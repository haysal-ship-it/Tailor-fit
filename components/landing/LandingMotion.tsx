'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import styles from './landing.module.css';

type RevealProps = { children: ReactNode; className?: string; delay?: number; hero?: boolean };

/** Visible server-rendered content; motion is a progressive enhancement. */
export function Reveal({ children, className = '', delay = 0, hero = false }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element || !element.animate || !('IntersectionObserver' in window)) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let played = false;
    let animation: Animation | undefined;
    let visible = false;
    const sync = () => {
      if (preference.matches) { animation?.finish(); return; }
      if (animation?.playState === 'finished') return;
      if (visible && !document.hidden) animation?.play();
      else animation?.pause();
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !played) {
        played = true;
        if (!preference.matches) animation = element.animate(
          [{ transform: `translateY(${hero ? 12 : 8}px)`, opacity: 0.75 }, { transform: 'translateY(0)', opacity: 1 }],
          { duration: hero ? 320 : 280, delay, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' },
        );
      }
      sync();
    }, { threshold: 0.1 });
    observer.observe(element);
    preference.addEventListener('change', sync);
    document.addEventListener('visibilitychange', sync);
    return () => {
      observer.disconnect(); animation?.cancel();
      preference.removeEventListener('change', sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, [delay, hero]);
  return <div ref={ref} className={className}>{children}</div>;
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
