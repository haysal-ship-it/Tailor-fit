import React, { useEffect, useRef } from 'react';
import { X, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { TourStepDefinition } from '@/lib/onboarding/steps';
import { TourExample } from './TourExamples';
import { cn } from '@/lib/utils';

interface TourCardProps {
  step: TourStepDefinition | null;
  isMissingTarget?: boolean;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onFinish: () => void;
  onClose: () => void;
  className?: string;
  isSheet?: boolean;
}

export function TourCard({
  step,
  isMissingTarget = false,
  onNext,
  onPrev,
  onSkip,
  onFinish,
  onClose,
  className,
  isSheet = false,
}: TourCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const nextButtonRef = useRef<HTMLButtonElement>(null);

  // Auto-focus next/action button when step changes for keyboard accessibility
  useEffect(() => {
    const timer = setTimeout(() => {
      if (nextButtonRef.current) {
        nextButtonRef.current.focus();
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [step?.id]);

  if (isMissingTarget || !step) {
    return (
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-missing-title"
        className={cn(
          'w-full max-w-[340px] bg-[var(--surface)] rounded-[16px] p-4 shadow-xl border border-[var(--outline)] flex flex-col gap-3 z-50 text-black',
          className
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <h2 id="tour-missing-title" className="text-[15px] font-semibold text-black leading-snug">
            This part of the workspace isn&apos;t available right now.
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close tour"
            className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--muted)] hover:text-black hover:bg-neutral-100 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[13px] text-[var(--text-2)] leading-relaxed">
          You can continue with the next part of the tour or close it.
        </p>

        <div className="flex items-center justify-end gap-2 pt-1 border-t border-[var(--outline)]">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-[13px] font-medium text-[var(--text-2)] hover:text-black rounded-full"
          >
            Close tour
          </button>
          <button
            ref={nextButtonRef}
            type="button"
            onClick={onNext}
            className="px-4 py-1.5 text-[13px] font-semibold bg-[var(--primary)] text-white rounded-full hover:opacity-95 shadow-xs"
          >
            Continue tour
          </button>
        </div>
      </div>
    );
  }

  const isFirstStep = step.stepNumber === 1;
  const isLastStep = step.stepNumber === step.totalSteps;

  return (
    <div
      ref={cardRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-step-title"
      aria-describedby="tour-step-body"
      className={cn(
        'bg-[var(--surface)] rounded-[16px] p-4 shadow-xl border border-[var(--outline)] flex flex-col gap-3 z-50 text-black select-none',
        isSheet ? 'w-full max-w-full' : 'w-[320px]',
        className
      )}
    >
      {/* Header: Visual Example + Close Button */}
      <div className="relative w-full">
        <TourExample exampleId={step.exampleId} />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close tour"
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-[var(--muted)] hover:text-black hover:bg-white shadow-2xs transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Title & Body */}
      <div className="flex flex-col gap-1">
        <h2 id="tour-step-title" className="text-[16px] font-semibold text-[var(--text-strong)] leading-[22px]">
          {step.title}
        </h2>
        <p id="tour-step-body" className="text-[14px] text-[var(--text-2)] leading-[21px]">
          {step.body}
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center justify-between pt-1 text-[12px] text-[var(--text-2)]">
        <span className="font-semibold tabular-nums text-black">
          {step.stepNumber} of {step.totalSteps}
        </span>
        <div className="flex items-center gap-1.5" aria-hidden="true">
          {Array.from({ length: step.totalSteps }).map((_, idx) => {
            const stepNum = idx + 1;
            const isCompleted = stepNum < step.stepNumber;
            const isCurrent = stepNum === step.stepNumber;

            return (
              <div
                key={idx}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-200',
                  isCurrent
                    ? 'w-5 bg-[var(--primary)]'
                    : isCompleted
                    ? 'w-1.5 bg-[var(--primary)]/50'
                    : 'w-1.5 bg-[#E0E0E0]'
                )}
              />
            );
          })}
        </div>
      </div>

      {/* Footer Controls */}
      <div className="flex items-center justify-between pt-2 border-t border-[var(--outline)] gap-2">
        <button
          type="button"
          onClick={onSkip}
          className="text-[13px] font-medium text-[var(--text-2)] hover:text-black px-2 py-1.5 rounded-md transition-colors cursor-pointer min-h-[36px]"
        >
          Skip tour
        </button>

        <div className="flex items-center gap-1.5">
          {!isFirstStep && (
            <button
              type="button"
              onClick={onPrev}
              className="flex items-center gap-1 text-[13px] font-medium text-black px-3 py-1.5 rounded-full border border-[var(--outline)] hover:bg-neutral-100 transition-colors cursor-pointer min-h-[36px]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          )}

          {isLastStep ? (
            <button
              ref={nextButtonRef}
              type="button"
              onClick={onFinish}
              className="flex items-center gap-1 text-[13px] font-semibold text-white px-4 py-1.5 rounded-full bg-[var(--primary)] hover:opacity-95 shadow-xs transition-opacity cursor-pointer min-h-[36px]"
            >
              <span>Finish tour</span>
              <Check className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              ref={nextButtonRef}
              type="button"
              onClick={onNext}
              className="flex items-center gap-1 text-[13px] font-semibold text-white px-4 py-1.5 rounded-full bg-[var(--primary)] hover:opacity-95 shadow-xs transition-opacity cursor-pointer min-h-[36px]"
            >
              <span>Next</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
