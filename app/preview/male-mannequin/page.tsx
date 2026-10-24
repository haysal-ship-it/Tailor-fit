'use client';

import React from 'react';
import { MaleMannequinReference } from '@/components/mannequin/MaleMannequinReference';

export default function MaleMannequinPreviewPage() {
  return (
    <main className="min-h-screen w-full bg-[#ECECEE] text-[#141414] py-6 px-4 sm:px-8">
      <div className="max-w-[1440px] mx-auto flex flex-col gap-4">
        <MaleMannequinReference showAlignmentGuides={false} />
      </div>
    </main>
  );
}
