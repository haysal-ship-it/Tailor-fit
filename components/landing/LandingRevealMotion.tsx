"use client";

import type { RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CustomEase } from 'gsap/CustomEase';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, CustomEase, useGSAP);
const entranceEase = CustomEase.create('tailorfit-entrance', '0.23,1,0.32,1');

export default function LandingRevealMotion({ scope, delay, hero }: {
  scope: RefObject<HTMLDivElement | null>; delay: number; hero: boolean;
}) {
  useGSAP(() => {
    const element = scope.current;
    if (!element) return;
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const rect = element.getBoundingClientRect();
      const alreadyVisible = rect.top < window.innerHeight * 0.92;
      // Never hide copy someone is already reading, including restored/hash positions.
      if (rect.bottom <= 0 || (alreadyVisible && !hero)) return;
      let trigger: ScrollTrigger | undefined;
      let pausedByVisibility = false;
      const tween = gsap.fromTo(element,
        { opacity: alreadyVisible ? 0.9 : 0.18, y: alreadyVisible ? 12 : 18 },
        { opacity: 1, y: 0, duration: hero ? 0.7 : 0.6,
          delay: Math.min(Math.max(delay, 0), 120) / 1000,
          ease: entranceEase, paused: true, clearProps: 'opacity,transform',
          onComplete: () => trigger?.kill() });
      const finish = () => { tween.totalProgress(1); trigger?.kill(); };
      const play = () => {
        if (element.getBoundingClientRect().bottom <= 0) { finish(); return; }
        tween.play();
        if (document.hidden) { pausedByVisibility = true; tween.pause(); }
      };
      if (alreadyVisible) play();
      else trigger = ScrollTrigger.create({ trigger: element, start: 'top 92%',
        onEnter: play, onLeave: finish });
      const visibility = () => {
        if (document.hidden && tween.isActive()) { pausedByVisibility = true; tween.pause(); }
        else if (!document.hidden && pausedByVisibility) { pausedByVisibility = false; tween.resume(); }
      };
      element.addEventListener('focusin', finish);
      document.addEventListener('visibilitychange', visibility);
      return () => {
        trigger?.kill(); tween.revert();
        element.removeEventListener('focusin', finish);
        document.removeEventListener('visibilitychange', visibility);
      };
    });
    return () => media.revert();
  }, { scope, dependencies: [delay, hero], revertOnUpdate: true });
  return null;
}
