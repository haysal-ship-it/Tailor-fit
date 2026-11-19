const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict'),ts=require('typescript'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const client={id:'c1',name:'Ada Okafor',phone:'08000000000',email:'ada@example.com',notes:'',createdAt:'2026-11-18'};
const order={id:'o1',clientId:'c1',garmentType:'Blue Agbada',price:50000,paidAmount:10000,currency:'NGN',referenceImages:[],status:'Pending',notes:'',pickupDateTime:'2026-11-25T12:00:00Z',createdAt:'2026-11-18T12:00:00Z'};
const store={clients:[client],orders:[order],snapshots:[],settings:{defaultUnit:'cm',currency:'NGN',templates:[],customFields:[]},allHotspots:[],isHydrated:true,getClientById:id=>id===client.id?client:undefined};
const mocks={
 '@phosphor-icons/react':{ArrowsClockwise:()=>null},
 '@/lib/store':{useStore:()=>store},
 '@/components/auth/AccountProvider':{useAccount:()=>({user:{id:'owner',email:'owner@example.com',user_metadata:{display_name:'Sal'}},requireAccount:()=>true})},
 '@/lib/drafts/use-draft':{useDraft:()=>({loaded:true,warning:'',getId:()=> 'draft',flush:async()=>{},discard:async()=>{}})},
 '@/components/mannequin/RotatableMannequin':{RotatableMannequin:props=>React.createElement('div',{'data-production-mannequin':true,'data-active-points':props.activePointKeys?.length||0})},
 '@/components/ui/AnimatedFileUpload':{AnimatedFileUpload:()=>React.createElement('div',{'data-upload':true})},
 '@/components/onboarding/ContextualTip':{ContextualTip:()=>null},
 '@/components/onboarding/TourProvider':{useTour:()=>({status:'unseen',contextualTipsEnabled:true})},
 '@/lib/invoices/actions':{sendInvoice:async()=>({ok:true})},
 '@/lib/account/actions':{accountDeletionAvailable:async()=>false},
 '@/lib/supabase/browser':{browserSupabase:()=>({})},
 '@/lib/data/images':{clearUploadCache:()=>{}},
 '@/lib/data/backup':{downloadBlob:()=>{},readBackup:async()=>{}},
 'next/image':{__esModule:true,default:props=>React.createElement('img',{src:props.src,alt:props.alt})},
};
const cache=new Map();function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file);const exports={};cache.set(file,exports);const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;const req=id=>{if(id in mocks)return mocks[id];if(id.startsWith('@/')||id.startsWith('.')){const base=id.startsWith('@/')?path.join(process.cwd(),id.slice(2)):path.resolve(path.dirname(file),id);const found=['','.ts','.tsx','.js'].map(ext=>base+ext).find(f=>fs.existsSync(f)&&fs.statSync(f).isFile());if(found)return load(found);}return require(id);};vm.runInNewContext(code,{exports,module:{exports},require:req,React,console,URL,Intl,Date,Map,Set,Buffer,process,TextEncoder,setTimeout,clearTimeout},{filename:file});return exports;}
const callbacks={onOpenOrder:()=>{},onAddClient:()=>{},onNewOrder:()=>{},onOpenOrders:()=>{},onResumeIntake:()=>{}};
const {OverviewScreen}=load('components/screens/OverviewScreen.tsx');const dashboard=renderToStaticMarkup(React.createElement(OverviewScreen,callbacks));assert.ok(dashboard.indexOf('Add client')<dashboard.indexOf('New order'));for(const text of ['Hello','Sal','Total orders','Active orders','Outstanding balance','Studio performance','Pickup Calendar','Recent Orders','Ada Okafor'])assert.ok(dashboard.includes(text),text);assert.ok(dashboard.includes('overview-calendar'));assert.ok(dashboard.includes('overview-recent-orders'));console.log('PASS Dashboard renders real analytics and preserved calendar/recent markup');
const {OrderWorkspace}=load('components/orders/OrderWorkspace.tsx');const fresh=renderToStaticMarkup(React.createElement(OrderWorkspace,{}));assert.ok(fresh.includes('Client name'));assert.ok(!fresh.includes('Ada Okafor'));assert.ok(!fresh.includes('Choose a client'));assert.ok(!fresh.includes('Saved measurements'));assert.ok(fresh.includes('data-production-mannequin="true"'));assert.ok(fresh.includes('data-active-points="0"'));assert.ok(fresh.includes('data-upload="true"'));console.log('PASS Generic New Order is blank with production mannequin and upload controls');
const details=renderToStaticMarkup(React.createElement(OrderWorkspace,{orderId:'o1',clientId:'c1'}));assert.ok(details.includes('Order details'));assert.ok(details.includes('Blue Agbada'));assert.ok(details.includes('Ada Okafor'));console.log('PASS Order ID renders existing full details page for the exact client');
const {SettingsScreen}=load('components/screens/SettingsScreen.tsx');const settings=renderToStaticMarkup(React.createElement(SettingsScreen));for(const text of ['Profile &amp; security','Studio','Measurements &amp; templates','Data &amp; privacy','Help','Display name','Email address'])assert.ok(settings.includes(text),text);console.log('PASS Settings renders grouped navigation and real account form');
console.log('4 server-render checks passed. These do not replace browser visual QA.');
