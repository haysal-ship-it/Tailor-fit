'use client';

import React, { useState } from 'react';
import { UnitType } from '@/types';
import { Sparkles, RefreshCw } from 'lucide-react';

interface LandmarkData {
  key: string;
  name: string;
  defaultValCm: number;
  color: string;
  zone: string;
  dotX: number;
  dotY: number;
  labelX: number;
  labelY: number;
  side: 'left' | 'right';
  anchorX: number;
  anchorY: number;
}

const LANDMARKS: LandmarkData[] = [
  {
    key: 'neck',
    name: 'Neck',
    defaultValCm: 36,
    color: '#00d2b4',
    zone: 'Collar Band',
    dotX: 200,
    dotY: 104,
    anchorX: 195,
    anchorY: 104,
    labelX: 120,
    labelY: 104,
    side: 'left',
  },
  {
    key: 'waist',
    name: 'Waist',
    defaultValCm: 72,
    color: '#1e3a8a',
    zone: 'Natural Midriff',
    dotX: 195,
    dotY: 250,
    anchorX: 172,
    anchorY: 250,
    labelX: 120,
    labelY: 250,
    side: 'left',
  },
  {
    key: 'shoulder',
    name: 'Shoulder',
    defaultValCm: 42,
    color: '#00d2b4',
    zone: 'Acromion Span',
    dotX: 254,
    dotY: 132,
    anchorX: 254,
    anchorY: 132,
    labelX: 290,
    labelY: 100,
    side: 'right',
  },
  {
    key: 'bust',
    name: 'Bust',
    defaultValCm: 92,
    color: '#00bfa5',
    zone: 'Full Bodice',
    dotX: 236,
    dotY: 182,
    anchorX: 238,
    anchorY: 182,
    labelX: 290,
    labelY: 175,
    side: 'right',
  },
  {
    key: 'sleeve',
    name: 'Sleeve',
    defaultValCm: 60,
    color: '#f59e0b',
    zone: 'Sleeve Length',
    dotX: 275,
    dotY: 260,
    anchorX: 278,
    anchorY: 260,
    labelX: 290,
    labelY: 260,
    side: 'right',
  },
  {
    key: 'thigh',
    name: 'Thigh',
    defaultValCm: 54,
    color: '#0ea5e9',
    zone: 'Upper Leg',
    dotX: 235,
    dotY: 375,
    anchorX: 238,
    anchorY: 375,
    labelX: 290,
    labelY: 420,
    side: 'right',
  },
];

interface AtelierMannequinProps {
  gender: 'M' | 'F';
  unit: UnitType;
  measurements: Record<string, number | string>;
  onMeasurementChange: (key: string, value: number) => void;
}

export function AtelierMannequin({
  gender,
  unit,
  measurements,
  onMeasurementChange,
}: AtelierMannequinProps) {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>('');

  const formatValue = (key: string, defaultCm: number) => {
    const raw = measurements[key];
    let cm = typeof raw === 'number' ? raw : parseFloat(String(raw)) || defaultCm;
    if (unit === 'in') {
      const inches = (cm / 2.54).toFixed(1);
      return `${inches}"`;
    }
    return `${Math.round(cm)} cm`;
  };

  const getRawNumber = (key: string, defaultCm: number) => {
    const raw = measurements[key];
    const cm = typeof raw === 'number' ? raw : parseFloat(String(raw)) || defaultCm;
    if (unit === 'in') {
      return parseFloat((cm / 2.54).toFixed(1));
    }
    return Math.round(cm);
  };

  const handleStartEdit = (key: string, defaultCm: number) => {
    setEditingKey(key);
    setTempValue(String(getRawNumber(key, defaultCm)));
  };

  const handleSaveEdit = (key: string) => {
    const val = parseFloat(tempValue);
    if (!isNaN(val) && val > 0) {
      const cmVal = unit === 'in' ? parseFloat((val * 2.54).toFixed(1)) : val;
      onMeasurementChange(key, cmVal);
    }
    setEditingKey(null);
  };

  return (
    <div className="w-full flex flex-col items-center select-none relative">
      {/* Visual Canvas */}
      <div className="w-full max-w-[440px] relative aspect-[3/4] flex items-center justify-center">
        <svg
          viewBox="0 0 400 560"
          className="w-full h-full drop-shadow-[0_20px_35px_rgba(0,0,0,0.08)]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Gradients for Mannequin Shading */}
            <linearGradient id="studioPedestal" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#1f2937" />
              <stop offset="50%" stopColor="#4b5563" />
              <stop offset="100%" stopColor="#111827" />
            </linearGradient>

            {/* Neck Band Color (Teal) */}
            <linearGradient id="neckGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#00e5c0" />
              <stop offset="50%" stopColor="#00bfa5" />
              <stop offset="100%" stopColor="#0d9488" />
            </linearGradient>

            {/* Chest / Bodice (Mint Green) */}
            <linearGradient id="chestGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="50%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>

            {/* Waist (Midnight Navy Blue) */}
            <linearGradient id="waistGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#2563eb" />
              <stop offset="50%" stopColor="#1d4ed8" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>

            {/* Thighs / Legs (Cerulean Cyan) */}
            <linearGradient id="thighGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#0ea5e9" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>

            {/* Arms (Warm Amber Gold) */}
            <linearGradient id="armGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>

            {/* Neutral Body Silhouette Gradient for Non-blocked parts */}
            <linearGradient id="bodyNeutral" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="40%" stopColor="#e2e8f0" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </linearGradient>

            {/* Soft Ambient Ground Shadow */}
            <radialGradient id="groundShadow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(0,0,0,0.18)" />
              <stop offset="60%" stopColor="rgba(0,0,0,0.06)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </radialGradient>
          </defs>

          {/* Ground Contact Shadow */}
          <ellipse cx="200" cy="535" rx="90" ry="14" fill="url(#groundShadow)" />

          {/* Metallic Tailoring Stand Base & Central Pole */}
          <g id="atelier-stand" opacity="0.85">
            <ellipse cx="200" cy="530" rx="42" ry="7" fill="url(#studioPedestal)" />
            <rect x="197" y="460" width="6" height="70" rx="3" fill="#374151" />
          </g>

          {/* Mannequin Finial Cap (Top Wood/Metal Knob) */}
          <circle cx="200" cy="62" r="7" fill="#1e293b" />
          <rect x="198" y="68" width="4" height="12" rx="2" fill="#475569" />

          {/* === 3D COLOR-BLOCKED ANATOMICAL MANNEQUIN === */}
          <g id="mannequin-mesh">
            {/* Lower Torso / Thighs / Hip Base (Cerulean Blue Zone) */}
            <path
              d={
                gender === 'F'
                  ? 'M155 285 Q145 320 152 380 Q170 395 198 395 Q226 395 244 380 Q252 320 242 285 Q220 295 198 295 Q176 295 155 285 Z'
                  : 'M158 285 Q150 325 156 385 Q174 395 198 395 Q222 395 240 385 Q246 325 238 285 Q218 292 198 292 Q178 292 158 285 Z'
              }
              fill="url(#thighGrad)"
              className="transition-all duration-300 hover:brightness-105 cursor-pointer"
              onClick={() => handleStartEdit('thigh', 54)}
            />

            {/* Natural Waist & Midriff (Navy Blue Zone) */}
            <path
              d={
                gender === 'F'
                  ? 'M160 215 Q150 248 155 285 Q176 295 198 295 Q220 295 242 285 Q247 248 237 215 Q218 222 198 222 Q178 222 160 215 Z'
                  : 'M155 215 Q154 250 158 285 Q178 292 198 292 Q218 292 238 285 Q242 250 241 215 Q220 220 198 220 Q176 220 155 215 Z'
              }
              fill="url(#waistGrad)"
              className="transition-all duration-300 hover:brightness-110 cursor-pointer"
              onClick={() => handleStartEdit('waist', 72)}
            />

            {/* Bust & Upper Bodice (Mint Green Zone) */}
            <path
              d={
                gender === 'F'
                  ? 'M146 135 Q136 170 160 215 Q178 222 198 222 Q218 222 237 215 Q260 170 250 135 Q230 142 198 142 Q166 142 146 135 Z'
                  : 'M140 135 Q138 172 155 215 Q176 220 198 220 Q220 220 241 215 Q258 172 256 135 Q228 140 198 140 Q168 140 140 135 Z'
              }
              fill="url(#chestGrad)"
              className="transition-all duration-300 hover:brightness-105 cursor-pointer"
              onClick={() => handleStartEdit('bust', 92)}
            />

            {/* Left Arm (Warm Amber Gold Zone) */}
            <path
              d="M142 135 Q125 155 122 195 Q120 240 126 290 Q136 290 138 275 Q134 235 138 190 Q142 155 150 138 Z"
              fill="url(#armGrad)"
              className="transition-all duration-300 hover:brightness-110 cursor-pointer"
              onClick={() => handleStartEdit('arm', 60)}
            />

            {/* Right Arm (Warm Amber Gold Zone) */}
            <path
              d="M254 135 Q271 155 274 195 Q276 240 270 290 Q260 290 258 275 Q262 235 258 190 Q254 155 246 138 Z"
              fill="url(#armGrad)"
              className="transition-all duration-300 hover:brightness-110 cursor-pointer"
              onClick={() => handleStartEdit('arm', 60)}
            />

            {/* Neck & Collar Band (Teal Zone) */}
            <path
              d="M185 80 Q182 108 180 115 Q198 122 216 115 Q214 108 211 80 Q198 84 185 80 Z"
              fill="url(#neckGrad)"
              className="transition-all duration-300 hover:brightness-110 cursor-pointer"
              onClick={() => handleStartEdit('neck', 36)}
            />

            {/* Shoulder Contours (Green Transition to Bodice) */}
            <path
              d="M180 115 Q160 120 142 135 Q166 142 198 142 Q230 142 254 135 Q236 120 216 115 Q198 122 180 115 Z"
              fill="#059669"
              opacity="0.9"
              className="transition-all duration-300 hover:brightness-110 cursor-pointer"
              onClick={() => handleStartEdit('shoulder', 42)}
            />

            {/* 3D Surface Highlights & Seam Lines for Haute-Couture Realism */}
            {/* Center Princess Seam Left */}
            <path
              d="M186 124 Q182 165 180 220 Q178 260 180 294"
              fill="none"
              stroke="rgba(255,255,255,0.22)"
              strokeWidth="1.5"
            />
            {/* Center Princess Seam Right */}
            <path
              d="M210 124 Q214 165 216 220 Q218 260 216 294"
              fill="none"
              stroke="rgba(255,255,255,0.22)"
              strokeWidth="1.5"
            />
            {/* Specular Highlighting on Curvature */}
            <path
              d="M194 130 Q190 190 192 250"
              fill="none"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </g>

          {/* === CYAN DASHED LEADER LINES & ANCHOR DOTS === */}
          {LANDMARKS.map((lm) => {
            const isLeft = lm.side === 'left';
            return (
              <g key={`leader-${lm.key}`} className="pointer-events-none">
                {/* Body Anchor Dot */}
                <circle
                  cx={lm.anchorX}
                  cy={lm.anchorY}
                  r="3.5"
                  fill="#00e5ff"
                  className="drop-shadow-[0_0_4px_#00e5ff]"
                />

                {/* Dashed Cyan Leader Line */}
                <line
                  x1={lm.anchorX}
                  y1={lm.anchorY}
                  x2={isLeft ? lm.labelX + 8 : lm.labelX - 8}
                  y2={lm.labelY - 5}
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                  opacity="0.9"
                />

                {/* Outer Connection Dot */}
                <circle
                  cx={isLeft ? lm.labelX + 8 : lm.labelX - 8}
                  cy={lm.labelY - 5}
                  r="2.5"
                  fill="#0284c7"
                />
              </g>
            );
          })}

          {/* Landmark Text Display on Canvas for Perfect Scale Positioning */}
          {LANDMARKS.map((lm) => {
            const isLeft = lm.side === 'left';

            return (
              <g
                key={`callout-${lm.key}`}
                className="cursor-pointer group"
                onClick={() => handleStartEdit(lm.key, lm.defaultValCm)}
              >
                {/* Fashion Serif Label Name matching design mockup */}
                <text
                  x={lm.labelX}
                  y={lm.labelY}
                  textAnchor={isLeft ? 'end' : 'start'}
                  className="font-serif text-[18px] font-normal fill-gray-900 tracking-wide select-none group-hover:fill-[#1d4ed8] transition-colors"
                >
                  {lm.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Interactive Value Edit Dialog / Inline Controller */}
      {editingKey && (
        <div className="absolute inset-x-4 bottom-4 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-gray-100 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 z-20">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00e5ff]" />
            <div>
              <p className="text-xs text-gray-500 font-medium">Update Landmark</p>
              <h4 className="text-sm font-bold text-gray-900 font-serif">
                {LANDMARKS.find((l) => l.key === editingKey)?.name}
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="number"
                step="0.1"
                autoFocus
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveEdit(editingKey);
                  if (e.key === 'Escape') setEditingKey(null);
                }}
                className="w-24 h-9 px-3 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold text-gray-900 focus:outline-none focus:border-[#1d4ed8] text-center"
              />
              <span className="absolute right-2 top-2 text-xs text-gray-400 font-medium pointer-events-none">
                {unit}
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleSaveEdit(editingKey)}
              className="px-4 py-2 bg-[#1d4ed8] text-white rounded-xl text-xs font-semibold hover:bg-[#1e40af] transition-colors"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={() => setEditingKey(null)}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-medium hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Atelier Hint Footer */}
      <div className="mt-2 flex items-center justify-center gap-2 text-[12px] text-gray-400 font-medium">
        <Sparkles className="w-3.5 h-3.5 text-teal-500" />
        <span>Tap any landmark to adjust contour measurements</span>
      </div>
    </div>
  );
}
