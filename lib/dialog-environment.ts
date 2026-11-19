'use client';
let locks=0;
let previousOverflow='';

/** Keep sheets inside the visible viewport when a software keyboard is open. */
export function prepareWorkspaceDialog(dialog:HTMLDialogElement){
  if(locks++===0){previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';}
  const viewport=window.visualViewport;
  const update=()=>{
    if(!viewport)return;
    dialog.style.setProperty('--workspace-dialog-height',Math.max(80,viewport.height-16)+'px');
    dialog.style.setProperty('--workspace-sheet-bottom',Math.max(0,window.innerHeight-viewport.height-viewport.offsetTop)+'px');
  };
  update();viewport?.addEventListener('resize',update);viewport?.addEventListener('scroll',update);
  window.addEventListener('resize',update);
  return()=>{
    viewport?.removeEventListener('resize',update);viewport?.removeEventListener('scroll',update);window.removeEventListener('resize',update);
    if(--locks===0)document.body.style.overflow=previousOverflow;
  };
}
