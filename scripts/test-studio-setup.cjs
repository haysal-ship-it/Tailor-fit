const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require('typescript');
let checks=0;
const cache=new Map();let auth;
function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file);const exports={};cache.set(file,exports);const source=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;const req=id=>{if(id==='@supabase/supabase-js')return {createClient:()=>{throw new Error('Unexpected admin call')}};if(id==='@/lib/supabase/config')return {supabaseConfig:()=>null};if(id==='next/server')return {NextResponse:{redirect:url=>({url:String(url)})}};if(id==='@/lib/supabase/server')return {serverSupabase:async()=>({auth})};if(id.startsWith('.')||id.startsWith('@/')){const base=id.startsWith('@/')?path.resolve(id.slice(2)):path.resolve(path.dirname(file),id);return load(['','.ts','.tsx'].map(e=>base+e).find(f=>fs.existsSync(f)&&fs.statSync(f).isFile()));}return require(id);};vm.runInNewContext(source,{exports,module:{exports},require:req,URL,URLSearchParams,Date,console,process},{filename:file});return exports;}
function test(name,fn){return Promise.resolve().then(fn).then(()=>{checks++;console.log('PASS '+name)});}

const {normalizeStudioSetup,shouldOfferStudioSetup,setupCurrency,studioMilestones}=load('lib/onboarding/studio-setup.ts');
const {saveStudioSetup}=load('lib/onboarding/save-studio-setup.ts');
const base={defaultUnit:'cm',currency:'NGN',templates:[],customFields:[]};
const input={name:' Sal ',studioName:' Ade Atelier ',unit:'in',currency:'USD'};
async function main(){
await test('Only canonical new or unfinished states open automatically',()=>{for(const status of ['not_started','in_progress','deferred','completed','legacy_existing'])assert.equal(shouldOfferStudioSetup({status}),['not_started','in_progress'].includes(status));assert.equal(shouldOfferStudioSetup(null),false);});
await test('Malformed or missing progress cannot classify an account as new',()=>{assert.equal(normalizeStudioSetup(null),null);assert.equal(normalizeStudioSetup({status:'not_started'}),null);});
await test('Currency defaults normalize safely',()=>{assert.equal(setupCurrency('$'),'USD');assert.equal(setupCurrency('KES'),'KES');assert.equal(setupCurrency(''),'NGN');});
await test('Checklist derives milestones from canonical state and saved records',()=>assert.deepEqual(Array.from(studioMilestones({status:'completed'},1,1)),[true,true,true]));
await test('Invalid profile prevents writes',async()=>{let writes=0;const result=await saveStudioSetup({...input,name:''},2,{settings:base,saveProfile:async()=>{writes++;return {ok:true}},updateSettings:async()=>true,saveProgress:async()=>({ok:true})});assert.equal(result.ok,false);assert.equal(writes,0);});
await test('Failed settings write never completes onboarding',async()=>{let progress=0;const result=await saveStudioSetup(input,2,{settings:base,saveProfile:async()=>({ok:true}),updateSettings:async()=>false,saveProgress:async()=>{progress++;return {ok:true}}});assert.equal(result.ok,false);assert.equal(progress,0);});
await test('First step saves canonical progress without replacing defaults',async()=>{let patch,state;const result=await saveStudioSetup(input,1,{settings:base,saveProfile:async()=>({ok:true}),updateSettings:async value=>{patch=value;return true},saveProgress:async value=>{state=value;return {ok:true}}});assert.equal(result.ok,true);assert.equal(patch.defaultUnit,undefined);assert.equal(state.status,'in_progress');assert.equal(state.lastStep,2);});
await test('Completion waits for canonical state save',async()=>{const result=await saveStudioSetup(input,2,{settings:base,saveProfile:async()=>({ok:true}),updateSettings:async()=>true,saveProgress:async()=>({ok:false,error:'Conflict'})});assert.equal(result.ok,false);assert.equal(result.error,'Conflict');});
auth={getUser:async()=>({data:{user:{id:'22222222-2222-4222-8222-222222222222'}}})};
await test('Setup writes reject an account switch',async()=>{const {saveProfile}=load('lib/account/actions.ts');assert.equal((await saveProfile({displayName:'Sal',expectedOwner:'11111111-1111-4111-8111-111111111111'})).ok,false);});
const {GET}=load('app/auth/callback/route.ts');
auth={exchangeCodeForSession:async()=>({error:null}),verifyOtp:async()=>({error:null})};
await test('OAuth callback preserves the intended order route without metadata writes',async()=>{const result=await GET({nextUrl:new URL('https://tailorfit.test/auth/callback?code=ok&next='+encodeURIComponent('/app?tab=clients&order=new'))});assert.equal(result.url,'https://tailorfit.test/app?tab=clients&order=new');});
await test('Recovery remains separate from studio setup',async()=>{const result=await GET({nextUrl:new URL('https://tailorfit.test/auth/callback?code=ok&recovery=1')});assert.ok(result.url.startsWith('https://tailorfit.test/update-password?next='));});
auth={exchangeCodeForSession:async()=>({error:new Error('expired')})};
await test('Expired callbacks return to sign in',async()=>{const result=await GET({nextUrl:new URL('https://tailorfit.test/auth/callback?code=expired')});assert.ok(result.url.startsWith('https://tailorfit.test/signin?error=callback'));});
console.log(checks+' studio setup integration checks passed.');
}
main().catch(e=>{console.error(e);process.exitCode=1});
