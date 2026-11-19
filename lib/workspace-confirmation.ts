'use client';
import {prepareWorkspaceDialog} from './dialog-environment';

/** Browser-native focus trapping with the same responsive workspace sheet styling. */
export function confirmWorkspaceAction(message:string,confirmLabel='Leave page',title='Unsaved changes'):Promise<boolean>{
  return new Promise(resolve=>{
    const previous=document.activeElement as HTMLElement|null;
    const dialog=document.createElement('dialog');
    dialog.className='workspace-dialog m-auto w-[calc(100%_-_32px)] max-w-md rounded-2xl bg-white p-6 text-[var(--text)] shadow-2xl backdrop:bg-black/45';
    const heading=document.createElement('h2');heading.id='workspace-confirmation-'+crypto.randomUUID();heading.className='text-lg font-semibold';heading.textContent=title;dialog.setAttribute('aria-labelledby',heading.id);
    const text=document.createElement('p');text.className='mt-4 text-sm leading-relaxed text-[var(--text-2)]';text.textContent=message;
    const actions=document.createElement('div');actions.className='dialog-actions mt-6 flex justify-end gap-2';
    const cancel=document.createElement('button');cancel.textContent='Cancel';cancel.className='min-h-11 rounded-full border border-[var(--outline)] px-5 text-sm';
    const confirm=document.createElement('button');confirm.textContent=confirmLabel;confirm.className='min-h-11 rounded-full bg-[var(--primary)] px-5 text-sm text-white';
    actions.append(cancel,confirm);dialog.append(heading,text,actions);document.body.append(dialog);
    const releaseEnvironment=prepareWorkspaceDialog(dialog);
    const finish=(result:boolean)=>{dialog.close();dialog.remove();releaseEnvironment();if(previous?.isConnected)previous.focus();resolve(result);};
    cancel.onclick=()=>finish(false);confirm.onclick=()=>finish(true);dialog.oncancel=e=>{e.preventDefault();finish(false);};dialog.showModal();cancel.focus();
  });
}

export function requestWorkspaceNavigation(resume:()=>void){
  return window.dispatchEvent(new CustomEvent('tailorfit:before-navigation',{cancelable:true,detail:{resume}}));
}
