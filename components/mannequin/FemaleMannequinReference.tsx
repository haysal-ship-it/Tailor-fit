'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  MANNEQUIN_SKIN_HEX,
  MANNEQUIN_SKIN_RGB,
} from '@/lib/mannequin/material';
import { RotatableMannequin } from '@/components/mannequin/RotatableMannequin';

export type OrthographicViewId = 'front' | 'left' | 'back';

interface ViewPanelSpec {
  id: OrthographicViewId;
  label: 'FRONT VIEW' | 'LEFT SIDE VIEW' | 'BACK VIEW';
  subtitle: string;
  imageSrc: string;
}

const VIEW_PANELS: ViewPanelSpec[] = [
  {
    id: 'front',
    label: 'FRONT VIEW',
    subtitle: '0° Orthographic · Anterior Projection',
    imageSrc: '/assets/mannequin-female-tpose-front.png',
  },
  {
    id: 'left',
    label: 'LEFT SIDE VIEW',
    subtitle: '90° Orthographic · Left Lateral Profile',
    imageSrc: '/assets/mannequin-female-tpose-left.png',
  },
  {
    id: 'back',
    label: 'BACK VIEW',
    subtitle: '180° Orthographic · Posterior Projection',
    imageSrc: '/assets/mannequin-female-tpose-back.png',
  },
];

export interface FemaleMannequinReferenceProps {
  showAlignmentGuides?: boolean;
  skinColorHex?: string;
}

export function FemaleMannequinReference({
  showAlignmentGuides: initialShowGuides = false,
  skinColorHex = MANNEQUIN_SKIN_HEX,
}: FemaleMannequinReferenceProps) {
  const [showGuides, setShowGuides] = useState(initialShowGuides);
  const [displayMode, setDisplayMode] = useState<'sheet' | 'panels' | 'rotatable'>('sheet');

  return (
    <div className="w-full flex flex-col gap-4 select-none">
      {/* Top specification & control bar */}
      <div className="w-full rounded-[8px] bg-white p-[2px] shadow-xs">
        <div className="w-full rounded-[6px] bg-[#F8F8F8] px-5 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-normal uppercase tracking-[0.3px] text-[#7D7D7D]">
              3D ORTHOGRAPHIC CHARACTER TURNAROUND · STUDIO RENDER
            </span>
            <h1 className="text-[16px] font-semibold text-black">
              Adult Female Mannequin — Strict 90° Horizontal T-Pose Reference Sheet
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Switch between Female & Male Preview */}
            <div className="flex items-center rounded-full bg-[#F2F2F2] p-1 border border-[#DDDBDB]">
              <span className="px-3 py-1 rounded-full text-[12px] font-medium bg-black text-white">
                Female
              </span>
              <Link
                href="/preview/male-mannequin"
                className="px-3 py-1 rounded-full text-[12px] font-medium text-[#525252] hover:text-black transition-colors"
              >
                Male
              </Link>
            </div>

            {/* Centralized Base Color Swatch Badge */}
            <div
              className="flex items-center gap-2.5 rounded-full bg-white px-3.5 py-1.5 border border-[#EDEDED]"
              title="Centralized Albedo Material Color"
            >
              <span
                className="w-4 h-4 rounded-full border border-black/15 shrink-0"
                style={{ backgroundColor: skinColorHex }}
              />
              <span className="text-[12px] font-medium text-black">
                Albedo <code className="font-mono font-semibold">{skinColorHex}</code>
              </span>
              <span className="text-[11px] text-[#7D7D7D]">
                RGB({MANNEQUIN_SKIN_RGB.r}, {MANNEQUIN_SKIN_RGB.g}, {MANNEQUIN_SKIN_RGB.b})
              </span>
            </div>

            {/* Display Mode Segmented Pill */}
            <div className="flex items-center rounded-full bg-[#F2F2F2] p-1 border border-[#DDDBDB]">
              <button
                type="button"
                onClick={() => setDisplayMode('sheet')}
                className={`px-3 py-1 rounded-full text-[12px] font-medium transition-colors cursor-pointer ${
                  displayMode === 'sheet'
                    ? 'bg-[#2563EB] text-white'
                    : 'text-[#525252] hover:text-black'
                }`}
              >
                Unified Sheet
              </button>
              <button
                type="button"
                onClick={() => setDisplayMode('panels')}
                className={`px-3 py-1 rounded-full text-[12px] font-medium transition-colors cursor-pointer ${
                  displayMode === 'panels'
                    ? 'bg-[#2563EB] text-white'
                    : 'text-[#525252] hover:text-black'
                }`}
              >
                3 Orthographic Panels
              </button>
              <button
                type="button"
                onClick={() => setDisplayMode('rotatable')}
                className={`px-3 py-1 rounded-full text-[12px] font-medium transition-colors cursor-pointer ${
                  displayMode === 'rotatable'
                    ? 'bg-[#2563EB] text-white'
                    : 'text-[#525252] hover:text-black'
                }`}
              >
                Interactive 360°
              </button>
            </div>

            {/* Alignment Guides Toggle */}
            <button
              type="button"
              onClick={() => setShowGuides((prev) => !prev)}
              className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-colors cursor-pointer border ${
                showGuides
                  ? 'bg-[#F8F9FF] border-[#2563EB] text-[#2563EB]'
                  : 'bg-[#F2F2F2] border-[#DDDBDB] text-[#525252] hover:bg-[#EAEAEA]'
              }`}
            >
              {showGuides ? 'Hide Alignment Guides' : 'Show Alignment Guides'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Orthographic Reference Sheet Display */}
      <div className="w-full rounded-[8px] bg-white p-[2px] shadow-xs">
        <div className="w-full rounded-[6px] bg-[#D5D5D7] p-3 sm:p-5 overflow-hidden">
          {displayMode === 'sheet' ? (
            <div className="relative w-full rounded-[6px] overflow-hidden bg-[#D5D5D7]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/mannequin-female-tpose-sheet.png"
                alt="Adult Female Mannequin 3-View Orthographic Turnaround (FRONT VIEW, LEFT SIDE VIEW, BACK VIEW)"
                className="w-full h-auto block select-none"
              />

              {showGuides && (
                <div className="pointer-events-none absolute inset-0">
                  {/* Crown of Head Alignment Line */}
                  <div
                    className="absolute left-0 right-0 border-t border-dashed border-[#2563EB]/60"
                    style={{ top: '5.5%' }}
                  >
                    <span className="ml-2 px-1.5 py-0.5 text-[10px] font-mono bg-white/85 text-[#2563EB] rounded">
                      Crown Alignment (1.70m)
                    </span>
                  </div>
                  {/* 90° Horizontal T-Pose Arm Axis Line */}
                  <div
                    className="absolute left-0 right-0 border-t border-dashed border-emerald-700/65"
                    style={{ top: '26.3%' }}
                  >
                    <span className="ml-2 px-1.5 py-0.5 text-[10px] font-mono bg-white/85 text-emerald-800 rounded">
                      90° Horizontal T-Pose Arm Axis
                    </span>
                  </div>
                  {/* Natural Waist Line */}
                  <div
                    className="absolute left-0 right-0 border-t border-dashed border-amber-700/50"
                    style={{ top: '38.3%' }}
                  >
                    <span className="ml-2 px-1.5 py-0.5 text-[10px] font-mono bg-white/85 text-amber-800 rounded">
                      Natural Waist Seam
                    </span>
                  </div>
                  {/* Hip / Pelvis Line */}
                  <div
                    className="absolute left-0 right-0 border-t border-dashed border-purple-700/45"
                    style={{ top: '44.8%' }}
                  >
                    <span className="ml-2 px-1.5 py-0.5 text-[10px] font-mono bg-white/85 text-purple-800 rounded">
                      Hip / Pelvis Seam
                    </span>
                  </div>
                  {/* Floor / Plantar Sole Alignment Line */}
                  <div
                    className="absolute left-0 right-0 border-t border-dashed border-[#2563EB]/60"
                    style={{ top: '93.1%' }}
                  >
                    <span className="ml-2 px-1.5 py-0.5 text-[10px] font-mono bg-white/85 text-[#2563EB] rounded">
                      Floor Contact Plane (0.00m)
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : displayMode === 'panels' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
              {VIEW_PANELS.map((panel) => (
                <div
                  key={panel.id}
                  className="flex flex-col rounded-[8px] bg-[#D5D5D7] border border-black/[0.08] overflow-hidden"
                >
                  <div className="relative w-full bg-[#D5D5D7] flex items-center justify-center overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={panel.imageSrc}
                      alt={panel.label}
                      data-testid={`mannequin-ortho-${panel.id}`}
                      className="w-full h-auto block select-none"
                    />

                    {showGuides && (
                      <div className="pointer-events-none absolute inset-0">
                        <div
                          className="absolute left-0 right-0 border-t border-dashed border-[#2563EB]/60"
                          style={{ top: '5.8%' }}
                        />
                        <div
                          className="absolute left-0 right-0 border-t border-dashed border-emerald-700/65"
                          style={{ top: '27.6%' }}
                        />
                        <div
                          className="absolute left-0 right-0 border-t border-dashed border-amber-700/50"
                          style={{ top: '40.2%' }}
                        />
                        <div
                          className="absolute left-0 right-0 border-t border-dashed border-[#2563EB]/60"
                          style={{ top: '97.7%' }}
                        />
                        <div className="absolute top-0 bottom-0 left-1/2 border-l border-dashed border-black/20" />
                      </div>
                    )}
                  </div>

                  <div className="bg-white/95 px-4 py-3 border-t border-black/[0.06] flex items-center justify-between">
                    <span className="text-[14px] font-semibold tracking-[0.04em] text-black">
                      {panel.label}
                    </span>
                    <span className="text-[12px] text-[#7D7D7D]">{panel.subtitle}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="w-full rounded-[8px] bg-[#F8F8F8] py-8 px-4 flex items-center justify-center">
              <RotatableMannequin gender="female" showGenderToggle={false} />
            </div>
          )}
        </div>
      </div>

      {/* Technical Verification Summary Strip */}
      <div className="w-full rounded-[8px] bg-white p-[2px] shadow-xs">
        <div className="w-full rounded-[6px] bg-[#F8F8F8] px-5 py-3 grid grid-cols-2 sm:grid-cols-4 gap-4 text-[12px]">
          <div>
            <span className="text-[#7D7D7D] block">Camera Views</span>
            <span className="font-medium text-black">
              FRONT VIEW · LEFT SIDE VIEW · BACK VIEW
            </span>
          </div>
          <div>
            <span className="text-[#7D7D7D] block">Arm Posture</span>
            <span className="font-medium text-black">
              Strict 90° Horizontal T-Pose · Palms Downward
            </span>
          </div>
          <div>
            <span className="text-[#7D7D7D] block">Material Finish</span>
            <span className="font-medium text-black">
              Matte Mannequin Resin · #C9AB84 (201, 171, 132)
            </span>
          </div>
          <div>
            <span className="text-[#7D7D7D] block">Anatomy & Seams</span>
            <span className="font-medium text-black">
              Matched to Reference Guide · Zero Cropping
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
