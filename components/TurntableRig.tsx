'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { ROTATION, type RotationConfig } from '@/lib/rotation-config';
import { TAU, wrapPi, smoothDamp, estimateReleaseVelocity, smoothstep } from '@/lib/rotation-math';
import { buildMannequinGroup } from '@/lib/mannequin/female-geometry';
import { createMannequinResinMaterial } from '@/lib/mannequin/material';
import { cn } from '@/lib/utils';

export type MannequinGender = 'female' | 'male';
export type MannequinViewAngle = 0 | 90 | 180 | 270;

export interface Hotspot3D {
  key: string;
  label: string;
  maleLabel?: string;
  zone: 'Head/Neck' | 'Torso' | 'Upper Limb' | 'Lower limb';
  /** 3D position [x, y, z] in mannequin local space (meters, feet at y = 0, crown at y = 1.75) */
  posFemale: [number, number, number];
  posMale: [number, number, number];
  /** Outward surface normal [nx, ny, nz] in mannequin local space */
  normal: [number, number, number];
  /** Preferred horizontal side for leader line in Front view (flips automatically based on screen X) */
  defaultSide: 'left' | 'right';
  /** Vertical offset in px for leader line label to avoid collisions */
  labelYOffset?: number;
}

/**
 * All 21 Canonical Anatomical Sizing Landmarks in the 1.75m 3D Mannequin's local space (meters).
 * Coordinates lie directly on the 3D surface of buildMannequinGroup, with outward surface normals
 * so points stick to the body under 3D projection and fade smoothly via smoothstep(0.05, 0.3, facing)
 * as they turn away from the camera.
 */
export const HOTSPOTS_3D: Hotspot3D[] = [
  // 1. HEAD / NECK (4 items)
  {
    key: 'head_circumference',
    label: 'Head circumference',
    zone: 'Head/Neck',
    posFemale: [0.0, 1.64, 0.096],
    posMale: [0.0, 1.64, 0.098],
    normal: [0.0, 0.12, 0.99],
    defaultSide: 'left',
    labelYOffset: -18,
  },
  {
    key: 'neck_circumference',
    label: 'Neck circumference',
    zone: 'Head/Neck',
    posFemale: [0.022, 1.50, 0.052],
    posMale: [0.025, 1.50, 0.058],
    normal: [0.38, 0.05, 0.92],
    defaultSide: 'left',
    labelYOffset: -12,
  },
  {
    key: 'neckline',
    label: 'Neckline',
    zone: 'Head/Neck',
    posFemale: [0.0, 1.44, 0.068],
    posMale: [0.0, 1.44, 0.074],
    normal: [0.0, 0.18, 0.98],
    defaultSide: 'left',
    labelYOffset: 10,
  },
  {
    key: 'shoulder_to_neck',
    label: 'Shoulder to Neck',
    zone: 'Head/Neck',
    posFemale: [-0.095, 1.43, 0.032],
    posMale: [-0.108, 1.43, 0.036],
    normal: [-0.55, 0.45, 0.70],
    defaultSide: 'left',
    labelYOffset: -24,
  },

  // 2. TORSO (6 items)
  {
    key: 'shoulder_width',
    label: 'Shoulder width',
    zone: 'Torso',
    posFemale: [0.185, 1.41, 0.028],
    posMale: [0.208, 1.41, 0.032],
    normal: [0.68, 0.32, 0.66],
    defaultSide: 'right',
    labelYOffset: -30,
  },
  {
    key: 'bust_chest',
    label: 'Bust/chest',
    zone: 'Torso',
    posFemale: [0.088, 1.265, 0.145],
    posMale: [0.096, 1.275, 0.128],
    normal: [0.35, 0.05, 0.93],
    defaultSide: 'right',
    labelYOffset: -8,
  },
  {
    key: 'waist_circumference',
    label: 'Waist circumference',
    zone: 'Torso',
    posFemale: [-0.112, 1.085, 0.068],
    posMale: [-0.132, 1.085, 0.074],
    normal: [-0.68, 0.0, 0.73],
    defaultSide: 'left',
    labelYOffset: -16,
  },
  {
    key: 'body_length',
    label: 'Body length',
    zone: 'Torso',
    posFemale: [0.0, 1.24, -0.108],
    posMale: [0.0, 1.24, -0.114],
    normal: [0.0, 0.05, -0.99],
    defaultSide: 'right',
    labelYOffset: 10,
  },
  {
    key: 'front_length',
    label: 'Front length',
    zone: 'Torso',
    posFemale: [-0.035, 1.18, 0.106],
    posMale: [-0.038, 1.18, 0.108],
    normal: [-0.18, 0.0, 0.98],
    defaultSide: 'left',
    labelYOffset: 0,
  },
  {
    key: 'hip_height',
    label: 'Hip Height',
    zone: 'Torso',
    posFemale: [0.165, 0.91, -0.055],
    posMale: [0.158, 0.91, -0.052],
    normal: [0.76, 0.05, -0.65],
    defaultSide: 'right',
    labelYOffset: 0,
  },

  // 3. UPPER LIMB (5 items)
  {
    key: 'armhole',
    label: 'Armhole',
    zone: 'Upper Limb',
    posFemale: [-0.175, 1.365, 0.048],
    posMale: [-0.195, 1.365, 0.052],
    normal: [-0.52, -0.1, 0.85],
    defaultSide: 'left',
    labelYOffset: -14,
  },
  {
    key: 'biceps',
    label: 'Biceps',
    zone: 'Upper Limb',
    posFemale: [0.33, 1.405, 0.042],
    posMale: [0.34, 1.405, 0.048],
    normal: [0.15, 0.25, 0.95],
    defaultSide: 'right',
    labelYOffset: -26,
  },
  {
    key: 'elbow_length',
    label: 'Elbow length',
    zone: 'Upper Limb',
    posFemale: [-0.46, 1.405, 0.038],
    posMale: [-0.47, 1.405, 0.042],
    normal: [-0.15, 0.2, 0.96],
    defaultSide: 'left',
    labelYOffset: 24,
  },
  {
    key: 'sleeve_length',
    label: 'Sleeve length',
    zone: 'Upper Limb',
    posFemale: [0.56, 1.405, 0.034],
    posMale: [0.57, 1.405, 0.038],
    normal: [0.15, 0.25, 0.95],
    defaultSide: 'right',
    labelYOffset: 26,
  },
  {
    key: 'wrist_circumference',
    label: 'Wrist circumference',
    zone: 'Upper Limb',
    posFemale: [0.695, 1.405, 0.028],
    posMale: [0.705, 1.405, 0.032],
    normal: [0.2, 0.3, 0.93],
    defaultSide: 'right',
    labelYOffset: 48,
  },

  // 4. LOWER LIMB (6 items)
  {
    key: 'rise',
    label: 'Rise',
    zone: 'Lower limb',
    posFemale: [0.0, 0.835, 0.092],
    posMale: [0.0, 0.835, 0.095],
    normal: [0.0, -0.1, 0.99],
    defaultSide: 'left',
    labelYOffset: 12,
  },
  {
    key: 'thigh_circumference',
    label: 'Thigh circumference',
    zone: 'Lower limb',
    posFemale: [0.115, 0.695, 0.072],
    posMale: [0.122, 0.695, 0.076],
    normal: [0.45, 0.0, 0.89],
    defaultSide: 'right',
    labelYOffset: 0,
  },
  {
    key: 'thigh_length',
    label: 'Thigh length',
    zone: 'Lower limb',
    posFemale: [-0.115, 0.615, 0.068],
    posMale: [-0.122, 0.615, 0.072],
    normal: [-0.48, 0.0, 0.88],
    defaultSide: 'left',
    labelYOffset: 0,
  },
  {
    key: 'knee_circumference',
    label: 'Knee circumference',
    zone: 'Lower limb',
    posFemale: [0.102, 0.49, 0.056],
    posMale: [0.108, 0.49, 0.060],
    normal: [0.38, 0.0, 0.92],
    defaultSide: 'right',
    labelYOffset: 0,
  },
  {
    key: 'inseam',
    label: 'Inseam',
    zone: 'Lower limb',
    posFemale: [-0.058, 0.39, 0.044],
    posMale: [-0.062, 0.39, 0.048],
    normal: [-0.32, 0.0, 0.95],
    defaultSide: 'left',
    labelYOffset: 14,
  },
  {
    key: 'outseam',
    label: 'Outseam',
    zone: 'Lower limb',
    posFemale: [0.142, 0.32, 0.032],
    posMale: [0.148, 0.32, 0.035],
    normal: [0.75, 0.0, 0.66],
    defaultSide: 'right',
    labelYOffset: 14,
  },
];

const VIEW_BUTTONS: Array<{
  key: 'front' | 'left' | 'back' | 'right';
  label: string;
  angleDeg: MannequinViewAngle;
  angleRad: number;
}> = [
  { key: 'front', label: 'Front', angleDeg: 0, angleRad: 0 },
  { key: 'left', label: 'Left', angleDeg: 270, angleRad: -Math.PI / 2 },
  { key: 'back', label: 'Back', angleDeg: 180, angleRad: Math.PI },
  { key: 'right', label: 'Right', angleDeg: 90, angleRad: Math.PI / 2 },
];

export interface ResolvedHotspotItem {
  hotspot: Hotspot3D;
  displayLabel: string;
  value: number | undefined;
  hasValue: boolean;
  isSelected: boolean;
}

export interface TurntableRigProps {
  gender: MannequinGender;
  onGenderChange?: (gender: MannequinGender) => void;
  showGenderToggle?: boolean;
  resolvedHotspots: ResolvedHotspotItem[];
  unit: 'inches' | 'cm';
  onSelectPoint?: (key: string) => void;
  readOnly?: boolean;
  showControls?: boolean;
  compact?: boolean;
  className?: string;
}

export const TurntableRig: React.FC<TurntableRigProps> = ({
  gender,
  onGenderChange,
  showGenderToggle = false,
  resolvedHotspots,
  unit,
  onSelectPoint,
  readOnly = false,
  showControls = true,
  compact = false,
  className,
}) => {
  const unitSuffix = unit === 'inches' ? 'in' : 'cm';

  // Mutable live config for ?tune=1 panel without causing per-frame React renders
  const cfgRef = useRef<RotationConfig>({
    ...ROTATION,
    snap: { ...ROTATION.snap },
    camera: { ...ROTATION.camera },
  });

  // URL flags (?debug=1 and ?tune=1) checked once on client mount
  const [urlFlags, setUrlFlags] = useState<{ debug: boolean; tune: boolean }>({
    debug: false,
    tune: false,
  });
  const [tuneTick, setTuneTick] = useState(0);
  const [copiedConfig, setCopiedConfig] = useState(false);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const hoveredKeyRef = useRef<string | null>(null);
  useEffect(() => {
    hoveredKeyRef.current = hoveredKey;
    invalidateRef.current?.();
  }, [hoveredKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    setUrlFlags({
      debug: params.get('debug') === '1',
      tune: params.get('tune') === '1',
    });
  }, []);

  // Reduced motion preference
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

  // DOM refs for zero-React-render animation updates
  const viewerRef = useRef<HTMLDivElement | null>(null);
  const canvasHostRef = useRef<HTMLDivElement | null>(null);
  const debugAngleRef = useRef<HTMLSpanElement | null>(null);
  const tuneStatsRef = useRef<HTMLDivElement | null>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Hotspot DOM & SVG refs keyed by landmark key
  const hotspotBtnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const leaderGroupRefs = useRef<Record<string, SVGGElement | null>>({});
  const leaderPolylineRefs = useRef<Record<string, SVGPolylineElement | null>>({});
  const leaderDotRefs = useRef<Record<string, SVGCircleElement | null>>({});
  const labelBadgeRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Keep latest resolvedHotspots in a ref so the rAF loop always reads current items
  const hotspotsRef = useRef<ResolvedHotspotItem[]>(resolvedHotspots);
  useEffect(() => {
    hotspotsRef.current = resolvedHotspots;
    invalidateRef.current?.();
  }, [resolvedHotspots]);

  const genderRef = useRef<MannequinGender>(gender);
  useEffect(() => {
    genderRef.current = gender;
  }, [gender]);

  // Physics state in a single ref — NEVER React state
  const physicsRef = useRef({
    target: 0,           // radians, unbounded
    display: 0,          // radians, unbounded
    dv: { v: 0 },        // SmoothDamp internal velocity
    vel: 0,              // coasting angular velocity (rad/s)
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
    activeButtonKey: 'front' as string | null,
    lastDebugUpdateMs: 0,
    frameTimes: [] as number[],
  });

  const invalidateRef = useRef<(() => void) | null>(null);
  const rebuildModelRef = useRef<((g: MannequinGender) => void) | null>(null);

  // Trigger model rebuild when gender prop changes
  useEffect(() => {
    rebuildModelRef.current?.(gender);
  }, [gender]);

  // Turn to a specific cardinal view along the shortest path
  const turnToAngleRad = useCallback((desiredAngleRad: number) => {
    const s = physicsRef.current;
    s.vel = 0;
    s.dragging = false;
    s.snapping = false;
    s.buttonTurning = true;
    s.target += wrapPi(desiredAngleRad - s.target);
    invalidateRef.current?.();
  }, []);

  // Main Three.js + Physics + Native Input setup
  useEffect(() => {
    const viewer = viewerRef.current;
    const canvasHost = canvasHostRef.current;
    if (!viewer || !canvasHost) return;

    // 1. WebGLRenderer (single fresh canvas per mount so React Strict Mode never loses context)
    canvasHost.innerHTML = '';
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    const canvas = renderer.domElement;
    canvas.className = 'block w-full h-full pointer-events-none';
    canvasHost.appendChild(canvas);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;

    // 2. Scene & Fixed World-Space Studio Lights
    const scene = new THREE.Scene();

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xd9d7d4, 0.5);
    hemiLight.position.set(0, 3, 0);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(-2, 3.2, 3);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(2, 1.2, 2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.7);
    rimLight.position.set(0, 2.5, -3);
    scene.add(rimLight);

    // 3. PerspectiveCamera (22 deg FOV, framed so 1.75m figure fills 92% of height)
    const cfg = cfgRef.current;
    const camera = new THREE.PerspectiveCamera(cfg.camera.fovDeg, 1, 0.5, 25);

    const updateCameraFraming = (width: number, height: number) => {
      const c = cfgRef.current;
      const safeW = Math.max(1, width);
      const safeH = Math.max(1, height);
      const aspect = safeW / safeH;
      camera.fov = c.camera.fovDeg;
      camera.aspect = aspect;
      const fovRad = (c.camera.fovDeg * Math.PI) / 180;
      const visibleH = 1.75 / c.camera.figureFill;
      const distH = (visibleH / 2) / Math.tan(fovRad / 2);
      const visibleW = 1.82 / c.camera.figureFill;
      const distW = (visibleW / 2) / (Math.tan(fovRad / 2) * aspect);
      const dist = Math.max(distH, distW);
      camera.position.set(0, c.camera.lookAtY, dist);
      camera.lookAt(0, c.camera.lookAtY, 0);
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();
    };

    // 4. Rotating Pivot Group & Centered Mannequin Mesh
    const pivot = new THREE.Group();
    pivot.name = 'TurntablePivot';
    scene.add(pivot);

    const material = createMannequinResinMaterial();
    let currentMannequin: THREE.Group | null = null;

    const mountMannequin = (g: MannequinGender) => {
      if (currentMannequin) {
        pivot.remove(currentMannequin);
        currentMannequin.traverse((obj) => {
          if ((obj as THREE.Mesh).isMesh) {
            (obj as THREE.Mesh).geometry.dispose();
          }
        });
      }
      currentMannequin = buildMannequinGroup(g, material);
      // MODEL_YAW_OFFSET = 0 so +Z is Front (0 deg)
      currentMannequin.rotation.y = 0;
      pivot.add(currentMannequin);
    };

    mountMannequin(genderRef.current);

    // Reusable vectors for per-frame 3D -> 2D hotspot projection
    const localPt = new THREE.Vector3();
    const worldPt = new THREE.Vector3();
    const ndcPt = new THREE.Vector3();
    const localNormal = new THREE.Vector3();
    const worldNormal = new THREE.Vector3();
    const viewDir = new THREE.Vector3();
    const normalMatrix = new THREE.Matrix3();

    let widthPx = viewer.clientWidth || 400;
    let heightPx = viewer.clientHeight || 520;
    renderer.setSize(widthPx, heightPx, false);
    updateCameraFraming(widthPx, heightPx);

    // Update active view button classes via DOM ref only when bucket changes
    const syncActiveViewButton = (displayRad: number, force = false) => {
      const s = physicsRef.current;
      const thresholdRad = (12 * Math.PI) / 180;
      let matchedKey: string | null = null;
      for (const btn of VIEW_BUTTONS) {
        if (Math.abs(wrapPi(displayRad - btn.angleRad)) <= thresholdRad) {
          matchedKey = btn.key;
          break;
        }
      }
      if (!force && matchedKey === s.activeButtonKey) return;
      s.activeButtonKey = matchedKey;

      for (const btn of VIEW_BUTTONS) {
        const el = buttonRefs.current[btn.key];
        if (!el) continue;
        const isActive = btn.key === matchedKey;
        el.setAttribute('data-active', isActive ? 'true' : 'false');
        if (isActive) {
          el.className =
            'px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors bg-[#2D1A10] text-white shadow-xs';
        } else {
          el.className =
            'px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors text-[#8C7C68] hover:text-[#1A1A1A] hover:bg-white/60';
        }
      }
    };

    syncActiveViewButton(physicsRef.current.display, true);

    // Project all 3D hotspots in the exact same frame after pivot.updateMatrixWorld()
    const syncHotspotsOverlay = () => {
      pivot.updateMatrixWorld(true);
      normalMatrix.getNormalMatrix(pivot.matrixWorld);

      const items = hotspotsRef.current;
      const g = genderRef.current;
      const hovered = hoveredKeyRef.current;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const { hotspot, isSelected } = item;
        const pos = g === 'male' ? hotspot.posMale : hotspot.posFemale;

        localPt.set(pos[0], pos[1], pos[2]);
        worldPt.copy(localPt).applyMatrix4(pivot.matrixWorld);

        localNormal.set(hotspot.normal[0], hotspot.normal[1], hotspot.normal[2]).normalize();
        worldNormal.copy(localNormal).applyMatrix3(normalMatrix).normalize();

        viewDir.copy(camera.position).sub(worldPt).normalize();
        const facing = worldNormal.dot(viewDir);
        const opacity = smoothstep(0.05, 0.3, facing);

        ndcPt.copy(worldPt).project(camera);
        const screenX = (ndcPt.x * 0.5 + 0.5) * widthPx;
        const screenY = (-ndcPt.y * 0.5 + 0.5) * heightPx;

        const btnEl = hotspotBtnRefs.current[hotspot.key];
        if (btnEl) {
          btnEl.style.transform = `translate3d(${screenX.toFixed(2)}px, ${screenY.toFixed(2)}px, 0)`;
          btnEl.style.opacity = opacity.toFixed(3);
          btnEl.style.pointerEvents = opacity > 0.15 ? 'auto' : 'none';
        }

        const showCallout = (isSelected || hovered === hotspot.key) && opacity > 0.18;
        const leaderGroup = leaderGroupRefs.current[hotspot.key];
        const polylineEl = leaderPolylineRefs.current[hotspot.key];
        const dotEl = leaderDotRefs.current[hotspot.key];
        const badgeEl = labelBadgeRefs.current[hotspot.key];

        if (leaderGroup && polylineEl && dotEl && badgeEl) {
          if (!showCallout) {
            leaderGroup.style.opacity = '0';
            badgeEl.style.opacity = '0';
            badgeEl.style.pointerEvents = 'none';
          } else {
            const isLeft =
              Math.abs(screenX - widthPx * 0.5) > 14
                ? screenX < widthPx * 0.5
                : hotspot.defaultSide === 'left';
            const yOff = (hotspot.labelYOffset ?? 0) * 0.65;
            const elbowX = isLeft ? screenX - 24 : screenX + 24;
            const elbowY = Math.max(24, Math.min(heightPx - 24, screenY + yOff));
            const anchorX = isLeft
              ? Math.max(16, Math.min(screenX - 42, widthPx * 0.22))
              : Math.min(widthPx - 16, Math.max(screenX + 42, widthPx * 0.78));

            polylineEl.setAttribute(
              'points',
              `${screenX.toFixed(1)},${screenY.toFixed(1)} ${elbowX.toFixed(1)},${elbowY.toFixed(1)} ${anchorX.toFixed(1)},${elbowY.toFixed(1)}`
            );
            dotEl.setAttribute('cx', anchorX.toFixed(1));
            dotEl.setAttribute('cy', elbowY.toFixed(1));
            leaderGroup.style.opacity = opacity.toFixed(3);

            badgeEl.style.transform = `translate3d(${anchorX.toFixed(1)}px, ${elbowY.toFixed(1)}px, 0) translate(${isLeft ? '0%' : '-100%'}, -50%)`;
            badgeEl.style.opacity = opacity.toFixed(3);
          }
        }
      }
    };

    // Demand-driven animation loop
    let rafId: number | null = null;
    let isVisible = true;
    let lastTimeMs = performance.now();

    const stepFrame = (nowMs: number) => {
      rafId = null;
      if (!isVisible) return;

      const rawDt = Math.max(0.001, (nowMs - lastTimeMs) / 1000);
      lastTimeMs = nowMs;
      // Clamp dt to Math.min(delta, 0.05) so tab switches never cause jumps
      const dt = Math.min(rawDt, 0.05);

      const s = physicsRef.current;
      const c = cfgRef.current;
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

      pivot.rotation.y = s.display;
      syncHotspotsOverlay();
      syncActiveViewButton(s.display);
      renderer.render(scene, camera);

      // Track frame times for ?tune=1 telemetry
      s.frameTimes.push(rawDt * 1000);
      if (s.frameTimes.length > 60) s.frameTimes.shift();

      // Throttled debug/tune text updates (at most 10 Hz via ref, never React state)
      if (nowMs - s.lastDebugUpdateMs >= 100 || settled) {
        s.lastDebugUpdateMs = nowMs;
        const degNorm = ((((s.display * 180) / Math.PI) % 360) + 360) % 360;
        if (debugAngleRef.current) {
          debugAngleRef.current.textContent = `${Math.round(degNorm) % 360}°`;
        }
        if (tuneStatsRef.current) {
          const avgMs =
            s.frameTimes.length > 0
              ? s.frameTimes.reduce((a, b) => a + b, 0) / s.frameTimes.length
              : 0;
          const fps = avgMs > 0 ? Math.min(120, Math.round(1000 / avgMs)) : 60;
          tuneStatsRef.current.textContent = `FPS: ${fps} | Frame: ${avgMs.toFixed(1)}ms | Vel: ${s.vel.toFixed(2)} rad/s | Angle: ${Math.round(degNorm) % 360}°`;
        }
      }

      if (!settled) {
        rafId = window.requestAnimationFrame(stepFrame);
      }
    };

    const invalidate = () => {
      if (!isVisible) return;
      if (rafId === null) {
        lastTimeMs = performance.now();
        rafId = window.requestAnimationFrame(stepFrame);
      }
    };

    invalidateRef.current = invalidate;
    rebuildModelRef.current = (g: MannequinGender) => {
      mountMannequin(g);
      updateCameraFraming(widthPx, heightPx);
      invalidate();
    };

    // Expose live inspection handle on canvas for Step 4 automated telemetry
    (canvas as unknown as Record<string, unknown>).__turntable = {
      renderer,
      scene,
      camera,
      pivot,
      physics: physicsRef.current,
      config: cfgRef.current,
      invalidate,
      turnToAngleRad,
      getBox3: () => new THREE.Box3().setFromObject(pivot),
    };

    // Render initial frame
    renderer.render(scene, camera);
    syncHotspotsOverlay();

    // 5. ResizeObserver
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const cr = entry.contentRect;
        if (cr.width > 0 && cr.height > 0) {
          widthPx = cr.width;
          heightPx = cr.height;
          renderer.setSize(widthPx, heightPx, false);
          updateCameraFraming(widthPx, heightPx);
          invalidate();
        }
      }
    });
    ro.observe(viewer);

    // 6. IntersectionObserver (pause loop when scrolled out of view)
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        isVisible = entry.isIntersecting;
        if (isVisible) {
          invalidate();
        } else if (rafId !== null) {
          window.cancelAnimationFrame(rafId);
          rafId = null;
        }
      },
      { threshold: 0.01 }
    );
    io.observe(viewer);

    // 7. Native Pointer, Wheel, Keyboard & Double-Click Listeners
    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      // Ignore if target is a button/hotspot control
      const targetEl = e.target as HTMLElement | null;
      if (targetEl?.closest('[data-hotspot-control="true"]')) return;

      const s = physicsRef.current;
      try {
        viewer.setPointerCapture(e.pointerId);
      } catch {
        // Ignore capture errors on synthetic events
      }
      s.dragging = true;
      s.snapping = false;
      s.buttonTurning = false;
      s.vel = 0;
      s.pointerId = e.pointerId;
      s.startX = e.clientX;
      s.startY = e.clientY;
      s.lastX = e.clientX;
      s.startT = performance.now();
      s.moved = 0;
      s.samples = [{ x: e.clientX, t: s.startT }];
      viewer.style.cursor = 'grabbing';
      invalidate();
    };

    const onPointerMove = (e: PointerEvent) => {
      const s = physicsRef.current;
      if (!s.dragging || e.pointerId !== s.pointerId) return;
      const now = performance.now();
      const dx = e.clientX - s.lastX;
      s.lastX = e.clientX;
      s.moved = Math.hypot(e.clientX - s.startX, e.clientY - s.startY);
      s.target += dx * cfgRef.current.radPerPx; // +dx turns front surface right
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
      viewer.style.cursor = 'grab';
      try {
        if (viewer.hasPointerCapture(e.pointerId)) {
          viewer.releasePointerCapture(e.pointerId);
        }
      } catch {
        // Ignore
      }

      const now = performance.now();
      const c = cfgRef.current;
      const reducedMotion = reducedMotionRef.current;

      // Tap detection (< 6px and < 300ms)
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
      if (targetEl?.closest('[data-hotspot-control="true"]')) return;
      turnToAngleRad(0);
    };

    const onWheel = (e: WheelEvent) => {
      // Horizontal trackpad scroll rotates at 0.004 rad/px; vertical scroll is left alone
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 0.5) {
        const s = physicsRef.current;
        s.vel = 0;
        s.snapping = false;
        s.buttonTurning = false;
        s.target += e.deltaX * cfgRef.current.wheelRadPerPx;
        invalidate();
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      const c = cfgRef.current;
      const stepDeg = e.shiftKey ? c.keyStepShiftDeg : c.keyStepDeg;
      const stepRad = (stepDeg * Math.PI) / 180;
      const dir = e.key === 'ArrowRight' ? 1 : -1;
      const s = physicsRef.current;
      s.vel = 0;
      s.snapping = false;
      s.buttonTurning = true;
      s.target += dir * stepRad;
      invalidate();
    };

    viewer.addEventListener('pointerdown', onPointerDown);
    viewer.addEventListener('pointermove', onPointerMove);
    viewer.addEventListener('pointerup', onPointerUp);
    viewer.addEventListener('pointercancel', onPointerUp);
    viewer.addEventListener('lostpointercapture', onPointerUp);
    viewer.addEventListener('dblclick', onDoubleClick);
    viewer.addEventListener('wheel', onWheel, { passive: true });
    viewer.addEventListener('keydown', onKeyDown);

    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      ro.disconnect();
      io.disconnect();
      viewer.removeEventListener('pointerdown', onPointerDown);
      viewer.removeEventListener('pointermove', onPointerMove);
      viewer.removeEventListener('pointerup', onPointerUp);
      viewer.removeEventListener('pointercancel', onPointerUp);
      viewer.removeEventListener('lostpointercapture', onPointerUp);
      viewer.removeEventListener('dblclick', onDoubleClick);
      viewer.removeEventListener('wheel', onWheel);
      viewer.removeEventListener('keydown', onKeyDown);
      if (currentMannequin) {
        currentMannequin.traverse((obj) => {
          if ((obj as THREE.Mesh).isMesh) {
            (obj as THREE.Mesh).geometry.dispose();
          }
        });
      }
      material.dispose();
      renderer.dispose();
      if (canvas.parentNode === canvasHost) {
        canvasHost.removeChild(canvas);
      }
    };
  }, [turnToAngleRad]);

  const updateTuneParam = (updater: (c: RotationConfig) => void) => {
    updater(cfgRef.current);
    setTuneTick((t) => t + 1);
    rebuildModelRef.current?.(genderRef.current);
  };

  const handleCopyConfig = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(JSON.stringify(cfgRef.current, null, 2));
      setCopiedConfig(true);
      setTimeout(() => setCopiedConfig(false), 1800);
    }
  };

  return (
    <div className={cn('relative flex flex-col items-center w-full select-none', className)}>
      {/* Top Toolbar: Gender Toggle + View Switcher (Front / Left / Back / Right) + Optional ?debug=1 Angle Readout */}
      {(showGenderToggle || showControls) && (
        <div className="w-full flex flex-wrap items-center justify-between gap-2 mb-2 px-1 z-10">
          {showGenderToggle && onGenderChange ? (
            <div className="inline-flex bg-[#F2EFE9] p-1 rounded-lg border border-[#E5E0D8]">
              {(['female', 'male'] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => onGenderChange(g)}
                  className={cn(
                    'px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all',
                    gender === g
                      ? 'bg-[#2D1A10] text-white shadow-xs'
                      : 'text-[#8C7C68] hover:text-[#1A1A1A]'
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
          ) : (
            <div />
          )}

          {showControls && (
            <div className="inline-flex items-center gap-1 bg-[#F2EFE9]/90 backdrop-blur-xs p-1 rounded-lg border border-[#E5E0D8]">
              {VIEW_BUTTONS.map((v) => (
                <button
                  key={v.key}
                  ref={(el) => {
                    buttonRefs.current[v.key] = el;
                  }}
                  type="button"
                  onClick={() => turnToAngleRad(v.angleRad)}
                  className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors text-[#8C7C68] hover:text-[#1A1A1A] hover:bg-white/60"
                >
                  {v.label}
                </button>
              ))}
              {urlFlags.debug && (
                <span
                  ref={debugAngleRef}
                  className="px-2 py-0.5 text-[10px] font-mono font-bold text-[#2D1A10] bg-white/80 rounded border border-[#E5E0D8]"
                >
                  0°
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Interactive 3D Turntable Viewer Stage */}
      <div
        ref={viewerRef}
        tabIndex={0}
        role="application"
        aria-label="Mannequin viewer. Drag or use the arrow keys to rotate."
        style={{ touchAction: 'pan-y', cursor: 'grab' }}
        className={cn(
          'relative w-full flex items-center justify-center overflow-hidden rounded-2xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2D1A10]/30',
          compact ? 'h-[360px] max-w-[380px]' : 'h-[480px] sm:h-[540px] max-w-[540px]'
        )}
      >
        {/* Single WebGL Canvas Host */}
        <div
          ref={canvasHostRef}
          className="w-full h-full pointer-events-none"
        />

        {/* SVG Leader Line Overlay (updated directly via DOM refs in rAF) */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
          aria-hidden="true"
        >
          {resolvedHotspots.map(({ hotspot, isSelected }) => (
            <g
              key={`leader-${hotspot.key}`}
              ref={(el) => {
                leaderGroupRefs.current[hotspot.key] = el;
              }}
              style={{ opacity: 0, transition: 'opacity 120ms ease-out' }}
            >
              <polyline
                ref={(el) => {
                  leaderPolylineRefs.current[hotspot.key] = el;
                }}
                fill="none"
                stroke={isSelected ? '#2D1A10' : '#4A3828'}
                strokeWidth={isSelected ? 1.8 : 1.35}
                strokeDasharray="3 3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                ref={(el) => {
                  leaderDotRefs.current[hotspot.key] = el;
                }}
                r={2.5}
                fill={isSelected ? '#2D1A10' : '#4A3828'}
              />
            </g>
          ))}
        </svg>

        {/* Hotspot Rings & Floating Callout Badges (moved per-frame via translate3d refs) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {resolvedHotspots.map(({ hotspot, displayLabel, value, hasValue, isSelected }) => (
            <React.Fragment key={hotspot.key}>
              <button
                ref={(el) => {
                  hotspotBtnRefs.current[hotspot.key] = el;
                }}
                type="button"
                data-hotspot-control="true"
                data-hotspot-key={hotspot.key}
                aria-label={`${displayLabel}${hasValue ? `: ${value} ${unitSuffix}` : ''}`}
                onPointerDown={(e) => {
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!readOnly && onSelectPoint) {
                    onSelectPoint(hotspot.key);
                  }
                }}
                onPointerEnter={() => setHoveredKey(hotspot.key)}
                onPointerLeave={() =>
                  setHoveredKey((prev) => (prev === hotspot.key ? null : prev))
                }
                style={{
                  transform: 'translate3d(-999px, -999px, 0)',
                  opacity: 0,
                }}
                className={cn(
                  'absolute top-0 left-0 -ml-3.5 -mt-3.5 w-7 h-7 rounded-full flex items-center justify-center pointer-events-auto focus:outline-none group',
                  readOnly ? 'cursor-default' : 'cursor-pointer'
                )}
              >
                {/* Outer Halo Ring */}
                <span
                  className={cn(
                    'w-5 h-5 rounded-full border-[1.75px] flex items-center justify-center transition-transform duration-150 group-hover:scale-125',
                    isSelected
                      ? 'border-[#2D1A10] bg-[#2D1A10]/20 scale-125 shadow-sm'
                      : hasValue
                        ? 'border-[#2D1A10] bg-white/75'
                        : 'border-[#5C4938]/85 bg-white/55'
                  )}
                >
                  {/* Inner Center Dot */}
                  <span
                    className={cn(
                      'w-2 h-2 rounded-full transition-colors',
                      isSelected
                        ? 'bg-[#2D1A10]'
                        : hasValue
                          ? 'bg-[#2D1A10]'
                          : 'bg-[#8C7C68]'
                    )}
                  />
                </span>
              </button>

              {/* Floating Pill Callout Label on Hover / Selection */}
              <div
                ref={(el) => {
                  labelBadgeRefs.current[hotspot.key] = el;
                }}
                style={{
                  transform: 'translate3d(-999px, -999px, 0)',
                  opacity: 0,
                }}
                className="absolute top-0 left-0 pointer-events-none z-20 whitespace-nowrap"
              >
                <div
                  className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] shadow-sm',
                    isSelected
                      ? 'bg-[#2D1A10] text-white border-[#2D1A10]'
                      : 'bg-[#FDFBF7]/95 text-[#1A1A1A] border-[#D8D0C5]'
                  )}
                >
                  <span className="font-semibold tracking-tight">{displayLabel}</span>
                  <span
                    className={cn(
                      'font-mono font-bold text-[10px]',
                      isSelected
                        ? 'text-[#E8C89E]'
                        : hasValue
                          ? 'text-[#2D1A10]'
                          : 'text-[#8C7C68]'
                    )}
                  >
                    {hasValue ? `${value} ${unitSuffix}` : 'Set size'}
                  </span>
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Dev Tuning Panel (rendered only when ?tune=1 is in the URL) */}
      {urlFlags.tune && (
        <div
          data-tune-panel="true"
          data-tick={tuneTick}
          className="w-full mt-3 p-3 rounded-xl bg-[#1A1A1A] text-white text-[11px] font-mono space-y-2.5 border border-white/15 shadow-lg z-30"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="font-bold uppercase tracking-wider text-[#C9AB84]">
              Turntable Rig Tuning (?tune=1)
            </span>
            <button
              type="button"
              onClick={handleCopyConfig}
              className="px-2.5 py-1 rounded bg-[#C9AB84] text-[#1A1A1A] font-sans font-bold text-[10px] uppercase tracking-wider hover:bg-[#d8bc96] transition-colors"
            >
              {copiedConfig ? 'Copied!' : 'Copy config'}
            </button>
          </div>

          <div
            ref={tuneStatsRef}
            className="text-[10px] text-emerald-300 bg-black/40 px-2 py-1 rounded"
          >
            FPS: 60 | Frame: 1.2ms | Vel: 0.00 rad/s | Angle: 0°
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <label className="flex flex-col gap-0.5">
              <span className="flex justify-between text-[10px] text-white/80">
                <span>radPerPx</span>
                <span>{cfgRef.current.radPerPx.toFixed(4)}</span>
              </span>
              <input
                type="range"
                min={0.003}
                max={0.025}
                step={0.0005}
                value={cfgRef.current.radPerPx}
                onChange={(e) =>
                  updateTuneParam((c) => {
                    c.radPerPx = parseFloat(e.target.value);
                  })
                }
              />
            </label>

            <label className="flex flex-col gap-0.5">
              <span className="flex justify-between text-[10px] text-white/80">
                <span>friction</span>
                <span>{cfgRef.current.friction.toFixed(2)}</span>
              </span>
              <input
                type="range"
                min={0.5}
                max={8.0}
                step={0.1}
                value={cfgRef.current.friction}
                onChange={(e) =>
                  updateTuneParam((c) => {
                    c.friction = parseFloat(e.target.value);
                  })
                }
              />
            </label>

            <label className="flex flex-col gap-0.5">
              <span className="flex justify-between text-[10px] text-white/80">
                <span>smoothDrag (s)</span>
                <span>{cfgRef.current.smoothDrag.toFixed(3)}</span>
              </span>
              <input
                type="range"
                min={0.01}
                max={0.15}
                step={0.005}
                value={cfgRef.current.smoothDrag}
                onChange={(e) =>
                  updateTuneParam((c) => {
                    c.smoothDrag = parseFloat(e.target.value);
                  })
                }
              />
            </label>

            <label className="flex flex-col gap-0.5">
              <span className="flex justify-between text-[10px] text-white/80">
                <span>smoothSnap (s)</span>
                <span>{cfgRef.current.smoothSnap.toFixed(2)}</span>
              </span>
              <input
                type="range"
                min={0.05}
                max={0.5}
                step={0.01}
                value={cfgRef.current.smoothSnap}
                onChange={(e) =>
                  updateTuneParam((c) => {
                    c.smoothSnap = parseFloat(e.target.value);
                  })
                }
              />
            </label>

            <label className="flex flex-col gap-0.5">
              <span className="flex justify-between text-[10px] text-white/80">
                <span>smoothButton (s)</span>
                <span>{cfgRef.current.smoothButton.toFixed(2)}</span>
              </span>
              <input
                type="range"
                min={0.08}
                max={0.6}
                step={0.01}
                value={cfgRef.current.smoothButton}
                onChange={(e) =>
                  updateTuneParam((c) => {
                    c.smoothButton = parseFloat(e.target.value);
                  })
                }
              />
            </label>

            <label className="flex flex-col gap-0.5">
              <span className="flex justify-between text-[10px] text-white/80">
                <span>snap.radiusDeg</span>
                <span>{cfgRef.current.snap.radiusDeg}°</span>
              </span>
              <input
                type="range"
                min={0}
                max={20}
                step={1}
                value={cfgRef.current.snap.radiusDeg}
                onChange={(e) =>
                  updateTuneParam((c) => {
                    c.snap.radiusDeg = parseFloat(e.target.value);
                  })
                }
              />
            </label>

            <label className="flex flex-col gap-0.5">
              <span className="flex justify-between text-[10px] text-white/80">
                <span>flingGain</span>
                <span>{cfgRef.current.flingGain.toFixed(2)}</span>
              </span>
              <input
                type="range"
                min={0.2}
                max={2.5}
                step={0.05}
                value={cfgRef.current.flingGain}
                onChange={(e) =>
                  updateTuneParam((c) => {
                    c.flingGain = parseFloat(e.target.value);
                  })
                }
              />
            </label>

            <label className="flex flex-col gap-0.5">
              <span className="flex justify-between text-[10px] text-white/80">
                <span>fovDeg</span>
                <span>{cfgRef.current.camera.fovDeg}°</span>
              </span>
              <input
                type="range"
                min={14}
                max={45}
                step={1}
                value={cfgRef.current.camera.fovDeg}
                onChange={(e) =>
                  updateTuneParam((c) => {
                    c.camera.fovDeg = parseFloat(e.target.value);
                  })
                }
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

export default TurntableRig;
