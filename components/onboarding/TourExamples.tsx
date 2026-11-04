import React from 'react';
import Image from 'next/image';
import { User, Scissors, ArrowRight, RotateCw, Check, Calendar, Tag } from 'lucide-react';

interface TourExampleProps {
  exampleId: 'client-fields' | 'template-picker' | 'mannequin-rotation' | 'order-summary' | 'client-reuse';
}

export function TourExample({ exampleId }: TourExampleProps) {
  return (
    <div
      aria-hidden="true"
      className="w-full h-[96px] bg-[var(--card)] rounded-[10px] p-2.5 flex items-center justify-center border border-[var(--outline)] select-none overflow-hidden"
    >
      {exampleId === 'client-fields' && (
        <div className="w-full max-w-[260px] flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-[6px] border border-[#E8E8E8] shadow-2xs">
            <User className="w-3.5 h-3.5 text-[var(--muted)] shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] text-[var(--muted)] leading-none">Client Name</span>
              <span className="text-[11px] font-semibold text-black truncate leading-tight">Adriana Kunle</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-[6px] border border-[#E8E8E8] shadow-2xs">
            <Scissors className="w-3.5 h-3.5 text-[var(--muted)] shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] text-[var(--muted)] leading-none">Garment Type</span>
              <span className="text-[11px] font-semibold text-black truncate leading-tight">Bespoke Evening Gown</span>
            </div>
          </div>
        </div>
      )}

      {exampleId === 'template-picker' && (
        <div className="w-full max-w-[260px] flex items-center justify-between gap-1.5">
          <div className="bg-white px-2.5 py-2 rounded-[8px] border border-[var(--primary)] flex flex-col items-center shadow-2xs shrink-0">
            <span className="text-[9px] font-medium text-[var(--primary)]">Template</span>
            <span className="text-[11px] font-bold text-black">Evening Gown</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-[var(--primary)] shrink-0" />
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <div className="bg-white px-2 py-1 rounded-[6px] border border-[#E8E8E8] flex justify-between items-center text-[10px]">
              <span className="font-medium text-black">Bust</span>
              <span className="text-[var(--primary)] font-bold">88 cm</span>
            </div>
            <div className="bg-white px-2 py-1 rounded-[6px] border border-[#E8E8E8] flex justify-between items-center text-[10px]">
              <span className="font-medium text-black">Waist</span>
              <span className="text-[var(--primary)] font-bold">68 cm</span>
            </div>
          </div>
        </div>
      )}

      {exampleId === 'mannequin-rotation' && (
        <div className="w-full flex items-center justify-center gap-3">
          <div className="relative w-12 h-20 shrink-0">
            <Image
              src="/assets/mannequin-female-front.png"
              alt=""
              width={48}
              height={80}
              className="object-contain w-full h-full"
            />
            {/* Pulsing landmark hotspot pin */}
            <div className="absolute top-[32%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[var(--primary)]/30 border border-[var(--primary)] flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
            </div>
          </div>
          <div className="flex flex-col gap-1 items-start text-[11px]">
            <div className="flex items-center gap-1 text-[var(--primary)] font-semibold bg-white px-2 py-1 rounded-full border border-[var(--primary)]/20 shadow-2xs">
              <RotateCw className="w-3 h-3" />
              <span>360° Drag &amp; Keys</span>
            </div>
            <span className="text-[10px] text-[var(--text-2)]">Front • Left • Back • Right</span>
          </div>
        </div>
      )}

      {exampleId === 'order-summary' && (
        <div className="w-full max-w-[260px] flex items-center justify-between gap-2">
          <div className="flex flex-col gap-1 flex-1">
            <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-2)] bg-white px-2 py-1 rounded-[6px] border border-[#E8E8E8]">
              <Tag className="w-3 h-3 text-[var(--primary)]" />
              <span className="font-semibold text-black">₦ 120,000</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-2)] bg-white px-2 py-1 rounded-[6px] border border-[#E8E8E8]">
              <Calendar className="w-3 h-3 text-[var(--primary)]" />
              <span className="font-semibold text-black">15 Nov 2026</span>
            </div>
          </div>
          <div className="bg-[var(--primary)] text-white px-3 py-2 rounded-[24px] flex items-center gap-1 text-[11px] font-bold shadow-xs shrink-0">
            <Check className="w-3.5 h-3.5" />
            <span>Save Order</span>
          </div>
        </div>
      )}

      {exampleId === 'client-reuse' && (
        <div className="w-full max-w-[260px] flex items-center justify-between gap-2">
          <div className="bg-white p-2 rounded-[8px] border border-[#E8E8E8] shadow-2xs flex-1 min-w-0">
            <div className="flex items-center gap-1 mb-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-bold text-black truncate">Adriana Kunle</span>
            </div>
            <div className="flex items-center gap-1 text-[9px] text-[var(--muted)]">
              <span>3 Orders</span>
              <span>•</span>
              <span className="text-[var(--primary)] font-medium">Saved Fitting</span>
            </div>
          </div>
          <div className="bg-white border border-[var(--primary)] text-[var(--primary)] px-2.5 py-1.5 rounded-[20px] text-[10px] font-bold shrink-0">
            Reuse Fitting
          </div>
        </div>
      )}
    </div>
  );
}
