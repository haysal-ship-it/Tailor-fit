export interface Draft { id:string; owner:string; key:string; updatedAt:number; data:Record<string,unknown> }
const memory=new Map<string,Draft>();
const MAX_AGE=24*60*60*1000;
async function database():Promise<IDBDatabase> {
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open('tailorfit-drafts',1);
    request.onupgradeneeded=()=>request.result.createObjectStore('drafts',{keyPath:'id'});
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error);
  });
}
async function transaction<T>(mode:IDBTransactionMode,run:(store:IDBObjectStore)=>IDBRequest<T>):Promise<T> {
  const db=await database();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction('drafts',mode); const request=run(tx.objectStore('drafts'));
    tx.oncomplete=()=>{db.close();resolve(request.result);};
    tx.onerror=()=>{db.close();reject(tx.error);};
    tx.onabort=()=>{db.close();reject(tx.error);};
  });
}
// Data URLs from the existing forms are persisted as binary Blobs, not duplicated strings.
async function pack(value:unknown):Promise<unknown> {
  if(typeof value==='string' && value.startsWith('data:image/')) return (await fetch(value)).blob();
  if(Array.isArray(value)) return Promise.all(value.map(pack));
  if(value && typeof value==='object') return Object.fromEntries(await Promise.all(Object.entries(value).map(async([k,v])=>[k,await pack(v)])));
  return value;
}
async function unpack(value:unknown):Promise<unknown> {
  if(value instanceof Blob) return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(value);});
  if(Array.isArray(value)) return Promise.all(value.map(unpack));
  if(value && typeof value==='object') return Object.fromEntries(await Promise.all(Object.entries(value).map(async([k,v])=>[k,await unpack(v)])));
  return value;
}
export async function persistDraft(draft:Draft):Promise<boolean> {
  memory.set(draft.id,draft);
  try {const data=await pack(draft.data);await transaction('readwrite',s=>s.put({...draft,data}));return true;}catch{return false;}
}
export async function readDraft(id:string,owner:string,claimGuest=false):Promise<Draft|null> {
  let draft=memory.get(id);
  try {draft=await transaction('readonly',s=>s.get(id)) || draft;}catch{}
  if(!draft || draft.owner!==owner && !(claimGuest && draft.owner==='guest')) return null;
  if(draft.owner==='guest' && Date.now()-draft.updatedAt>MAX_AGE){await deleteDraft(id);return null;}
  return {...draft,owner,data:await unpack(draft.data) as Record<string,unknown>};
}
export async function listDrafts(owner:string) {
  let drafts=[...memory.values()];
  try {drafts=await transaction('readonly',s=>s.getAll());}catch{}
  return drafts.filter(d=>d.owner===owner && (owner!=='guest'||Date.now()-d.updatedAt<MAX_AGE));
}
export async function deleteDraft(id:string){memory.delete(id);try{await transaction('readwrite',s=>s.delete(id));}catch{}}
export async function clearDrafts(owner:string){for(const d of await listDrafts(owner))await deleteDraft(d.id);}
