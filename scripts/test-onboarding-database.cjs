const fs=require('node:fs'),assert=require('node:assert/strict');
const {PGlite}=require('@electric-sql/pglite');
async function main(){
 const db=new PGlite();let count=0;
 const old='11111111-1111-4111-8111-111111111111',fresh='22222222-2222-4222-8222-222222222222',email='33333333-3333-4333-8333-333333333333';
 await db.exec(`create role anon;create role authenticated;create role supabase_auth_admin;create schema auth;create table auth.users(id uuid primary key,created_at timestamptz default now());create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;create table public.profiles(id uuid primary key,display_name text);create table public.studio_settings(id uuid primary key,owner_id uuid,data jsonb,updated_at timestamptz default now());insert into auth.users(id) values('${old}');`);
 for(const [i,status] of ['in_progress','deferred','completed'].entries()){const id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa'+i;await db.query('insert into auth.users(id) values($1)',[id]);await db.query('insert into public.studio_settings(id,owner_id,data) values($1,$1,$2)',[id,JSON.stringify({onboarding:{studioSetup:{version:1,status,lastStep:2}}})]);}
 await db.exec(fs.readFileSync('supabase/migrations/20261119192458_user_onboarding.sql','utf8'));
 async function check(name,fn){await fn();count++;console.log('PASS '+name);}
 const row=async id=>(await db.query('select * from public.user_onboarding where user_id=$1',[id])).rows[0];
 await check('Existing empty account is grandfathered',async()=>assert.equal((await row(old)).status,'legacy_existing'));
 await check('Backfill preserves prior incomplete, skipped and completed setup',async()=>{for(const [i,status] of ['in_progress','deferred','completed'].entries())assert.equal((await row('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa'+i)).status,status);});
 await db.exec(`grant usage on schema auth to supabase_auth_admin;grant insert on auth.users to supabase_auth_admin;set role supabase_auth_admin;insert into auth.users(id) values('${fresh}'),('${email}');reset role;`);
 await check('Both new OAuth and email auth records receive setup',async()=>{assert.equal((await row(fresh)).status,'not_started');assert.equal((await row(email)).status,'not_started');});
 await db.exec(`set role authenticated;select set_config('request.jwt.claim.sub','${fresh}',false);`);
 const rpc=async(rev,status,step=null)=>(await db.query('select public.update_user_onboarding($1,$2,$3,null) as state',[rev,status,step])).rows[0].state;
 await check('RLS exposes only the current account',async()=>assert.equal((await db.query('select * from public.user_onboarding')).rows.length,1));
 await check('Direct progress writes are denied',async()=>assert.rejects(db.exec("update public.user_onboarding set status='completed'"),/permission denied/));
 await check('Progress is saved with a revision',async()=>assert.equal((await rpc(1,'in_progress',2)).revision,2));
 await check('Exact retries are idempotent',async()=>assert.equal((await rpc(1,'in_progress',2)).revision,2));
 await check('Stale conflicting writes are rejected',async()=>assert.rejects(rpc(1,'deferred'),/CONFLICT/));
 await check('Completion requires saved profile and defaults',async()=>assert.rejects(rpc(2,'completed'),/SETUP_DETAILS_REQUIRED/));
 await db.exec(`reset role;insert into public.profiles values('${fresh}','Sal');insert into public.studio_settings(id,owner_id,data) values('${fresh}','${fresh}','{"defaultUnit":"cm","currency":"NGN"}');set role authenticated;`);
 await check('Valid completion persists',async()=>{const state=await rpc(2,'completed');assert.equal(state.status,'completed');assert.ok(state.completed_at);});
 await check('Completed setup cannot be downgraded',async()=>assert.equal((await rpc(3,'deferred',1)).status,'completed'));
 await db.exec("reset role;set role anon;");
 await check('Anonymous reads and RPC writes are denied',async()=>{await assert.rejects(db.query('select * from public.user_onboarding'),/permission denied/);await assert.rejects(rpc(1,'deferred'),/permission denied/);});
 await db.exec('reset role;');
 await check('RPC is an invoker wrapper; privileged functions stay private',async()=>{const rows=(await db.query("select n.nspname,p.prosecdef from pg_proc p join pg_namespace n on n.oid=p.pronamespace where p.proname='update_user_onboarding' order by n.nspname")).rows;assert.equal(rows.find(r=>r.nspname==='public').prosecdef,false);assert.equal(rows.find(r=>r.nspname==='tailorfit_private').prosecdef,true);});
 await db.close();console.log(`${count} PostgreSQL onboarding checks passed.`);
}
main().catch(e=>{console.error(e);process.exitCode=1;});
