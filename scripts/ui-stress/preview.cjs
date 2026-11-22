// Local stress preview. All records and persistence adapters are isolated from the app.
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const os=require('node:os');
const compiled=require('next/dist/compiled/webpack/webpack');
compiled.init();
const root=path.resolve(__dirname,'../..');
const out=fs.mkdtempSync(path.join(os.tmpdir(),'tailorfit-ui-stress-'));
const fixture=path.join(__dirname,'fixtures.jsx');
function build(server){
  const aliases=Object.fromEntries(['@/lib/store','@/components/auth/AccountProvider','@/components/onboarding/TourProvider','./TourProvider','@/lib/drafts/use-draft','@/lib/drafts/storage','@/lib/invoices/actions'].map(name=>[name+'$',fixture]));
  return new Promise((resolve,reject)=>compiled.webpack({
    context:root,mode:'production',devtool:false,target:server?'node':'web',
    entry:path.join(__dirname,server?'Review.jsx':'client.jsx'),
    output:{path:out,filename:'review.js',...(server?{library:{type:'commonjs2'}}:{})},
    resolve:{extensions:['.tsx','.ts','.js','.jsx'],alias:{...aliases,'@':root}},
    externals:server?[({request},cb)=>request&&!request.startsWith('.')&&!request.startsWith('@/')&&!path.isAbsolute(request)?cb(null,'commonjs '+request):cb()]:[],
    module:{rules:[{test:/\.(tsx?|jsx)$/,use:path.join(root,'scripts/faux-ui-ts-loader.cjs')}]},
    plugins:server?[]:[new compiled.webpack.DefinePlugin({'process.env.__NEXT_IMAGE_OPTS':'undefined'}),new compiled.webpack.ProvidePlugin({process:require.resolve('next/dist/build/polyfills/process')})],
    optimization:{minimize:false}
  },(err,stats)=>err||stats.hasErrors()?reject(err||Error(stats.toString({all:false,errors:true}))):resolve()));
}

async function run(){
  if(process.argv.includes('--check')){
    const {createRequire}=require('node:module');
    const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
    await build(true);
    const mod={exports:{}};
    new Function('require','module','exports',fs.readFileSync(path.join(out,'review.js'),'utf8'))(createRequire(__filename),mod,mod.exports);
    for(const mode of ['demo','worst','empty','one','large']){
      for(const screen of mod.exports.screens){
        const html=renderToStaticMarkup(React.createElement(mod.exports.Surface,{mode,screen}));
        if(!html)throw Error('Empty render: '+mode+' '+screen);
        const cards=(html.match(/role="button" tabindex="0"/g)||[]).length;
        if(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/.test(html)||/\b1 (body points|selected points|orders have)/.test(html)) throw Error('Initials or singular count regression: '+mode+' '+screen);
        if(mode==='large' && screen==='Clients' && cards!==24) throw Error('Directory pagination regression');
        if(mode==='large' && screen==='Orders' && (html.match(/text-left hover:bg-\[var\(--chip\)\]/g)||[]).length!==24) throw Error('Order pagination regression');
        console.log(mode,screen,Buffer.byteLength(html)+' bytes',JSON.stringify({
          cards,orderRows:(html.match(/text-left hover:bg-\[var\(--chip\)\]/g)||[]).length,
          damagedInitial:/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/.test(html),
          singularError:/1 (body points|selected points|orders have)/.test(html),
          toolbar:['Front','Left','Back','Right'].every(label=>html.includes('>'+label+'</button>')),
          empty:html.includes('No orders match this view.')
        }));
      }
    }
    return;
  }
  await build(false);
  const css=await require('postcss')([require('@tailwindcss/postcss')({base:root})]).process(fs.readFileSync(path.join(root,'app/globals.css'),'utf8'),{from:path.join(root,'app/globals.css')});
  fs.writeFileSync(path.join(out,'review.css'),css.css);
  const html='<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Tailorfit UI stress test</title><link rel="stylesheet" href="/review.css"><style>@font-face{font-family:Manrope;src:url(/fonts/manrope-latin-400-normal.woff2)}body{--font-manrope:Manrope;font-family:Manrope,system-ui,sans-serif}.stress-controls{position:fixed;bottom:8px;left:50%;transform:translateX(-50%);z-index:100;width:max-content;max-width:96vw;display:flex;justify-content:center;align-items:center;flex-wrap:wrap;gap:3px;padding:5px;background:#e8e8e8;border-radius:14px;font:13px system-ui}.stress-controls button,.stress-controls select{padding:6px;border-radius:10px}.stress-controls [aria-pressed=true],.stress-controls select{background:white}</style><body><div id="root"></div><script src="/review.js"></script></body></html>';
  const types={'.js':'application/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2','.webp':'image/webp'};
  http.createServer((req,res)=>{
    const url=new URL(req.url,'http://localhost');
    if(url.pathname==='/'){res.setHeader('Content-Type','text/html; charset=utf-8');return res.end(html);}
    const base=['/review.js','/review.css'].includes(url.pathname)?out:path.join(root,'public');
    const file=path.resolve(base,'.'+url.pathname);
    if(!file.startsWith(base+path.sep)||!fs.statSync(file,{throwIfNoEntry:false})?.isFile()){res.writeHead(404);return res.end();}
    res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);
  }).listen(Number(process.env.TAILORFIT_STRESS_PORT||4361),'127.0.0.1',function(){console.log('Tailorfit stress preview on http://127.0.0.1:'+this.address().port+'/');});
}
run().catch(err=>{console.error(err);process.exitCode=1;});
