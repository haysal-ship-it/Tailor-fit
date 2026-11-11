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
    const inputId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[11px] font-medium leading-snug text-[var(--text)] select-none"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftAddon && (
            <div className="absolute left-2.5 flex items-center pointer-events-none text-[var(--muted)] z-10">
              {leftAddon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={
              error && inputId
                ? `${inputId}-error`
                : helperText && inputId
                ? `${inputId}-helper`
                : undefined
            }
            className={cn(
              'w-full h-10 sm:h-11 rounded-[8px] bg-[#F8F8F8] border border-[#EDEDED] px-3 text-[14px] font-medium text-[#1D1D1D] placeholder:text-[#8E8E8E] transition-colors',
              leftAddon ? 'pl-9' : 'pl-3',
              rightAddon ? 'pr-9' : 'pr-3',
              'focus:outline-none focus:border-[#1D49E8] focus:ring-1 focus:ring-[#1D49E8]',
              error && 'border-[var(--status-danger)] focus:border-[var(--status-danger)] focus:ring-[var(--status-danger)]',
              disabled && 'opacity-40 cursor-not-allowed',
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
              id={inputId ? `${inputId}-error` : undefined}
              role="alert"
              initial={{ opacity: 0, y: -4, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -4, height: 0 }}
              transition={springSnappy}
              className="text-[11px] text-[var(--status-danger)]"
            >
              {error}
            </motion.p>
          ) : helperText ? (
            <p
              id={inputId ? `${inputId}-helper` : undefined}
              className="text-[11px] text-[var(--text-faint)]"
            >
              {helperText}
            </p>
          ) : null}
        </AnimatePresence>
      </div>
    );
  }
);

Input.displayName = 'Input';
