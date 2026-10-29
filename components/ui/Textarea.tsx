'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { springSnappy } from '@/lib/motion-tokens';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, id, disabled, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-[11px] font-medium leading-snug text-[var(--text)] select-none"
          >
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={
            error && textareaId
              ? `${textareaId}-error`
              : helperText && textareaId
              ? `${textareaId}-helper`
              : undefined
          }
          className={cn(
            'w-full rounded-[8px] p-[8px] bg-[var(--card)] border border-[var(--card)] text-[12px] font-normal text-[var(--text)] placeholder:text-[var(--muted)] transition-all resize-none',
            'focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[rgba(29,73,232,0.15)]',
            error && 'border-[var(--status-danger)] focus:border-[var(--status-danger)] focus:ring-[rgba(242,72,89,0.2)]',
            disabled && 'opacity-30 cursor-not-allowed',
            className
          )}
          {...props}
        />

        <AnimatePresence mode="wait">
          {error ? (
            <motion.p
              id={textareaId ? `${textareaId}-error` : undefined}
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
              id={textareaId ? `${textareaId}-helper` : undefined}
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

Textarea.displayName = 'Textarea';
