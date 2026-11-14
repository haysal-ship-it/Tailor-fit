'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { useAnimate, useInView, useReducedMotion } from 'framer-motion';

/** Solva's 16px, low-bounce spring entrance, scoped to the requested sections. */
export function SolvaReveal({ children, className='', delay=0, role }: {
  children:ReactNode; className?:string; delay?:number; role?:'article';
}) {
  const [scope,animate]=useAnimate<HTMLDivElement>();
  const inView=useInView(scope,{once:true,amount:0.12,margin:'0px 0px -32px 0px'});
  const reduced=useReducedMotion();
  const played=useRef(false);
  useEffect(()=>{
    const element=scope.current;
    if(!element||!inView||played.current)return;
    played.current=true;
    if(reduced)return;
    let finished=false;
    const controls=animate(element,{opacity:[0.001,1],transform:['translateY(16px)','translateY(0px)']},{type:'spring',duration:1.2,bounce:0.1,delay:Math.min(Math.max(delay,0),600)/1000});
    void controls.then(()=>{finished=true;});
    const sync=()=>{if(finished)return;if(document.hidden)controls.pause();else controls.play();};
    const focus=()=>{controls.stop();finished=true;element.style.opacity='1';element.style.transform='none';};
    document.addEventListener('visibilitychange',sync);
    element.addEventListener('focusin',focus);
    sync();
    return()=>{controls.stop();element.style.opacity='1';element.style.transform='none';document.removeEventListener('visibilitychange',sync);element.removeEventListener('focusin',focus);};
  },[inView,reduced,animate,scope,delay]);
  return <div ref={scope} role={role} className={className} data-solva-reveal="">{children}</div>;
}
