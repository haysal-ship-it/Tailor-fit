'use client';
import {prepareWorkspaceDialog} from '@/lib/dialog-environment';
import {useEffect,useRef,type ReactNode} from 'react';
import {createPortal} from 'react-dom';

/** Native modal semantics around an existing workspace dialog's visual content. */
export function LegacyDialog({label,onClose,children,busy=false}:{label:string;onClose:()=>void;children:ReactNode;busy?:boolean}) {
  const ref=useRef<HTMLDialogElement>(null);
  useEffect(()=>{
    const dialog=ref.current!,previous=document.activeElement as HTMLElement|null;
    const releaseEnvironment=prepareWorkspaceDialog(dialog);dialog.showModal();
    return()=>{dialog.close();releaseEnvironment();if(previous?.isConnected)previous.focus();};
  },[]);
  return createPortal(<dialog ref={ref} aria-label={label} aria-busy={busy||undefined} onCancel={e=>{e.preventDefault();if(!busy)onClose();}} className="workspace-dialog legacy-workspace-dialog m-auto max-h-[90dvh] w-[calc(100%_-_32px)] max-w-xl overflow-y-auto rounded-2xl bg-[var(--surface)] p-0 text-[var(--text)] shadow-2xl backdrop:bg-black/45"><fieldset disabled={busy} className="m-0 min-w-0 border-0 p-0">{children}</fieldset></dialog>,document.body);
}
