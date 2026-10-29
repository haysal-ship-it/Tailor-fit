'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { resolveCanonicalKey } from '@/lib/initial-data';
import { ROTATION, type RotationConfig } from '@/lib/rotation-config';
import { TAU, wrapPi, smoothDamp, estimateReleaseVelocity } from '@/lib/rotation-math';

export type MannequinGender = 'female' | 'male';
export type MannequinViewAngle = 0 | 90 | 180 | 270;

export interface RotatableLandmark3D {
  key: string;
  label: string;
  maleLabel?: string;
  zone: 'Head/Neck' | 'Torso' | 'Upper Limb' | 'Lower limb';
  /** Y coordinate in the 636x730 canvas space */
  y: number;
  /** X offset from spine centerline (318) in Front view (+ is viewer's right) */
  x3dFemale: number;
  x3dMale: number;
  /** Z offset from spine centerline (+ is anterior/front, - is posterior/back) */
  z3dFemale: number;
  z3dMale: number;
  /** Views where this landmark is clearly visible and not occluded */
  visibleViews: MannequinViewAngle[];
  /** Preferred label side per cardinal view */
  sideByView: Record<MannequinViewAngle, 'left' | 'right'>;
  /** Vertical offset for kinked leader lines so labels never collide */
  labelYOffset?: number;
}

/**
 * All 21 Canonical Anatomical Sizing Landmarks mapped onto the 636x730 Studio Mannequin:
 * 1. Head/Neck: Head circumference, Neck circumference, Neckline, Shoulder to Neck
 * 2. Torso: Shoulder width, Bust/chest, Waist circumference, Body length, Front length, Hip Height
 * 3. Upper Limb: Sleeve length, Biceps, Wrist circumference, Armhole, Elbow length
 * 4. Lower limb: Inseam, Outseam, Thigh circumference, Knee circumference, Rise, Thigh length
 */
export const MANNEQUIN_LANDMARKS_3D: RotatableLandmark3D[] = [
  // 1. HEAD / NECK (4 items)
  {
    key: 'head_circumference',
    label: 'Head circumference',
    zone: 'Head/Neck',
    y: 78,
    x3dFemale: 0,
    x3dMale: 0,
    z3dFemale: 24,
    z3dMale: 26,
    visibleViews: [0, 90, 180, 270],
    sideByView: { 0: 'left', 90: 'right', 180: 'left', 270: 'left' },
    labelYOffset: -18,
  },
  {
    key: 'neck_circumference',
    label: 'Neck circumference',
    zone: 'Head/Neck',
    y: 144,
    x3dFemale: 0,
    x3dMale: 0,
    z3dFemale: 18,
    z3dMale: 21,
    visibleViews: [0, 90, 180, 270],
    sideByView: { 0: 'left', 90: 'right', 180: 'left', 270: 'left' },
    labelYOffset: -12,
  },
  {
    key: 'neckline',
    label: 'Neckline',
    zone: 'Head/Neck',
    y: 168,
    x3dFemale: 0,
    x3dMale: 0,
    z3dFemale: 26,
    z3dMale: 28,
    visibleViews: [0, 90, 270],
    sideByView: { 0: 'left', 90: 'right', 180: 'left', 270: 'left' },
    labelYOffset: 10,
  },
  {
    key: 'shoulder_to_neck',
    label: 'Shoulder to Neck',
    zone: 'Head/Neck',
    y: 155,
    x3dFemale: -30,
    x3dMale: -36,
    z3dFemale: 8,
    z3dMale: 10,
    visibleViews: [0, 90, 180, 270],
    sideByView: { 0: 'left', 90: 'left', 180: 'right', 270: 'left' },
    labelYOffset: -24,
  },

  // 2. TORSO (6 items)
  {
    key: 'shoulder_width',
    label: 'Shoulder width',
    zone: 'Torso',
    y: 165,
    x3dFemale: 58,
    x3dMale: 72,
    z3dFemale: 0,
    z3dMale: 0,
    visibleViews: [0, 90, 180, 270],
    sideByView: { 0: 'right', 90: 'right', 180: 'left', 270: 'left' },
    labelYOffset: -32,
  },
  {
    key: 'bust_chest',
    label: 'Bust/chest',
    zone: 'Torso',
    y: 222,
    x3dFemale: 34,
    x3dMale: 42,
    z3dFemale: 40,
    z3dMale: 36,
    visibleViews: [0, 90, 270],
    sideByView: { 0: 'right', 90: 'right', 180: 'right', 270: 'left' },
    labelYOffset: -8,
  },
  {
    key: 'waist_circumference',
    label: 'Waist circumference',
    zone: 'Torso',
    y: 288,
    x3dFemale: -42,
    x3dMale: -52,
    z3dFemale: 30,
    z3dMale: 34,
    visibleViews: [0, 90, 180, 270],
    sideByView: { 0: 'left', 90: 'right', 180: 'right', 270: 'left' },
    labelYOffset: -18,
  },
  {
    key: 'body_length',
    label: 'Body length',
    zone: 'Torso',
    y: 256,
    x3dFemale: 0,
    x3dMale: 0,
    z3dFemale: -34,
    z3dMale: -38,
    visibleViews: [0, 90, 180, 270],
    sideByView: { 0: 'right', 90: 'left', 180: 'right', 270: 'right' },
    labelYOffset: 12,
  },
  {
    key: 'front_length',
    label: 'Front length',
    zone: 'Torso',
    y: 248,
    x3dFemale: -14,
    x3dMale: -16,
    z3dFemale: 36,
    z3dMale: 35,
    visibleViews: [0, 90, 270],
    sideByView: { 0: 'left', 90: 'right', 180: 'left', 270: 'left' },
    labelYOffset: 0,
  },
  {
    key: 'hip_height',
    label: 'Hip Height',
    zone: 'Torso',
    y: 346,
    x3dFemale: 58,
    x3dMale: 60,
    z3dFemale: -36,
    z3dMale: -34,
    visibleViews: [0, 90, 180, 270],
    sideByView: { 0: 'right', 90: 'left', 180: 'left', 270: 'right' },
    labelYOffset: 0,
  },

  // 3. UPPER LIMB (5 items)
  {
    key: 'armhole',
    label: 'Armhole',
    zone: 'Upper Limb',
    y: 192,
    x3dFemale: -64,
    x3dMale: -76,
    z3dFemale: 12,
    z3dMale: 14,
    visibleViews: [0, 90, 180, 270],
    sideByView: { 0: 'left', 90: 'right', 180: 'right', 270: 'left' },
    labelYOffset: -14,
  },
  {
    key: 'biceps',
    label: 'Biceps',
    zone: 'Upper Limb',
    y: 184,
    x3dFemale: 108,
    x3dMale: 120,
    z3dFemale: 8,
    z3dMale: 10,
    visibleViews: [0, 180],
    sideByView: { 0: 'right', 90: 'right', 180: 'left', 270: 'left' },
    labelYOffset: -26,
  },
  {
    key: 'elbow_length',
    label: 'Elbow length',
    zone: 'Upper Limb',
    y: 186,
    x3dFemale: -145,
    x3dMale: -158,
    z3dFemale: -6,
    z3dMale: -6,
    visibleViews: [0, 180],
    sideByView: { 0: 'left', 90: 'left', 180: 'right', 270: 'right' },
    labelYOffset: 26,
  },
  {
    key: 'sleeve_length',
    label: 'Sleeve length',
    zone: 'Upper Limb',
    y: 186,
    x3dFemale: 176,
    x3dMale: 188,
    z3dFemale: 0,
    z3dMale: 0,
    visibleViews: [0, 180],
    sideByView: { 0: 'right', 90: 'right', 180: 'left', 270: 'left' },
    labelYOffset: 28,
  },
  {
    key: 'wrist_circumference',
    label: 'Wrist circumference',
    zone: 'Upper Limb',
    y: 186,
    x3dFemale: 228,
    x3dMale: 242,
    z3dFemale: 4,
    z3dMale: 4,
    visibleViews: [0, 180],
    sideByView: { 0: 'right', 90: 'right', 180: 'left', 270: 'left' },
    labelYOffset: 52,
  },

  // 4. LOWER LIMB (6 items)
  {
    key: 'rise',
    label: 'Rise',
    zone: 'Lower limb',
    y: 374,
    x3dFemale: 0,
    x3dMale: 0,
    z3dFemale: 32,
    z3dMale: 34,
    visibleViews: [0, 90, 180, 270],
    sideByView: { 0: 'left', 90: 'right', 180: 'left', 270: 'left' },
    labelYOffset: 12,
  },
  {
    key: 'thigh_circumference',
    label: 'Thigh circumference',
    zone: 'Lower limb',
    y: 432,
    x3dFemale: 38,
    x3dMale: 42,
    z3dFemale: 24,
    z3dMale: 26,
    visibleViews: [0, 90, 180, 270],
    sideByView: { 0: 'right', 90: 'right', 180: 'left', 270: 'left' },
    labelYOffset: 0,
  },
  {
    key: 'thigh_length',
    label: 'Thigh length',
    zone: 'Lower limb',
    y: 468,
    x3dFemale: -38,
    x3dMale: -42,
    z3dFemale: 24,
    z3dMale: 26,
    visibleViews: [0, 90, 270],
    sideByView: { 0: 'left', 90: 'right', 180: 'right', 270: 'left' },
    labelYOffset: 0,
  },
  {
    key: 'knee_circumference',
    label: 'Knee circumference',
    zone: 'Lower limb',
    y: 524,
    x3dFemale: 34,
    x3dMale: 38,
    z3dFemale: 18,
    z3dMale: 20,
    visibleViews: [0, 90, 180, 270],
    sideByView: { 0: 'right', 90: 'right', 180: 'left', 270: 'left' },
    labelYOffset: 0,
  },
  {
    key: 'inseam',
    label: 'Inseam',
    zone: 'Lower limb',
    y: 562,
    x3dFemale: -20,
    x3dMale: -22,
    z3dFemale: 8,
    z3dMale: 8,
    visibleViews: [0, 180],
    sideByView: { 0: 'left', 90: 'left', 180: 'right', 270: 'right' },
    labelYOffset: 16,
  },
  {
    key: 'outseam',
    label: 'Outseam',
    zone: 'Lower limb',
    y: 596,
    x3dFemale: 42,
    x3dMale: 46,
    z3dFemale: 0,
    z3dMale: 0,
    visibleViews: [0, 90, 180, 270],
    sideByView: { 0: 'right', 90: 'right', 180: 'left', 270: 'left' },
    labelYOffset: 16,
  },
];

/**
 * 4 Cardinal views in the studio coordinate system:
 * 0° = Front
 * 90° = Right profile (model faces right)
 * 180° = Back
 * 270° = Left profile (model faces left)
 */
export const VIEW_METADATA: Array<{
  angle: MannequinViewAngle;
  shortLabel: string;
  fullLabel: string;
  suffix: 'front' | 'right' | 'back' | 'left';
}> = [
  { angle: 0, shortLabel: 'Front', fullLabel: 'FRONT VIEW (0°)', suffix: 'front' },
  { angle: 270, shortLabel: 'Left', fullLabel: 'LEFT SIDE (270°)', suffix: 'left' },
  { angle: 180, shortLabel: 'Back', fullLabel: 'BACK VIEW (180°)', suffix: 'back' },
  { angle: 90, shortLabel: 'Right', fullLabel: 'RIGHT SIDE (90°)', suffix: 'right' },
];

function normalizeAngleDeg(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

function shortestAngleDiffDeg(from: number, to: number): number {
  let diff = ((to - from + 540) % 360) - 180;
  if (diff === -180) diff = 180;
  return diff;
}

function nearestCardinalDeg(deg: number): MannequinViewAngle {
  const norm = normalizeAngleDeg(deg);
  if (norm >= 315 || norm < 45) return 0;
  if (norm >= 45 && norm < 135) return 90;
  if (norm >= 135 && norm < 225) return 180;
  return 270;
}

export interface RotatableMannequinProps {
  gender?: MannequinGender;
  onGenderChange?: (gender: MannequinGender) => void;
  showGenderToggle?: boolean;
  initialAngle?: MannequinViewAngle;
  activeView?: 'front' | 'back' | 'left' | 'right';
  onViewChange?: (view: 'front' | 'back' | 'left' | 'right') => void;
  measurements?: Record<string, number | string>;
  activePointKeys?: string[];
  selectedPointKey?: string | null;
  unit?: string;
  onSelectPoint?: (key: string, label: string) => void;
  readOnly?: boolean;
  showControls?: boolean;
  compact?: boolean;
  className?: string;
}

export function RotatableMannequin({
  gender = 'female',
  onGenderChange,
  showGenderToggle = false,
  initialAngle = 0,
  activeView,
  onViewChange,
  measurements,
  activePointKeys,
  selectedPointKey = null,
  unit = 'cm',
  onSelectPoint,
  readOnly = false,
  showControls = true,
  compact = false,
  className = '',
}: RotatableMannequinProps) {
  // Preload all 8 studio mannequin PNGs once on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const genders: MannequinGender[] = ['female', 'male'];
    const suffixes = ['front', 'left', 'back', 'right'];
    genders.forEach((g) => {
      suffixes.forEach((s) => {
        const img = new window.Image();
        img.src = `/assets/mannequin-${g}-${s}.png`;
      });
    });
  }, []);

  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const hoveredKeyRef = useRef<string | null>(null);
  useEffect(() => {
    hoveredKeyRef.current = hoveredKey;
    invalidateRef.current?.();
  }, [hoveredKey]);

  // Reduced motion
  const reducedMotionRef = useRef(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionRef.current = mq.matches;
    const onChange = (e: MediaQueryListEvent) => {
      reducedMotionRef.current = e.matches;
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // DOM Refs for direct 60fps updates (0 React re-renders per second during drag)
  const stageRef = useRef<HTMLDivElement | null>(null);
  const imageRefs = useRef<Record<string, SVGImageElement | null>>({});
  const landmarkGroupRefs = useRef<Record<string, SVGGElement | null>>({});
  const touchpointCircleRefs = useRef<Record<string, SVGCircleElement | null>>({});
  const touchpointRingRefs = useRef<Record<string, SVGCircleElement | null>>({});
  const touchpointDotRefs = useRef<Record<string, SVGCircleElement | null>>({});
  const leaderLineRefs = useRef<Record<string, SVGPolylineElement | null>>({});
  const leaderTickRefs = useRef<Record<string, SVGCircleElement | null>>({});
  const leaderTextNameRefs = useRef<Record<string, SVGTextElement | null>>({});
  const leaderTextValRefs = useRef<Record<string, SVGTextElement | null>>({});
  const buttonRefs = useRef<Record<number, HTMLButtonElement | null>>({});

  // Active point keys set
  const resolvedActiveKeySet = useMemo(() => {
    const set = new Set<string>();
    if (Array.isArray(activePointKeys)) {
      activePointKeys.forEach((k) => set.add(resolveCanonicalKey(k)));
      return set;
    }
    if (measurements) {
      Object.entries(measurements).forEach(([k, val]) => {
        if (val !== undefined && val !== '') {
          set.add(resolveCanonicalKey(k));
        }
      });
    }
    return set;
  }, [activePointKeys, measurements]);

  const canonicalMeasurements = useMemo(() => {
    const map: Record<string, number | string> = {};
    if (!measurements) return map;
    Object.entries(measurements).forEach(([k, v]) => {
      if (v !== undefined && v !== '') {
        map[resolveCanonicalKey(k)] = v;
      }
    });
    return map;
  }, [measurements]);

  const resolvedSelectedKey = selectedPointKey ? resolveCanonicalKey(selectedPointKey) : null;

  // Active landmarks
  const activeLandmarks = useMemo(() => {
    return MANNEQUIN_LANDMARKS_3D.filter((lm) => resolvedActiveKeySet.has(lm.key));
  }, [resolvedActiveKeySet]);

  const activeLandmarksRef = useRef(activeLandmarks);
  useEffect(() => {
    activeLandmarksRef.current = activeLandmarks;
    invalidateRef.current?.();
  }, [activeLandmarks]);

  const genderRef = useRef(gender);
  useEffect(() => {
    genderRef.current = gender;
    invalidateRef.current?.();
  }, [gender]);

  // Dedicated physics state in a single ref — NEVER React state
  const initialAngleRad = (initialAngle * Math.PI) / 180;
  const physicsRef = useRef({
    target: initialAngleRad, // unbounded radians
    display: initialAngleRad, // unbounded radians
    dv: { v: 0 },
    vel: 0,
    dragging: false,
    snapping: false,
    buttonTurning: false,
    pointerId: -1,
    startX: 0,
    startY: 0,
    startT: 0,
    lastX: 0,
    moved: 0,
    samples: [] as Array<{ x: number; t: number }>,
    activeCardinal: initialAngle as MannequinViewAngle,
  });

  const invalidateRef = useRef<(() => void) | null>(null);

  // Shortest-path turn to angle
  const animateToAngleRad = useCallback((desiredRad: number) => {
    const s = physicsRef.current;
    s.vel = 0;
    s.dragging = false;
    s.snapping = false;
    s.buttonTurning = true;
    s.target += wrapPi(desiredRad - s.target);
    invalidateRef.current?.();
  }, []);

  const animateToAngleDeg = useCallback(
    (deg: number) => {
      animateToAngleRad((deg * Math.PI) / 180);
    },
    [animateToAngleRad]
  );

  // Sync external activeView prop if changed
  useEffect(() => {
    if (!activeView) return;
    const viewMap: Record<string, number> = { front: 0, right: 90, back: 180, left: 270 };
    const targetDeg = viewMap[activeView];
    if (targetDeg !== undefined) {
      const currentNorm = normalizeAngleDeg((physicsRef.current.display * 180) / Math.PI);
      if (nearestCardinalDeg(currentNorm) !== targetDeg) {
        animateToAngleDeg(targetDeg);
      }
    }
  }, [activeView, animateToAngleDeg]);

  // Main 60fps Spring + Momentum Physics & Direct DOM/SVG Projection Loop
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    let rafId: number | null = null;
    let lastTimeMs = performance.now();

    const updateViewButtonStyles = (cardinal: MannequinViewAngle) => {
      const s = physicsRef.current;
      if (cardinal === s.activeCardinal) return;
      s.activeCardinal = cardinal;

      VIEW_METADATA.forEach((v) => {
        const btn = buttonRefs.current[v.angle];
        if (!btn) return;
        const isActive = v.angle === cardinal;
        btn.setAttribute('aria-pressed', String(isActive));
        btn.className = cn(
          'px-2.5 h-6 rounded-full text-[11px] font-medium transition-all cursor-pointer',
          isActive
            ? 'bg-[var(--primary)] text-white shadow-2xs'
            : 'text-[var(--text-2)] hover:text-black'
        );
      });

      if (onViewChange) {
        const viewName =
          cardinal === 0 ? 'front' : cardinal === 90 ? 'right' : cardinal === 180 ? 'back' : 'left';
        onViewChange(viewName);
      }
    };

    const renderLayersAndLandmarks = (rad: number) => {
      const normDeg = normalizeAngleDeg((rad * 180) / Math.PI);
      const cardinal = nearestCardinalDeg(normDeg);
      updateViewButtonStyles(cardinal);

      // 1. Update 4 Studio Orthographic Layers via direct SVG image transforms
      VIEW_METADATA.forEach((v) => {
        const img = imageRefs.current[v.suffix];
        if (!img) return;

        const diff = shortestAngleDiffDeg(v.angle, normDeg);
        const absDiff = Math.abs(diff);

        if (absDiff >= 88) {
          img.style.opacity = '0';
          return;
        }

        // Quintic smoothstep centered around 45° for seamless studio cross-fade
        const t = Math.max(0, Math.min(1, (absDiff - 12) / 66));
        const smooth = t * t * t * (t * (t * 6 - 15) + 10);
        const opacity = 1 - smooth;

        const radDiff = (diff * Math.PI) / 180;
        const scaleX = Math.max(0.76, Math.cos(radDiff * 0.82));
        const translateX = Math.sin(radDiff) * 18;

        img.style.opacity = opacity.toFixed(3);
        img.style.transform = `translateX(${translateX.toFixed(2)}px) scaleX(${scaleX.toFixed(3)})`;
      });

      // 2. Update Landmarks Projection in 636x730 viewBox
      const g = genderRef.current;
      const hovered = hoveredKeyRef.current;
      const items = activeLandmarksRef.current;

      items.forEach((lm) => {
        const x3d = g === 'male' ? lm.x3dMale : lm.x3dFemale;
        const z3d = g === 'male' ? lm.z3dMale : lm.z3dFemale;

        // Orthographic projection: rotate around vertical spine center (X = 318)
        // With rad increasing on right drag (+dx), front surface (+z) moves to viewer's right (+X)
        const projX = 318 + x3d * Math.cos(rad) + z3d * Math.sin(rad);
        const projY = lm.y;

        // Depth/facing check: is point on the visible hemisphere?
        const depth = z3d * Math.cos(rad) - x3d * Math.sin(rad);
        const isFacing = depth > -12; // smoothly visible when facing camera

        const groupEl = landmarkGroupRefs.current[lm.key];
        const circleEl = touchpointCircleRefs.current[lm.key];
        const ringEl = touchpointRingRefs.current[lm.key];
        const dotEl = touchpointDotRefs.current[lm.key];
        const polylineEl = leaderLineRefs.current[lm.key];
        const tickEl = leaderTickRefs.current[lm.key];
        const textNameEl = leaderTextNameRefs.current[lm.key];
        const textValEl = leaderTextValRefs.current[lm.key];

        if (groupEl) {
          groupEl.style.opacity = isFacing ? '1' : '0.15';
          groupEl.style.pointerEvents = isFacing ? 'auto' : 'none';
        }

        if (circleEl) {
          circleEl.setAttribute('cx', projX.toFixed(1));
          circleEl.setAttribute('cy', projY.toFixed(1));
        }
        if (ringEl) {
          ringEl.setAttribute('cx', projX.toFixed(1));
          ringEl.setAttribute('cy', projY.toFixed(1));
        }
        if (dotEl) {
          dotEl.setAttribute('cx', projX.toFixed(1));
          dotEl.setAttribute('cy', projY.toFixed(1));
        }

        const isHoveredOrActive = hovered === lm.key || resolvedSelectedKey === lm.key;
        if (polylineEl && tickEl && textNameEl) {
          if (!isHoveredOrActive || !isFacing) {
            polylineEl.style.opacity = '0';
            tickEl.style.opacity = '0';
            textNameEl.style.opacity = '0';
            if (textValEl) textValEl.style.opacity = '0';
          } else {
            const side = lm.sideByView[cardinal] || (projX < 318 ? 'left' : 'right');
            const isLeft = side === 'left';
            const yOff = lm.labelYOffset ?? 0;
            const labelAnchorX = isLeft ? 104 : 532;
            const labelAnchorY = Math.max(42, Math.min(685, projY + yOff));

            let pointsStr: string;
            if (Math.abs(yOff) > 2) {
              const kinkX = isLeft
                ? Math.max(labelAnchorX + 12, projX - Math.abs(yOff))
                : Math.min(labelAnchorX - 12, projX + Math.abs(yOff));
              pointsStr = `${projX.toFixed(1)},${projY.toFixed(1)} ${kinkX.toFixed(1)},${labelAnchorY.toFixed(1)} ${labelAnchorX.toFixed(1)},${labelAnchorY.toFixed(1)}`;
            } else {
              pointsStr = `${projX.toFixed(1)},${projY.toFixed(1)} ${labelAnchorX.toFixed(1)},${labelAnchorY.toFixed(1)}`;
            }

            polylineEl.setAttribute('points', pointsStr);
            polylineEl.style.opacity = '1';

            tickEl.setAttribute('cx', String(labelAnchorX));
            tickEl.setAttribute('cy', String(labelAnchorY));
            tickEl.style.opacity = '1';

            const hasValText = Boolean(textValEl && textValEl.textContent && textValEl.textContent.trim().length > 0);
            textNameEl.setAttribute('x', String(isLeft ? labelAnchorX - 8 : labelAnchorX + 8));
            textNameEl.setAttribute('y', String(hasValText ? labelAnchorY - 9 : labelAnchorY));
            textNameEl.setAttribute('text-anchor', isLeft ? 'end' : 'start');
            textNameEl.style.opacity = '1';

            if (textValEl) {
              textValEl.setAttribute('x', String(isLeft ? labelAnchorX - 8 : labelAnchorX + 8));
              textValEl.setAttribute('y', String(labelAnchorY + 9));
              textValEl.setAttribute('text-anchor', isLeft ? 'end' : 'start');
              textValEl.style.opacity = '1';
            }
          }
        }
      });
    };

    const stepFrame = (nowMs: number) => {
      rafId = null;

      const rawDt = Math.max(0.001, (nowMs - lastTimeMs) / 1000);
      lastTimeMs = nowMs;
      const dt = Math.min(rawDt, 0.05);

      const s = physicsRef.current;
      const c = ROTATION;
      const reducedMotion = reducedMotionRef.current;

      if (!s.dragging) {
        if (Math.abs(s.vel) >= c.stopSpeed) {
          s.target += s.vel * dt;
          s.vel *= Math.exp(-c.friction * dt);
          if (Math.abs(s.vel) < c.stopSpeed) {
            s.vel = 0;
            if (!reducedMotion && c.snap.enabled) {
              const nearest = Math.round(s.target / (Math.PI / 2)) * (Math.PI / 2);
              if (Math.abs(wrapPi(s.target - nearest)) <= (c.snap.radiusDeg * Math.PI) / 180) {
                s.target = nearest;
                s.snapping = true;
              }
            }
          }
        }
      }

      const smoothTime = reducedMotion
        ? s.dragging
          ? 0.01
          : 0.12
        : s.dragging
          ? c.smoothDrag
          : s.buttonTurning
            ? c.smoothButton
            : s.snapping
              ? c.smoothSnap
              : c.smoothCoast;

      s.display = smoothDamp(s.display, s.target, s.dv, smoothTime, dt);

      const settled =
        !s.dragging &&
        Math.abs(s.vel) < c.stopSpeed &&
        Math.abs(s.target - s.display) < 0.0005 &&
        Math.abs(s.dv.v) < 0.001;

      if (settled) {
        s.display = s.target;
        s.dv.v = 0;
        s.snapping = false;
        s.buttonTurning = false;
      }

      renderLayersAndLandmarks(s.display);

      if (!settled) {
        rafId = window.requestAnimationFrame(stepFrame);
      }
    };

    const invalidate = () => {
      if (rafId === null) {
        lastTimeMs = performance.now();
        rafId = window.requestAnimationFrame(stepFrame);
      }
    };

    invalidateRef.current = invalidate;

    // Render initial frame
    renderLayersAndLandmarks(physicsRef.current.display);

    // Native pointer gestures (1:1 tracking, zero dead-zone, surface follows finger)
    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      const targetEl = e.target as HTMLElement | null;
      if (targetEl?.closest('button') || targetEl?.closest('[data-mannequin-point="true"]')) {
        return;
      }

      const s = physicsRef.current;
      try {
        stage.setPointerCapture(e.pointerId);
      } catch {
        // Ignore
      }
      s.dragging = true;
      s.snapping = false;
      s.buttonTurning = false;
      s.vel = 0;
      s.target = s.display;
      s.dv.v = 0;
      s.pointerId = e.pointerId;
      s.startX = e.clientX;
      s.startY = e.clientY;
      s.lastX = e.clientX;
      s.startT = performance.now();
      s.moved = 0;
      s.samples = [{ x: e.clientX, t: s.startT }];
      stage.style.cursor = 'grabbing';
      invalidate();
    };

    const onPointerMove = (e: PointerEvent) => {
      const s = physicsRef.current;
      if (!s.dragging || e.pointerId !== s.pointerId) return;
      const now = performance.now();
      const dx = e.clientX - s.lastX;
      s.lastX = e.clientX;
      s.moved = Math.hypot(e.clientX - s.startX, e.clientY - s.startY);
      // Front surface follows finger (+dx turns front surface right)
      s.target += dx * ROTATION.radPerPx;
      s.samples.push({ x: e.clientX, t: now });
      const cutoff = now - 180;
      while (s.samples.length > 2 && s.samples[0].t < cutoff) {
        s.samples.shift();
      }
      invalidate();
    };

    const onPointerUp = (e: PointerEvent) => {
      const s = physicsRef.current;
      if (!s.dragging || e.pointerId !== s.pointerId) return;
      s.dragging = false;
      s.pointerId = -1;
      stage.style.cursor = 'grab';
      try {
        if (stage.hasPointerCapture(e.pointerId)) {
          stage.releasePointerCapture(e.pointerId);
        }
      } catch {
        // Ignore
      }

      const now = performance.now();
      const c = ROTATION;
      const reducedMotion = reducedMotionRef.current;

      // Tap (< 6px and < 300ms)
      if (s.moved < c.tapSlopPx && now - s.startT < c.tapMaxMs) {
        s.vel = 0;
        invalidate();
        return;
      }

      const v = reducedMotion ? 0 : estimateReleaseVelocity(s.samples, now, c);

      // Gentle magnet to the 4 views when released slowly (< 0.8 rad/s) within 8 deg
      const nearest = Math.round(s.target / (Math.PI / 2)) * (Math.PI / 2);
      const distToNearest = Math.abs(wrapPi(s.target - nearest));
      const withinSnapRadius = distToNearest <= (c.snap.radiusDeg * Math.PI) / 180;

      if (!reducedMotion && c.snap.enabled && Math.abs(v) < c.snap.maxReleaseSpeed && withinSnapRadius) {
        s.vel = 0;
        s.target = nearest;
        s.snapping = true;
      } else if (Math.abs(v) >= c.minFlingSpeed) {
        s.vel = v;
        s.snapping = false;
      } else {
        s.vel = 0;
      }

      invalidate();
    };

    const onDoubleClick = (e: MouseEvent) => {
      const targetEl = e.target as HTMLElement | null;
      if (targetEl?.closest('button') || targetEl?.closest('[data-mannequin-point="true"]')) {
        return;
      }
      animateToAngleRad(0);
    };

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 0.5) {
        const s = physicsRef.current;
        s.vel = 0;
        s.snapping = false;
        s.buttonTurning = false;
        s.target += e.deltaX * ROTATION.wheelRadPerPx;
        invalidate();
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      const stepDeg = e.shiftKey ? ROTATION.keyStepShiftDeg : ROTATION.keyStepDeg;
      const stepRad = (stepDeg * Math.PI) / 180;
      const dir = e.key === 'ArrowRight' ? 1 : -1;
      const s = physicsRef.current;
      s.vel = 0;
      s.snapping = false;
      s.buttonTurning = true;
      s.target += dir * stepRad;
      invalidate();
    };

    stage.addEventListener('pointerdown', onPointerDown);
    stage.addEventListener('pointermove', onPointerMove);
    stage.addEventListener('pointerup', onPointerUp);
    stage.addEventListener('pointercancel', onPointerUp);
    stage.addEventListener('lostpointercapture', onPointerUp);
    stage.addEventListener('dblclick', onDoubleClick);
    stage.addEventListener('wheel', onWheel, { passive: true });
    stage.addEventListener('keydown', onKeyDown);

    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      stage.removeEventListener('pointerdown', onPointerDown);
      stage.removeEventListener('pointermove', onPointerMove);
      stage.removeEventListener('pointerup', onPointerUp);
      stage.removeEventListener('pointercancel', onPointerUp);
      stage.removeEventListener('lostpointercapture', onPointerUp);
      stage.removeEventListener('dblclick', onDoubleClick);
      stage.removeEventListener('wheel', onWheel);
      stage.removeEventListener('keydown', onKeyDown);
    };
  }, [animateToAngleRad, onViewChange]);

  const handleRotate90 = () => {
    const s = physicsRef.current;
    s.vel = 0;
    s.dragging = false;
    s.snapping = false;
    s.buttonTurning = true;
    s.target += Math.PI / 2;
    invalidateRef.current?.();
  };

  return (
    <div
      className={cn(
        'w-full flex flex-col items-center justify-center select-none relative outline-none',
        className
      )}
    >
      {/* Interactive 360° Turntable Stage */}
      <div
        ref={stageRef}
        tabIndex={0}
        role="application"
        aria-label="Mannequin viewer. Drag or use the arrow keys to rotate."
        style={{ touchAction: 'pan-y', cursor: 'grab' }}
        className={cn(
          'relative w-full flex items-center justify-center overflow-visible focus:outline-none',
          compact ? 'max-w-[340px]' : 'max-w-[440px]'
        )}
      >
        <svg
          viewBox="0 0 636 730"
          className={cn(
            'w-full h-auto select-none overflow-visible',
            compact ? 'max-h-[430px]' : 'max-h-[540px]'
          )}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Subtle 3D Studio Turntable Plinth Ellipse */}
          <ellipse
            cx="318"
            cy="702"
            rx="116"
            ry="14"
            fill="rgba(0, 0, 0, 0.04)"
            className="pointer-events-none"
          />

          {/* 4 Orthographic Studio Mannequin Layers (Female & Male from https://tailorfit-beta.vercel.app/) */}
          {VIEW_METADATA.map((v) => {
            const href = `/assets/mannequin-${gender}-${v.suffix}.png`;
            return (
              <image
                key={`${gender}-${v.suffix}`}
                ref={(el) => {
                  imageRefs.current[v.suffix] = el;
                }}
                href={href}
                x="0"
                y="18"
                width="636"
                height="684"
                preserveAspectRatio="xMidYMid meet"
                style={{
                  opacity: v.angle === 0 ? 1 : 0,
                  transformOrigin: '318px center',
                  pointerEvents: 'none',
                }}
              />
            );
          })}

          {/* 21 Anatomical Sizing Touchpoints (Requirement D: Empty state when activePointKeys is empty) */}
          {activeLandmarks.map((lm) => {
            const displayLabel = gender === 'male' && lm.maleLabel ? lm.maleLabel : lm.label;
            const rawVal = canonicalMeasurements[lm.key];
            const hasValue = rawVal !== undefined && rawVal !== '' && Number(rawVal) > 0;
            const formattedVal = hasValue ? `${Number(rawVal).toFixed(1)} ${unit}` : '';
            const isHoveredOrActive = hoveredKey === lm.key || resolvedSelectedKey === lm.key;

            const rad = physicsRef.current.display;
            const x3d = gender === 'male' ? lm.x3dMale : lm.x3dFemale;
            const z3d = gender === 'male' ? lm.z3dMale : lm.z3dFemale;
            const initProjX = 318 + x3d * Math.cos(rad) + z3d * Math.sin(rad);
            const initProjY = lm.y;

            return (
              <g
                key={lm.key}
                ref={(el) => {
                  landmarkGroupRefs.current[lm.key] = el;
                }}
                data-mannequin-point="true"
                tabIndex={readOnly ? undefined : 0}
                role={readOnly ? undefined : 'button'}
                aria-label={`${displayLabel}${hasValue ? `: ${formattedVal}` : ' (not set)'}`}
                onFocus={() => setHoveredKey(lm.key)}
                onBlur={() => setHoveredKey((prev) => (prev === lm.key ? null : prev))}
                onMouseEnter={() => setHoveredKey(lm.key)}
                onMouseLeave={() => setHoveredKey((prev) => (prev === lm.key ? null : prev))}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!readOnly && onSelectPoint) {
                    onSelectPoint(lm.key, displayLabel);
                  }
                }}
                onKeyDown={(e) => {
                  if (!readOnly && onSelectPoint && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    e.stopPropagation();
                    onSelectPoint(lm.key, displayLabel);
                  }
                }}
                className={cn(
                  'transition-opacity duration-150 focus:outline-none',
                  readOnly ? 'pointer-events-none' : 'cursor-pointer'
                )}
              >
                {/* Trailing Dotted Line & Floating Value Pill (Requirement C: Only visible on hover or when modal is open) */}
                <g className="pointer-events-none">
                  <polyline
                    ref={(el) => {
                      leaderLineRefs.current[lm.key] = el;
                    }}
                    fill="none"
                    stroke="#079BF8"
                    strokeWidth="1.75"
                    strokeDasharray="4.5 4.5"
                    style={{ opacity: 0 }}
                  />
                  <circle
                    ref={(el) => {
                      leaderTickRefs.current[lm.key] = el;
                    }}
                    r="2.5"
                    fill="#079BF8"
                    style={{ opacity: 0 }}
                  />
                  <text
                    ref={(el) => {
                      leaderTextNameRefs.current[lm.key] = el;
                    }}
                    dominantBaseline="central"
                    fontFamily="var(--font-manrope), sans-serif"
                    fontSize="18"
                    fontWeight="600"
                    fill="#000000"
                    stroke="#FFFFFF"
                    strokeWidth="4"
                    paintOrder="stroke"
                    style={{ opacity: 0 }}
                    className="select-none"
                  >
                    {displayLabel}
                  </text>
                  {hasValue && (
                    <text
                      ref={(el) => {
                        leaderTextValRefs.current[lm.key] = el;
                      }}
                      dominantBaseline="central"
                      fontFamily="var(--font-manrope), sans-serif"
                      fontSize="15"
                      fontWeight="700"
                      fill="#079BF8"
                      stroke="#FFFFFF"
                      strokeWidth="3.5"
                      paintOrder="stroke"
                      style={{ opacity: 0 }}
                      className="select-none tabular-nums"
                    >
                      {formattedVal}
                    </text>
                  )}
                </g>

                {/* 44px+ Hit Target for Touch & Mouse */}
                <circle
                  ref={(el) => {
                    touchpointCircleRefs.current[lm.key] = el;
                  }}
                  cx={initProjX}
                  cy={initProjY}
                  r="26"
                  fill="transparent"
                />

                {/* Touchpoint Outer Cyan Ring */}
                <circle
                  ref={(el) => {
                    touchpointRingRefs.current[lm.key] = el;
                  }}
                  cx={initProjX}
                  cy={initProjY}
                  r={isHoveredOrActive ? '10.5' : '8'}
                  fill={
                    isHoveredOrActive
                      ? 'rgba(7, 155, 248, 0.32)'
                      : hasValue
                      ? 'rgba(7, 155, 248, 0.24)'
                      : 'rgba(7, 155, 248, 0.14)'
                  }
                  stroke="#079BF8"
                  strokeWidth={isHoveredOrActive ? '2' : '1.6'}
                  className="transition-all duration-150"
                />

                {/* Touchpoint Inner Cyan Dot */}
                <circle
                  ref={(el) => {
                    touchpointDotRefs.current[lm.key] = el;
                  }}
                  cx={initProjX}
                  cy={initProjY}
                  r={isHoveredOrActive ? '3.5' : '2.5'}
                  fill="#079BF8"
                  className="transition-all duration-150 pointer-events-none"
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Direction Toolbar at the BOTTOM of the Mannequin Container (Matching https://tailorfit-beta.vercel.app/) */}
      {showControls && (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2 z-10 w-full">
          {/* Optional M / F Gender Toggle when parent doesn't render one */}
          {showGenderToggle && onGenderChange && (
            <div className="h-8 bg-white border border-[#EDEDED] rounded-full px-1.5 py-1 flex items-center gap-1 shadow-2xs">
              <button
                type="button"
                aria-label="Feminine form"
                aria-pressed={gender === 'female'}
                onClick={() => onGenderChange('female')}
                className={cn(
                  'px-2.5 h-6 rounded-full text-[11px] font-semibold transition-all cursor-pointer',
                  gender === 'female'
                    ? 'bg-[var(--primary)] text-white shadow-2xs'
                    : 'text-[var(--text-2)] hover:text-black'
                )}
              >
                Female
              </button>
              <button
                type="button"
                aria-label="Masculine form"
                aria-pressed={gender === 'male'}
                onClick={() => onGenderChange('male')}
                className={cn(
                  'px-2.5 h-6 rounded-full text-[11px] font-semibold transition-all cursor-pointer',
                  gender === 'male'
                    ? 'bg-[var(--primary)] text-white shadow-2xs'
                    : 'text-[var(--text-2)] hover:text-black'
                )}
              >
                Male
              </button>
            </div>
          )}

          {/* 4-View Orthographic Angle Pill Selector (Front, Left, Back, Right, RotateCw 90°) */}
          <div className="h-8 bg-white border border-[#EDEDED] rounded-full p-1 flex items-center gap-0.5 shadow-2xs">
            {VIEW_METADATA.map((v) => {
              const isActive = v.angle === 0;
              return (
                <button
                  key={v.angle}
                  ref={(el) => {
                    buttonRefs.current[v.angle] = el;
                  }}
                  type="button"
                  aria-label={v.fullLabel}
                  aria-pressed={isActive}
                  onClick={() => animateToAngleDeg(v.angle)}
                  className={cn(
                    'px-2.5 h-6 rounded-full text-[11px] font-medium transition-all cursor-pointer',
                    isActive
                      ? 'bg-[var(--primary)] text-white shadow-2xs'
                      : 'text-[var(--text-2)] hover:text-black'
                  )}
                  title={v.fullLabel}
                >
                  {v.shortLabel}
                </button>
              );
            })}

            <div className="w-[1px] h-4 bg-[#EDEDED] mx-0.5" />

            <button
              type="button"
              aria-label="Rotate mannequin 90 degrees"
              onClick={handleRotate90}
              className="w-6 h-6 rounded-full flex items-center justify-center text-[var(--text-2)] hover:text-black hover:bg-[#F2F2F2] transition-colors cursor-pointer"
              title="Rotate 90°"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default RotatableMannequin;
