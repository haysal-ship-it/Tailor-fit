'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Loader2, AlertCircle, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { springSnappy, springMorph } from '@/lib/motion-tokens';

export type MorphingButtonStatus = 'idle' | 'loading' | 'success' | 'error';

interface MorphingSaveButtonProps {
  status?: MorphingButtonStatus;
  onClick?: () => void | Promise<void>;
  idleText?: string;
  className?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export function MorphingSaveButton({
  status: controlledStatus,
  onClick,
  idleText = 'Save',
  className,
  disabled = false,
  style,
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
      disabled={disabled || status === 'loading'}
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
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={springMorph}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium"
          >
            <Save className="w-4 h-4 shrink-0" />
            <span>{idleText}</span>
          </motion.span>
        )}

        {status === 'loading' && (
          <motion.span
            key="loading"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={springMorph}
            className="inline-flex items-center gap-2 text-[13px] font-medium"
          >
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Saving...</span>
          </motion.span>
        )}

        {status === 'success' && (
          <motion.span
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={springMorph}
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
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={springMorph}
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
