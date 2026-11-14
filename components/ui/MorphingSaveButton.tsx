'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Loader2, AlertCircle, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { springSnappy } from '@/lib/motion-tokens';

export type MorphingButtonStatus = 'idle' | 'loading' | 'success' | 'error';

interface MorphingSaveButtonProps {
  status?: MorphingButtonStatus;
  onClick?: () => void | Promise<void>;
  idleText?: string;
  className?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
  dataTour?: string;
}

export function MorphingSaveButton({
  status: controlledStatus,
  onClick,
  idleText = 'Save',
  className,
  disabled = false,
  style,
  dataTour,
}: MorphingSaveButtonProps) {
  const [internalStatus, setInternalStatus] = useState<MorphingButtonStatus>('idle');
  const shouldReduceMotion = useReducedMotion();

  const status = controlledStatus !== undefined ? controlledStatus : internalStatus;

  const handleClick = async () => {
    if (status !== 'idle' && status !== 'error') return;
    if (onClick) {
      if (controlledStatus === undefined) {
        setInternalStatus('loading');
        try {
          await onClick();
          setInternalStatus('success');
          setTimeout(() => {
            setInternalStatus('idle');
          }, 1600);
        } catch {
          setInternalStatus('error');
          setTimeout(() => {
            setInternalStatus('idle');
          }, 2000);
        }
      } else {
        onClick();
      }
    }
  };

  return (
    <motion.button
      type="button"
      data-tour={dataTour}
      disabled={disabled || status === 'loading'}
      aria-busy={status === 'loading' || undefined}
      onClick={handleClick}
      whileTap={disabled || status === 'loading' || shouldReduceMotion ? undefined : { scale: 0.97 }}
      transition={springSnappy}
      className={cn(
        'relative inline-flex items-center justify-center rounded-[24px] font-medium text-[13px] cursor-pointer select-none overflow-hidden transition-colors',
        'h-10 min-w-[110px] px-5',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]',
        status === 'error'
          ? 'bg-[var(--status-danger)] text-white hover:opacity-90'
          : status === 'success'
          ? 'bg-[var(--completed)] text-white'
          : 'bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90',
        disabled && 'opacity-30 cursor-not-allowed',
        className
      )}
      style={style}
    >
      <AnimatePresence mode="wait" initial={false}>
        {status === 'idle' && (
          <motion.span
            key="idle"
            initial={shouldReduceMotion ? false : { opacity: 0, transform: "translateY(4px)" }}
            animate={{ opacity: 1, transform: "translateY(0px)" }}
            exit={{ opacity: 0, transform: shouldReduceMotion ? "none" : "translateY(-4px)" }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium"
          >
            <Save className="w-4 h-4 shrink-0" />
            <span>{idleText}</span>
          </motion.span>
        )}

        {status === 'loading' && (
          <motion.span
            key="loading"
            initial={shouldReduceMotion ? false : { opacity: 0, transform: "scale(0.98)" }}
            animate={{ opacity: 1, transform: "scale(1)" }}
            exit={{ opacity: 0, transform: shouldReduceMotion ? "none" : "scale(0.98)" }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            className="inline-flex items-center gap-2 text-[13px] font-medium"
          >
            <Loader2 aria-hidden="true" className="w-4 h-4 motion-safe:animate-spin" />
            <span>Saving...</span>
          </motion.span>
        )}

        {status === 'success' && (
          <motion.span
            key="success"
            initial={shouldReduceMotion ? false : { opacity: 0, transform: "scale(0.98)" }}
            animate={{ opacity: 1, transform: "scale(1)" }}
            exit={{ opacity: 0, transform: shouldReduceMotion ? "none" : "scale(0.98)" }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <motion.path
                d="M4 12l5 5L20 6"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{
                  duration: shouldReduceMotion ? 0.05 : 0.35,
                  ease: [0.22, 1, 0.36, 1],
                }}
              />
            </svg>
            <span>Saved</span>
          </motion.span>
        )}

        {status === 'error' && (
          <motion.span
            key="error"
            initial={shouldReduceMotion ? false : { opacity: 0, transform: "scale(0.98)" }}
            animate={{ opacity: 1, transform: "scale(1)" }}
            exit={{ opacity: 0, transform: shouldReduceMotion ? "none" : "scale(0.98)" }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium"
          >
            <AlertCircle className="w-4 h-4" />
            <span>Retry</span>
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
