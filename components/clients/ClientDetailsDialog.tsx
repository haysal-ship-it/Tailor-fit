'use client';

import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { ModalDialog } from '@/components/ui/ModalDialog';
import { emptyClientDetails,hasClientDetailsChanges,saveClientDetails,validateClientDetails,type ClientDetails,type ClientDetailsErrors,type ClientDetailsTarget } from '@/lib/client-details';

type SavedClient={id:string;name:string;created:boolean};
export function ClientDetailsDialog({target,onCreate,onUpdate,onSaved,onClose,persistenceError=''}:{
  target:ClientDetailsTarget;onCreate:(data:ClientDetails)=>Promise<{id:string;name:string}|null>;
  onUpdate:(id:string,data:ClientDetails)=>Promise<boolean>;onSaved:(result:SavedClient)=>void;onClose:()=>void;persistenceError?:string;
}) {
  // A mounted form owns one immutable operation and, when editing, one client ID.
  const [session]=useState(target);
  const [original]=useState<ClientDetails>(()=>session.kind==='edit'?{name:session.client.name,phone:session.client.phone,email:session.client.email,notes:session.client.notes}:emptyClientDetails());
  const [values,setValues]=useState(original),[errors,setErrors]=useState<ClientDetailsErrors>({});
  const [busy,setBusy]=useState(false),[failed,setFailed]=useState(''),[confirmDiscard,setConfirmDiscard]=useState(false);
  const submitting=useRef(false),nameRef=useRef<HTMLInputElement>(null),emailRef=useRef<HTMLInputElement>(null),id=useId();
  const dirty=hasClientDetailsChanges(values,original),creating=session.kind==='create';
  useEffect(()=>{if(!dirty)return;const warn=(e:BeforeUnloadEvent)=>{e.preventDefault();e.returnValue='';};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[dirty]);
  function requestClose(){if(submitting.current)return;if(confirmDiscard){setConfirmDiscard(false);nameRef.current?.focus();return;}if(dirty)setConfirmDiscard(true);else onClose();}
  function change(key:keyof ClientDetails,value:string){setValues(current=>({...current,[key]:value}));setErrors(current=>({...current,[key]:undefined}));setFailed('');}
  async function submit(e:FormEvent){
    e.preventDefault();if(submitting.current||confirmDiscard)return;
    const next=validateClientDetails(values);setErrors(next);
    if(next.name){nameRef.current?.focus();return;}if(next.email){emailRef.current?.focus();return;}
    submitting.current=true;setBusy(true);setFailed('');
    try{const saved=await saveClientDetails(session,values,{create:onCreate,update:onUpdate});
      if(!saved){setFailed("Your client details weren't saved. Check your connection and try again.");return;}
      onSaved(saved);
    }catch(error){setFailed(error instanceof Error?error.message:"Your client details weren't saved. Try again.");}
    finally{submitting.current=false;setBusy(false);}
  }
  const fieldClass='w-full min-h-11 rounded-lg border border-[var(--outline)] bg-[var(--card)] px-3 py-2.5 text-base text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:outline-2 focus:outline-offset-2 focus:outline-[var(--primary)] disabled:opacity-60 sm:text-sm';
  const secondary='min-h-11 rounded-full border border-[var(--outline)] bg-[var(--surface)] px-5 text-sm font-medium text-[var(--text-2)] hover:bg-[var(--chip)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)] disabled:opacity-50';
  return <ModalDialog title={creating?'Add client':`Edit ${session.client.name}`} description={creating?'Save their details now. Add measurements and orders when ready.':"Update this client's contact details and notes."} busy={busy} onRequestClose={requestClose}>
    <form noValidate onSubmit={submit}>
      <fieldset disabled={busy} className="m-0 grid gap-4 border-0 px-5 py-5 sm:px-6">
        <div><label htmlFor={`${id}-name`} className="mb-1.5 block text-sm font-medium">Full name <span className="text-[var(--text-2)]">(required)</span></label>
          <input id={`${id}-name`} ref={nameRef} data-autofocus autoComplete="name" required value={values.name} onChange={e=>change('name',e.target.value)} placeholder="Client’s full name" aria-invalid={!!errors.name} aria-describedby={errors.name?`${id}-name-error`:undefined} className={fieldClass}/>
          {errors.name&&<p id={`${id}-name-error`} role="alert" className="mt-2 text-sm text-red-700">{errors.name}</p>}</div>
        <div><label htmlFor={`${id}-phone`} className="mb-1.5 block text-sm font-medium">Phone <span className="font-normal text-[var(--text-2)]">(optional)</span></label>
          <input id={`${id}-phone`} type="tel" autoComplete="tel" value={values.phone} onChange={e=>change('phone',e.target.value)} placeholder="+234 800 000 0000" className={fieldClass}/></div>
        <div><label htmlFor={`${id}-email`} className="mb-1.5 block text-sm font-medium">Email <span className="font-normal text-[var(--text-2)]">(optional)</span></label>
          <input id={`${id}-email`} ref={emailRef} type="email" autoComplete="email" spellCheck={false} value={values.email} onChange={e=>change('email',e.target.value)} placeholder="client@example.com" aria-invalid={!!errors.email} aria-describedby={errors.email?`${id}-email-error`:undefined} className={fieldClass}/>
          {errors.email&&<p id={`${id}-email-error`} role="alert" className="mt-2 text-sm text-red-700">{errors.email}</p>}</div>
        <div><label htmlFor={`${id}-notes`} className="mb-1.5 block text-sm font-medium">Notes <span className="font-normal text-[var(--text-2)]">(optional)</span></label>
          <textarea id={`${id}-notes`} rows={3} value={values.notes} onChange={e=>change('notes',e.target.value)} placeholder="Fit preferences, fabric notes…" className={`${fieldClass} resize-y`}/></div>
        {failed&&<p role="alert" className="rounded-lg bg-red-50 p-3 text-sm leading-relaxed text-red-800">{persistenceError||failed}</p>}
        {confirmDiscard&&<div role="alert" className="rounded-lg bg-[var(--chip)] p-3 text-sm leading-relaxed"><strong className="block font-semibold">Discard unsaved changes?</strong><span className="text-[var(--text-2)]">Your entered details will be lost. Keep editing to save them.</span></div>}
      </fieldset>
      <div className="sticky bottom-0 flex flex-wrap justify-end gap-2 border-t border-[var(--outline)] bg-[var(--surface)] px-5 py-4 sm:px-6">
        {confirmDiscard?<><button type="button" className={secondary} onClick={()=>{setConfirmDiscard(false);nameRef.current?.focus();}}>Keep editing</button><button type="button" onClick={onClose} className="min-h-11 rounded-full bg-red-700 px-5 text-sm font-semibold text-white hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700">Discard changes</button></>:
          <><button type="button" disabled={busy} onClick={requestClose} className={secondary}>Cancel</button><button type="submit" disabled={busy} className="min-h-11 rounded-full bg-[var(--primary)] px-5 text-sm font-semibold text-white hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)] disabled:cursor-wait disabled:opacity-60"><span role="status" aria-live="polite">{busy?(creating?'Adding client…':'Saving changes…'):(creating?'Add client':'Save changes')}</span></button></>}
      </div>
    </form>
  </ModalDialog>;
}
