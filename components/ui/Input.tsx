'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { springSnappy } from '@/lib/motion-tokens';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      leftAddon,
      rightAddon,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-normal text-[var(--text-muted)] select-none"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftAddon && (
            <div className="absolute left-3 flex items-center pointer-events-none text-[var(--text-muted)] z-10">
              {leftAddon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={cn(
              'w-full rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--text)] placeholder:text-[var(--text-faint)] transition-colors',
              'h-10 min-h-[40px] px-3.5 max-sm:min-h-[44px] max-sm:text-base',
              leftAddon ? 'pl-9' : 'pl-3.5',
              rightAddon ? 'pr-9' : 'pr-3.5',
              'focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]',
              error && 'border-[var(--status-danger)] focus:border-[var(--status-danger)] focus:ring-[var(--status-danger)]',
              disabled && 'opacity-30 cursor-not-allowed',
              className
            )}
            {...props}
          />

          {rightAddon && (
            <div className="absolute right-3 flex items-center text-[var(--text-muted)] z-10">
              {rightAddon}
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {error ? (
            <motion.p
              initial={{ opacity: 0, y: -4, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -4, height: 0 }}
              transition={springSnappy}
              className="text-[11px] text-[var(--status-danger)]"
            >
              {error}
            </motion.p>
          ) : helperText ? (
            <p className="text-[11px] text-[var(--text-faint)]">{helperText}</p>
          ) : null}
        </AnimatePresence>
      </div>
    );
  }
);

Input.displayName = 'Input';
