'use client';
import './mannequin-demo.css';
import {useEffect,useRef,useState,useSyncExternalStore} from 'react';
import {Pause,Play} from 'lucide-react';
import {RotatableMannequin} from '@/components/mannequin/RotatableMannequin';
import {DEMO_CURSOR_KEYFRAMES,DEMO_DURATION,DEMO_POINTS,REDUCED_FRAME,demoFrameAt,demoSize} from '@/lib/onboarding/mannequin-demo';

const motionQuery='(prefers-reduced-motion: reduce)';
function subscribeMotion(callback:()=>void){const query=window.matchMedia(motionQuery);query.addEventListener('change',callback);return()=>query.removeEventListener('change',callback);}
function reduceMotion(){return window.matchMedia(motionQuery).matches||!('animate' in Element.prototype);}

export function MannequinDemo({unit}:{unit:'cm'|'in'}){
  const reduced=useSyncExternalStore(subscribeMotion,reduceMotion,()=>true);
  const cursor=useRef<SVGGElement>(null),animation=useRef<Animation|null>(null),pausedRef=useRef(false);
  const [frame,setFrame]=useState(()=>demoFrameAt(0)),[paused,setPaused]=useState(false);
  const current=reduced?REDUCED_FRAME:frame;
  useEffect(()=>{
    if(reduced||!cursor.current)return;
    const motion=cursor.current.animate(DEMO_CURSOR_KEYFRAMES,{duration:DEMO_DURATION,iterations:Infinity,fill:'both'});
    animation.current=motion;
    if(pausedRef.current)motion.pause();
    const timer=window.setInterval(()=>{
      const next=demoFrameAt(Number(motion.currentTime)||0);
      setFrame(previous=>previous.id===next.id?previous:next);
    },80);
    return()=>{window.clearInterval(timer);motion.cancel();animation.current=null;};
  },[reduced]);
  function togglePause(){const next=!pausedRef.current;pausedRef.current=next;setPaused(next);if(next)animation.current?.pause();else animation.current?.play();}
  return <div className="ob-mannequin-demo" data-demo-phase={current.id} data-paused={paused||reduced}>
    <div className="ob-demo-stage" role="img" aria-label="Mannequin demonstration: a cursor reveals waist, bust and shoulder measurements, then turns the mannequin to show every angle.">
      <div inert aria-hidden="true" className="ob-demo-renderer"><RotatableMannequin gender="female" activeView={current.view} showControls={false} measurements={{}} activePointKeys={[]} readOnly className="max-w-[430px]"/></div>
      <svg className="ob-demo-overlay" viewBox="-40 0 716 730" aria-hidden="true" focusable="false">
        {DEMO_POINTS.map(point=>{
          const selected=current.point===point.key,revealed=selected&&current.reveal;
          const left=point.side==='left',cardX=left?0:488,cardY=point.y-42;
          const endX=left?148:480,endY=point.y-5;
          return <g key={point.key} className="ob-demo-point" style={{opacity:current.pointsVisible?1:0}}>
            <g className="ob-demo-leader" style={{transformBox:'fill-box',transformOrigin:left?'right center':'left center',transform:revealed?'scaleX(1)':'scaleX(0)',opacity:revealed?1:0}}>
              <polyline points={`${point.x},${point.y} ${left?endX+18:endX-18},${endY} ${endX},${endY}`} stroke="#079BF8" strokeWidth="1.5" fill="none" vectorEffect="non-scaling-stroke"/>
              <circle cx={endX} cy={endY} r="3" fill="#079BF8"/>
            </g>
            <g className="ob-demo-measurement" data-revealed={revealed} style={{opacity:revealed?1:0,transform:`translate(${revealed?0:left?6:-6}px, 0px)`}}>
              <rect x={cardX} y={cardY} width="140" height="76" rx="12" fill="white" stroke="#E5E9F2" strokeWidth="1.5"/>
              <text x={cardX+14} y={cardY+27} fontSize="20" fontWeight="500" fill="#595959">{point.label}</text>
              <text x={cardX+14} y={cardY+56} fontSize="25" fontWeight="600" fill="#1D49E8">{demoSize(point.cm,unit)}</text>
            </g>
            {selected&&!reduced&&<circle key={current.id} className="ob-demo-pulse" cx={point.x} cy={point.y} r="17" fill="none" stroke="#079BF8" strokeWidth="2"/>}
            <circle cx={point.x} cy={point.y} r={selected?9:6.5} fill={selected?'#1D49E8':'#079BF8'} stroke="white" strokeWidth="3"/>
            <circle cx={point.x} cy={point.y} r="2.4" fill="white"/>
          </g>;
        })}
        <g ref={cursor} className="ob-demo-cursor" style={{opacity:reduced?0:undefined}}><path d="M1 1 L1 33 L9 25 L16 40 L23 36 L16 22 L31 21 Z" fill="#1D49E8" stroke="white" strokeWidth="2.5" strokeLinejoin="round"/></g>
      </svg>
    </div>
    <div className="ob-demo-controls"><span><i/>{current.pointsVisible?'Example measurements':'A view from every angle'}</span>{!reduced&&<button type="button" onClick={togglePause} aria-label={paused?'Resume mannequin demo':'Pause mannequin demo'} title={paused?'Resume animation':'Pause animation'} aria-pressed={paused}>{paused?<Play size={14}/>:<Pause size={14}/>}</button>}</div>
  </div>;
}
