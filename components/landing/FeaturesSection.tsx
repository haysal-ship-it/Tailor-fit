'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import {
  motion,
  useScroll,
  useMotionValueEvent,
  useReducedMotion,
  type MotionValue,
} from 'framer-motion';

type FeatureId = 'measurements' | 'clients' | 'orders';

const FEATURES: { id: FeatureId; title: string; body: string }[] = [
  {
    id: 'measurements',
    title: 'Measurements',
    body: 'Rotate the mannequin, select a measurement point and enter its value. Garment templates help you choose the fields you need, while List view makes keyboard entry straightforward.',
  },
  {
    id: 'clients',
    title: 'Client records',
    body: 'Keep contact details, saved measurements and order history together. Review an earlier fitting and use its measurements as the starting point for a new garment.',
  },
  {
    id: 'orders',
    title: 'Orders and due dates',
    body: 'Keep the garment brief, reference images, price and due date with each order. Review its status and use the calendar to see the work coming up.',
  },
];

function FeatureVisual({ id }: { id: FeatureId }) {
  const bg =
    id === 'measurements'
      ? '/assets/landing/features-preview.png'
      : id === 'clients'
        ? '/assets/landing/noisy-gradient-2.png'
        : '/assets/landing/noisy-gradient-1.png';

  return (
    <div className="relative w-full h-[360px] sm:h-[420px] rounded-[24px] overflow-hidden bg-[#E4CECE] flex items-center justify-center p-6">
      <div className="absolute inset-0 pointer-events-none">
        <Image src={bg} alt="" fill unoptimized className="object-cover opacity-90" />
      </div>

      {id === 'measurements' && (
        <div className="relative z-10 w-full max-w-[440px] aspect-[16/10] bg-white rounded-[20px] p-5 shadow-2xl flex flex-col items-center justify-center text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#1D49E8]/10 text-[#1D49E8] flex items-center justify-center font-bold text-[18px]">
            360°
          </div>
          <span className="text-[16px] font-semibold text-black">Interactive Mannequin View</span>
          <span className="text-[13px] text-neutral-500 max-w-xs">
            Front, Left, Back and Right angles with direct point selection and live unit conversions.
          </span>
        </div>
      )}

      {id === 'clients' && (
        <div className="relative z-10 w-full max-w-[440px] aspect-[16/10] bg-white rounded-[20px] p-5 shadow-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
            <div>
              <h4 className="text-[15px] font-semibold text-black">Adriana Kunle</h4>
              <p className="text-[12px] text-neutral-500">Last fitting: 14 Oct 2026</p>
            </div>
            <span className="px-2.5 py-1 bg-green-50 text-green-700 text-[11px] font-semibold rounded-full border border-green-200">
              Active Client
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 py-2">
            {[
              ['Bust', '94 cm'],
              ['Waist', '72 cm'],
              ['Hips', '102 cm'],
            ].map(([label, value]) => (
              <div key={label} className="p-2 bg-neutral-50 rounded-[8px] text-center">
                <span className="text-[10px] text-neutral-500 block">{label}</span>
                <span className="text-[13px] font-bold text-black">{value}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-end pt-2 border-t border-neutral-100">
            <span className="text-[12px] font-semibold text-[#1D49E8]">Reuse for New Order →</span>
          </div>
        </div>
      )}

      {id === 'orders' && (
        <div className="relative z-10 w-full max-w-[440px] aspect-[16/10] bg-white rounded-[20px] p-5 shadow-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
            <span className="text-[14px] font-semibold text-black">Order #ORD-2026-09</span>
            <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-[11px] font-semibold rounded-full border border-amber-200">
              Due in 4 Days
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-[10px] bg-neutral-100 border border-neutral-200 flex items-center justify-center text-[11px] text-neutral-500 font-medium">
              Photo
            </div>
            <div>
              <h5 className="text-[13px] font-semibold text-black">Silk Evening Gown</h5>
              <p className="text-[11px] text-neutral-500">Client: Chloe Dallas · ₦140,000</p>
            </div>
          </div>
          <div className="p-2.5 bg-neutral-50 rounded-[8px] flex items-center justify-between text-[12px]">
            <span className="text-neutral-600">Pickup Scheduled:</span>
            <span className="font-semibold text-black">Wed, 9 Nov 2026</span>
          </div>
        </div>
      )}
    </div>
  );
}

function ProgressItem({
  title,
  progress,
  isActive,
  onSelect,
}: {
  title: string;
  progress: MotionValue<number>;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <button type="button" onClick={onSelect} className="flex flex-col gap-3 text-left group cursor-pointer">
      <span
        className={`text-[24px] font-semibold transition-colors duration-200 ${
          isActive ? 'text-[#1D1D1D]' : 'text-[#8E8E8E] group-hover:text-black'
        }`}
      >
        {title}
      </span>
      <div className="relative h-[2px] w-full max-w-[480px] bg-[#D9D9D9] rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-[#1D49E8] origin-left"
          style={{ scaleX: progress }}
        />
      </div>
    </button>
  );
}

export function FeaturesSection() {
  const reduceMotion = useReducedMotion();
  const [activeFeature, setActiveFeature] = useState<FeatureId>('measurements');

  const refs = {
    measurements: useRef<HTMLDivElement>(null),
    clients: useRef<HTMLDivElement>(null),
    orders: useRef<HTMLDivElement>(null),
  };

  // Each card's progress runs 0 → 1 from its top reaching viewport centre
  // until its bottom (including the gap to the next card) passes viewport centre.
  const offset: ['start center', 'end center'] = ['start center', 'end center'];
  const progress = {
    measurements: useScroll({ target: refs.measurements, offset }).scrollYProgress,
    clients: useScroll({ target: refs.clients, offset }).scrollYProgress,
    orders: useScroll({ target: refs.orders, offset }).scrollYProgress,
  };

  const track = (id: FeatureId) => (v: number) => {
    if (v > 0 && v < 1) setActiveFeature((prev) => (prev === id ? prev : id));
  };
  useMotionValueEvent(progress.measurements, 'change', track('measurements'));
  useMotionValueEvent(progress.clients, 'change', track('clients'));
  useMotionValueEvent(progress.orders, 'change', track('orders'));

  const scrollToFeature = (id: FeatureId) => {
    refs[id].current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  };

  return (
    <section id="features" className="py-20 sm:py-28 max-w-[1440px] mx-auto px-6 sm:px-12 lg:px-20 scroll-mt-24">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
        {/* Left column: sticky heading + scroll-linked progress */}
        <div className="lg:col-span-5 lg:sticky lg:top-32 lg:self-start flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <h2 className="text-[36px] sm:text-[42px] font-semibold text-[#1D1D1D] leading-[1.2]">
              The details behind every garment, together.
            </h2>
            <p className="text-[20px] text-[#727272] font-medium leading-[1.44]">
              Move between measurements, client records and orders without piecing together scattered notes.
            </p>
          </div>

          <div className="hidden lg:flex flex-col gap-6 pt-2">
            {FEATURES.map((f) => (
              <ProgressItem
                key={f.id}
                title={f.title}
                progress={progress[f.id]}
                isActive={activeFeature === f.id}
                onSelect={() => scrollToFeature(f.id)}
              />
            ))}
          </div>
        </div>

        {/* Right column: scrolling feature cards (no padding, no stroke) */}
        <div className="lg:col-span-7 flex flex-col">
          {FEATURES.map((f) => (
            <div
              key={f.id}
              ref={refs[f.id]}
              className="flex flex-col gap-6 pb-16 last:pb-0 scroll-mt-32"
            >
              <div className="flex flex-col gap-3">
                <h3 className="text-[26px] sm:text-[28px] font-semibold text-[#1D1D1D]">{f.title}</h3>
                <p className="text-[18px] text-[#727272] leading-[1.44]">{f.body}</p>
              </div>
              <FeatureVisual id={f.id} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
