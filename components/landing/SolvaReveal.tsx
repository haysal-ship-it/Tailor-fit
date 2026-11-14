"use client";

import { useRef, type ReactNode } from 'react';
import dynamic from 'next/dynamic';

// Motion enhances the rendered page after its interactive content is available.
const LandingRevealMotion = dynamic(() => import('./LandingRevealMotion'), { ssr: false });

export function SolvaReveal({ children, className = '', delay = 0, role, hero = false }: {
  children: ReactNode; className?: string; delay?: number; role?: 'article'; hero?: boolean;
}) {
  const scope = useRef<HTMLDivElement>(null);
  return <div ref={scope} role={role} className={className} data-solva-reveal="" data-motion-engine="gsap">
    {children}
    <LandingRevealMotion scope={scope} delay={delay} hero={hero} />
  </div>;
}
