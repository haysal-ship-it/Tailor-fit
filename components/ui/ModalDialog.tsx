'use client';
import {prepareWorkspaceDialog} from '@/lib/dialog-environment';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export function ModalDialog({title,description,children,onRequestClose,busy=false}:{
  title:string;description?:string;children:ReactNode;onRequestClose:()=>void;busy?:boolean;
}) {
  const ref=useRef<HTMLDialogElement>(null),titleId=useId(),descriptionId=useId(),outside=useRef(false);
  useEffect(()=>{
    const dialog=ref.current!,previous=document.activeElement as HTMLElement|null;
    const releaseEnvironment=prepareWorkspaceDialog(dialog);
    dialog.showModal();
    dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    return()=>{releaseEnvironment();dialog.close();if(previous?.isConnected)previous.focus();};
  },[]);
  return createPortal(<dialog ref={ref} aria-labelledby={titleId} aria-describedby={description?descriptionId:undefined}
    aria-busy={busy||undefined}
    onCancel={e=>{e.preventDefault();if(!busy)onRequestClose();}}
    onPointerDown={e=>{const r=e.currentTarget.getBoundingClientRect();outside.current=e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom;}}
    onClick={e=>{if(e.target===e.currentTarget&&outside.current&&!busy)onRequestClose();outside.current=false;}}
    className="workspace-dialog m-auto w-[calc(100%_-_32px)] max-w-md max-h-[calc(100dvh_-_32px)] overflow-y-auto overscroll-contain rounded-2xl bg-[var(--surface)] p-0 text-[var(--text)] shadow-2xl backdrop:bg-black/45">
    <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[var(--outline)] bg-[var(--surface)] px-5 py-4 sm:px-6">
      <div className="min-w-0 pt-1"><h2 id={titleId} className="text-lg font-semibold tracking-tight">{title}</h2>
        {description&&<p id={descriptionId} className="mt-1.5 text-sm leading-relaxed text-[var(--text-2)]">{description}</p>}</div>
      <button type="button" aria-label={`Close ${title.toLowerCase()}`} disabled={busy} onClick={onRequestClose}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[var(--text-2)] transition-colors hover:bg-[var(--chip)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)] disabled:opacity-40"><X size={18}/></button>
    </div>{children}
  </dialog>,document.body);
}
