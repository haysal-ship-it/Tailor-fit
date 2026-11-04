import React, { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { TourStepDefinition } from '@/lib/onboarding/steps';
import {
  waitForVisibleTarget,
  measureTargetRect,
  scrollTargetIntoSafeView,
  computeCardPlacement,
  TargetRect,
  CardPlacement,
} from '@/lib/onboarding/targets';
import { TourCard } from './TourCard';

interface TourOverlayProps {
  step: TourStepDefinition | null;
  isOpen: boolean;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onFinish: () => void;
  onClose: () => void;
}

export function TourOverlay({
  step,
  isOpen,
  onNext,
  onPrev,
  onSkip,
  onFinish,
  onClose,
}: TourOverlayProps) {
  const [mounted, setMounted] = useState(false);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [isTargetMissing, setIsTargetMissing] = useState(false);
  const [placement, setPlacement] = useState<CardPlacement>({ mode: 'centered' });

  const activeElementOnOpenRef = useRef<HTMLElement | null>(null);
  const scrollPositionOnOpenRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const rafIdRef = useRef<number | null>(null);
  const currentStepIdRef = useRef<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Remember activeElement and scroll position on tour open; restore on exit
  useEffect(() => {
    if (isOpen) {
      if (typeof document !== 'undefined') {
        activeElementOnOpenRef.current = document.activeElement as HTMLElement | null;
        scrollPositionOnOpenRef.current = {
          x: window.scrollX,
          y: window.scrollY,
        };
      }
    } else {
      if (activeElementOnOpenRef.current && typeof activeElementOnOpenRef.current.focus === 'function') {
        try {
          activeElementOnOpenRef.current.focus();
        } catch {
          // ignore focus errors
        }
      }
    }
  }, [isOpen]);

  // Recalculate target rect and card placement
  const updateGeometry = useCallback((targetEl: HTMLElement | null) => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }

    rafIdRef.current = requestAnimationFrame(() => {
      if (!targetEl || !targetEl.isConnected) {
        setTargetRect(null);
        setPlacement(computeCardPlacement(null));
        return;
      }

      const rect = measureTargetRect(targetEl, 8);
      setTargetRect(rect);
      const computed = computeCardPlacement(rect, 320, 260, step?.preferredPlacement);
      setPlacement(computed);
    });
  }, [step?.preferredPlacement]);

  // When step changes, find target, scroll if needed, and measure
  useEffect(() => {
    if (!isOpen || !step) {
      setTargetRect(null);
      setIsTargetMissing(false);
      return;
    }

    currentStepIdRef.current = step.id;
    setIsTargetMissing(false);
    let isCancelled = false;

    waitForVisibleTarget(step.targetKey, 2000).then((targetEl) => {
      if (isCancelled || currentStepIdRef.current !== step.id) return;

      if (!targetEl) {
        setIsTargetMissing(true);
        setTargetRect(null);
        setPlacement(computeCardPlacement(null));
        return;
      }

      // Safely scroll target into view
      scrollTargetIntoSafeView(targetEl);

      // Wait a frame for smooth scroll to initiate before measuring
      setTimeout(() => {
        if (!isCancelled && currentStepIdRef.current === step.id) {
          updateGeometry(targetEl);
        }
      }, 100);
    });

    return () => {
      isCancelled = true;
    };
  }, [isOpen, step, updateGeometry]);

  // Window resize and scroll listener to update spotlight position dynamically
  useEffect(() => {
    if (!isOpen || !step) return;

    let targetEl: HTMLElement | null = null;

    const handleUpdate = () => {
      if (!targetEl || !targetEl.isConnected) {
        waitForVisibleTarget(step.targetKey, 500).then((found) => {
          targetEl = found;
          updateGeometry(found);
        });
      } else {
        updateGeometry(targetEl);
      }
    };

    window.addEventListener('resize', handleUpdate, { passive: true });
    window.addEventListener('scroll', handleUpdate, { passive: true });

    return () => {
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate);
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [isOpen, step, updateGeometry]);

  // Keyboard navigation & trap
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      // Trap Tab focus inside the tour overlay
      if (e.key === 'Tab') {
        const dialog = document.getElementById('tour-overlay-dialog');
        if (!dialog) return;

        const focusable = dialog.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!mounted || !isOpen || !step) return null;

  const isSheet = placement.mode === 'sheet-bottom' || placement.mode === 'sheet-top';

  return createPortal(
    <div
      id="tour-overlay-host"
      className="fixed inset-0 z-[9999] pointer-events-auto select-none"
      style={{ isolation: 'isolate' }}
    >
      {/* SVG Mask Backdrop with Clean Spotlight Cutout */}
      <svg
        className="fixed inset-0 w-full h-full pointer-events-auto"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100vw', height: '100vh' }}
        aria-hidden="true"
      >
        <defs>
          <mask id="tour-spotlight-mask">
            {/* White covers entire screen (opaque) */}
            <rect x="0" y="0" width="100%" height="100%" fill="#ffffff" />
            {/* Black cuts out the spotlight area around target (transparent) */}
            {targetRect && (
              <rect
                x={targetRect.x}
                y={targetRect.y}
                width={targetRect.width}
                height={targetRect.height}
                rx={targetRect.radius}
                ry={targetRect.radius}
                fill="#000000"
              />
            )}
          </mask>
        </defs>

        {/* Semi-transparent Dim Backdrop (32% black, no blur) */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="#000000"
          fillOpacity="0.32"
          mask="url(#tour-spotlight-mask)"
        />

        {/* Clear Highlight Outline around Spotlight Cutout */}
        {targetRect && (
          <rect
            x={targetRect.x}
            y={targetRect.y}
            width={targetRect.width}
            height={targetRect.height}
            rx={targetRect.radius}
            ry={targetRect.radius}
            fill="none"
            stroke="#1D49E8"
            strokeWidth="2.5"
            strokeOpacity="0.85"
            className="transition-all duration-150"
          />
        )}
      </svg>

      {/* Floating Card or Mobile Sheet Container */}
      <div
        id="tour-overlay-dialog"
        className="fixed z-[10000] pointer-events-auto transition-all duration-150"
        style={{
          top: placement.top !== undefined ? `${placement.top}px` : undefined,
          bottom: placement.bottom !== undefined ? `${placement.bottom}px` : undefined,
          left: placement.left !== undefined ? `${placement.left}px` : undefined,
          width: placement.width !== undefined ? `${placement.width}px` : 'auto',
          maxWidth: isSheet ? 'calc(100vw - 32px)' : '320px',
        }}
      >
        <TourCard
          step={step}
          isMissingTarget={isTargetMissing}
          onNext={onNext}
          onPrev={onPrev}
          onSkip={onSkip}
          onFinish={onFinish}
          onClose={onClose}
          isSheet={isSheet}
        />
      </div>
    </div>,
    document.body
  );
}
