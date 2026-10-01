'use client';

import React from 'react';
import { UnitType } from '@/types';

export interface LandmarkData {
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
  linePoints?: string;
}

export const LANDMARKS: LandmarkData[] = [
  {
    key: 'neck',
    name: 'Neck',
    defaultValCm: 36,
    color: '#0084FF',
    zone: 'Collar Band',
    dotX: 195,
    dotY: 112,
    anchorX: 195,
    anchorY: 112,
    labelX: 110,
    labelY: 115,
    side: 'left',
  },
  {
    key: 'shoulder',
    name: 'Shoulder',
    defaultValCm: 42,
    color: '#0084FF',
    zone: 'Acromion Span',
    dotX: 256,
    dotY: 136,
    anchorX: 256,
    anchorY: 136,
    labelX: 290,
    labelY: 109,
    side: 'right',
  },
  {
    key: 'bust',
    name: 'Bust',
    defaultValCm: 92,
    color: '#0084FF',
    zone: 'Full Bodice',
    dotX: 238,
    dotY: 184,
    anchorX: 238,
    anchorY: 184,
    labelX: 290,
    labelY: 187,
    side: 'right',
  },
  {
    key: 'waist',
    name: 'Waist',
    defaultValCm: 72,
    color: '#0084FF',
    zone: 'Natural Midriff',
    dotX: 195,
    dotY: 254,
    anchorX: 195,
    anchorY: 254,
    labelX: 110,
    labelY: 257,
    side: 'left',
  },
  {
    key: 'sleeve',
    name: 'Sleeve',
    defaultValCm: 60,
    color: '#0084FF',
    zone: 'Sleeve Length',
    dotX: 276,
    dotY: 270,
    anchorX: 276,
    anchorY: 270,
    labelX: 290,
    labelY: 273,
    side: 'right',
  },
  {
    key: 'thigh',
    name: 'Thigh',
    defaultValCm: 54,
    color: '#0084FF',
    zone: 'Upper Leg',
    dotX: 236,
    dotY: 380,
    anchorX: 236,
    anchorY: 380,
    labelX: 290,
    labelY: 419,
    side: 'right',
  },
];

export interface AtelierMannequinProps {
  gender?: string;
  unit?: UnitType;
  measurements?: Record<string, number | string>;
  onMeasurementChange?: (key: string, value: number) => void;
  onSelectLandmark?: (key: string, name: string, currentVal: number) => void;
  className?: string;
}

export function AtelierMannequin({
  gender = 'F',
  unit = 'cm',
  measurements = {},
  onMeasurementChange,
  onSelectLandmark,
  className = '',
}: AtelierMannequinProps) {
  const getMeasurementVal = (key: string, defaultCm: number) => {
    const raw = measurements[key];
    const cm = typeof raw === 'number' ? raw : parseFloat(String(raw)) || defaultCm;
    if (unit === 'in') {
      return parseFloat((cm / 2.54).toFixed(1));
    }
    return Math.round(cm);
  };

  const handleLandmarkClick = (landmark: LandmarkData) => {
    const val = getMeasurementVal(landmark.key, landmark.defaultValCm);
    if (onSelectLandmark) {
      onSelectLandmark(landmark.key, landmark.name, val);
    }
  };

  return (
    <div className={`w-full flex flex-col items-center justify-center select-none relative ${className}`}>
      {/* 2D Anatomical Mannequin SVG Canvas matching Overview.png & Clients.png */}
      <div className="w-full max-w-[420px] aspect-[3/4] max-h-[540px] flex items-center justify-center relative">
        <svg
          viewBox="0 0 400 550"
          className="w-full h-full drop-shadow-[0_8px_20px_rgba(0,0,0,0.04)]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Shading Gradients for Smooth Porcelain Form */}
            <linearGradient id="headPorcelain" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fdfdfd" />
              <stop offset="60%" stopColor="#e5e7eb" />
              <stop offset="100%" stopColor="#d1d5db" />
            </linearGradient>

            <linearGradient id="neckPorcelain" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#f3f4f6" />
              <stop offset="50%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#e5e7eb" />
            </linearGradient>

            {/* Amber Collar Band */}
            <linearGradient id="collarAmber" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#d97706" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>

            {/* Chest / Bust Emerald Teal Zone matching design */}
            <linearGradient id="bodiceTeal" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#00e5c0" />
              <stop offset="45%" stopColor="#00bfa5" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>

            {/* Midriff Neutral White Porcelain */}
            <linearGradient id="midriffWhite" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#e5e7eb" />
              <stop offset="50%" stopColor="#f9fafb" />
              <stop offset="100%" stopColor="#d1d5db" />
            </linearGradient>

            {/* Natural Waist Deep Midnight Navy Blue Zone */}
            <linearGradient id="waistNavy" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1e1b4b" />
              <stop offset="40%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#0a1128" />
            </linearGradient>

            {/* Hip / Pelvis Lower Band */}
            <linearGradient id="hipWhite" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#e5e7eb" />
              <stop offset="50%" stopColor="#f9fafb" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </linearGradient>

            {/* Arms Warm Amber Gold Zone */}
            <linearGradient id="armAmber" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>

            {/* Legs Cerulean Cyan Zone */}
            <linearGradient id="legsCyan" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#0ea5e9" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>

            {/* Stand Pole & Metal Base */}
            <linearGradient id="metalStand" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#374151" />
              <stop offset="50%" stopColor="#6b7280" />
              <stop offset="100%" stopColor="#1f2937" />
            </linearGradient>
          </defs>

          {/* Stand Pole & Pedestal Base at ground level */}
          <g opacity="0.85">
            <ellipse cx="200" cy="528" rx="36" ry="6" fill="url(#metalStand)" />
            <rect x="198" y="475" width="4" height="53" rx="2" fill="#4b5563" />
          </g>

          {/* === 2D MANNEQUIN ANATOMY MESH === */}
          <g id="couture-mannequin-body">
            {/* Top Finial Cap Knob */}
            <circle cx="200" cy="36" r="3.5" fill="#374151" />
            <rect x="198.5" y="39.5" width="3" height="6" rx="1.5" fill="#6b7280" />

            {/* Stylized Egg-Shaped Porcelain Head */}
            <ellipse cx="200" cy="58" rx="14" ry="19" fill="url(#headPorcelain)" />

            {/* Neck Pillar */}
            <path
              d="M194 77 Q193 98 189 108 Q200 112 211 108 Q207 98 206 77 Z"
              fill="url(#neckPorcelain)"
            />

            {/* Golden Amber Collar Band */}
            <path
              d="M189 108 Q200 113 211 108 Q214 116 215 120 Q200 124 185 120 Q186 116 189 108 Z"
              fill="url(#collarAmber)"
              className="cursor-pointer transition-opacity hover:opacity-90"
              onClick={() => handleLandmarkClick(LANDMARKS[0])}
            />

            {/* Legs & Lower Torso / Thighs (Cerulean Cyan Zone) */}
            {/* Left Leg */}
            <path
              d="M158 300 Q150 340 152 395 Q156 450 160 490 Q167 492 168 488 Q167 445 171 390 Q175 338 186 310 Q172 305 158 300 Z"
              fill="url(#legsCyan)"
              className="cursor-pointer transition-all hover:brightness-105"
              onClick={() => handleLandmarkClick(LANDMARKS[5])}
            />
            {/* Right Leg */}
            <path
              d="M242 300 Q250 340 248 395 Q244 450 240 490 Q233 492 232 488 Q233 445 229 390 Q225 338 214 310 Q228 305 242 300 Z"
              fill="url(#legsCyan)"
              className="cursor-pointer transition-all hover:brightness-105"
              onClick={() => handleLandmarkClick(LANDMARKS[5])}
            />

            {/* Lower Hip / Pelvis Band (Neutral Light Grey) */}
            <path
              d="M158 266 Q153 283 158 300 Q179 308 200 308 Q221 308 242 300 Q247 283 242 266 Q221 272 200 272 Q179 272 158 266 Z"
              fill="url(#hipWhite)"
            />

            {/* Natural Waist Midriff (Deep Midnight Navy Blue Zone) */}
            <path
              d="M161 234 Q157 250 158 266 Q179 272 200 272 Q221 272 242 266 Q243 250 239 234 Q220 240 200 240 Q180 240 161 234 Z"
              fill="url(#waistNavy)"
              className="cursor-pointer transition-all hover:brightness-110"
              onClick={() => handleLandmarkClick(LANDMARKS[3])}
            />

            {/* Midriff Transition Band (Neutral Porcelain) */}
            <path
              d="M163 210 Q159 222 161 234 Q180 240 200 240 Q220 240 239 234 Q241 222 237 210 Q220 216 200 216 Q180 216 163 210 Z"
              fill="url(#midriffWhite)"
            />

            {/* Upper Bodice / Chest (Teal / Emerald Green Zone) */}
            <path
              d="M185 120 Q160 124 138 138 Q134 142 140 152 Q156 168 163 210 Q180 216 200 216 Q220 216 237 210 Q244 168 260 152 Q266 142 262 138 Q240 124 215 120 Q200 124 185 120 Z"
              fill="url(#bodiceTeal)"
              className="cursor-pointer transition-all hover:brightness-105"
              onClick={() => handleLandmarkClick(LANDMARKS[2])}
            />

            {/* Arms (Warm Amber Gold Zone) */}
            {/* Left Arm */}
            <path
              d="M136 140 Q121 168 116 208 Q113 254 122 292 Q127 292 129 278 Q125 242 128 204 Q132 168 142 144 Z"
              fill="url(#armAmber)"
              className="cursor-pointer transition-all hover:brightness-110"
              onClick={() => handleLandmarkClick(LANDMARKS[4])}
            />
            {/* Right Arm */}
            <path
              d="M264 140 Q279 168 284 208 Q287 254 278 292 Q273 292 271 278 Q275 242 272 204 Q268 168 258 144 Z"
              fill="url(#armAmber)"
              className="cursor-pointer transition-all hover:brightness-110"
              onClick={() => handleLandmarkClick(LANDMARKS[4])}
            />
          </g>

          {/* === CYAN DASHED LEADER LINES & CONCENTRIC ANCHOR TARGETS === */}
          {LANDMARKS.map((lm) => {
            const isLeft = lm.side === 'left';
            
            // Exact anchor & leader line endpoints matching Overview.png & Clients.png
            let lineX2 = isLeft ? lm.labelX + 8 : lm.labelX - 8;
            let lineY2 = lm.labelY - 5;

            // Shoulder has slight upward angle
            if (lm.key === 'shoulder') {
              lineY2 = lm.labelY - 4;
            }
            // Thigh has downward diagonal dashed line
            if (lm.key === 'thigh') {
              lineY2 = lm.labelY - 4;
            }

            return (
              <g
                key={`callout-${lm.key}`}
                className="cursor-pointer group"
                onClick={() => handleLandmarkClick(lm)}
              >
                {/* Expanded touch target for easy tap on mobile */}
                <circle
                  cx={lm.anchorX}
                  cy={lm.anchorY}
                  r="20"
                  fill="transparent"
                  className="cursor-pointer"
                />

                {/* Cyan Dashed Leader Line */}
                <line
                  x1={lm.anchorX}
                  y1={lm.anchorY}
                  x2={lineX2}
                  y2={lineY2}
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                  className="transition-opacity group-hover:stroke-[#0284c7]"
                />

                {/* Concentric Anchor Target - Outer Translucent Ring */}
                <circle
                  cx={lm.anchorX}
                  cy={lm.anchorY}
                  r="7"
                  fill="rgba(0, 132, 255, 0.16)"
                  stroke="#0084FF"
                  strokeWidth="1.5"
                  className="transition-transform group-hover:scale-125 origin-center"
                />

                {/* Concentric Anchor Target - Inner Solid Dot */}
                <circle
                  cx={lm.anchorX}
                  cy={lm.anchorY}
                  r="3.5"
                  fill="#0084FF"
                  className="transition-transform group-hover:scale-125 origin-center"
                />

                {/* Outer Connection Dot */}
                <circle
                  cx={lineX2}
                  cy={lineY2}
                  r="2.5"
                  fill="#0284c7"
                  className="transition-transform group-hover:scale-125 origin-center"
                />

                {/* Fashion Serif Landmark Label (Playfair Display font) */}
                <text
                  x={lm.labelX}
                  y={lm.labelY}
                  textAnchor={isLeft ? 'end' : 'start'}
                  className="font-serif text-[17px] font-normal fill-gray-950 tracking-wide select-none group-hover:fill-[#1d4ed8] transition-colors"
                >
                  {lm.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
