'use client';

import { useId, useMemo, useState } from 'react';
import { Check, Search } from 'lucide-react';
import { ModalDialog } from '@/components/ui/ModalDialog';

type PickerClient={id:string;name:string;phone:string;email:string};
export function ClientPickerDialog({clients,selectedClientId,onSelect,onClose}:{clients:PickerClient[];selectedClientId:string|null;onSelect:(id:string)=>void;onClose:()=>void}){
  const [search,setSearch]=useState(''),id=useId();
  const filtered=useMemo(()=>{const q=search.trim().toLocaleLowerCase();return clients.filter(client=>[client.name,client.phone,client.email].some(v=>v.toLocaleLowerCase().includes(q)));},[clients,search]);
  return <ModalDialog title="Switch client" description="Open another client’s profile." onRequestClose={onClose}>
    <div className="px-5 py-5 sm:px-6"><label htmlFor={id} className="mb-1.5 block text-sm font-medium">Search clients</label>
      <div className="flex min-h-11 items-center gap-2 rounded-lg border border-[var(--outline)] bg-[var(--card)] px-3 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--primary)]"><Search size={16} className="shrink-0 text-[var(--text-2)]"/><input id={id} data-autofocus type="search" autoComplete="off" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Name, phone or email" className="min-h-11 w-full bg-transparent text-base text-[var(--text)] outline-none placeholder:text-[var(--muted)] sm:text-sm"/></div>
      <p role="status" className="mb-2 mt-3 text-xs text-[var(--text-2)]">{filtered.length} {filtered.length===1?'client':'clients'}{search.trim()?' found':''}</p>
      <div className="grid gap-1">{filtered.map(client=><button key={client.id} type="button" onClick={()=>onSelect(client.id)} aria-current={client.id===selectedClientId?'true':undefined} className="flex min-h-14 w-full items-center justify-between gap-3 rounded-lg p-3 text-left transition-colors hover:bg-[var(--chip)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)] aria-current:bg-[var(--selected-bg)]"><span className="min-w-0"><span className="block truncate text-sm font-semibold">{client.name}</span><span className="mt-1 block truncate text-xs text-[var(--text-2)]">{client.phone||client.email||'No contact details yet'}</span></span>{client.id===selectedClientId&&<><Check size={17} className="shrink-0 text-[var(--primary)]"/><span className="sr-only">Current client</span></>}</button>)}</div>
      {filtered.length===0&&<div className="py-6 text-center"><p className="text-sm text-[var(--text-2)]">{clients.length?'No clients match your search.':'No clients yet. Add one from the Clients page.'}</p>{search&&<button type="button" onClick={()=>setSearch('')} className="mt-3 min-h-11 rounded-full px-4 text-sm font-semibold text-[var(--primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]">Clear search</button>}</div>}
    </div>
  </ModalDialog>;
}
