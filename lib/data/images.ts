'use client';
import { browserSupabase } from '@/lib/supabase/browser';
import { createImageUpload } from './actions';

const uploaded = new Map<string,string>();
export function clearUploadCache() { uploaded.clear(); }
export async function validateImage(blob:Blob) {
  if(blob.size<=0 || blob.size>5*1024*1024) throw new Error('Each image must be no larger than 5 MB.');
  const b=new Uint8Array(await blob.slice(0,12).arrayBuffer());
  const type=b[0]===255 && b[1]===216 && b[2]===255 ? 'image/jpeg' : b[0]===137 && b[1]===80 && b[2]===78 && b[3]===71 ? 'image/png' : String.fromCharCode(...b.slice(0,4))==='RIFF' && String.fromCharCode(...b.slice(8,12))==='WEBP' ? 'image/webp' : '';
  if(!type || blob.type && blob.type!==type) throw new Error('Choose a JPEG, PNG or WebP image.');
  return type;
}
export async function uploadImage(url:string,ownerId:string):Promise<string> {
  const response=await fetch(url);
  if(!response.ok) throw new Error('A reference image could not be read. Remove it or select it again.');
  const blob=await response.blob();
  const type=await validateImage(blob);
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer())),x=>x.toString(16).padStart(2,'0')).join('');
  const key=`${ownerId}:${hash}`;
  if(uploaded.has(key)) return uploaded.get(key)!;
  const id=crypto.randomUUID();
  const target=await createImageUpload(id,type,blob.size);
  if(!target.ok) throw new Error(target.error.message);
  if(!target.data.path.startsWith(`${ownerId}/`)) throw new Error('Your account changed. Sign in to the original account to save this draft.');
  const {error}=await browserSupabase().storage.from('workspace-images').uploadToSignedUrl(target.data.path,target.data.token,blob,{contentType:type});
  if(error) throw new Error('Image upload failed. Your draft is still here; retry when connected.');
  uploaded.set(key,target.data.path);
  return target.data.path;
}
