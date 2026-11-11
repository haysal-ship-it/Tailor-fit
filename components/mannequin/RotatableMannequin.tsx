'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { resolveCanonicalKey } from '@/lib/initial-data';

import { MANNEQUIN_LANDMARKS_3D, type MannequinGender, type MannequinViewAngle } from '@/lib/mannequin-landmarks';
export { MANNEQUIN_LANDMARKS_3D } from '@/lib/mannequin-landmarks';
export type { MannequinGender, MannequinViewAngle, RotatableLandmark3D } from '@/lib/mannequin-landmarks';

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

/**
 * Wraps long landmark labels into at most 2 compact lines so callouts never
 * shoot outside the horizontal bounds of the Saved Measurements container.
 */
function wrapCalloutLabel(label: string, maxCharsPerLine = 12): string[] {
  const trimmed = label.trim();
  if (trimmed.length <= maxCharsPerLine || !trimmed.includes(' ')) {
    return [trimmed];
  }
  const words = trimmed.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if (!current) {
      current = word;
    } else if ((current + ' ' + word).length <= maxCharsPerLine) {
      current += ' ' + word;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  if (lines.length > 2) {
    return [lines[0], lines.slice(1).join(' ')];
  }
  return lines;
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
  /** When true (default), dotted callout lines, point names, and sizes are always visible without requiring hover/click */
  alwaysShowCallouts?: boolean;
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
  alwaysShowCallouts = true,
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

  // Compute non-overlapping, container-bounded callout positions for all visible landmarks
  const positionedLandmarks = useMemo(() => {
    const LEFT_ANCHOR_X = 132;
    const RIGHT_ANCHOR_X = 504;
    const MIN_Y = 30;
    const MAX_Y = 700;

    type Item = {
      lm: (typeof visibleLandmarks)[number];
      projX: number;
      projY: number;
      isLeft: boolean;
      labelAnchorX: number;
      naturalY: number;
      resolvedY: number;
      lines: string[];
      formattedVal: string;
      hasValue: boolean;
      boxHeight: number;
    };

    const rawItems: Item[] = visibleLandmarks.map((lm) => {
      const x3d = gender === 'female' ? lm.x3dFemale : lm.x3dMale;
      const z3d = gender === 'female' ? lm.z3dFemale : lm.z3dMale;
      const projX = 318 + x3d * Math.cos(rad) - z3d * Math.sin(rad);
      const projY = lm.y;

      const side = lm.sideByView[cardinalAngle];
      const isLeft = side === 'left';
      const labelAnchorX = isLeft ? LEFT_ANCHOR_X : RIGHT_ANCHOR_X;

      const displayLabel = gender === 'male' && lm.maleLabel ? lm.maleLabel : lm.label;
      const lines = wrapCalloutLabel(displayLabel, 12);
      const rawVal = canonicalMeasurements[lm.key];
      const hasValue = rawVal !== undefined && rawVal !== '' && Number(rawVal) > 0;
      const numVal = hasValue ? Number(rawVal) : 0;
      const formattedVal = hasValue
        ? `${Number.isInteger(numVal) ? numVal : numVal.toFixed(1)} ${unit}`
        : '';

      const totalLines = lines.length + (hasValue ? 1 : 0);
      const boxHeight = totalLines * 14 + 8;

      let yOff = lm.labelYOffset ?? 0;
      // Push wide arm landmarks vertically clear of the arm touchpoint dot
      if (isLeft && projX < LEFT_ANCHOR_X + 35 && Math.abs(yOff) < 28) {
        yOff = yOff >= 0 ? 34 : -34;
      } else if (!isLeft && projX > RIGHT_ANCHOR_X - 35 && Math.abs(yOff) < 28) {
        yOff = yOff >= 0 ? 34 : -34;
      }

      const naturalY = Math.max(
        MIN_Y + boxHeight / 2,
        Math.min(MAX_Y - boxHeight / 2, projY + yOff)
      );

      return {
        lm,
        projX,
        projY,
        isLeft,
        labelAnchorX,
        naturalY,
        resolvedY: naturalY,
        lines,
        formattedVal,
        hasValue,
        boxHeight,
      };
    });

    const solveSide = (group: Item[]) => {
      if (group.length <= 1) return;
      group.sort((a, b) => a.naturalY - b.naturalY || a.projY - b.projY);

      const totalBoxHeight = group.reduce((acc, it) => acc + it.boxHeight, 0);
      const availableSpan = MAX_Y - MIN_Y;
      const gap =
        totalBoxHeight + (group.length - 1) * 7 <= availableSpan
          ? 7
          : Math.max(2, (availableSpan - totalBoxHeight) / Math.max(1, group.length - 1));

      // Forward pass: push down any overlapping callouts
      for (let i = 0; i < group.length; i++) {
        const half = group[i].boxHeight / 2;
        if (i === 0) {
          group[i].resolvedY = Math.max(MIN_Y + half, group[i].naturalY);
        } else {
          const prevBottom = group[i - 1].resolvedY + group[i - 1].boxHeight / 2;
          const minCenter = prevBottom + gap + half;
          group[i].resolvedY = Math.max(minCenter, group[i].naturalY);
        }
      }

      // Backward pass: pull up if bottom-most callout exceeded MAX_Y
      const last = group[group.length - 1];
      const lastHalf = last.boxHeight / 2;
      if (last.resolvedY + lastHalf > MAX_Y) {
        last.resolvedY = MAX_Y - lastHalf;
        for (let i = group.length - 2; i >= 0; i--) {
          const nextTop = group[i + 1].resolvedY - group[i + 1].boxHeight / 2;
          const maxCenter = nextTop - gap - group[i].boxHeight / 2;
          if (group[i].resolvedY > maxCenter) {
            group[i].resolvedY = maxCenter;
          }
        }
      }

      // Final clamp pass from top if backward pass pushed first item above MIN_Y
      if (group[0].resolvedY - group[0].boxHeight / 2 < MIN_Y) {
        group[0].resolvedY = MIN_Y + group[0].boxHeight / 2;
        for (let i = 1; i < group.length; i++) {
          const prevBottom = group[i - 1].resolvedY + group[i - 1].boxHeight / 2;
          const minCenter = prevBottom + gap + group[i].boxHeight / 2;
          if (group[i].resolvedY < minCenter) {
            group[i].resolvedY = minCenter;
          }
        }
      }
    };

    const leftGroup = rawItems.filter((it) => it.isLeft);
    const rightGroup = rawItems.filter((it) => !it.isLeft);
    solveSide(leftGroup);
    solveSide(rightGroup);

    return rawItems;
  }, [visibleLandmarks, gender, rad, cardinalAngle, canonicalMeasurements, unit]);

  return (
    <div
      className={cn(
        'w-full flex flex-col items-center justify-center select-none relative outline-none overflow-hidden',
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
          'relative w-full flex items-center justify-center touch-pan-y overflow-hidden',
          isDragging ? 'cursor-grabbing' : 'cursor-grab',
          compact ? 'max-w-[380px]' : 'max-w-[520px]'
        )}
      >
        <svg
          viewBox="0 0 636 730"
          className={cn(
            'w-full h-auto select-none overflow-hidden',
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

          {/* Touchpoints + Persistent Non-Overlapping Dotted Callout Lines & Sizes */}
          {positionedLandmarks.map((item) => {
            const {
              lm,
              projX,
              projY,
              isLeft,
              labelAnchorX,
              resolvedY: labelAnchorY,
              lines,
              formattedVal,
              hasValue,
            } = item;

            const dy = labelAnchorY - projY;
            let polyPoints: string;
            if (Math.abs(dy) > 3) {
              const kinkSpan = Math.min(28, Math.max(10, Math.abs(dy) * 0.45));
              const kinkX = isLeft
                ? Math.max(labelAnchorX + 10, projX - kinkSpan)
                : Math.min(labelAnchorX - 10, projX + kinkSpan);
              polyPoints = `${projX.toFixed(1)},${projY.toFixed(1)} ${kinkX.toFixed(1)},${labelAnchorY.toFixed(1)} ${labelAnchorX.toFixed(1)},${labelAnchorY.toFixed(1)}`;
            } else {
              polyPoints = `${projX.toFixed(1)},${projY.toFixed(1)} ${labelAnchorX.toFixed(1)},${labelAnchorY.toFixed(1)}`;
            }

            const displayLabel = gender === 'male' && lm.maleLabel ? lm.maleLabel : lm.label;
            const isHoveredOrActive = hoveredKey === lm.key || resolvedSelectedKey === lm.key;
            const showCallout = alwaysShowCallouts || isHoveredOrActive;

            const handlePointClick = (e: React.MouseEvent) => {
              e.stopPropagation();
              if (readOnly || !onSelectPoint) return;
              onSelectPoint(lm.key, displayLabel);
            };

            const textX = isLeft ? labelAnchorX - 7 : labelAnchorX + 7;
            const totalTextLines = lines.length + (hasValue ? 1 : 0);
            const lineStep = 13.5;
            const startY = labelAnchorY - ((totalTextLines - 1) * lineStep) / 2;

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
                  isDragging ? 'opacity-60' : 'opacity-100',
                  readOnly ? 'pointer-events-none' : 'cursor-pointer'
                )}
              >
                {/* Dotted Leader Line, Wrapped Point Name & Measurement Size */}
                <g
                  className={cn(
                    'pointer-events-none transition-opacity duration-150',
                    showCallout && !isDragging ? 'opacity-100' : 'opacity-0'
                  )}
                >
                  <polyline
                    points={polyPoints}
                    fill="none"
                    stroke="#079BF8"
                    strokeWidth={isHoveredOrActive ? '2' : '1.5'}
                    strokeDasharray="4 4"
                  />

                  {/* Small terminal anchor tick at the end of the dotted line */}
                  <circle cx={labelAnchorX} cy={labelAnchorY} r="2.5" fill="#079BF8" />

                  {/* Wrapped Point Name Lines */}
                  {lines.map((lineText, lineIdx) => (
                    <text
                      key={lineIdx}
                      x={textX}
                      y={startY + lineIdx * lineStep}
                      textAnchor={isLeft ? 'end' : 'start'}
                      dominantBaseline="central"
                      fontFamily="var(--font-manrope), sans-serif"
                      fontSize="12"
                      fontWeight="600"
                      fill="#1D1D1D"
                      stroke="#F8F8F8"
                      strokeWidth="3.5"
                      paintOrder="stroke"
                      className="select-none"
                    >
                      {lineText}
                    </text>
                  ))}

                  {/* Measurement Size Line */}
                  {hasValue && (
                    <text
                      x={textX}
                      y={startY + lines.length * lineStep}
                      textAnchor={isLeft ? 'end' : 'start'}
                      dominantBaseline="central"
                      fontFamily="var(--font-manrope), sans-serif"
                      fontSize="12.5"
                      fontWeight="700"
                      fill="#079BF8"
                      stroke="#F8F8F8"
                      strokeWidth="3.5"
                      paintOrder="stroke"
                      className="select-none tabular-nums"
                    >
                      {formattedVal}
                    </text>
                  )}
                </g>

                {/* Generous 44px+ Equivalent Invisible Hit Target for Touch & Mouse */}
                <circle cx={projX} cy={projY} r="24" fill="transparent" />

                {/* Active Touchpoint Ring & Center Dot */}
                <circle
                  cx={projX}
                  cy={projY}
                  r={isHoveredOrActive ? '9.5' : '7.5'}
                  fill={
                    isHoveredOrActive
                      ? 'rgba(7, 155, 248, 0.32)'
                      : hasValue
                      ? 'rgba(7, 155, 248, 0.24)'
                      : 'rgba(7, 155, 248, 0.14)'
                  }
                  stroke="#079BF8"
                  strokeWidth={isHoveredOrActive ? '2' : '1.5'}
                  className="transition-all duration-150"
                />
                <circle
                  cx={projX}
                  cy={projY}
                  r={isHoveredOrActive ? '4' : '3.2'}
                  fill="#079BF8"
                  className="transition-all duration-150"
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* 4-View Orthographic Angle Selector */}
      {showControls && (
        <div className="mt-2 flex items-center justify-center z-10 w-full">
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
      )}
    </div>
  );
}
