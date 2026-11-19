'use server';
import {z} from 'zod';
import {createClient} from '@supabase/supabase-js';
import {serverSupabase} from '@/lib/supabase/server';
import {supabaseConfig} from '@/lib/supabase/config';

class AccountSettingsError extends Error {}

type AccountResult={ok:true}|{ok:false;error:string};

export async function saveProfile(raw:unknown):Promise<AccountResult> {
 try {
  const input=z.object({displayName:z.string().trim().min(1).max(100),expectedOwner:z.string().uuid().optional()}).parse(raw);
  const db=await serverSupabase();const {data:{user}}=await db.auth.getUser();
  if(!user||(input.expectedOwner&&input.expectedOwner!==user.id))throw new AccountSettingsError('Sign in to the same account before saving these profile details.');
  const {error}=await db.from('profiles').upsert({id:user.id,display_name:input.displayName});
  if(error)throw new AccountSettingsError('Your profile could not be saved. Try again.');
  const result=await db.auth.updateUser({data:{display_name:input.displayName}});
  if(result.error)throw new AccountSettingsError('Your profile name could not be updated. Try again.');
  return {ok:true};
 }catch(error){return {ok:false,error:error instanceof AccountSettingsError?error.message:'Could not complete this account operation. Check your connection and retry.'};}
}

export async function accountDeletionAvailable(){return !!process.env.SUPABASE_SERVICE_ROLE_KEY;}

export async function deleteOwnAccount(raw:unknown):Promise<AccountResult> {
 try {
  const input=z.object({confirmation:z.literal('DELETE'),password:z.string().min(1).max(200)}).parse(raw);
  const db=await serverSupabase();const {data:{user},error}=await db.auth.getUser();
  if(error||!user?.email)throw new AccountSettingsError('Sign in again before deleting your account.');
  const config=supabaseConfig(),secret=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!config||!secret)throw new AccountSettingsError('Account deletion is not configured on this server. No records were deleted.');
  // Verify the current owner's password afresh, without replacing the browser session.
  const verifier=createClient(config.url,config.key,{auth:{persistSession:false,autoRefreshToken:false}});
  const verified=await verifier.auth.signInWithPassword({email:user.email,password:input.password});
  if(verified.error||verified.data.user?.id!==user.id)throw new AccountSettingsError('Password verification failed. Your account has not been deleted.');
  await verifier.auth.signOut();
  const admin=createClient(config.url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
  // Include unattached uploads; never accept an owner ID or object path from the caller.
  const bucket=admin.storage.from('workspace-images');
  const paths:string[]=[];
  async function collect(prefix:string){
    for(let offset=0;;offset+=1000){
      const page=await bucket.list(prefix,{limit:1000,offset,sortBy:{column:'name',order:'asc'}});
      if(page.error)throw new AccountSettingsError('Could not check owned files. Account deletion stopped.');
      for(const item of page.data){if(item.name==='.'||item.name==='..'||item.name.includes('/')||item.name.includes('\\'))throw new AccountSettingsError('Unexpected file path. Account deletion stopped.');const path=prefix+'/'+item.name;if(item.id)paths.push(path);else await collect(path);}
      if(page.data.length<1000)break;
    }
  }
  await collect(user.id);
  for(let i=0;i<paths.length;i+=100){
    const removed=await bucket.remove(paths.slice(i,i+100));
    if(removed.error)throw new AccountSettingsError('Some files could not be removed. Your account still exists; retry deletion.');
  }
  // Auth ownership cascades to profiles, records, drafts and attachment metadata.
  const deleted=await admin.auth.admin.deleteUser(user.id);
  if(deleted.error)throw new AccountSettingsError('Files were removed, but the account could not be deleted. Retry to finish.');
  await db.auth.signOut();
  return {ok:true};
 }catch(error){return {ok:false,error:error instanceof AccountSettingsError?error.message:'Could not complete this account operation. Check your connection and retry.'};}
}
