'use client';
import { zipSync, unzipSync, strToU8, strFromU8 } from 'fflate';
import type { BackupPayload } from '@/lib/backup';
import { validateBackupPayload } from '@/lib/backup';
import { normalizeDate, validateOperation, type Operation } from './schema';
import { normalizeMeasurementsRecord, DEFAULT_SETTINGS } from '@/lib/initial-data';

export function downloadBlob(blob:Blob,name:string){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
export async function exportBackup(payload:BackupPayload,prefix='tailorfit-backup') {
  const copy=structuredClone(payload); const files:Record<string,Uint8Array>={};let size=0;
  const archive=async(url:string)=>{
    const response=await fetch(url);if(!response.ok)throw new Error('Could not download every photo. Retry the backup while connected.');
    const blob=await response.blob();size+=blob.size;if(size>250*1024*1024)throw new Error('This backup exceeds the 250 MB browser export limit. Contact support for a server export.');
    const name=`images/${crypto.randomUUID()}.${blob.type==='image/png'?'png':blob.type==='image/webp'?'webp':'jpg'}`;
    files[name]=new Uint8Array(await blob.arrayBuffer());return `archive:${name}`;
  };
  for(const client of copy.clients){if(client.photoUrl)client.photoUrl=await archive(client.photoUrl);delete client.photoPath;}
  for(const order of copy.orders)for(const image of order.referenceImages){image.url=await archive(image.url);delete image.storagePath;}
  copy.version='3.0';copy.exportedAt=new Date().toISOString();files['manifest.json']=strToU8(JSON.stringify(copy));
  const bytes=zipSync(files,{level:0});
  downloadBlob(new Blob([new Uint8Array(bytes)],{type:'application/zip'}),`${prefix}-${new Date().toISOString().slice(0,10)}.zip`);
}
export async function readBackup(file:File):Promise<BackupPayload> {
  if(file.size>250*1024*1024)throw new Error('Backup is larger than 250 MB.');
  let raw:unknown;
  if(file.name.toLowerCase().endsWith('.zip')){
    let total=0;let entries=0;
    const files=unzipSync(new Uint8Array(await file.arrayBuffer()),{filter:entry=>{
      total+=entry.originalSize;entries++;
      if(total>250*1024*1024||entries>10000||entry.name.includes('..')||entry.name.startsWith('/'))throw new Error('Invalid or oversized backup archive.');
      return true;
    }});
    if(!files['manifest.json'])throw new Error('The backup manifest is missing.');
    raw=JSON.parse(strFromU8(files['manifest.json']));
    const validation=validateBackupPayload(raw);if(!validation.isValid||!validation.data)throw new Error(validation.error);
    const payload=validation.data;
    const restore=(url:string)=>{
      if(!url.startsWith('archive:'))throw new Error('Backup image is not embedded in the archive.');
      const path=url.slice(8),bytes=files[path];if(!bytes)throw new Error('A backup image is missing.');
      const type=path.endsWith('.png')?'image/png':path.endsWith('.webp')?'image/webp':'image/jpeg';
      let binary='';for(const b of bytes)binary+=String.fromCharCode(b);
      return `data:${type};base64,${btoa(binary)}`;
    };
    for(const c of payload.clients){if(c.photoUrl)c.photoUrl=restore(c.photoUrl);delete c.photoPath;}
    for(const o of payload.orders)for(const image of o.referenceImages){image.url=restore(image.url);delete image.storagePath;}
    return payload;
  }
  raw=JSON.parse(await file.text());const validation=validateBackupPayload(raw);
  if(!validation.isValid||!validation.data)throw new Error(validation.error);return validation.data;
}
export async function stableUuid(value:string){const b=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))).slice(0,16);b[6]=(b[6]&15)|64;b[8]=(b[8]&63)|128;const s=Array.from(b,x=>x.toString(16).padStart(2,'0')).join('');return `${s.slice(0,8)}-${s.slice(8,12)}-${s.slice(12,16)}-${s.slice(16,20)}-${s.slice(20)}`;}
export async function importOperations(payload:BackupPayload,owner:string,run:string,includeSettings:boolean):Promise<Operation[]> {
  if(payload.clients.length+payload.orders.length+payload.snapshots.length>10000)throw new Error('Import up to 10,000 records at a time.');
  const ids=new Map<string,string>();
  for(const [kind,records] of [['clients',payload.clients],['measurement_snapshots',payload.snapshots],['orders',payload.orders]] as const){
    for(const record of records){const key=`${kind}:${record.id}`;if(ids.has(key))throw new Error('Backup contains duplicate record identifiers.');ids.set(key,await stableUuid(`${owner}:${run}:${key}`));}
  }
  const operations:Operation[]=[];
  for(const c of payload.clients)operations.push({kind:'clients',action:'put',id:ids.get(`clients:${c.id}`)!,expected:0,data:{...c,phone:c.phone||'',email:c.email||'',notes:c.notes||'',photoPath:undefined}});
  for(const s of payload.snapshots){const clientId=ids.get(`clients:${s.clientId}`);if(!clientId)throw new Error('A fitting refers to a missing client.');operations.push({kind:'measurement_snapshots',action:'put',id:ids.get(`measurement_snapshots:${s.id}`)!,expected:0,data:{...s,clientId,date:normalizeDate(s.date),measurements:normalizeMeasurementsRecord(s.measurements)}});}
  for(const o of payload.orders){const clientId=ids.get(`clients:${o.clientId}`),snapshotId=o.measurementSnapshotId?ids.get(`measurement_snapshots:${o.measurementSnapshotId}`):undefined;if(!clientId||o.measurementSnapshotId&&!snapshotId)throw new Error('An order refers to a missing client or fitting.');operations.push({kind:'orders',action:'put',id:ids.get(`orders:${o.id}`)!,expected:0,data:{...o,clientId,measurementSnapshotId:snapshotId,referenceImages:(o.referenceImages||[]).map(i=>({...i,storagePath:undefined}))}});}
  if(includeSettings)operations.push({kind:'studio_settings',action:'put',id:owner,expected:0,data:{...DEFAULT_SETTINGS,...payload.settings}});
  return operations.map(validateOperation);
}
export function legacyBackup():BackupPayload|null {
  try{
    const clients=JSON.parse(localStorage.getItem('tailorfit_clients_v4')||'[]'),snapshots=JSON.parse(localStorage.getItem('tailorfit_snapshots_v4')||'[]'),orders=JSON.parse(localStorage.getItem('tailorfit_orders_v4')||'[]'),settings=JSON.parse(localStorage.getItem('tailorfit_settings_v4')||'null')||DEFAULT_SETTINGS;
    if(!clients.length&&!snapshots.length&&!orders.length)return null;
    const result=validateBackupPayload({clients,snapshots,orders,settings});return result.isValid?result.data!:null;
  }catch{return null;}
}
