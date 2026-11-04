import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, Play, RotateCcw, Compass, Check, X, ArrowRight } from 'lucide-react';
import { useStore } from '@/lib/store';
import { useTour } from './TourProvider';
import { cn } from '@/lib/utils';

export function HelpMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [showMeasurementHelp, setShowMeasurementHelp] = useState(false);
  const [nonOverviewNotice, setNonOverviewNotice] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { activeScreen } = useStore();
  const {
    status,
    contextualTipsEnabled,
    startTour,
    resumeTour,
    setTipsEnabled,
  } = useTour();

  const isOverview =
    activeScreen === 'overview' ||
    activeScreen === 'dashboard' ||
    activeScreen === 'new-measurement' ||
    activeScreen === 'edit-measurement';

  // Close dropdown on outside click or Escape
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setNonOverviewNotice(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setNonOverviewNotice(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleStartTourClick = () => {
    if (!isOverview) {
      setNonOverviewNotice(true);
      return;
    }
    setIsOpen(false);
    startTour();
  };

  const handleResumeTourClick = () => {
    if (!isOverview) {
      setNonOverviewNotice(true);
      return;
    }
    setIsOpen(false);
    resumeTour();
  };

  return (
    <>
      <div ref={containerRef} className="relative">
        <button
          type="button"
          aria-label="Help and tours"
          aria-expanded={isOpen}
          aria-haspopup="menu"
          onClick={() => {
            setIsOpen(!isOpen);
            setNonOverviewNotice(false);
          }}
          className={cn(
            'w-10 h-10 rounded-full bg-white flex items-center justify-center p-2 text-black cursor-pointer select-none transition-colors hover:bg-neutral-100',
            isOpen && 'bg-neutral-100'
          )}
        >
          <HelpCircle className="w-5 h-5 text-black" />
        </button>

        {isOpen && (
          <div
            role="menu"
            aria-label="Help and tours options"
            className="absolute right-0 top-12 z-50 w-72 bg-white rounded-[12px] p-2 shadow-xl border border-[var(--outline)] flex flex-col gap-1 text-black select-none"
          >
            <div className="px-3 py-1.5 border-b border-[var(--outline)]">
              <span className="text-[11px] font-bold text-[var(--muted)] tracking-wider uppercase">
                Studio Help &amp; Guides
              </span>
            </div>

            {nonOverviewNotice && (
              <div
                role="status"
                className="mx-1 my-1 p-2.5 rounded-[8px] bg-amber-50 border border-amber-200 text-amber-900 text-[12px] leading-snug flex flex-col gap-1.5"
              >
                <span>
                  Return to Overview to take the tour. Your current work will stay where it is.
                </span>
                <button
                  type="button"
                  onClick={() => setNonOverviewNotice(false)}
                  className="self-end text-[11px] font-semibold text-amber-950 underline cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Item 1: Take the quick tour */}
            <button
              type="button"
              role="menuitem"
              onClick={handleStartTourClick}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-black rounded-[8px] hover:bg-neutral-100 transition-colors cursor-pointer text-left"
            >
              <Play className="w-4 h-4 text-[var(--primary)] shrink-0" />
              <span>Take the quick tour</span>
            </button>

            {/* Item 2: Resume tour (only if interrupted) */}
            {status === 'interrupted' && (
              <button
                type="button"
                role="menuitem"
                onClick={handleResumeTourClick}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-black rounded-[8px] hover:bg-neutral-100 transition-colors cursor-pointer text-left"
              >
                <RotateCcw className="w-4 h-4 text-[var(--primary)] shrink-0" />
                <span>Resume tour</span>
              </button>
            )}

            {/* Item 3: Measurement help */}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setIsOpen(false);
                setShowMeasurementHelp(true);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-black rounded-[8px] hover:bg-neutral-100 transition-colors cursor-pointer text-left"
            >
              <Compass className="w-4 h-4 text-[var(--muted)] shrink-0" />
              <span>Measurement help</span>
            </button>

            <div className="my-1 border-t border-[var(--outline)]" />

            {/* Item 4: Show contextual tips toggle */}
            <label className="flex items-center justify-between px-3 py-2 rounded-[8px] hover:bg-neutral-50 transition-colors cursor-pointer">
              <span className="text-[13px] font-medium text-black">
                Show contextual tips
              </span>
              <input
                type="checkbox"
                aria-label="Show contextual tips"
                checked={contextualTipsEnabled}
                onChange={(e) => setTipsEnabled(e.target.checked)}
                className="w-4 h-4 text-[var(--primary)] rounded border-gray-300 focus:ring-[var(--primary)] cursor-pointer"
              />
            </label>
          </div>
        )}
      </div>

      {/* Measurement Help Modal */}
      {showMeasurementHelp && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="measurement-help-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs"
        >
          <div className="w-full max-w-md bg-white rounded-[16px] p-5 shadow-2xl border border-[var(--outline)] flex flex-col gap-4 text-black">
            <div className="flex items-start justify-between">
              <div>
                <h3 id="measurement-help-title" className="text-[16px] font-bold text-black">
                  Studio Measurement Guide
                </h3>
                <p className="text-[12px] text-[var(--text-2)] mt-0.5">
                  How to interact with mannequin sizing and fitting points
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowMeasurementHelp(false)}
                aria-label="Close measurement help"
                className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--muted)] hover:text-black hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-[13px] text-[var(--text-2)] leading-relaxed">
              <div className="p-3 bg-[#F8F8F8] rounded-[8px] border border-[#EDEDED]">
                <strong className="text-black font-semibold block mb-0.5">
                  1. 360° Turntable Rotation
                </strong>
                Click and drag the mannequin horizontally to inspect any angle. You can also focus the mannequin and use the{' '}
                <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-[11px] font-mono text-black">Left</kbd>{' '}
                and{' '}
                <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-[11px] font-mono text-black">Right</kbd>{' '}
                arrow keys, or click Front, Left, Back, Right buttons.
              </div>

              <div className="p-3 bg-[#F8F8F8] rounded-[8px] border border-[#EDEDED]">
                <strong className="text-black font-semibold block mb-0.5">
                  2. Interactive Touchpoints
                </strong>
                Hover over blue circular pins to see animated dotted leader lines with anatomical labels. Click any point to open its precise measurement value entry modal.
              </div>

              <div className="p-3 bg-[#F8F8F8] rounded-[8px] border border-[#EDEDED]">
                <strong className="text-black font-semibold block mb-0.5">
                  3. Garment Templates &amp; List View
                </strong>
                Use &ldquo;Choose Template&rdquo; to load standardized measurement sets (e.g. Bespoke Suit, Evening Gown). Switch to &ldquo;List&rdquo; view to enter all values sequentially with Tab navigation.
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[var(--outline)]">
              <button
                type="button"
                onClick={() => setShowMeasurementHelp(false)}
                className="px-5 py-2 text-[13px] font-semibold bg-[var(--primary)] text-white rounded-full hover:opacity-95 shadow-xs transition-opacity cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
