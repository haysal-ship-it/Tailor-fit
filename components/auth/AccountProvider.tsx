'use client';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { browserSupabase } from '@/lib/supabase/browser';
import { supabaseConfig } from '@/lib/supabase/config';
import { safeReturnTo } from '@/lib/auth/navigation';
import { clearDrafts } from '@/lib/drafts/storage';
import { clearUploadCache } from '@/lib/data/images';

type DraftHandle={id:string;dirty:boolean;flush:()=>Promise<void>};
type AccountContext={user:User|null;ready:boolean;configured:boolean;requireAccount:()=>boolean;registerDraft:(key:string,handle:DraftHandle)=>()=>void;signOut:()=>Promise<void>;openAuth:()=>void};
const Context=createContext<AccountContext|null>(null);
export function useAccount(){const value=useContext(Context);if(!value)throw new Error('AccountProvider is required');return value;}
export function AccountProvider({children}:{children:ReactNode}) {
  const [user,setUser]=useState<User|null>(null);
  const [ready,setReady]=useState(false);
  const [open,setOpen]=useState(false);
  const [message,setMessage]=useState('');
  const dialog=useRef<HTMLDivElement>(null);
  const drafts=useRef(new Map<string,DraftHandle>());
  const router=useRouter(); const configured=!!supabaseConfig();
  useEffect(()=>{
    if(!configured){queueMicrotask(()=>setReady(true));return;}
    let alive=true;
    const client=browserSupabase();
    void client.auth.getUser().then(({data}:{data:{user:User|null}})=>{if(alive){setUser(data.user);setReady(true);}}).catch(()=>{if(alive)setReady(true);});
    const {data}=client.auth.onAuthStateChange((_event:AuthChangeEvent,session:Session|null)=>{if(alive){setUser(session?.user??null);setReady(true);clearUploadCache();}});
    return()=>{alive=false;data.subscription.unsubscribe();};
  },[configured]);
  useEffect(()=>{
    if(!open)return;
    const previous=document.activeElement as HTMLElement|null;
    dialog.current?.querySelector<HTMLElement>('button')?.focus();
    const handle=(event:KeyboardEvent)=>{
      if(event.key==='Escape')setOpen(false);
      if(event.key==='Tab'){
        const nodes=dialog.current?.querySelectorAll<HTMLElement>('button,a[href]');
        if(!nodes?.length)return;
        const first=nodes[0],last=nodes[nodes.length-1];
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
      }
    };
    document.addEventListener('keydown',handle);
    return()=>{document.removeEventListener('keydown',handle);previous?.focus();};
  },[open]);
  const registerDraft=useCallback((key:string,handle:DraftHandle)=>{drafts.current.set(key,handle);return()=>{drafts.current.delete(key);};},[]);
  const requireAccount=useCallback(()=>{if(user)return true;setOpen(true);return false;},[user]);
  const go=async(path:string)=>{
    setMessage('');
    try {
      const active=[...drafts.current.values()].filter(d=>d.dirty);
      await Promise.all(active.map(d=>d.flush()));
      const target=new URL(safeReturnTo(location.pathname+location.search),location.origin);
      if(active[0])target.searchParams.set('draft',active[0].id);
      setOpen(false);router.push(`${path}?next=${encodeURIComponent(target.pathname+target.search)}`);
    }catch{setMessage('This browser cannot preserve your draft through navigation. Keep exploring, or copy your details before signing in.');}
  };
  const signOut=async()=>{
    if([...drafts.current.values()].some(d=>d.dirty)&&!window.confirm('Sign out and discard unsaved drafts on this device?'))return;
    const {error}=await browserSupabase().auth.signOut();
    if(error){setMessage('Sign out failed. Reconnect and try again.');return;}
    if(user)await clearDrafts(user.id);
    drafts.current.clear();clearUploadCache();setUser(null);router.replace('/');router.refresh();
  };
  return <Context.Provider value={{user,ready,configured,requireAccount,registerDraft,signOut,openAuth:()=>setOpen(true)}}>
    {children}
    {open&&<div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/35 p-5" onClick={e=>{if(e.target===e.currentTarget)setOpen(false);}}>
      <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby="account-gate-title" className="w-full max-w-md rounded-3xl bg-white p-7 shadow-xl">
        <h2 id="account-gate-title" className="text-2xl font-semibold">Sign in to save your work</h2>
        <p className="mt-3 text-base leading-relaxed text-[#595959]">Keep your clients, measurements and orders together, and access them from another device.</p>
        <p className="mt-3 text-sm text-[#595959]">Your unfinished draft is temporarily kept on this device for 24 hours.</p>
        {!configured&&<p className="mt-3 text-sm text-[#595959]">Online accounts are being set up. You can keep exploring without uploading any records.</p>}
        {message&&<p role="alert" className="mt-3 text-sm text-red-700">{message}</p>}
        <div className="mt-6 grid gap-3"><button className="min-h-11 rounded-full bg-[#1D49E8] px-5 text-white" onClick={()=>void go('/signup')}>Create account</button><button className="min-h-11 rounded-full border border-neutral-300 px-5" onClick={()=>void go('/signin')}>Log in</button><button className="min-h-11 rounded-full px-5 text-[#595959]" onClick={()=>setOpen(false)}>Keep exploring</button></div>
      </div>
    </div>}
  </Context.Provider>;
}
