'use client';

import React, { useState } from 'react';
import { UnitType } from '@/types';
import { RotatableMannequin, MannequinGender } from '@/components/mannequin/RotatableMannequin';

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
    key: 'back',
    name: 'Back',
    defaultValCm: 40,
    color: '#0084FF',
    zone: 'Cross Back',
    dotX: 165,
    dotY: 195,
    anchorX: 165,
    anchorY: 195,
    labelX: 110,
    labelY: 195,
    side: 'left',
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
    key: 'hip',
    name: 'Hip',
    defaultValCm: 96,
    color: '#0084FF',
    zone: 'Full Hip',
    dotX: 165,
    dotY: 318,
    anchorX: 165,
    anchorY: 318,
    labelX: 110,
    labelY: 318,
    side: 'left',
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
  {
    key: 'ankle',
    name: 'Ankle',
    defaultValCm: 24,
    color: '#0084FF',
    zone: 'Lower Leg',
    dotX: 185,
    dotY: 485,
    anchorX: 185,
    anchorY: 485,
    labelX: 110,
    labelY: 485,
    side: 'left',
  },
];

export interface AtelierMannequinProps {
  gender?: string;
  unit?: UnitType;
  measurements?: Record<string, number | string>;
  onMeasurementChange?: (key: string, value: number) => void;
  onSelectLandmark?: (key: string, name: string, currentVal: number) => void;
  className?: string;
  readOnly?: boolean;
}

export function AtelierMannequin({
  gender = 'F',
  unit = 'cm',
  measurements = {},
  onSelectLandmark,
  className = '',
  readOnly = false,
}: AtelierMannequinProps) {
  const initialGender: MannequinGender =
    gender.toLowerCase().startsWith('m') ? 'male' : 'female';
  const [activeGender, setActiveGender] = useState<MannequinGender>(initialGender);

  const getMeasurementVal = (key: string, defaultCm: number) => {
    const raw = measurements[key];
    const cm = typeof raw === 'number' ? raw : parseFloat(String(raw)) || defaultCm;
    if (unit === 'in') {
      return parseFloat((cm / 2.54).toFixed(1));
    }
    return Math.round(cm);
  };

  const handleSelectPoint = (key: string, label: string) => {
    if (!onSelectLandmark) return;
    const found = LANDMARKS.find((l) => l.key === key);
    const val = getMeasurementVal(key, found?.defaultValCm ?? 40);
    onSelectLandmark(key, label, val);
  };

  return (
    <div className={`w-full flex flex-col items-center justify-center select-none relative ${className}`}>
      <RotatableMannequin
        gender={activeGender}
        onGenderChange={setActiveGender}
        showGenderToggle={true}
        measurements={measurements}
        onSelectPoint={handleSelectPoint}
        readOnly={readOnly}
      />
    </div>
  );
}
