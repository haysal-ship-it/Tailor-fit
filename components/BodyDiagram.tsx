'use client';

import React, { useState } from 'react';
import { HotspotDefinition, UnitType } from '@/types';
import { Check, Info, ChevronRight, X, ArrowLeftRight, User, RotateCcw, Plus } from 'lucide-react';

interface BodyDiagramProps {
  gender: 'male' | 'female';
  setGender: (g: 'male' | 'female') => void;
  view: 'front' | 'back';
  setView: (v: 'front' | 'back') => void;
  unit: UnitType;
  selectedTemplateId: string;
  templateFieldKeys: string[];
  allHotspots: HotspotDefinition[];
  measurements: Record<string, number | string>;
  onUpdateMeasurement: (key: string, value: number | string) => void;
  onAddCustomFieldClick?: () => void;
  hideHeaderControls?: boolean;
}

export function BodyDiagram({
  gender,
  setGender,
  view,
  setView,
  unit,
  templateFieldKeys,
  allHotspots,
  measurements,
  onUpdateMeasurement,
  onAddCustomFieldClick,
  hideHeaderControls = true,
}: BodyDiagramProps) {
  const [activeHotspotKey, setActiveHotspotKey] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState<string>('');

  // Filter hotspots for current view (front / back)
  const visibleHotspots = allHotspots.filter((h) => {
    // Check if relevant for this template
    const isIncludedInTemplate = templateFieldKeys.length === 0 || templateFieldKeys.includes(h.key);
    if (!isIncludedInTemplate) return false;

    if (view === 'front') {
      return h.view === 'front' || h.view === 'both';
    } else {
      return h.view === 'back' || h.view === 'both';
    }
  });

  const activeHotspot = allHotspots.find((h) => h.key === activeHotspotKey);

  const openHotspot = (hotspot: HotspotDefinition) => {
    setActiveHotspotKey(hotspot.key);
    const curr = measurements[hotspot.key];
    setInputValue(curr !== undefined && curr !== '' ? String(curr) : '');
  };

  const saveAndClose = () => {
    if (activeHotspotKey) {
      if (inputValue.trim() === '') {
        // Clear or remove measurement
        const updated = { ...measurements };
        delete updated[activeHotspotKey];
        onUpdateMeasurement(activeHotspotKey, '');
      } else {
        const num = parseFloat(inputValue);
        onUpdateMeasurement(activeHotspotKey, isNaN(num) ? inputValue : num);
      }
    }
    setActiveHotspotKey(null);
  };

  const saveAndNext = () => {
    if (activeHotspotKey) {
      const num = parseFloat(inputValue);
      onUpdateMeasurement(activeHotspotKey, isNaN(num) ? inputValue : num);
    }
    // Find next unmeasured visible hotspot
    const currentIndex = visibleHotspots.findIndex((h) => h.key === activeHotspotKey);
    const nextHotspots = [
      ...visibleHotspots.slice(currentIndex + 1),
      ...visibleHotspots.slice(0, currentIndex),
    ];
    const nextUnmeasured = nextHotspots.find((h) => !measurements[h.key]);
    if (nextUnmeasured) {
      openHotspot(nextUnmeasured);
    } else if (nextHotspots.length > 0) {
      openHotspot(nextHotspots[0]);
    } else {
      setActiveHotspotKey(null);
    }
  };

  // Adjust numeric input by delta
  const adjustValue = (delta: number) => {
    const curr = parseFloat(inputValue) || 0;
    const next = Math.max(0, parseFloat((curr + delta).toFixed(1)));
    setInputValue(String(next));
  };

  return (
    <div className="relative w-full flex flex-col items-center select-none">
      {/* View & Gender Controls Bar */}
      {!hideHeaderControls && (
        <div className="w-full flex items-center justify-between mb-4 flex-wrap gap-2">
          {/* Front / Back Toggle */}
          <div className="inline-flex rounded-full bg-[#f5f3f1] p-1 border border-[#ebe8e4]">
            <button
              type="button"
              onClick={() => setView('front')}
              className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-all ${
                view === 'front'
                  ? 'bg-[#000000] text-white shadow-xs'
                  : 'text-[#777169] hover:text-[#000000]'
              }`}
            >
              Front Silhouette
            </button>
            <button
              type="button"
              onClick={() => setView('back')}
              className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-all ${
                view === 'back'
                  ? 'bg-[#000000] text-white shadow-xs'
                  : 'text-[#777169] hover:text-[#000000]'
              }`}
            >
              Back Silhouette
            </button>
          </div>

          {/* Gender Silhouette Toggle */}
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-full bg-[#f5f3f1] p-1 border border-[#ebe8e4]">
              <button
                type="button"
                onClick={() => setGender('female')}
                className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-all ${
                  gender === 'female'
                    ? 'bg-[#000000] text-white shadow-xs'
                    : 'text-[#777169] hover:text-[#000000]'
                }`}
              >
                Female
              </button>
              <button
                type="button"
                onClick={() => setGender('male')}
                className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-all ${
                  gender === 'male'
                    ? 'bg-[#000000] text-white shadow-xs'
                    : 'text-[#777169] hover:text-[#000000]'
                }`}
              >
                Male
              </button>
            </div>

            {onAddCustomFieldClick && (
              <button
                type="button"
                onClick={onAddCustomFieldClick}
                title="Add Custom Measurement Point"
                className="px-3 py-1.5 rounded-full border border-[#ebe8e4] text-[#44403b] text-[12px] font-medium hover:bg-[#f5f3f1] inline-flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Add Point</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* SVG Canvas Stage */}
      <div className="relative w-full max-w-[340px] sm:max-w-[380px] aspect-[1/1.9] bg-[#fdfcfc] rounded-[24px] border border-[#ebe8e4] p-3 flex items-center justify-center overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        {/* Subtle grid watermark */}
        <div 
          className="absolute inset-0 opacity-[0.25] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#ebe8e4 1px, transparent 1px)`,
            backgroundSize: '16px 16px',
          }}
        />

        {/* View Indicator Label */}
        <div className="absolute top-4 left-4 pointer-events-none z-10">
          <span className="text-[11px] font-mono tracking-wider text-[#a59f97] uppercase">
            {gender} · {view} view
          </span>
        </div>

        {/* SVG Mannequin Diagram */}
        <svg
          viewBox="0 0 300 600"
          className="w-full h-full max-h-[580px] drop-shadow-xs"
          style={{ touchAction: 'manipulation' }}
        >
          <defs>
            <linearGradient id="bodyFill" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f5f3f1" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ebe8e4" stopOpacity="0.5" />
            </linearGradient>
            <filter id="measuredGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#0447ff" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* Body Outlines: Conditioned on Gender & View */}
          {gender === 'female' ? (
            view === 'front' ? (
              // Female Front Outline
              <g id="female-front" stroke="#44403b" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="url(#bodyFill)">
                {/* Head / Neck */}
                <ellipse cx="150" cy="45" rx="20" ry="26" stroke="#44403b" fill="#fdfcfc" />
                <path d="M 143 68 C 143 78, 142 82, 138 88 L 162 88 C 158 82, 157 78, 157 68" />
                
                {/* Shoulders, Arms, Torso, Hips, Legs */}
                <path d="
                  M 138 88
                  C 120 90, 100 96, 92 108
                  C 86 116, 82 140, 78 180
                  C 74 220, 68 270, 64 300
                  C 62 308, 68 312, 72 308
                  C 76 295, 82 250, 86 210
                  C 88 190, 92 170, 100 160
                  C 106 152, 114 158, 122 175
                  C 126 185, 126 195, 124 206
                  C 122 220, 118 234, 114 250
                  C 110 266, 108 280, 112 305
                  C 116 335, 120 380, 122 430
                  C 123 460, 120 500, 116 540
                  C 115 550, 122 554, 126 550
                  C 132 542, 136 500, 138 450
                  C 140 400, 142 360, 144 320
                  C 145 305, 148 290, 150 280
                  C 152 290, 155 305, 156 320
                  C 158 360, 160 400, 162 450
                  C 164 500, 168 542, 174 550
                  C 178 554, 185 550, 184 540
                  C 180 500, 177 460, 178 430
                  C 180 380, 184 335, 188 305
                  C 192 280, 190 266, 186 250
                  C 182 234, 178 220, 176 206
                  C 174 195, 174 185, 178 175
                  C 186 158, 194 152, 200 160
                  C 208 170, 212 190, 214 210
                  C 218 250, 224 295, 228 308
                  C 232 312, 238 308, 236 300
                  C 232 270, 226 220, 222 180
                  C 218 140, 214 116, 208 108
                  C 200 96, 180 90, 162 88
                  Z
                " />

                {/* Subtle Anatomical Lines (Collarbones, Bust, Waist) */}
                <path d="M 132 96 C 142 100, 148 102, 150 102 C 152 102, 158 100, 168 96" fill="none" stroke="#777169" strokeWidth="1" />
                <path d="M 126 142 C 134 150, 142 150, 147 144" fill="none" stroke="#a59f97" strokeWidth="1" strokeDasharray="2 2" />
                <path d="M 174 142 C 166 150, 158 150, 153 144" fill="none" stroke="#a59f97" strokeWidth="1" strokeDasharray="2 2" />
                <line x1="126" y1="202" x2="174" y2="202" stroke="#a59f97" strokeWidth="0.8" strokeDasharray="3 3" />
                <line x1="114" y1="250" x2="186" y2="250" stroke="#a59f97" strokeWidth="0.8" strokeDasharray="3 3" />
              </g>
            ) : (
              // Female Back Outline
              <g id="female-back" stroke="#44403b" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="url(#bodyFill)">
                {/* Head / Neck back */}
                <ellipse cx="150" cy="45" rx="20" ry="26" stroke="#44403b" fill="#fdfcfc" />
                <path d="M 143 68 C 143 78, 141 84, 138 88 L 162 88 C 159 84, 157 78, 157 68" />
                
                {/* Back Torso, Arms, Legs */}
                <path d="
                  M 138 88
                  C 120 90, 100 96, 92 108
                  C 86 116, 82 140, 78 180
                  C 74 220, 68 270, 64 300
                  C 62 308, 68 312, 72 308
                  C 76 295, 82 250, 86 210
                  C 88 190, 92 170, 100 160
                  C 106 152, 114 158, 122 175
                  C 126 185, 126 195, 124 206
                  C 122 220, 118 234, 114 250
                  C 110 266, 108 280, 112 305
                  C 116 335, 120 380, 122 430
                  C 123 460, 120 500, 116 540
                  C 115 550, 122 554, 126 550
                  C 132 542, 136 500, 138 450
                  C 140 400, 142 360, 144 320
                  C 145 305, 148 290, 150 280
                  C 152 290, 155 305, 156 320
                  C 158 360, 160 400, 162 450
                  C 164 500, 168 542, 174 550
                  C 178 554, 185 550, 184 540
                  C 180 500, 177 460, 178 430
                  C 180 380, 184 335, 188 305
                  C 192 280, 190 266, 186 250
                  C 182 234, 178 220, 176 206
                  C 174 195, 174 185, 178 175
                  C 186 158, 194 152, 200 160
                  C 208 170, 212 190, 214 210
                  C 218 250, 224 295, 228 308
                  C 232 312, 238 308, 236 300
                  C 232 270, 226 220, 222 180
                  C 218 140, 214 116, 208 108
                  C 200 96, 180 90, 162 88
                  Z
                " />

                {/* Back anatomical lines (Spine midline, shoulder blades, waist indentation) */}
                <line x1="150" y1="88" x2="150" y2="280" stroke="#a59f97" strokeWidth="1" strokeDasharray="2 3" />
                <path d="M 124 135 C 132 142, 134 154, 130 162" fill="none" stroke="#777169" strokeWidth="1" />
                <path d="M 176 135 C 168 142, 166 154, 170 162" fill="none" stroke="#777169" strokeWidth="1" />
                <line x1="126" y1="202" x2="174" y2="202" stroke="#a59f97" strokeWidth="0.8" strokeDasharray="3 3" />
              </g>
            )
          ) : (
            // Male Outlines
            view === 'front' ? (
              // Male Front Outline (broader shoulders, straighter waist, masculine proportions)
              <g id="male-front" stroke="#44403b" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="url(#bodyFill)">
                {/* Head / Neck */}
                <ellipse cx="150" cy="45" rx="21" ry="27" stroke="#44403b" fill="#fdfcfc" />
                <path d="M 141 70 C 141 78, 138 84, 134 88 L 166 88 C 162 84, 159 78, 159 70" />

                {/* Shoulders & Torso */}
                <path d="
                  M 134 88
                  C 114 91, 94 98, 82 108
                  C 76 116, 73 140, 70 180
                  C 66 220, 60 270, 56 300
                  C 54 308, 60 312, 64 308
                  C 68 295, 74 250, 78 210
                  C 80 190, 84 170, 92 160
                  C 100 152, 110 165, 116 182
                  C 118 195, 118 210, 118 226
                  C 118 240, 117 254, 116 268
                  C 115 285, 114 305, 116 335
                  C 118 365, 120 400, 120 440
                  C 120 475, 118 510, 114 545
                  C 113 554, 120 557, 125 552
                  C 131 544, 135 505, 138 455
                  C 140 410, 142 368, 144 330
                  C 145 315, 148 295, 150 286
                  C 152 295, 155 315, 156 330
                  C 158 368, 160 410, 162 455
                  C 165 505, 169 544, 175 552
                  C 180 557, 187 554, 186 545
                  C 182 510, 180 475, 180 440
                  C 180 400, 182 365, 184 335
                  C 186 305, 185 285, 184 268
                  C 183 254, 182 240, 182 226
                  C 182 210, 182 195, 184 182
                  C 190 165, 200 152, 208 160
                  C 216 170, 220 190, 222 210
                  C 226 250, 232 295, 236 308
                  C 240 312, 246 308, 244 300
                  C 240 270, 234 220, 230 180
                  C 227 140, 224 116, 218 108
                  C 206 98, 186 91, 166 88
                  Z
                " />

                {/* Pectoral & Collarbone Lines */}
                <path d="M 128 98 C 140 102, 148 103, 150 103 C 152 103, 160 102, 172 98" fill="none" stroke="#777169" strokeWidth="1" />
                <path d="M 122 144 C 132 152, 144 152, 148 144" fill="none" stroke="#a59f97" strokeWidth="1" strokeDasharray="3 2" />
                <path d="M 178 144 C 168 152, 156 152, 152 144" fill="none" stroke="#a59f97" strokeWidth="1" strokeDasharray="3 2" />
                <line x1="120" y1="202" x2="180" y2="202" stroke="#a59f97" strokeWidth="0.8" strokeDasharray="3 3" />
                <line x1="116" y1="250" x2="184" y2="250" stroke="#a59f97" strokeWidth="0.8" strokeDasharray="3 3" />
              </g>
            ) : (
              // Male Back Outline
              <g id="male-back" stroke="#44403b" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="url(#bodyFill)">
                {/* Head / Neck */}
                <ellipse cx="150" cy="45" rx="21" ry="27" stroke="#44403b" fill="#fdfcfc" />
                <path d="M 141 70 C 141 78, 138 84, 134 88 L 166 88 C 162 84, 159 78, 159 70" />

                <path d="
                  M 134 88
                  C 114 91, 94 98, 82 108
                  C 76 116, 73 140, 70 180
                  C 66 220, 60 270, 56 300
                  C 54 308, 60 312, 64 308
                  C 68 295, 74 250, 78 210
                  C 80 190, 84 170, 92 160
                  C 100 152, 110 165, 116 182
                  C 118 195, 118 210, 118 226
                  C 118 240, 117 254, 116 268
                  C 115 285, 114 305, 116 335
                  C 118 365, 120 400, 120 440
                  C 120 475, 118 510, 114 545
                  C 113 554, 120 557, 125 552
                  C 131 544, 135 505, 138 455
                  C 140 410, 142 368, 144 330
                  C 145 315, 148 295, 150 286
                  C 152 295, 155 315, 156 330
                  C 158 368, 160 410, 162 455
                  C 165 505, 169 544, 175 552
                  C 180 557, 187 554, 186 545
                  C 182 510, 180 475, 180 440
                  C 180 400, 182 365, 184 335
                  C 186 305, 185 285, 184 268
                  C 183 254, 182 240, 182 226
                  C 182 210, 182 195, 184 182
                  C 190 165, 200 152, 208 160
                  C 216 170, 220 190, 222 210
                  C 226 250, 232 295, 236 308
                  C 240 312, 246 308, 244 300
                  C 240 270, 234 220, 230 180
                  C 227 140, 224 116, 218 108
                  C 206 98, 186 91, 166 88
                  Z
                " />

                {/* Spine & Latissimus Guidelines */}
                <line x1="150" y1="88" x2="150" y2="286" stroke="#a59f97" strokeWidth="1" strokeDasharray="2 3" />
                <path d="M 120 140 C 132 148, 134 162, 128 174" fill="none" stroke="#777169" strokeWidth="1" />
                <path d="M 180 140 C 168 148, 166 162, 172 174" fill="none" stroke="#777169" strokeWidth="1" />
                <line x1="120" y1="202" x2="180" y2="202" stroke="#a59f97" strokeWidth="0.8" strokeDasharray="3 3" />
              </g>
            )
          )}

          {/* Render Tappable Hotspots on top of the silhouette */}
          {visibleHotspots.map((hotspot) => {
            const x = view === 'front' ? (hotspot.frontX ?? 150) : (hotspot.backX ?? hotspot.frontX ?? 150);
            const y = view === 'front' ? (hotspot.frontY ?? 200) : (hotspot.backY ?? hotspot.frontY ?? 200);
            const isMeasured = measurements[hotspot.key] !== undefined && measurements[hotspot.key] !== '';
            const isActive = activeHotspotKey === hotspot.key;

            return (
              <g
                key={hotspot.key}
                id={`hotspot-${hotspot.key}`}
                onClick={() => openHotspot(hotspot)}
                className="cursor-pointer group"
              >
                {/* Large transparent hit area for easy touch on mobile/tablet (44px target) */}
                <circle cx={x} cy={y} r="22" fill="transparent" />

                {/* Active Ring */}
                {isActive && (
                  <circle
                    cx={x}
                    cy={y}
                    r="12"
                    fill="none"
                    stroke="#0447ff"
                    strokeWidth="1.5"
                    strokeDasharray="3 2"
                    className="animate-spin origin-center"
                    style={{ transformOrigin: `${x}px ${y}px` }}
                  />
                )}

                {/* Hotspot Dot */}
                {isMeasured ? (
                  // Measured Hotspot: Filled with --color-accent-measured #0447ff (violet spark)
                  <g filter="url(#measuredGlow)">
                    <circle
                      cx={x}
                      cy={y}
                      r="6.5"
                      fill="#0447ff"
                      stroke="#fdfcfc"
                      strokeWidth="1.8"
                      className="transition-transform group-hover:scale-125"
                    />
                    <circle cx={x} cy={y} r="2" fill="#ffffff" />
                  </g>
                ) : (
                  // Unmeasured Hotspot: subtle outlined stone-colored dot
                  <g>
                    <circle
                      cx={x}
                      cy={y}
                      r="5.5"
                      fill="#f5f3f1"
                      stroke="#a59f97"
                      strokeWidth="1.4"
                      className="transition-all group-hover:scale-125 group-hover:stroke-[#44403b] group-hover:fill-[#ffffff]"
                    />
                    <circle cx={x} cy={y} r="1.5" fill="#a59f97" />
                  </g>
                )}

                {/* Micro Label Tag for Measured values or active hover */}
                {isMeasured && !isActive && (
                  <g transform={`translate(${x > 150 ? x + 10 : x - 10}, ${y})`}>
                    <text
                      textAnchor={x > 150 ? 'start' : 'end'}
                      alignmentBaseline="middle"
                      fill="#0447ff"
                      fontSize="9.5"
                      fontFamily="monospace"
                      fontWeight="600"
                      className="pointer-events-none drop-shadow-xs"
                    >
                      {measurements[hotspot.key]} {unit}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* In-Diagram Popover for Active Hotspot */}
        {activeHotspot && (
          <div className="absolute inset-x-3 bottom-3 z-30 bg-[#fdfcfc] rounded-[18px] border border-[#ebe8e4] p-3.5 shadow-[0_4px_20px_rgba(0,0,0,0.08)] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#0447ff]" />
                  <h4 className="text-[14px] font-medium text-[#000000]">
                    {activeHotspot.label}
                  </h4>
                </div>
                <p className="text-[11px] text-[#777169] mt-0.5 leading-snug line-clamp-2">
                  {activeHotspot.hint}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveHotspotKey(null)}
                className="p-1 rounded-full text-[#a59f97] hover:text-[#000000] hover:bg-[#f5f3f1]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Adjustment & Input */}
            <div className="flex items-center gap-1.5 my-2">
              <button
                type="button"
                onClick={() => adjustValue(-1)}
                className="w-8 h-8 rounded-full border border-[#ebe8e4] bg-[#f5f3f1] text-[#44403b] text-[13px] font-medium hover:bg-[#ebe8e4] active:scale-95 transition-all"
              >
                -1
              </button>
              <div className="relative flex-1">
                <input
                  type="number"
                  step="0.1"
                  autoFocus
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveAndNext();
                  }}
                  placeholder="0.0"
                  className="w-full h-8 px-2.5 text-center text-[15px] font-mono font-medium rounded-[4px] border border-[#ebe8e4] bg-[#fdfcfc] text-[#000000] focus:outline-none focus:border-[#0447ff] focus:ring-1 focus:ring-[#0447ff]"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-mono text-[#a59f97]">
                  {unit}
                </span>
              </div>
              <button
                type="button"
                onClick={() => adjustValue(+1)}
                className="w-8 h-8 rounded-full border border-[#ebe8e4] bg-[#f5f3f1] text-[#44403b] text-[13px] font-medium hover:bg-[#ebe8e4] active:scale-95 transition-all"
              >
                +1
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#ebe8e4]">
              <button
                type="button"
                onClick={saveAndClose}
                className="px-3 py-1.5 rounded-full border border-[#ebe8e4] text-[#44403b] text-[12px] font-medium hover:bg-[#f5f3f1] transition-colors"
              >
                Save
              </button>
              <button
                type="button"
                onClick={saveAndNext}
                className="px-3.5 py-1.5 rounded-full bg-[#000000] text-white text-[12px] font-medium hover:bg-[#222222] inline-flex items-center gap-1 transition-colors"
              >
                <span>Save & Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Hotspots Quick Scroller on Mobile/Tablet */}
      <div className="w-full max-w-[380px] mt-3">
        <div className="flex items-center justify-between text-[11px] text-[#777169] mb-1.5 px-1">
          <span>Tap any point to capture</span>
          <span className="font-mono text-[#0447ff] font-medium">
            {Object.keys(measurements).filter((k) => measurements[k] !== '' && measurements[k] !== undefined).length} / {templateFieldKeys.length || allHotspots.length} Captured
          </span>
        </div>

        {/* Horizontal Chip Bar of Hotspots for Quick Access */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 px-0.5 no-scrollbar">
          {visibleHotspots.map((h) => {
            const isMeasured = measurements[h.key] !== undefined && measurements[h.key] !== '';
            const isActive = activeHotspotKey === h.key;

            return (
              <button
                key={h.key}
                type="button"
                onClick={() => openHotspot(h)}
                className={`shrink-0 px-2.5 py-1 rounded-full text-[12px] flex items-center gap-1.5 border transition-all ${
                  isActive
                    ? 'border-[#0447ff] bg-[#0447ff]/5 text-[#0447ff] font-medium'
                    : isMeasured
                    ? 'border-[#ebe8e4] bg-[#f5f3f1] text-[#000000]'
                    : 'border-[#ebe8e4] bg-[#fdfcfc] text-[#777169] hover:text-[#000000]'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isMeasured ? 'bg-[#0447ff]' : 'bg-[#a59f97]'
                  }`}
                />
                <span>{h.label.split(' ')[0]}</span>
                {isMeasured && (
                  <span className="font-mono text-[10px] text-[#0447ff]">
                    {measurements[h.key]}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
