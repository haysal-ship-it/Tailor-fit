'use server';
import {z} from 'zod';
import {serverSupabase} from '@/lib/supabase/server';
import {normalizeStudioSetup,type StudioSetupResult} from './studio-setup';
const ownerSchema=z.string().uuid();
const updateSchema=z.object({expectedRevision:z.number().int().positive(),status:z.enum(['in_progress','deferred','completed']).optional(),lastStep:z.union([z.literal(1),z.literal(2)]).optional(),checklistDismissed:z.boolean().optional()}).strict();
function failure(code:string):StudioSetupResult{
  if(code==='AUTH_REQUIRED')return {ok:false,code,error:'Sign in to the same account to check studio setup.'};
  if(['42P01','PGRST205','PGRST202'].includes(code))return {ok:false,code:'MIGRATION_REQUIRED',error:'Studio setup is being updated. Retry shortly, or continue without setup.'};
  if(code==='CONFLICT')return {ok:false,code,error:'Setup changed on another tab or device. Reload saved progress and retry.'};
  if(code==='SETUP_DETAILS_REQUIRED')return {ok:false,code,error:'Save your name and studio defaults before completing setup.'};
  if(code==='STATE_MISSING')return {ok:false,code,error:'Your setup status could not be found. Retry, or continue without setup.'};
  return {ok:false,code,error:'Your setup status could not be saved or checked. Reconnect and retry; your account remains signed in.'};
}
async function authenticated(expectedOwner:unknown){
  const owner=ownerSchema.parse(expectedOwner),db=await serverSupabase();
  const {data,error}=await db.auth.getUser();
  if(error||!data.user||data.user.id!==owner)throw new Error('AUTH_REQUIRED');
  return {db,user:data.user};
}
export async function getStudioOnboarding(expectedOwner:unknown):Promise<StudioSetupResult>{
  try{
    const {db,user}=await authenticated(expectedOwner);
    const {data,error}=await db.from('user_onboarding').select('*').eq('user_id',user.id).maybeSingle();
    if(error)return failure(error.code||'READ_FAILED');
    if(!data)return failure('STATE_MISSING');
    const state=normalizeStudioSetup(data);
    return state&&data.user_id===user.id?{ok:true,state}:failure('INVALID_STATE');
  }catch(e){return failure(e instanceof Error&&e.message==='AUTH_REQUIRED'?'AUTH_REQUIRED':'READ_FAILED');}
}
export async function updateStudioOnboarding(expectedOwner:unknown,raw:unknown):Promise<StudioSetupResult>{
  try{
    const input=updateSchema.parse(raw),{db,user}=await authenticated(expectedOwner);
    const {data,error}=await db.rpc('update_user_onboarding',{p_expected_revision:input.expectedRevision,p_status:input.status??null,p_last_step:input.lastStep??null,p_checklist_dismissed:input.checklistDismissed??null});
    if(error){const message=error.message||'';return failure(/CONFLICT/.test(message)?'CONFLICT':/SETUP_DETAILS_REQUIRED/.test(message)?'SETUP_DETAILS_REQUIRED':/ONBOARDING_STATE_MISSING/.test(message)?'STATE_MISSING':error.code||'WRITE_FAILED');}
    const state=normalizeStudioSetup(data);
    return state&&data.user_id===user.id?{ok:true,state}:failure('INVALID_STATE');
  }catch(e){return failure(e instanceof Error&&e.message==='AUTH_REQUIRED'?'AUTH_REQUIRED':'WRITE_FAILED');}
}
