'use client';

import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import {
  motion,
  useScroll,
  useMotionValueEvent,
  useReducedMotion,
  type MotionValue,
} from 'framer-motion';
import { InteractiveShaderBackground } from './InteractiveShaderBackground';

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
  return (
    <div className="relative w-full h-[380px] sm:h-[460px] lg:h-[480px] rounded-[32px] overflow-hidden bg-[#e4cece] flex items-center justify-center">
      {/* Animated interactive shader fill */}
      <InteractiveShaderBackground speed={1.2} />

      {/* Image container filling 80% of shader container, relative across all breakpoints */}
      <div className="relative w-[80%] h-[80%] z-10 flex items-center justify-center rounded-[24px] bg-white/40 backdrop-blur-md border border-white/60 shadow-[0_16px_40px_rgba(0,0,0,0.12)] p-4 sm:p-6 transition-transform duration-300 hover:scale-[1.01]">
        {id === 'measurements' && (
          <div className="relative w-full h-full bg-white/95 rounded-[18px] p-5 shadow-sm flex flex-col items-center justify-center text-center gap-3">
            <div className="w-14 h-14 rounded-full bg-[#1D49E8]/10 text-[#1D49E8] flex items-center justify-center font-bold text-[20px] shadow-xs">
              360°
            </div>
            <span className="text-[18px] font-semibold text-[#1D1D1D]">Interactive Mannequin View</span>
            <span className="text-[14px] text-[#727272] max-w-sm leading-relaxed">
              Front, Left, Back and Right angles with direct measurement point selection and live unit conversions.
            </span>
            <div className="flex items-center gap-2 pt-1 text-[13px] font-medium text-[#1D49E8]">
              <span>Rotate 3D Mannequin</span>
              <span>→</span>
            </div>
          </div>
        )}

        {id === 'clients' && (
          <div className="relative w-full h-full bg-white/95 rounded-[18px] p-5 sm:p-6 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <h4 className="text-[17px] font-semibold text-[#1D1D1D]">Adriana Kunle</h4>
                <p className="text-[13px] text-[#727272]">Last fitting: 14 Oct 2026</p>
              </div>
              <span className="px-3 py-1 bg-green-50 text-green-700 text-[12px] font-semibold rounded-full border border-green-200">
                Active Client
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2.5 py-3">
              {[
                ['Bust', '94 cm'],
                ['Waist', '72 cm'],
                ['Hips', '102 cm'],
              ].map(([label, value]) => (
                <div key={label} className="p-2.5 bg-neutral-50 rounded-[10px] text-center border border-neutral-100">
                  <span className="text-[11px] text-[#727272] block font-medium">{label}</span>
                  <span className="text-[14px] font-bold text-[#1D1D1D]">{value}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
              <span className="text-[12px] text-[#727272]">4 garments created</span>
              <span className="text-[13px] font-semibold text-[#1D49E8] hover:underline cursor-pointer">
                Reuse for New Order →
              </span>
            </div>
          </div>
        )}

        {id === 'orders' && (
          <div className="relative w-full h-full bg-white/95 rounded-[18px] p-5 sm:p-6 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <span className="text-[15px] font-semibold text-[#1D1D1D]">Order #ORD-2026-09</span>
              <span className="px-3 py-1 bg-amber-50 text-amber-700 text-[12px] font-semibold rounded-full border border-amber-200">
                Due in 4 Days
              </span>
            </div>
            <div className="flex items-center gap-3.5 my-auto">
              <div className="w-14 h-14 rounded-[12px] bg-[#1D49E8]/10 text-[#1D49E8] font-bold border border-[#1D49E8]/20 flex items-center justify-center text-[12px]">
                GOWN
              </div>
              <div>
                <h5 className="text-[15px] font-semibold text-[#1D1D1D]">Silk Evening Gown</h5>
                <p className="text-[13px] text-[#727272]">Client: Chloe Dallas · ₦140,000</p>
              </div>
            </div>
            <div className="p-3 bg-neutral-50 rounded-[10px] flex items-center justify-between text-[13px] border border-neutral-100">
              <span className="text-[#727272]">Pickup Scheduled:</span>
              <span className="font-semibold text-[#1D1D1D]">Wed, 9 Nov 2026</span>
            </div>
          </div>
        )}
      </div>
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
    <button
      type="button"
      onClick={onSelect}
      className="flex flex-col gap-3.5 text-left group cursor-pointer w-full max-w-[480px]"
    >
      <span
        className={`text-[18px] sm:text-[20px] font-semibold transition-colors duration-200 ${
          isActive ? 'text-[#1D1D1D]' : 'text-[#606060] group-hover:text-black'
        }`}
      >
        {title}
      </span>
      <div className="relative h-[2px] w-full bg-[#D9D9D9] rounded-full overflow-hidden">
        {isActive ? (
          <motion.div
            className="absolute inset-y-0 left-0 bg-[#1D49E8] origin-left rounded-full"
            style={{
              width: '100%',
              scaleX: progress,
            }}
          />
        ) : (
          <div className="w-0 h-full bg-[#1D49E8]" />
        )}
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

  // Scroll offset: starts moving when card top reaches 65% of viewport, finishes when card bottom reaches 35%
  const offset: ['start 65%', 'end 35%'] = ['start 65%', 'end 35%'];
  const progress = {
    measurements: useScroll({ target: refs.measurements, offset }).scrollYProgress,
    clients: useScroll({ target: refs.clients, offset }).scrollYProgress,
    orders: useScroll({ target: refs.orders, offset }).scrollYProgress,
  };

  // Synchronize which card is active: exactly ONE active card with dynamic progress bar
  const updateActiveCard = () => {
    const pOrders = progress.orders.get();
    const pClients = progress.clients.get();

    if (pOrders > 0.05) {
      setActiveFeature('orders');
    } else if (pClients > 0.05) {
      setActiveFeature('clients');
    } else {
      setActiveFeature('measurements');
    }
  };

  useMotionValueEvent(progress.measurements, 'change', updateActiveCard);
  useMotionValueEvent(progress.clients, 'change', updateActiveCard);
  useMotionValueEvent(progress.orders, 'change', updateActiveCard);

  const scrollToFeature = (id: FeatureId) => {
    refs[id].current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
  };

  return (
    <section id="features" className="py-20 sm:py-28 max-w-[1440px] mx-auto px-6 sm:px-12 lg:px-20 scroll-mt-24">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
        {/* Left column: sticky heading + active-only scroll-linked progress */}
        <div className="lg:col-span-5 lg:sticky lg:top-36 lg:self-start flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <h2 className="text-[32px] sm:text-[36px] lg:text-[42px] font-semibold text-[#1D1D1D] leading-[1.2]">
              The details behind every garment, together.
            </h2>
            <p className="text-[18px] sm:text-[20px] text-[#727272] font-medium leading-[1.44]">
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
        <div className="lg:col-span-7 flex flex-col gap-12 sm:gap-16">
          {FEATURES.map((f) => (
            <div
              key={f.id}
              ref={refs[f.id]}
              className="flex flex-col gap-6 scroll-mt-32"
            >
              <div className="flex flex-col gap-3">
                <h3 className="text-[24px] sm:text-[28px] font-semibold text-[#1D1D1D] leading-[1.2]">{f.title}</h3>
                <p className="text-[17px] sm:text-[18px] text-[#727272] leading-[1.44] font-medium">{f.body}</p>
              </div>
              <FeatureVisual id={f.id} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
