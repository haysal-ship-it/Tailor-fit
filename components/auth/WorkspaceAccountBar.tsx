'use client';
import { useEffect, useState } from 'react';
import { useAccount } from './AccountProvider';
import { useStore } from '@/lib/store';
import { downloadBlob, legacyBackup } from '@/lib/data/backup';
import type { BackupPayload } from '@/lib/backup';

export function WorkspaceAccountBar() {
  const {user,openAuth,signOut}=useAccount();
  const {saveStatus,error,refresh,importBrowserRecords}=useStore();
  const [legacy,setLegacy]=useState<BackupPayload|null>(null);
  const [busy,setBusy]=useState(false);
  useEffect(()=>{if(user)setLegacy(legacyBackup());else setLegacy(null);},[user]);
  const importRecords=async()=>{
    if(!legacy||busy)return;
    if(!window.confirm('Append these browser records to this account? Existing online records will be kept.'))return;
    setBusy(true);
    try{
      downloadBlob(new Blob([JSON.stringify(legacy)],{type:'application/json'}),'tailorfit-browser-recovery.json');
      if(await importBrowserRecords(legacy))setLegacy(null);
    }finally{setBusy(false);}
  };
  return <div className="mx-auto w-full max-w-[1280px] px-4 py-2 text-sm text-[var(--text)]">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p>{user?user.email:'Explore TailorFit. Sign in to save clients, measurements and orders.'}</p>
      <button className="min-h-11 rounded-full px-4 underline focus-visible:outline-2" onClick={()=>user?void signOut():openAuth()}>{user?'Log out':'Sign up / Log in'}</button>
    </div>
    {saveStatus==='saving'&&<p role="status">Saving…</p>}
    {saveStatus==='saved'&&!error&&<p role="status">Saved online</p>}
    {error&&<div role="alert" className="flex flex-wrap items-center gap-2 text-red-700"><p>{error}</p><button className="min-h-11 underline" onClick={()=>void refresh()}>Reload saved records</button></div>}
    {legacy&&<div className="mt-2 rounded-2xl border border-neutral-200 p-4">
      <h2 className="font-semibold">Bring your existing records online</h2>
      <p className="mt-1">{legacy.clients.length} clients · {legacy.snapshots.length} fittings · {legacy.orders.length} orders · {legacy.clients.filter(c=>c.photoUrl).length+legacy.orders.reduce((n,o)=>n+o.referenceImages.length,0)} photos</p>
      <p className="mt-1">Import into {user?.email}. Your original browser records will be kept, and a recovery copy will download.</p>
      <div className="mt-2 flex gap-4"><button disabled={busy} className="min-h-11 underline" onClick={()=>void importRecords()}>{busy?'Importing…':'Import records'}</button><button disabled={busy} className="min-h-11 underline" onClick={()=>setLegacy(null)}>Not now</button></div>
    </div>}
  </div>;
}
