"use client";
import { useEffect, useRef, type ReactNode } from 'react';
import { useAnimate, useInView, useReducedMotion } from 'framer-motion';
import styles from './landing.module.css';

type RevealProps = { children: ReactNode; className?: string; delay?: number; hero?: boolean; role?: 'article' };
/** Content remains visible without JavaScript. Each entrance runs once, on approach. */
export function Reveal({children,className='',delay=0,hero=false,role}:RevealProps) {
  const [scope,animate]=useAnimate<HTMLDivElement>();
  const inView=useInView(scope,{once:true,amount:0.12,margin:'0px 0px -32px 0px'});
  const reduced=useReducedMotion();
  const played=useRef(false);
  useEffect(()=>{
    const element=scope.current;
    if(!element||!inView||played.current)return;
    played.current=true;
    if(reduced)return;
    const controls=animate(element,{opacity:[0.72,1],transform:[`translateY(${hero?12:20}px)`,'translateY(0px)']},{duration:hero?0.5:0.6,delay:Math.min(delay,120)/1000,ease:[0.23,1,0.32,1]});
    const sync=()=>document.hidden?controls.pause():controls.play();
    document.addEventListener('visibilitychange',sync);
    sync();
    return()=>{controls.stop();element.style.opacity='1';element.style.transform='none';document.removeEventListener('visibilitychange',sync);};
  },[inView,reduced,animate,scope,delay,hero]);
  return <div ref={scope} role={role} className={className} data-scroll-reveal="">{children}</div>;
}

export function FeatureBackdrop() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element || !element.animate || !('IntersectionObserver' in window)) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce), (hover: none), (pointer: coarse)');
    let visible = false;
    let played = false;
    let animation: Animation | undefined;
    const sync = () => {
      if (preference.matches) { animation?.cancel(); return; }
      if (visible && !document.hidden && !played) {
        played = true;
        animation = element.animate(
          [{ transform: 'translate(-6px, -6px)' }, { transform: 'translate(6px, 6px)' }, { transform: 'translate(0, 0)' }],
          { duration: 4000, easing: 'ease-in-out', iterations: 1 },
        );
      }
      if (!animation || animation.playState === 'finished' || animation.playState === 'idle') return;
      if (visible && !document.hidden) animation.play();
      else animation.pause();
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
    observer.observe(element);
    preference.addEventListener('change', sync);
    document.addEventListener('visibilitychange', sync);
    return () => {
      observer.disconnect(); animation?.cancel();
      preference.removeEventListener('change', sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, []);
  return <div ref={ref} className={styles.backdrop} aria-hidden="true" />;
}
