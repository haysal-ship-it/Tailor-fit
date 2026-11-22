'use client';
import { useState, type ReactNode } from 'react';

export function ReferenceThumbnail({ src, alt, recovery }: { src: string; alt: string; recovery?: ReactNode }) {
  const [failed, setFailed] = useState<string | null>(null);
  if (!src || failed === src) return <div className="flex h-full flex-col items-center justify-center gap-1 px-1 text-center text-xs text-[var(--text-2)]">
    <span>Reference unavailable</span>{recovery}
  </div>;
  return <img src={src} alt={alt} onError={() => setFailed(src)} className="h-full w-full object-cover"/>;
}
