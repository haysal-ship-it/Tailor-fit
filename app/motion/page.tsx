'use client';

import React from 'react';
import Link from 'next/link';
import { MotionFilmStudio } from '@/components/motion/MotionFilmStudio';
import { ArrowLeft, Clapperboard, Sparkles } from 'lucide-react';
import { OrigamiTailorFitLogo } from '@/components/Navbar';

export default function MotionPage() {
  return (
    <div className="min-h-screen bg-[#F5F2EB] dark:bg-[#121110] text-[#141312] dark:text-white flex flex-col transition-colors selection:bg-[#C9AB84] selection:text-black">
      {/* Top Breadcrumb & Return Bar */}
      <header className="w-full max-w-[1360px] mx-auto px-4 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#E8DDD0] dark:border-white/10 bg-white dark:bg-[#1E1C1A] text-[12px] font-semibold text-[#141312] dark:text-white hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to TailorFit Atelier</span>
        </Link>

        <div className="flex items-center gap-2 text-[12px] font-mono text-[#7A7570] dark:text-white/60">
          <Clapperboard className="w-4 h-4 text-[#8B6E45]" />
          <span>PRODUCTION MOTION GRAPHICS • 16:9 60s</span>
        </div>
      </header>

      {/* Main Studio Viewport */}
      <main className="flex-1 flex flex-col justify-center">
        <MotionFilmStudio />
      </main>
    </div>
  );
}
