// Exercise each real story against its rendered component targets. This does
// not replace browser film; it catches missing targets and incomplete payoffs.
const fs=require('fs'),path=require('path'),ts=require('typescript'),Module=require('module');
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
require.extensions['.css']=()=>{};
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(mod,file)=>mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{fileName:file,compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,file+".cjs");
global.window={matchMedia:()=>({matches:false})};
const plain=tag=>p=>React.createElement(tag,Object.fromEntries(Object.entries(p).filter(([k])=>k.startsWith('data-')||k==='className')),p.children);
const kit=new Proxy({Segmented:p=>React.createElement('div',null,p.items.map((x,i)=>React.createElement('span',{'data-target':p.targets?.[i],key:i},x))),Field:p=>React.createElement('div',p.box,p.value),Row:p=>React.createElement('div',Object.fromEntries(Object.entries(p).filter(([k])=>k.startsWith('data-'))),p.title,p.subtitle,p.meta,p.children),Count:p=>React.createElement('span',null,p.value)}, {get:(o,k)=>o[k]||plain('div')});
let state,stageProps;
const originalLoad=Module._load;
Module._load=function(name,parent,...args){if(name==='./stageshow')return new Proxy(kit,{get:(o,k)=>k==='Stage'?(p=>{stageProps=p;return p.children(state,()=>({}),'wide');}):o[k]});return originalLoad.call(this,name,parent,...args);};
const demos=require('../components/landing/faux-ui/Scenes.tsx');
const names={client:'AddClient',fitting:'Fitting',order:'Order',share:'Share',measurements:'MeasurementFeature',records:'ClientFeature',schedule:'OrderFeature'};
(async()=>{const reports=[];for(const [id,component] of Object.entries(names)){
  state={...demos.initialStates[id]};const actions=[];let readingMs=0;
  const render=()=>renderToStaticMarkup(React.createElement(demos[component],{gender:'female'}));
  const check=target=>{const name=typeof target==='string'?target:target.at;if(!name)return;const html=render();if(!html.includes(`data-target="${name}"`))throw Error(`${id}: missing target ${name}`);actions.push(name);};
const a={wait:async ms=>{readingMs+=ms;},mark:name=>actions.push('beat:'+name),click:async target=>check(target),move:async target=>check(target),set:async patch=>{Object.assign(state,typeof patch==='function'?patch(state):patch);},put:patch=>Object.assign(state,patch),type:async(key,text)=>{state[key]=text;},key:async key=>actions.push('key:'+key),snap:async patch=>{if(!state.resetting)throw Error(id+': unmasked reset');Object.assign(state,patch);},place:()=>{},layout:'wide'};
  await demos.demoScripts[id](a);
  if(!state.done)throw Error(`${id}: no completed payoff`);
  render();const landing=renderToStaticMarkup(React.createElement(demos.LandingFauxUI,{kind:id}));
  if(landing.includes('Replay')||landing.includes('CURSOR DEMO'))throw Error(id+': review controls in landing');
  if(stageProps.play!=='loop'||!stageProps.runOffscreen)throw Error(id+': timeline does not loop offscreen');
  state={...demos.initialStates[id]};
  for(let repetition=0;repetition<2;repetition++){
    await demos.loopScripts[id](a);
    if(JSON.stringify(state)!==JSON.stringify(demos.initialStates[id]))throw Error(id+': loop seam state mismatch');
  }
  reports.push({id,targetsVerified:actions.filter(x=>!x.startsWith('beat:')&&!x.startsWith('key:')).length,loopCycles:2,offscreen:true,reviewControls:false,readingMs,beats:actions.filter(x=>x.startsWith('beat:'))});
}
const cells=renderToStaticMarkup(React.createElement(demos.OrderFeature));
if(!cells.includes('data-target="day-30"'))throw Error('Calendar omitted November 30');
fs.mkdirSync('scratch',{recursive:true});fs.writeFileSync('scratch/faux-ui-motion-verification.json',JSON.stringify(reports,null,2));console.log(JSON.stringify(reports,null,2));console.log('PASS: seven stories have valid targets and completed payoffs; calendar includes November 30.');
})().catch(e=>{console.error(e);process.exitCode=1;});
