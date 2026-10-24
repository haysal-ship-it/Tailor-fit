'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { RotateCw, MoveHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { resolveCanonicalKey } from '@/lib/initial-data';

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
 * All 21 Canonical Anatomical Sizing Landmarks mapped onto the 636x730 3D Mannequin:
 * 1. Head/Neck: Head circumference, Neck circumference, Neckline, Shoulder to Neck
 * 2. Torso: Shoulder width, Bust/chest, Waist circumference, Body length, Front length, Hip Height
 * 3. Upper Limb: Sleeve length, Biceps, Wrist circumference, Armhole, Elbow length
 * 4. Lower limb: Inseam, Outseam, Thigh circumference, Knee circumference, Rise, Thigh length
 */
export const MANNEQUIN_LANDMARKS_3D: RotatableLandmark3D[] = [
  // =========================================================================
  // 1. HEAD / NECK (4 items)
  // =========================================================================
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
    sideByView: { 0: 'left', 90: 'left', 180: 'left', 270: 'right' },
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
    sideByView: { 0: 'left', 90: 'left', 180: 'left', 270: 'right' },
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
    sideByView: { 0: 'left', 90: 'left', 180: 'left', 270: 'right' },
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
    sideByView: { 0: 'left', 90: 'left', 180: 'right', 270: 'right' },
    labelYOffset: -24,
  },

  // =========================================================================
  // 2. TORSO (6 items)
  // =========================================================================
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
    sideByView: { 0: 'right', 90: 'left', 180: 'right', 270: 'right' },
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
    sideByView: { 0: 'left', 90: 'left', 180: 'right', 270: 'right' },
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
    sideByView: { 0: 'right', 90: 'right', 180: 'right', 270: 'left' },
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
    sideByView: { 0: 'left', 90: 'left', 180: 'left', 270: 'right' },
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
    sideByView: { 0: 'right', 90: 'right', 180: 'left', 270: 'left' },
    labelYOffset: 0,
  },

  // =========================================================================
  // 3. UPPER LIMB (5 items)
  // =========================================================================
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
    sideByView: { 0: 'left', 90: 'left', 180: 'right', 270: 'right' },
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

  // =========================================================================
  // 4. LOWER LIMB (6 items)
  // =========================================================================
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
    sideByView: { 0: 'left', 90: 'left', 180: 'left', 270: 'right' },
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
    sideByView: { 0: 'right', 90: 'left', 180: 'left', 270: 'right' },
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
    sideByView: { 0: 'left', 90: 'left', 180: 'right', 270: 'right' },
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
    sideByView: { 0: 'right', 90: 'left', 180: 'left', 270: 'right' },
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

const VIEW_METADATA: Array<{
  angle: MannequinViewAngle;
  shortLabel: string;
  fullLabel: string;
  suffix: 'front' | 'left' | 'back' | 'right';
}> = [
  { angle: 0, shortLabel: 'Front', fullLabel: 'FRONT VIEW (0°)', suffix: 'front' },
  { angle: 90, shortLabel: 'Left', fullLabel: 'LEFT SIDE (90°)', suffix: 'left' },
  { angle: 180, shortLabel: 'Back', fullLabel: 'BACK VIEW (180°)', suffix: 'back' },
  { angle: 270, shortLabel: 'Right', fullLabel: 'RIGHT SIDE (270°)', suffix: 'right' },
];

function normalizeAngle(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

function nearestCardinal(deg: number): MannequinViewAngle {
  const norm = normalizeAngle(deg);
  if (norm >= 315 || norm < 45) return 0;
  if (norm >= 45 && norm < 135) return 90;
  if (norm >= 135 && norm < 225) return 180;
  return 270;
}

function shortestAngleDiff(from: number, to: number): number {
  let diff = ((to - from + 540) % 360) - 180;
  if (diff === -180) diff = 180;
  return diff;
}

export interface RotatableMannequinProps {
  gender?: MannequinGender;
  onGenderChange?: (gender: MannequinGender) => void;
  showGenderToggle?: boolean;
  initialAngle?: MannequinViewAngle;
  activeView?: 'front' | 'back' | 'left' | 'right';
  onViewChange?: (view: 'front' | 'back' | 'left' | 'right') => void;
  measurements?: Record<string, number | string>;
  /**
   * Explicit list of active measurement keys to display on the mannequin.
   * Per Requirement D: When `activePointKeys` is empty (`[]`), NO touchpoints are rendered
   * (clean empty state of only the rotatable mannequin).
   * If omitted (`undefined`), falls back to keys present in `measurements`.
   */
  activePointKeys?: string[];
  /** Currently open/focused measurement key so its leader line stays visible while modal is open */
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
  // Smooth continuous turntable angle in degrees [0..360)
  const [angle, setAngle] = useState<number>(initialAngle);
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  // Physics state refs for 60fps spring & momentum glide
  const currentAngleRef = useRef<number>(initialAngle);
  const targetAngleRef = useRef<number>(initialAngle);
  const velocityRef = useRef<number>(0);
  const isPointerDownRef = useRef<boolean>(false);
  const isGlidingRef = useRef<boolean>(false);
  const rafRef = useRef<number | null>(null);

  const dragHistoryRef = useRef<Array<{ x: number; time: number }>>([]);
  const dragStartRef = useRef<{ x: number; startAngle: number; moved: boolean } | null>(null);

  // Preload all 8 orthographic mannequin PNGs once on mount for zero-flicker 60fps rotation
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

  // Unified 60fps Spring + Inertial Physics Loop
  const startPhysicsLoop = useCallback(() => {
    if (rafRef.current !== null) return;

    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.004, (now - lastTime) / 1000));
      lastTime = now;

      if (isPointerDownRef.current) {
        // Plush spring-follow while dragging so motion feels fluid, weighted, and never stiff
        const diff = shortestAngleDiff(currentAngleRef.current, targetAngleRef.current);
        const step = diff * Math.min(1, dt * 22);
        currentAngleRef.current = normalizeAngle(currentAngleRef.current + step);
        setAngle(currentAngleRef.current);
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      if (isGlidingRef.current) {
        // Momentum coasting after flick release + soft magnetic attraction to nearest cardinal view when slow
        currentAngleRef.current = normalizeAngle(
          currentAngleRef.current + velocityRef.current * dt
        );
        // Exponential friction decay
        velocityRef.current *= Math.pow(0.035, dt);

        if (Math.abs(velocityRef.current) < 42) {
          // Smoothly transition from momentum glide into gentle cardinal settle
          isGlidingRef.current = false;
          const cardinal = nearestCardinal(currentAngleRef.current);
          targetAngleRef.current = cardinal;
          if (onViewChange) {
            const viewName =
              cardinal === 0
                ? 'front'
                : cardinal === 90
                ? 'left'
                : cardinal === 180
                ? 'back'
                : 'right';
            onViewChange(viewName);
          }
        }
        setAngle(currentAngleRef.current);
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      // Smooth spring settle toward targetAngleRef
      const diff = shortestAngleDiff(currentAngleRef.current, targetAngleRef.current);
      if (Math.abs(diff) > 0.12 || Math.abs(velocityRef.current) > 0.8) {
        // Critically-damped spring
        const stiffness = 170;
        const damping = 24;
        const accel = stiffness * diff - damping * velocityRef.current;
        velocityRef.current += accel * dt;
        currentAngleRef.current = normalizeAngle(
          currentAngleRef.current + velocityRef.current * dt
        );
        setAngle(currentAngleRef.current);
        rafRef.current = requestAnimationFrame(tick);
      } else {
        currentAngleRef.current = normalizeAngle(targetAngleRef.current);
        velocityRef.current = 0;
        setAngle(currentAngleRef.current);
        rafRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [onViewChange]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  // Sync with external activeView prop if provided
  useEffect(() => {
    if (!activeView) return;
    const targetMap: Record<'front' | 'left' | 'back' | 'right', MannequinViewAngle> = {
      front: 0,
      left: 90,
      back: 180,
      right: 270,
    };
    const target = targetMap[activeView];
    if (
      target !== undefined &&
      nearestCardinal(targetAngleRef.current) !== target &&
      !isPointerDownRef.current
    ) {
      isGlidingRef.current = false;
      targetAngleRef.current = target;
      startPhysicsLoop();
    }
  }, [activeView, startPhysicsLoop]);

  const animateToAngle = useCallback(
    (targetDeg: number) => {
      const normTarget = normalizeAngle(targetDeg);
      isGlidingRef.current = false;
      targetAngleRef.current = normTarget;
      startPhysicsLoop();

      if (onViewChange) {
        const c = nearestCardinal(normTarget);
        const viewName =
          c === 0 ? 'front' : c === 90 ? 'left' : c === 180 ? 'back' : 'right';
        onViewChange(viewName);
      }
    },
    [onViewChange, startPhysicsLoop]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Do not start drag if clicking an interactive point or button
    const targetEl = e.target as HTMLElement;
    if (targetEl.closest('button') || targetEl.closest('[data-mannequin-point="true"]')) {
      return;
    }

    e.currentTarget.setPointerCapture(e.pointerId);
    const now = performance.now();
    isPointerDownRef.current = true;
    isGlidingRef.current = false;
    velocityRef.current = 0;

    dragStartRef.current = {
      x: e.clientX,
      startAngle: currentAngleRef.current,
      moved: false,
    };
    dragHistoryRef.current = [{ x: e.clientX, time: now }];
    targetAngleRef.current = currentAngleRef.current;
    setIsDragging(true);
    startPhysicsLoop();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current || !isPointerDownRef.current) return;
    const now = performance.now();
    const dx = e.clientX - dragStartRef.current.x;

    if (Math.abs(dx) > 3) {
      dragStartRef.current.moved = true;
    }

    // Track recent pointer samples (last 90ms) for accurate flick velocity
    dragHistoryRef.current.push({ x: e.clientX, time: now });
    while (dragHistoryRef.current.length > 2 && now - dragHistoryRef.current[0].time > 90) {
      dragHistoryRef.current.shift();
    }

    // Smooth sensitivity: 0.78 deg per pixel
    targetAngleRef.current = normalizeAngle(dragStartRef.current.startAngle + dx * 0.78);
    startPhysicsLoop();
  };

  const handlePointerUp = () => {
    if (!dragStartRef.current) return;
    const wasMoved = dragStartRef.current.moved;
    isPointerDownRef.current = false;
    dragStartRef.current = null;
    setIsDragging(false);

    if (wasMoved) {
      const history = dragHistoryRef.current;
      let releaseVelocityDegPerSec = 0;
      if (history.length >= 2) {
        const first = history[0];
        const last = history[history.length - 1];
        const dtSec = Math.max(0.008, (last.time - first.time) / 1000);
        const vxPxPerSec = (last.x - first.x) / dtSec;
        releaseVelocityDegPerSec = Math.max(-720, Math.min(720, vxPxPerSec * 0.78));
      }

      if (Math.abs(releaseVelocityDegPerSec) > 65) {
        // Momentum flick glide!
        velocityRef.current = releaseVelocityDegPerSec;
        isGlidingRef.current = true;
        startPhysicsLoop();
      } else {
        // Gentle settle to nearest cardinal view
        const cardinal = nearestCardinal(currentAngleRef.current);
        targetAngleRef.current = cardinal;
        startPhysicsLoop();
        if (onViewChange) {
          const viewName =
            cardinal === 0
              ? 'front'
              : cardinal === 90
              ? 'left'
              : cardinal === 180
              ? 'back'
              : 'right';
          onViewChange(viewName);
        }
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const next = ((nearestCardinal(currentAngleRef.current) + 90) % 360) as MannequinViewAngle;
      animateToAngle(next);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prev = ((nearestCardinal(currentAngleRef.current) + 270) % 360) as MannequinViewAngle;
      animateToAngle(prev);
    }
  };

  const cardinalAngle = nearestCardinal(angle);
  const normAngle = normalizeAngle(angle);
  const rad = (normAngle * Math.PI) / 180;

  /**
   * 3D Cylindrical Turntable Projection for the 4 Orthographic Studio Layers:
   * Uses a sharper S-curve blend near the 45° silhouette transition and cylindrical
   * horizontal foreshortening so the mannequin feels like a solid rotating 3D figure
   * rather than a wide ghosted double-exposure.
   */
  const getLayerTransform = (viewAngle: MannequinViewAngle) => {
    const diff = shortestAngleDiff(viewAngle, normAngle);
    const absDiff = Math.abs(diff);
    if (absDiff >= 88) {
      return { opacity: 0, scaleX: 0.78, translateX: 0 };
    }
    // Sharper quintic smoothstep centered around 45° so cardinal views stay crisp longer
    const t = Math.max(0, Math.min(1, (absDiff - 12) / 66));
    const smooth = t * t * t * (t * (t * 6 - 15) + 10);
    const opacity = 1 - smooth;

    const radDiff = (diff * Math.PI) / 180;
    const scaleX = Math.max(0.76, Math.cos(radDiff * 0.82));
    const translateX = Math.sin(radDiff) * 18;
    return { opacity, scaleX, translateX };
  };

  /**
   * Requirement D: Determine which touchpoints are active on the mannequin.
   * - If `activePointKeys` is explicitly provided (even if `[]`), ONLY show those keys.
   * - If `activePointKeys` is `[]`, zero touchpoints are shown (clean empty state).
   * - If `activePointKeys` is `undefined`, infer active keys from `measurements` keys with values.
   */
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

  // Normalized measurements map for displaying value in hover tooltip
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

  // Filter landmarks: must be in `resolvedActiveKeySet` AND visible in the current cardinal view
  const visibleLandmarks = useMemo(() => {
    return MANNEQUIN_LANDMARKS_3D.filter(
      (lm) => resolvedActiveKeySet.has(lm.key) && lm.visibleViews.includes(cardinalAngle)
    );
  }, [resolvedActiveKeySet, cardinalAngle]);

  const resolvedSelectedKey = selectedPointKey ? resolveCanonicalKey(selectedPointKey) : null;

  return (
    <div
      className={cn(
        'w-full flex flex-col items-center justify-center select-none relative outline-none',
        className
      )}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label={`Rotatable 3D ${gender} mannequin, currently at ${Math.round(normAngle)} degrees`}
    >
      {/* Interactive 360° Turntable Stage */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={cn(
          'relative w-full flex items-center justify-center touch-pan-y',
          isDragging ? 'cursor-grabbing' : 'cursor-grab',
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
            fill="rgba(0, 0, 0, 0.035)"
            stroke="rgba(0, 0, 0, 0.08)"
            strokeWidth="1"
            strokeDasharray="4 4"
            style={{
              transform: `rotate(${(normAngle * 0.25).toFixed(1)}deg)`,
              transformOrigin: '318px 702px',
            }}
          />

          {/* 4 Orthographic Studio Layers with Smooth 3D Cylindrical Turntable Blending */}
          {VIEW_METADATA.map((v) => {
            const { opacity, scaleX, translateX } = getLayerTransform(v.angle);
            if (opacity <= 0.008) return null;
            const href = `/assets/mannequin-${gender}-${v.suffix}.png`;

            return (
              <g
                key={`${gender}-${v.suffix}`}
                style={{
                  opacity,
                  transform: `translateX(${translateX.toFixed(2)}px) scaleX(${scaleX.toFixed(3)})`,
                  transformOrigin: '318px 365px',
                  willChange: 'transform, opacity',
                }}
              >
                <image
                  href={href}
                  x="0"
                  y="0"
                  width="636"
                  height="730"
                  preserveAspectRatio="xMidYMid meet"
                  className="pointer-events-none"
                />
              </g>
            );
          })}

          {/* Requirement C & D: Active Touchpoints Only by Default; Leader Line & Label ONLY on Hover/Focus */}
          {visibleLandmarks.map((lm) => {
            const x3d = gender === 'female' ? lm.x3dFemale : lm.x3dMale;
            const z3d = gender === 'female' ? lm.z3dFemale : lm.z3dMale;

            // Orthographic 3D projection around spine axis X = 318
            const projX = 318 + x3d * Math.cos(rad) - z3d * Math.sin(rad);
            const projY = lm.y;

            const side = lm.sideByView[cardinalAngle];
            const isLeft = side === 'left';
            const yOff = lm.labelYOffset ?? 0;

            // Outer label anchor coordinates in 636x730 viewBox
            const labelAnchorX = isLeft ? 88 : 548;
            const labelAnchorY = Math.max(42, Math.min(685, projY + yOff));

            let polyPoints: string;
            if (Math.abs(yOff) > 2) {
              const kinkX = isLeft
                ? Math.max(labelAnchorX + 12, projX - Math.abs(yOff))
                : Math.min(labelAnchorX - 12, projX + Math.abs(yOff));
              polyPoints = `${projX.toFixed(1)},${projY.toFixed(1)} ${kinkX.toFixed(1)},${labelAnchorY.toFixed(1)} ${labelAnchorX.toFixed(1)},${labelAnchorY.toFixed(1)}`;
            } else {
              polyPoints = `${projX.toFixed(1)},${projY.toFixed(1)} ${labelAnchorX.toFixed(1)},${labelAnchorY.toFixed(1)}`;
            }

            const displayLabel = gender === 'male' && lm.maleLabel ? lm.maleLabel : lm.label;
            const rawVal = canonicalMeasurements[lm.key];
            const hasValue = rawVal !== undefined && rawVal !== '' && Number(rawVal) > 0;
            const formattedVal = hasValue ? `${Number(rawVal).toFixed(1)} ${unit}` : '';

            // Requirement C: Leader line & label ONLY visible on hover or when its modal is open
            const isHoveredOrActive = hoveredKey === lm.key || resolvedSelectedKey === lm.key;

            const handlePointClick = (e: React.MouseEvent) => {
              e.stopPropagation();
              if (readOnly || !onSelectPoint) return;
              onSelectPoint(lm.key, displayLabel);
            };

            return (
              <g
                key={lm.key}
                data-mannequin-point="true"
                onMouseEnter={() => setHoveredKey(lm.key)}
                onMouseLeave={() => setHoveredKey((prev) => (prev === lm.key ? null : prev))}
                onFocus={() => setHoveredKey(lm.key)}
                onBlur={() => setHoveredKey((prev) => (prev === lm.key ? null : prev))}
                onClick={handlePointClick}
                className={cn(
                  'transition-opacity duration-150',
                  isDragging ? 'opacity-50' : 'opacity-100',
                  readOnly ? 'pointer-events-none' : 'cursor-pointer'
                )}
              >
                {/* Hover-Only Trailing Dotted Leader Line & Description Badge (Requirement C) */}
                <g
                  className={cn(
                    'pointer-events-none transition-opacity duration-150',
                    isHoveredOrActive && !isDragging ? 'opacity-100' : 'opacity-0'
                  )}
                >
                  <polyline
                    points={polyPoints}
                    fill="none"
                    stroke="#079BF8"
                    strokeWidth="1.75"
                    strokeDasharray="4.5 4.5"
                  />

                  {/* Small terminal anchor tick at the end of the dotted line */}
                  <circle cx={labelAnchorX} cy={labelAnchorY} r="2.5" fill="#079BF8" />

                  {/* Point Name & Current Size Pill Background for crisp legibility */}
                  <text
                    x={isLeft ? labelAnchorX - 8 : labelAnchorX + 8}
                    y={hasValue ? labelAnchorY - 8 : labelAnchorY}
                    textAnchor={isLeft ? 'end' : 'start'}
                    dominantBaseline="central"
                    fontFamily="var(--font-manrope), sans-serif"
                    fontSize="18"
                    fontWeight="600"
                    fill="#000000"
                    stroke="#FFFFFF"
                    strokeWidth="4"
                    paintOrder="stroke"
                    className="select-none"
                  >
                    {displayLabel}
                  </text>

                  {hasValue && (
                    <text
                      x={isLeft ? labelAnchorX - 8 : labelAnchorX + 8}
                      y={labelAnchorY + 12}
                      textAnchor={isLeft ? 'end' : 'start'}
                      dominantBaseline="central"
                      fontFamily="var(--font-manrope), sans-serif"
                      fontSize="15"
                      fontWeight="700"
                      fill="#079BF8"
                      stroke="#FFFFFF"
                      strokeWidth="3.5"
                      paintOrder="stroke"
                      className="select-none tabular-nums"
                    >
                      {formattedVal}
                    </text>
                  )}
                </g>

                {/* Generous 44px+ Equivalent Invisible Hit Target for Touch & Mouse */}
                <circle cx={projX} cy={projY} r="26" fill="transparent" />

                {/* Active Touchpoint Ring & Center Dot (Always visible for active points) */}
                <circle
                  cx={projX}
                  cy={projY}
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
                <circle
                  cx={projX}
                  cy={projY}
                  r={isHoveredOrActive ? '4.2' : '3.4'}
                  fill="#079BF8"
                  className="transition-all duration-150"
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Interactive 360° Rotation & View Control Strip */}
      {showControls && (
        <div className="mt-2 flex flex-col items-center justify-center gap-2 z-10 w-full max-w-[360px]">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {/* Optional M / F Gender Toggle when parent doesn't render one */}
            {showGenderToggle && onGenderChange && (
              <div className="h-8 bg-white border border-[#EDEDED] rounded-full px-1.5 py-1 flex items-center gap-1 shadow-2xs">
                <button
                  type="button"
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

            {/* 4-View Orthographic Angle Pill Selector */}
            <div className="h-8 bg-white border border-[#EDEDED] rounded-full p-1 flex items-center gap-0.5 shadow-2xs">
              {VIEW_METADATA.map((v) => {
                const isActive = cardinalAngle === v.angle;
                return (
                  <button
                    key={v.angle}
                    type="button"
                    onClick={() => animateToAngle(v.angle)}
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
                onClick={() =>
                  animateToAngle(((cardinalAngle + 90) % 360) as MannequinViewAngle)
                }
                className="w-6 h-6 rounded-full flex items-center justify-center text-[var(--text-2)] hover:text-black hover:bg-[#F2F2F2] transition-colors cursor-pointer"
                title="Rotate 90°"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Smooth 360° Turntable Scrubber Bar */}
          <div className="w-full max-w-[260px] flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 border border-[#EDEDED] shadow-2xs">
            <MoveHorizontal className="w-3.5 h-3.5 text-[var(--muted)] shrink-0" />
            <input
              type="range"
              min={0}
              max={360}
              step={1}
              value={Math.round(normAngle)}
              onChange={(e) => {
                const next = Number(e.target.value);
                isGlidingRef.current = false;
                currentAngleRef.current = normalizeAngle(next);
                targetAngleRef.current = normalizeAngle(next);
                setAngle(currentAngleRef.current);
              }}
              aria-label="Smooth 360 degree rotation scrubber"
              className="w-full h-1 bg-[#E5E5E5] rounded-lg appearance-none cursor-ew-resize accent-[var(--primary)]"
            />
            <span className="text-[10px] font-semibold text-[var(--text-2)] tabular-nums w-7 text-right shrink-0">
              {Math.round(normAngle)}°
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
