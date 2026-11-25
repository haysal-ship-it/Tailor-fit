'use server';
import {headers} from 'next/headers';
import {adminKey, setTicket, ticket, verificationClient} from './deletion-server';
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

export async function accountDeletionAvailable() {
  const secret = adminKey(), config = supabaseConfig();
  if (!secret || !config) return 'unconfigured' as const;
  const db = await serverSupabase();
  const {data: {user}, error: authError} = await db.auth.getUser();
  if (authError && authError.name !== 'AuthSessionMissingError' && authError.status !== 401) return 'unavailable' as const;
  if (!user) return 'signed-out' as const;
  const admin = createClient(config.url, secret, {auth: {persistSession:false, autoRefreshToken:false}});
  const {data, error} = await admin.auth.admin.getUserById(user.id);
  if (error || data.user?.id !== user.id) return 'unavailable' as const;
  return 'ready' as const;
}

export async function beginDeletionVerification() {
  const db = await serverSupabase();
  const {data:{user}} = await db.auth.getUser();
  if (!adminKey() || !user?.identities?.some(identity => identity.provider === 'google'))
    throw new Error('Sign in with your linked Google account and try again.');
  const origin = (await headers()).get('origin');
  if (!origin) throw new Error('Open Settings again to verify your account.');
  const storage: Record<string,string> = {};
  const verifier = verificationClient(storage);
  const {data,error} = await verifier.auth.signInWithOAuth({provider:'google', options:{
    redirectTo: new URL('/auth/verify-deletion', origin).href,
    skipBrowserRedirect: true, queryParams:{prompt:'select_account'},
  }});
  if (error || !data.url) throw new Error('Google verification could not start. Try again.');
  await setTicket({stage:'started', owner:user.id, verifier:storage});
  return data.url;
}

export async function deleteOwnAccount(raw:unknown):Promise<AccountResult> {
 try {
  const input=z.object({confirmation:z.literal('DELETE'),password:z.string().min(1).max(200).optional(),expectedOwner:z.string().uuid().optional()}).parse(raw);
  const db=await serverSupabase();const {data:{user},error}=await db.auth.getUser();
  if(error||!user?.email||(input.expectedOwner && input.expectedOwner!==user.id))throw new AccountSettingsError('Sign in again before deleting your account.');
  const config=supabaseConfig(),secret=adminKey();
  if(!config||!secret)throw new AccountSettingsError('Account deletion is not configured on this server. No records were deleted.');
  // Verify the current owner's password afresh, without replacing the browser session.
  if (input.password) {
    const verifier=createClient(config.url,config.key,{auth:{persistSession:false,autoRefreshToken:false}});
    const verified=await verifier.auth.signInWithPassword({email:user.email,password:input.password});
    if(verified.error||verified.data.user?.id!==user.id)throw new AccountSettingsError('Password verification failed. Your account has not been deleted.');
    await verifier.auth.signOut({scope:'local'});
  } else {
    const proof = await ticket();
    if (proof?.stage !== 'verified' || proof.owner !== user.id)
      throw new AccountSettingsError('Verify with Google again, then confirm deletion.');
  }
  const admin=createClient(config.url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
  // Persist intent before removing any files. A retry scans only the remaining objects.
  const marked = await admin.auth.admin.updateUserById(user.id,{app_metadata:{deletion_started_at:user.app_metadata?.deletion_started_at || new Date().toISOString()}});
  if (marked.error) throw new AccountSettingsError('Could not start deletion. Try again.');
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
  if(deleted.error && deleted.error.code !== 'user_not_found')throw new AccountSettingsError('Files were removed, but the account could not be deleted. Retry to finish.');
  await Promise.allSettled([db.auth.signOut({scope:'local'}), setTicket(null)]);
  return {ok:true};
 }catch(error){return {ok:false,error:error instanceof AccountSettingsError?error.message:'Could not complete this account operation. Check your connection and retry.'};}
}
