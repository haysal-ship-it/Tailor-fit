'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { createReferenceMaterial, createClayMaterial } from '@/lib/mannequin/reference-material';
import { buildReferenceMannequin } from '@/lib/mannequin/reference-geometry';
import { wrapPi, smoothDamp, estimateReleaseVelocity } from '@/lib/rotation-math';

const RAD_PER_PX = 0.008;
const FRICTION = 3.2; // 1/s exponential damping constant k
const STOP_SPEED = 0.03; // rad/s
const MAX_SPEED = 16.0; // rad/s
const PROGRAMMATIC_SMOOTH = 0.28; // seconds critically damped duration

export default function ReconstructionPreview() {
  const host = useRef<HTMLDivElement>(null);
  const [gender, setGender] = useState<'female' | 'male'>('female');
  const [view, setView] = useState<'front' | 'right' | 'back' | 'left'>('front');
  const [surface, setSurface] = useState<'reference' | 'clay'>('reference');
  const [degrees, setDegrees] = useState(0);

  // Controller interaction hooks exposed to UI buttons
  const turnToAngleRef = useRef<(target: number) => void>(() => {});

  useEffect(() => {
    const target = host.current;
    if (!target) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.toneMapping = THREE.NoToneMapping;
    target.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    // Calibrated studio lighting: Hemisphere 1.6 + Key 2.2 at (1.5, 3.5, 3.5)
    // Ensures clay diffuse reaches ~(176, 149, 118) on front, matching the reference photos
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x8a755c, 1.6);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(1.5, 3.5, 3.5);
    scene.add(keyLight);

    // Subtle soft circular contact shadow under the feet at y=0.001
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const shadowCtx = shadowCanvas.getContext('2d');
    if (shadowCtx) {
      const grad = shadowCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
      grad.addColorStop(0, 'rgba(40, 30, 20, 0.40)');
      grad.addColorStop(0.35, 'rgba(40, 30, 20, 0.22)');
      grad.addColorStop(0.7, 'rgba(40, 30, 20, 0.06)');
      grad.addColorStop(1.0, 'rgba(40, 30, 20, 0.0)');
      shadowCtx.fillStyle = grad;
      shadowCtx.fillRect(0, 0, 128, 128);
    }
    const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
    const shadowGeo = new THREE.PlaneGeometry(0.75, 0.75);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      depthWrite: false,
    });
    const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
    contactShadow.position.set(0, 0.001, 0);
    scene.add(contactShadow);

    const textures = ['front', 'back', 'left', 'right'].map((v) => {
      const texture = new THREE.TextureLoader().load(
        `/assets/reconstruction/${gender}-${v}-surface.png`
      );
      texture.colorSpace = THREE.SRGBColorSpace;
      return texture;
    });

    const material =
      surface === 'reference'
        ? createReferenceMaterial(textures)
        : createClayMaterial();

    const modelRoot = new THREE.Group();
    modelRoot.name = 'mannequin-root';
    scene.add(modelRoot);

    const gltfLoader = new GLTFLoader();
    gltfLoader.load(
      `/assets/reconstruction/${gender}-mannequin.glb`,
      (gltf) => {
        gltf.scene.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            (child as THREE.Mesh).material = material;
          }
        });
        modelRoot.clear();
        modelRoot.add(gltf.scene);
        renderer.render(scene, camera);
        wakeRenderer();
      },
      undefined,
      (err) => {
        console.warn('GLB load error, falling back to procedural generation:', err);
        const fallback = buildReferenceMannequin(gender, material);
        modelRoot.clear();
        modelRoot.add(fallback);
        renderer.render(scene, camera);
        wakeRenderer();
      }
    );

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 20);
    camera.position.set(0, 0.875, 5);
    camera.lookAt(0, 0.875, 0);

    // Physics & controller state (kept in local scope to avoid per-frame React re-renders)
    let currentAngle = 0; // continuous unwrapped radians
    let velocity = 0; // rad/s
    let isDragging = false;
    let isCoasting = false;
    let isProgrammatic = false;
    let programmaticTarget = 0;
    const programmaticVel = { v: 0 };

    let pointerSamples: Array<{ x: number; t: number }> = [];
    let previousX = 0;
    let activePointerId: number | null = null;

    let lastTime = performance.now();
    let frameId = 0;
    let isIdle = false;

    // View synchronizer (normalizes to 0..2PI and detects quadrant)
    const syncView = (angleRad: number) => {
      const wrapped = ((angleRad % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      const deg = Math.round((wrapped * 180) / Math.PI) % 360;
      setDegrees(deg);

      // Cardinal quadrants:
      // Front: [7PI/4, 2PI) or [0, PI/4)
      // Right: [PI/4, 3PI/4)
      // Back:  [3PI/4, 5PI/4)
      // Left:  [5PI/4, 7PI/4)
      if (wrapped >= (7 * Math.PI) / 4 || wrapped < Math.PI / 4) {
        setView('front');
      } else if (wrapped >= Math.PI / 4 && wrapped < (3 * Math.PI) / 4) {
        setView('right');
      } else if (wrapped >= (3 * Math.PI) / 4 && wrapped < (5 * Math.PI) / 4) {
        setView('back');
      } else {
        setView('left');
      }
    };

    // RAF loop
    const renderLoop = (now: number) => {
      const rawDt = (now - lastTime) / 1000;
      const dt = Math.min(rawDt, 0.05); // cap at 50ms to prevent jumps on tab resume
      lastTime = now;

      let activeMotion = false;

      if (isDragging) {
        activeMotion = true;
      } else if (isProgrammatic) {
        currentAngle = smoothDamp(
          currentAngle,
          programmaticTarget,
          programmaticVel,
          PROGRAMMATIC_SMOOTH,
          dt
        );
        if (
          Math.abs(currentAngle - programmaticTarget) < 0.001 &&
          Math.abs(programmaticVel.v) < 0.01
        ) {
          currentAngle = programmaticTarget;
          isProgrammatic = false;
          programmaticVel.v = 0;
        }
        activeMotion = true;
      } else if (isCoasting) {
        const q = Math.exp(-FRICTION * dt);
        currentAngle += (velocity * (1 - q)) / FRICTION;
        velocity *= q;

        if (Math.abs(velocity) < STOP_SPEED) {
          velocity = 0;
          isCoasting = false;
        }
        activeMotion = true;
      }

      modelRoot.rotation.y = currentAngle;
      renderer.render(scene, camera);
      syncView(currentAngle);

      if (activeMotion) {
        isIdle = false;
        frameId = requestAnimationFrame(renderLoop);
      } else {
        isIdle = true;
        frameId = 0;
      }
    };

    const wakeRenderer = () => {
      lastTime = performance.now();
      if (frameId === 0 || isIdle) {
        isIdle = false;
        frameId = requestAnimationFrame(renderLoop);
      }
    };

    // Public programmatic turn handler (Front, Right, Back, Left)
    turnToAngleRef.current = (desiredTarget: number) => {
      const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReduced) {
        currentAngle = desiredTarget;
        velocity = 0;
        isCoasting = false;
        isProgrammatic = false;
        modelRoot.rotation.y = currentAngle;
        renderer.render(scene, camera);
        syncView(currentAngle);
        return;
      }

      // Shortest path interpolation from current angle
      programmaticTarget = currentAngle + wrapPi(desiredTarget - currentAngle);
      programmaticVel.v = velocity; // preserve existing inertia direction
      velocity = 0;
      isCoasting = false;
      isProgrammatic = true;
      wakeRenderer();
    };

    const resize = new ResizeObserver(() => {
      const w = target.clientWidth;
      const h = target.clientHeight;
      if (w === 0 || h === 0) return;
      renderer.setSize(w, h);
      // Framing matching a 636x730 reference image with object-fit: contain
      const halfHeight = Math.max(730 / 2, (636 * h) / w / 2) * (1.75 / 660);
      camera.left = (-halfHeight * w) / h;
      camera.right = (halfHeight * w) / h;
      camera.top = halfHeight;
      camera.bottom = -halfHeight;
      camera.position.y = (715 - 365) * (1.75 / 660);
      camera.lookAt(0, camera.position.y, 0);
      camera.updateProjectionMatrix();

      modelRoot.rotation.y = currentAngle;
      renderer.render(scene, camera);
    });
    resize.observe(target);

    // Pointer events
    const onPointerDown = (e: PointerEvent) => {
      if (!e.isPrimary || e.button !== 0) return;
      try {
        target.setPointerCapture(e.pointerId);
      } catch {}
      activePointerId = e.pointerId;
      isDragging = true;
      isCoasting = false;
      isProgrammatic = false;
      velocity = 0;
      programmaticVel.v = 0;
      previousX = e.clientX;

      const now = performance.now();
      pointerSamples = [{ x: e.clientX, t: now }];
      wakeRenderer();
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging || e.pointerId !== activePointerId) return;
      const dx = e.clientX - previousX;
      previousX = e.clientX;

      currentAngle += dx * RAD_PER_PX;
      pointerSamples.push({ x: e.clientX, t: performance.now() });
      if (pointerSamples.length > 25) pointerSamples.shift();
      wakeRenderer();
    };

    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerId !== activePointerId) return;
      if (target.hasPointerCapture(e.pointerId)) {
        try {
          target.releasePointerCapture(e.pointerId);
        } catch {}
      }
      activePointerId = null;
      isDragging = false;

      const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (e.type !== 'pointerup' || prefersReduced) {
        velocity = 0;
        isCoasting = false;
        return;
      }

      const now = performance.now();
      const releaseVel = estimateReleaseVelocity(pointerSamples, now, {
        staleRelease: 0.06,
        velocityWindow: 0.09,
        radPerPx: RAD_PER_PX,
        flingGain: 1.0,
        maxSpeed: MAX_SPEED,
      });

      if (Math.abs(releaseVel) >= STOP_SPEED) {
        velocity = releaseVel;
        isCoasting = true;
        wakeRenderer();
      } else {
        velocity = 0;
        isCoasting = false;
      }
    };

    const onCancel = () => {
      if (isDragging && activePointerId !== null) {
        try {
          target.releasePointerCapture(activePointerId);
        } catch {}
      }
      activePointerId = null;
      isDragging = false;
      velocity = 0;
      isCoasting = false;
      isProgrammatic = false;
    };

    // Keyboard navigation (Arrow keys with visible focus)
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        const step = (e.shiftKey ? 15 : 5) * (Math.PI / 180);
        const delta = e.key === 'ArrowLeft' ? -step : step;

        currentAngle += delta;
        velocity = 0;
        isCoasting = false;
        isProgrammatic = false;
        wakeRenderer();
      }
    };

    target.addEventListener('pointerdown', onPointerDown);
    target.addEventListener('pointermove', onPointerMove);
    target.addEventListener('pointerup', onPointerUp);
    target.addEventListener('pointercancel', onPointerUp);
    target.addEventListener('lostpointercapture', onCancel);
    target.addEventListener('keydown', onKeyDown);
    window.addEventListener('blur', onCancel);
    document.addEventListener('visibilitychange', onCancel);

    // Initial frame kick
    frameId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(frameId);
      resize.disconnect();
      target.removeEventListener('pointerdown', onPointerDown);
      target.removeEventListener('pointermove', onPointerMove);
      target.removeEventListener('pointerup', onPointerUp);
      target.removeEventListener('pointercancel', onPointerUp);
      target.removeEventListener('lostpointercapture', onCancel);
      target.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('blur', onCancel);
      document.removeEventListener('visibilitychange', onCancel);

      modelRoot.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (!Array.isArray(obj.material)) obj.material.dispose();
        }
      });
      textures.forEach((t) => t.dispose());
      contactShadow.geometry.dispose();
      if (!Array.isArray(contactShadow.material)) contactShadow.material.dispose();
      shadowTexture.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [gender, surface]);

  return (
    <main style={{ padding: 24, background: '#eeedeb', minHeight: '100vh', color: '#25221e' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0 }}>Mannequin reconstruction study</h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: '#666' }}>
            Continuous body reconstruction with reference-derived surface detail. Drag to turn smoothly, or use cardinal view presets.
          </p>
        </div>
        <div style={{ padding: '6px 12px', background: '#fff', borderRadius: 20, border: '1px solid #d5d3ce', fontSize: 13, fontWeight: 500 }}>
          Yaw: {degrees}° · Active quadrant: <strong style={{ textTransform: 'capitalize' }}>{view}</strong>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, margin: '20px 0', flexWrap: 'wrap' }}>
        <button
          onClick={() => setGender(gender === 'female' ? 'male' : 'female')}
          style={{ padding: '8px 16px', borderRadius: 20, border: '1px solid #c5c3be', background: '#fff', cursor: 'pointer', fontWeight: 600 }}
        >
          {gender === 'female' ? 'Switch to male' : 'Switch to female'}
        </button>

        <div style={{ display: 'inline-flex', background: '#e0ded9', borderRadius: 20, padding: 2, gap: 2 }}>
          {[
            { label: 'Front', rad: 0 },
            { label: 'Right', rad: Math.PI / 2 },
            { label: 'Back', rad: Math.PI },
            { label: 'Left', rad: (3 * Math.PI) / 2 },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => turnToAngleRef.current(item.rad)}
              style={{
                padding: '6px 14px',
                borderRadius: 18,
                border: 'none',
                background: view === item.label.toLowerCase() ? '#25221e' : 'transparent',
                color: view === item.label.toLowerCase() ? '#fff' : '#25221e',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: 13,
                transition: 'all 0.15s ease',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setSurface(surface === 'reference' ? 'clay' : 'reference')}
          style={{
            padding: '8px 16px',
            borderRadius: 20,
            border: '1px solid #c5c3be',
            background: surface === 'clay' ? '#b09576' : '#fff',
            color: surface === 'clay' ? '#fff' : '#25221e',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          {surface === 'reference' ? 'Inspect untextured clay' : 'Show reference surface'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
        <section style={{ background: '#fff', borderRadius: 12, padding: 16, border: '1px solid #dedcd7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Original reference</h2>
            <span style={{ fontSize: 12, color: '#888' }}>
              636×730 · {gender} {view}
            </span>
          </div>
          <Image
            unoptimized
            width={636}
            height={730}
            src={`/assets/mannequin-${gender}-${view}.png`}
            alt={`Original ${gender} mannequin ${view} reference`}
            style={{ width: '100%', height: 'min(620px, calc(100dvh - 220px))', objectFit: 'contain' }}
          />
        </section>

        <section style={{ background: '#fff', borderRadius: 12, padding: 16, border: '1px solid #dedcd7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Reconstructed geometry</h2>
            <span style={{ fontSize: 12, color: '#888' }}>
              Drag to turn · Arrow keys to rotate
            </span>
          </div>
          <div
            ref={host}
            tabIndex={0}
            aria-label="3D mannequin model preview canvas. Use drag or arrow keys to rotate."
            style={{
              height: 'min(620px, calc(100dvh - 220px))',
              width: '100%',
              touchAction: 'pan-y',
              cursor: 'grab',
              outline: 'none',
              borderRadius: 8,
              background: '#f9f9f8',
            }}
          />
        </section>
      </div>
    </main>
  );
}
