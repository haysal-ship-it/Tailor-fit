import React from 'react';
import { Lightbulb, X } from 'lucide-react';
import { useTour } from './TourProvider';
import { cn } from '@/lib/utils';

export type ContextualTipId =
  | 'template-fields'
  | 'viewer-rotate'
  | 'measurement-unit'
  | 'measurement-list'
  | 'order-saved'
  | 'reuse-fitting'
  | 'calendar-dates'
  | 'settings-defaults';

interface ContextualTipProps {
  id: ContextualTipId;
  text?: string;
  className?: string;
  variant?: 'banner' | 'inline' | 'compact';
}

const DEFAULT_TIP_TEXTS: Record<ContextualTipId, string> = {
  'template-fields':
    'Templates choose the measurement fields for a garment. Your client’s values are entered separately.',
  'viewer-rotate':
    'Drag to rotate. You can also focus the viewer and use the Left and Right arrow keys.',
  'measurement-unit':
    'Enter the value in {unit}. Use the same unit throughout this fitting.',
  'measurement-list':
    'Use Tab to move between measurements.',
  'order-saved':
    'Find this order and its measurements in Clients.',
  'reuse-fitting':
    'Create a new order from these measurements when the client returns.',
  'calendar-dates':
    'Orders with a due date appear here. Select a date to review them.',
  'settings-defaults':
    'Choose defaults for new work and manage your garment templates.',
};

export function ContextualTip({
  id,
  text,
  className,
  variant = 'banner',
}: ContextualTipProps) {
  const {
    contextualTipsEnabled,
    acknowledgedTipIds,
    hasActiveBlocker,
    isTourRunning,
    acknowledgeTip,
  } = useTour();

  // If tips disabled globally, already acknowledged, tour running, or blocker active, don't show
  if (!contextualTipsEnabled || acknowledgedTipIds.includes(id) || isTourRunning || hasActiveBlocker) {
    return null;
  }

  const displayText = text || DEFAULT_TIP_TEXTS[id];

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    acknowledgeTip(id);
  };

  if (variant === 'compact') {
    return (
      <div
        role="status"
        aria-live="polite"
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-900 rounded-full text-[11px] font-medium select-none',
          className
        )}
      >
        <Lightbulb className="w-3 h-3 text-[var(--primary)] shrink-0" />
        <span>{displayText}</span>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label={`Dismiss ${id} tip`}
          className="w-4 h-4 rounded-full flex items-center justify-center text-blue-700 hover:text-blue-950 hover:bg-blue-100 transition-colors cursor-pointer shrink-0 ml-0.5"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div
        role="status"
        aria-live="polite"
        className={cn(
          'flex items-start gap-2 p-2.5 bg-blue-50/70 border border-blue-200/80 rounded-[8px] text-[12px] text-blue-950 select-none leading-relaxed',
          className
        )}
      >
        <Lightbulb className="w-3.5 h-3.5 text-[var(--primary)] shrink-0 mt-0.5" />
        <span className="flex-1">{displayText}</span>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label={`Dismiss tip`}
          className="w-5 h-5 rounded-full flex items-center justify-center text-blue-700 hover:text-blue-950 hover:bg-blue-100 transition-colors cursor-pointer shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'w-full flex items-center justify-between gap-3 p-3 bg-blue-50 border border-blue-200 text-blue-950 rounded-[10px] text-[12px] shadow-2xs select-none',
        className
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-6 h-6 rounded-full bg-blue-100 text-[var(--primary)] flex items-center justify-center shrink-0">
          <Lightbulb className="w-3.5 h-3.5" />
        </div>
        <span className="leading-snug">{displayText}</span>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label={`Dismiss tip`}
        className="w-6 h-6 rounded-full flex items-center justify-center text-blue-700 hover:text-blue-950 hover:bg-blue-100 transition-colors cursor-pointer shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
