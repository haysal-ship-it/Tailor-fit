'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAccount } from '@/components/auth/AccountProvider';
import { deleteDraft, listDrafts, persistDraft, readDraft } from './storage';

export function useDraft(key:string,data:Record<string,unknown>,restore:(data:Record<string,unknown>)=>void,dirty:boolean) {
  const {user,ready,registerDraft}=useAccount();
  const owner=user?.id||'guest';
  const [loaded,setLoaded]=useState(false);
  const [warning,setWarning]=useState('');
  const id=useRef('');const latest=useRef(data);const restoreRef=useRef(restore);const dirtyRef=useRef(dirty);const saving=useRef(Promise.resolve());
  useEffect(()=>{latest.current=data;restoreRef.current=restore;dirtyRef.current=dirty;});
  useEffect(()=>{
    if(!ready)return;let alive=true;
    void (async()=>{
      const requested=new URLSearchParams(location.search).get('draft');
      const found=requested?await readDraft(requested,owner,!!user):null;
      const recent=found?.key===key?found:(await listDrafts(owner)).filter(d=>d.key===key).sort((a,b)=>b.updatedAt-a.updatedAt)[0];
      const draft=recent?await readDraft(recent.id,owner,!!user):null;
      if(!alive)return;
      id.current=draft?.id||crypto.randomUUID();
      if(draft){restoreRef.current(draft.data);await persistDraft({...draft,owner});}
      setLoaded(true);
    })();
    return()=>{alive=false;};
  },[key,owner,ready,user]);
  const flush=useCallback(async()=>{
    if(!id.current||!dirtyRef.current)return;
    let durable=true;
    saving.current=saving.current.then(async()=>{durable=await persistDraft({id:id.current,owner,key,updatedAt:Date.now(),data:latest.current});});
    await saving.current;
    if(!durable){setWarning('Draft kept in memory only. Leaving this page may lose it.');throw new Error('Draft storage unavailable');}
  },[key,owner]);
  useEffect(()=>{
    if(!loaded)return;
    const unregister=registerDraft(key,{id:id.current,dirty,flush});
    const timer=setTimeout(()=>{if(dirty)void flush().catch(()=>{});},300);
    return()=>{clearTimeout(timer);unregister();};
  },[key,data,dirty,loaded,registerDraft,flush]);
  useEffect(()=>{
    const save=()=>{void flush().catch(()=>{});};
    window.addEventListener('pagehide',save);return()=>{window.removeEventListener('pagehide',save);};
  },[flush]);
  const discard=useCallback(async()=>{await saving.current;if(id.current)await deleteDraft(id.current);id.current=crypto.randomUUID();setWarning('');},[]);
  return {loaded,warning,discard,getId:()=>id.current,flush};
}
