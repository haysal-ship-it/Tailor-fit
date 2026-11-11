'use server';

import { serverSupabase } from '@/lib/supabase/server';
import { operationSchema, validateOperation, type Operation, type Result } from './schema';
import { z } from 'zod';

async function authenticated() {
  const db = await serverSupabase();
  const { data, error } = await db.auth.getUser();
  if (error || !data.user) throw new Error('AUTH_REQUIRED');
  return { db, user: data.user };
}
function failure<T>(error: unknown): Result<T> {
  const message = error instanceof Error ? error.message : String((error as { message?: string })?.message || 'Request failed');
  const code = error instanceof z.ZodError ? 'VALIDATION' : message.includes('AUTH_REQUIRED') ? 'AUTH_REQUIRED' : message.includes('CONFLICT') || message.includes('duplicate key') ? 'CONFLICT' : message.includes('not configured') ? 'CONFIGURATION' : /fetch|network|timeout/i.test(message) ? 'OFFLINE' : 'SERVER';
  const messages = { AUTH_REQUIRED: 'Sign in to save your work.', VALIDATION: 'Check the form details and try again.', CONFLICT: 'This record changed on another device. Your draft is still here. Reload the saved record and review your changes.', CONFIGURATION: 'Online storage is not configured yet. Your draft has not been uploaded.', OFFLINE: 'Not saved — reconnect and retry. Your draft is kept on this device.', SERVER: 'Could not save online. Your draft is still here; please retry.' };
  return { ok: false, error: { code, message: messages[code] } };
}
export async function loadWorkspace(): Promise<Result<Record<string, unknown[]>>> {
  try {
    const { db } = await authenticated();
    const result: Record<string, unknown[]> = {};
    for (const kind of ['clients','measurement_snapshots','orders','studio_settings']) {
      const all = [];
      for (let from=0;;from+=500) {
        const { data, error } = await db.from(kind).select('*').order('id').range(from,from+499);
        if(error) throw error;
        all.push(...data);
        if(data.length<500) break;
      }
      result[kind]=all;
    }
    return { ok:true,data:result };
  } catch(error) { return failure(error); }
}
async function preparedOperations(raw: unknown, uid: string) {
  const operations = z.array(operationSchema).max(20000).parse(raw).map(validateOperation);
  for(const op of operations) {
    if(op.kind==='studio_settings' && op.id!==uid) throw new Error('AUTH_REQUIRED');
    if(op.action==='put') {
      const data=op.data as Record<string,unknown>;
      const images=(data.referenceImages || []) as {storagePath?:string;url?:string}[];
      const paths=[...images.map(i=>i.storagePath), data.photoPath].filter(Boolean) as string[];
      if(paths.some(p=>!p.startsWith(`${uid}/`) || p.includes('..'))) throw new Error('AUTH_REQUIRED');
      if(images.some(i=>!i.storagePath)) throw new z.ZodError([]);
      if(data.photoUrl && !data.photoPath) throw new z.ZodError([]);
      if(images.length) data.referenceImages=images.map(({url: _url,...image})=>({...image,url:''}));
      if(data.photoPath) data.photoUrl='';
    }
  }
  return operations;
}
export async function commitRecords(requestId: string, raw: Operation[], expectedOwner:string): Promise<Result<unknown[]>> {
  try {
    z.string().uuid().parse(requestId);
    const { db,user }=await authenticated();
    if(user.id!==expectedOwner)throw new Error('AUTH_REQUIRED');
    const operations=await preparedOperations(raw,user.id);
    const {data,error}=await db.rpc('commit_records',{p_request:requestId,p_operations:operations});
    if(error) throw error;
    return {ok:true,data};
  } catch(error) {return failure(error);}
}
export async function importWorkspace(runId:string, raw:Operation[], replace:boolean, expectedVersion:number,expectedOwner:string):Promise<Result<unknown[]>> {
  try {
    z.string().uuid().parse(runId); z.number().int().nonnegative().parse(expectedVersion);
    const {db,user}=await authenticated();
    if(user.id!==expectedOwner)throw new Error('AUTH_REQUIRED');
    const operations=await preparedOperations(raw,user.id);
    const {data,error}=await db.rpc('import_workspace',{p_run:runId,p_operations:operations,p_replace:replace,p_expected_version:expectedVersion});
    if(error) throw error;
    return {ok:true,data};
  }catch(error){return failure(error);}
}
export async function createImageUpload(id:string,type:string,size:number):Promise<Result<{path:string;token:string}>> {
  try {
    z.string().uuid().parse(id); z.enum(['image/jpeg','image/png','image/webp']).parse(type); z.number().positive().max(5242880).parse(size);
    const {db,user}=await authenticated();
    const path=`${user.id}/${id}.${type==='image/jpeg'?'jpg':type.split('/')[1]}`;
    const {error:insertError}=await db.from('attachments').upsert({id,owner_id:user.id,object_path:path,mime_type:type,byte_size:size},{onConflict:'id',ignoreDuplicates:true});
    if(insertError) throw insertError;
    const {data,error}=await db.storage.from('workspace-images').createSignedUploadUrl(path);
    if(error) throw error;
    return {ok:true,data:{path,token:data.token}};
  }catch(error){return failure(error);}
}
export async function imageUrls(paths:string[]):Promise<Result<Record<string,string>>> {
  try {
    z.array(z.string().max(500)).max(500).parse(paths);
    const {db,user}=await authenticated();
    if(paths.some(p=>!p.startsWith(`${user.id}/`) || p.includes('..'))) throw new Error('AUTH_REQUIRED');
    if(!paths.length) return {ok:true,data:{}};
    const {data,error}=await db.storage.from('workspace-images').createSignedUrls(paths,900);
    if(error) throw error;
    return {ok:true,data:Object.fromEntries(data.filter(x=>x.signedUrl).map(x=>[x.path!,x.signedUrl!]))};
  }catch(error){return failure(error);}
}
