'use client';
import {useEffect,useRef,useState} from 'react';
import {UsersRound,Plus,ClipboardList,Ruler,Search,CalendarDays,Bell,Check,ArrowUpRight} from 'lucide-react';
import './empty-state.css';
export type EmptyKind='clients'|'orders'|'fittings'|'search'|'filter'|'activity'|'calendar'|'notifications';
const IconMap={clients:UsersRound,orders:ClipboardList,fittings:Ruler,search:Search,filter:ClipboardList,activity:ArrowUpRight,calendar:CalendarDays,notifications:Bell};
export function EmptyArtwork({kind,replay}:{kind:EmptyKind;replay:number}) {
  const host=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const node=host.current!;
    const observer=new IntersectionObserver(([entry])=>{node.dataset.visible=String(entry.isIntersecting)});
    const visibility=()=>{node.dataset.paused=String(document.hidden)};
    visibility();observer.observe(node);document.addEventListener('visibilitychange',visibility);
    return()=>{observer.disconnect();document.removeEventListener('visibilitychange',visibility)};
  },[]);
  const Icon=IconMap[kind];
  return <div ref={host} className={'art art-'+kind} aria-hidden="true">
    <div key={replay} className="art-stage">
      <div className="art-ground"/>
      {kind==='clients'?<>
        <div className="mini-card card-back"><div className="avatar-dot"/><i/><i/></div>
        <div className="mini-card card-front"><div className="avatar-dot"/><i/><i/></div>
        <span className="art-badge"><Plus size={16}/></span>
      </>:kind==='orders'||kind==='filter'?<>
        <div className="fabric"/><div className="order-slip"><span/><i/><i/><i/><div className="slip-total"/></div>
        <span className="art-badge"><Plus size={16}/></span>
      </>:kind==='fittings'?<>
        <div className="tape-coil"/><div className="tape-tail">{Array.from({length:9},(_,i)=><i key={i}/>)}</div><span className="tape-end"/>
      </>:kind==='activity'?<div className="chart-bars"><i/><i/><i/><i/></div>
      :<><div className="icon-sheet"><Icon size={44} strokeWidth={1.4}/>{kind==='search'&&<><i/><i/></>}</div>
      {kind==='notifications'&&<span className="art-badge"><Check size={15}/></span>}</>}
    </div>
  </div>;
}

export function EmptyState({kind,title,description,actionLabel,onAction,secondaryActionLabel,onSecondaryAction,compact=false,headingLevel=3}:{
 kind:EmptyKind;title:string;description:string;actionLabel?:string;onAction?:()=>void;secondaryActionLabel?:string;onSecondaryAction?:()=>void;compact?:boolean;headingLevel?:2|3;
}){
 const [replay,setReplay]=useState(0);
 const Heading=headingLevel===2?'h2':'h3';
 return <div className={'tf-empty'+(compact?' tf-empty-compact':'')}>
   <EmptyArtwork kind={kind} replay={replay}/>
   <Heading>{title}</Heading><p>{description}</p>
   {((actionLabel&&onAction)||(secondaryActionLabel&&onSecondaryAction))&&<div className="tf-empty-actions">
   {actionLabel&&onAction&&<button type="button" className="tf-empty-action" onFocus={()=>setReplay(n=>n+1)} onMouseEnter={()=>setReplay(n=>n+1)} onClick={onAction}>{actionLabel}</button>}
   {secondaryActionLabel&&onSecondaryAction&&<button type="button" className="tf-empty-action tf-empty-secondary" onClick={onSecondaryAction}>{secondaryActionLabel}</button>}
   </div>}
 </div>;
}
