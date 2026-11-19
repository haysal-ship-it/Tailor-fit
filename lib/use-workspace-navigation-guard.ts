'use client';
import {useEffect,useRef} from 'react';
import {confirmWorkspaceAction} from './workspace-confirmation';

export function useWorkspaceNavigationGuard(dirty:boolean,message:string,bypass?:{current:boolean}){
  const approved=useRef(false),pending=useRef(false);
  useEffect(()=>{
    if(!dirty)return;
    const navigate=(event:Event)=>{
      if(approved.current||bypass?.current)return;
      event.preventDefault();
      if(pending.current)return;
      pending.current=true;
      void confirmWorkspaceAction(message).then(ok=>{
        pending.current=false;
        if(!ok)return;
        const resume=(event as CustomEvent<{resume?:()=>void}>).detail?.resume;
        if(resume){approved.current=true;resume();queueMicrotask(()=>{approved.current=false;});}
      });
    };
    window.addEventListener('tailorfit:before-navigation',navigate);
    return()=>window.removeEventListener('tailorfit:before-navigation',navigate);
  },[dirty,message,bypass]);
}
