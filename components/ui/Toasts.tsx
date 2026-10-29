'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Check, Undo2, X, AlertCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { springSmooth } from '@/lib/motion-tokens';

export interface ToastMessage {
  id: string;
  type: 'velocity' | 'undo' | 'warning' | 'error' | 'success';
  title?: string;
  message: string;
  onUndo?: () => void;
  duration?: number;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className="fixed bottom-20 lg:bottom-6 inset-x-0 sm:inset-x-auto sm:right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full mx-auto sm:mx-0 pointer-events-none px-4 sm:px-0">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}) {
  const shouldReduceMotion = useReducedMotion();
  const [isHovered, setIsHovered] = useState(false);
  const duration = toast.duration || (toast.type === 'undo' ? 5000 : 3500);
  const [remainingTime, setRemainingTime] = useState(duration);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isHovered) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    startTimeRef.current = Date.now();
    timerRef.current = setTimeout(() => {
      onDismiss(toast.id);
    }, remainingTime);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isHovered, remainingTime, toast.id, onDismiss]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    const elapsed = Date.now() - startTimeRef.current;
    setRemainingTime((prev) => Math.max(0, prev - elapsed));
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <motion.div
      role="alert"
      aria-live={toast.type === 'error' || toast.type === 'warning' ? 'assertive' : 'polite'}
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.95 }}
      transition={shouldReduceMotion ? { duration: 0.1 } : springSmooth}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'pointer-events-auto w-full rounded-2xl p-3.5 bg-[var(--surface-1)] border shadow-xl flex items-center justify-between gap-3 overflow-hidden relative',
        toast.type === 'warning'
          ? 'border-amber-300 bg-amber-50/40 dark:bg-amber-950/20 dark:border-amber-600/40'
          : toast.type === 'error'
          ? 'border-red-300 bg-red-50/40 dark:bg-red-950/20 dark:border-red-600/40'
          : 'border-[var(--border)]'
      )}
    >
      <div className="flex items-start gap-2.5">
        {toast.type === 'warning' ? (
          <div className="w-6 h-6 rounded-full bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
        ) : toast.type === 'error' ? (
          <div className="w-6 h-6 rounded-full bg-red-500/15 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
            <AlertCircle className="w-3.5 h-3.5" />
          </div>
        ) : toast.type === 'velocity' || toast.type === 'success' ? (
          <div className="w-6 h-6 rounded-full bg-[var(--status-success)]/15 text-[var(--status-success)] flex items-center justify-center shrink-0 mt-0.5">
            <Check className="w-3.5 h-3.5" />
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full bg-[var(--text)] text-[var(--bg)] flex items-center justify-center shrink-0 mt-0.5">
            <Undo2 className="w-3.5 h-3.5" />
          </div>
        )}
        <div className="flex flex-col">
          {toast.title && (
            <span className="text-xs font-bold text-[var(--text)] leading-tight">
              {toast.title}
            </span>
          )}
          <span className="text-xs text-[var(--text)] font-medium leading-normal">
            {toast.message}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {toast.type === 'undo' && toast.onUndo && (
          <button
            type="button"
            onClick={() => {
              toast.onUndo!();
              onDismiss(toast.id);
            }}
            className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[var(--surface-2)] text-[var(--text)] hover:bg-[var(--border)] transition-colors cursor-pointer"
          >
            Undo
          </button>
        )}
        <button
          type="button"
          aria-label="Dismiss notification"
          onClick={() => onDismiss(toast.id)}
          className="text-[var(--text-muted)] hover:text-[var(--text)] p-1 transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Progress countdown bar for undo */}
      {toast.type === 'undo' && !shouldReduceMotion && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--surface-2)]">
          <motion.div
            initial={{ width: '100%' }}
            animate={{ width: isHovered ? undefined : '0%' }}
            transition={{ duration: duration / 1000, ease: 'linear' }}
            className="h-full bg-[var(--text)]"
          />
        </div>
      )}
    </motion.div>
  );
}
