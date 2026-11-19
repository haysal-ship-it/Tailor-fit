'use client';
import {useEffect,useState} from 'react';
import {useAccount} from '@/components/auth/AccountProvider';
import {listDrafts,readDraft,type Draft} from '@/lib/drafts/storage';
export function IntakeDraftRecovery({disabled,onRecover}:{disabled:boolean;onRecover:(draft:Draft)=>void}){
 const {user}=useAccount(),[legacy,setLegacy]=useState<Draft|null>(null),[dismissed,setDismissed]=useState(false);
 useEffect(()=>{let alive=true;void(async()=>{
   const owner=user?.id||'guest',requested=new URLSearchParams(location.search).get('draft');
   const explicit=requested?await readDraft(requested,owner,!!user):null;
   const entries=await listDrafts(owner);
   const candidate=explicit?.key==='overview-intake'?explicit:entries.filter(d=>d.key==='overview-intake').sort((a,b)=>b.updatedAt-a.updatedAt)[0];
   const found=candidate?await readDraft(candidate.id,owner,!!user):null;
   if(alive)setLegacy(found);
 })();return()=>{alive=false;};},[user]);
 if(!legacy||dismissed)return null;
 return <aside className="mx-4 mb-4 rounded-lg border border-[var(--outline)] bg-[var(--card)] p-4 text-sm"><p>You have an unfinished order from the previous intake form.</p><p className="mt-2 text-xs text-[var(--text-2)]">{disabled?'Finish or discard the current draft before recovering another.':'Recover it into this order form and review the details before saving.'}</p><div className="mt-3 flex flex-col gap-2 sm:flex-row"><button type="button" disabled={disabled} onClick={()=>{onRecover(legacy);setDismissed(true);}} className="min-h-11 rounded-full bg-[var(--primary)] px-4 text-white disabled:opacity-50">Recover saved order</button><button type="button" onClick={()=>setDismissed(true)} className="min-h-11 rounded-full border border-[var(--outline)] px-4">Not now</button></div></aside>;
}
