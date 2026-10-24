'use client';

import React from 'react';
import { FemaleMannequinReference } from '@/components/mannequin/FemaleMannequinReference';

export default function FemaleMannequinPreviewPage() {
  return (
    <main className="min-h-screen w-full bg-[#ECECEE] text-[#141414] py-6 px-4 sm:px-8">
      <div className="max-w-[1440px] mx-auto flex flex-col gap-4">
        <FemaleMannequinReference showAlignmentGuides={false} />
      </div>
    </main>
  );
}
