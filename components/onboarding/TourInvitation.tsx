import React from 'react';
import { Sparkles, ArrowRight, X, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TourInvitationProps {
  onStart: () => void;
  onDismiss: () => void;
  className?: string;
}

export function TourInvitation({
  onStart,
  onDismiss,
  className,
}: TourInvitationProps) {
  return (
    <div
      role="region"
      aria-label="Product tour invitation"
      className={cn(
        'w-full bg-[var(--surface)] border border-[var(--outline)] rounded-[12px] p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs transition-all',
        className
      )}
    >
      <div className="flex items-start gap-3 min-w-0">
        <div className="w-8 h-8 rounded-full bg-[var(--chip)] text-[var(--primary)] flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="flex flex-col min-w-0">
          <h3 className="text-[14px] font-semibold text-[var(--text-strong)] leading-tight">
            Get to know TailorFit
          </h3>
          <p className="text-[12px] text-[var(--text-2)] mt-0.5 leading-normal">
            See how client details, measurements and orders work together.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
        <button
          type="button"
          onClick={onDismiss}
          className="px-3 py-1.5 text-[12px] font-medium text-[var(--text-2)] hover:text-black transition-colors rounded-full cursor-pointer"
        >
          Not now
        </button>
        <button
          type="button"
          onClick={onStart}
          className="flex items-center gap-1.5 px-4 py-1.5 text-[12px] font-semibold bg-[var(--primary)] text-white hover:opacity-95 transition-opacity rounded-full shadow-xs cursor-pointer"
        >
          <span>Take the tour</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

interface TourCompletionFeedbackProps {
  hasDraft: boolean;
  onAction: () => void;
  onDismiss: () => void;
  className?: string;
}

export function TourCompletionFeedback({
  hasDraft,
  onAction,
  onDismiss,
  className,
}: TourCompletionFeedbackProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'w-full bg-emerald-50 border border-emerald-200 text-emerald-950 rounded-[12px] p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs transition-all',
        className
      )}
    >
      <div className="flex items-start gap-3 min-w-0">
        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
          <CheckCircle2 className="w-4 h-4" />
        </div>
        <div className="flex flex-col min-w-0">
          <h3 className="text-[14px] font-semibold text-emerald-900 leading-tight">
            You&apos;re ready to start.
          </h3>
          <p className="text-[12px] text-emerald-800 mt-0.5 leading-normal">
            Add your client details when you&apos;re ready.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
        <button
          type="button"
          onClick={onAction}
          className="flex items-center gap-1.5 px-4 py-1.5 text-[12px] font-semibold bg-emerald-700 text-white hover:bg-emerald-800 transition-colors rounded-full shadow-xs cursor-pointer"
        >
          <span>{hasDraft ? 'Continue your order' : 'Start an order'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss completion notice"
          className="w-7 h-7 rounded-full flex items-center justify-center text-emerald-700 hover:text-emerald-950 hover:bg-emerald-100 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
