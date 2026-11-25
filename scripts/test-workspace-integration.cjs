const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
function load(file,mocks={},env={}){const exports={};const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;vm.runInNewContext(code,{exports,module:{exports},require:id=>id in mocks?mocks[id]:require(id),process:{env},console,Buffer,URL,Map,Date,Intl,Array,Math,Number},{filename:file});return exports;}
const analytics=load('lib/workspace-analytics.ts');
const order=(extra={})=>({id:'order',clientId:'client',garmentType:'Agbada',price:100,paidAmount:20,currency:'NGN',status:'Pending',createdAt:'2026-11-18T12:00:00Z',...extra});
let count=0;function test(name,fn){fn();count++;console.log('PASS '+name);}
test('Active orders include pending, progress, paused and ready',()=>{for(const status of ['Pending','In Progress','Paused','Ready'])assert.equal(analytics.isActiveOrder(order({status})),true);for(const status of ['Completed','Picked Up'])assert.equal(analytics.isActiveOrder(order({status})),false);});
test('Missing payment amount is unknown, not zero',()=>{assert.equal(analytics.knownBalance(order({paidAmount:undefined})),null);assert.equal(analytics.matchesOrderFilter(order({paidAmount:undefined}),'outstanding'),false);assert.equal(analytics.knownBalance(order({paidAmount:0})),100);assert.equal(analytics.knownBalance(order({paidAmount:120})),0);});
test('Balances are separated by currency and unknown records counted',()=>{const r=analytics.outstandingBalances([order(),order({currency:'₦'}),order({currency:'USD'}),order({currency:undefined}),order({paidAmount:undefined})]);assert.equal(r.unknown,2);assert.equal(r.totals.length,2);assert.equal(r.totals.find(t=>t.currency==='NGN').amount,160);assert.equal(r.totals.find(t=>t.currency==='USD').amount,80);});
test('Trend uses real current/prior intervals and ignores invalid/future dates',()=>{const trend=analytics.orderTrend([order(),order({createdAt:'2026-11-12T12:00:00Z'}),order({createdAt:'2026-11-11T12:00:00Z'}),order({createdAt:'2026-11-05T12:00:00Z'}),order({createdAt:'2026-11-19T12:00:00Z'}),order({createdAt:'invalid'})],7,new Date('2026-11-18T15:00:00Z'));assert.equal(trend.currentTotal,2);assert.equal(trend.previousTotal,2);assert.equal(trend.current.length,7);});
test('Empty chart remains empty',()=>{const t=analytics.orderTrend([],30);assert.equal(t.currentTotal,0);assert.equal(t.previousTotal,0);});
async function fails(operation,pattern){const result=await operation;assert.equal(result.ok,false);assert.match(result.error,pattern);}
async function accountTests(){
 const owner='11111111-1111-4111-8111-111111111111';
 function setup({configured=true,passwordOK=true,verifiedOwner=owner,removeError=false,deleteError=false,userPresent=true,proof=null}={}){
  const calls=[];const db={auth:{getUser:async()=>({data:{user:userPresent?{id:owner,email:'owner@example.com'}:null},error:null}),signOut:async()=>{calls.push('sign-out');return{error:null};}}};
  const bucket={list:async prefix=>{calls.push(['list',prefix]);return{data:[{name:'photo.jpg',id:'file'}],error:null};},remove:async paths=>{calls.push(['remove',...paths]);return{error:removeError?{}:null};}};
  const admin={storage:{from:bucketName=>{assert.equal(bucketName,'workspace-images');return bucket;}},auth:{admin:{updateUserById:async(id,attrs)=>{assert.equal(id,owner);assert.ok(attrs.app_metadata.deletion_started_at);return {error:null}},getUserById:async id=>({data:{user:{id}},error:null}),deleteUser:async id=>{calls.push(['delete',id]);return{error:deleteError?{}:null};}}}};
  const verifier={auth:{signInWithPassword:async()=>({data:{user:{id:verifiedOwner}},error:passwordOK?null:{}}),signOut:async options=>{assert.equal(options.scope,'local');return {error:null}}}};
  const actions=load('lib/account/actions.ts',{'next/headers':{},'./deletion-server':{adminKey:()=>configured?'secret':undefined,ticket:async()=>proof,setTicket:async()=>{}},'@/lib/supabase/server':{serverSupabase:async()=>db},'@/lib/supabase/config':{supabaseConfig:()=>({url:'https://example.invalid',key:'public'})},'@supabase/supabase-js':{createClient:(_url,key)=>key==='secret'?admin:verifier}},{SUPABASE_SERVICE_ROLE_KEY:configured?'secret':undefined});
  return {actions,calls};
 }
 for (const [configured,userPresent,expected] of [[false,true,'unconfigured'],[true,false,'signed-out'],[true,true,'ready']]) {
    const {actions}=setup({configured,userPresent});assert.equal(await actions.accountDeletionAvailable(),expected);
 }
 for(const proof of [null,{stage:'started',owner},{stage:'verified',owner:'different-owner'}]){
   const {actions,calls}=setup({proof});await fails(actions.deleteOwnAccount({confirmation:'DELETE'}),/Verify with Google/);assert.equal(calls.length,0);
 }
 const google=setup({proof:{stage:'verified',owner}});
 await fails(google.actions.deleteOwnAccount({confirmation:'',expectedOwner:owner}),/Could not complete/);
 assert.equal(google.calls.length,0);
 assert.equal((await google.actions.deleteOwnAccount({confirmation:'DELETE',expectedOwner:owner})).ok,true);
 const {signTicket,readTicket}=load('lib/account/deletion-ticket.ts',{'node:crypto':require('node:crypto')});
 const signed=signTicket({stage:'verified',owner},'signing-secret',100);
 assert.equal(readTicket(signed,'signing-secret',101).owner,owner);
 assert.equal(readTicket(signed,'signing-secret',300100),null);
 assert.equal(readTicket(signed,'other-secret',101),null);
 assert.equal(readTicket('x'+signed,'signing-secret',101),null);
 for (const [signedIn,returned,code,expected] of [
   [owner,owner,'auth-code','review'],[owner,'different','auth-code','retry'],
   ['different',owner,'auth-code','retry'],[owner,owner,'','retry']
 ]) {
   let proof={stage:'started',owner,verifier:{}},exchanges=0;
   const route=load('app/auth/verify-deletion/route.ts',{
     'next/server':{NextResponse:{redirect:url=>url}},
     '@/lib/supabase/server':{serverSupabase:async()=>({auth:{getUser:async()=>({data:{user:{id:signedIn}}})}})},
     '@/lib/account/deletion-server':{
       ticket:async()=>proof,setTicket:async next=>{proof=next},
       verificationClient:()=>({auth:{
         exchangeCodeForSession:async()=>{exchanges++;return {data:{user:{id:returned},session:{}},error:null}},
         signOut:async options=>{assert.equal(options.scope,'local')}
       }})
     }
   });
   const nextUrl=new URL('https://fixture.invalid/auth/verify-deletion?code='+code);
   const response=await route.GET({url:nextUrl.href,nextUrl});
   assert.equal(response.searchParams.get('deletion'),expected);
   assert.equal(proof?.stage??null,expected==='review'?'verified':null);
   assert.equal(exchanges,code&&signedIn===owner?1:0);
 }
 console.log('PASS Availability states, verified Google owner, final confirmation, ticket tampering and expiry');
 for(const [name,options,pattern] of [['Missing credentials makes no destructive calls',{configured:false},/not configured/],['Wrong password blocks deletion',{passwordOK:false},/verification failed/],['Different verified user blocks deletion',{verifiedOwner:'different-owner'},/verification failed/],['Missing signed-in user blocks deletion',{userPresent:false},/Sign in again/]]){const {actions,calls}=setup(options);await fails(actions.deleteOwnAccount({confirmation:'DELETE',password:'password'}),pattern);assert.equal(calls.length,0);count++;console.log('PASS '+name);}
 {const {actions,calls}=setup({removeError:true});await fails(actions.deleteOwnAccount({confirmation:'DELETE',password:'password'}),/files could not be removed/);assert.equal(calls.some(c=>Array.isArray(c)&&c[0]==='delete'),false);count++;console.log('PASS Failed file cleanup does not delete auth user');}
 {const {actions,calls}=setup({deleteError:true});await fails(actions.deleteOwnAccount({confirmation:'DELETE',password:'password'}),/account could not be deleted/);assert.equal(calls.includes('sign-out'),false);count++;console.log('PASS Failed account removal never reports success');}
 {const {actions,calls}=setup();const result=await actions.deleteOwnAccount({confirmation:'DELETE',password:'password',owner:'someone-else'});assert.equal(result.ok,true);assert.deepEqual(calls[0],['list',owner]);assert.deepEqual(calls.find(c=>Array.isArray(c)&&c[0]==='remove'),['remove',owner+'/photo.jpg']);assert.deepEqual(calls.find(c=>Array.isArray(c)&&c[0]==='delete'),['delete',owner]);count++;console.log('PASS Account deletion derives ownership solely from authenticated user');}
}
accountTests().then(()=>console.log(count+' integration tests passed.')).catch(e=>{console.error(e);process.exitCode=1;});
