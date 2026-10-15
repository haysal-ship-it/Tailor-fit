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
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-xs font-normal text-[var(--text-muted)] select-none"
          >
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          disabled={disabled}
          className={cn(
            'w-full rounded-xl p-3 bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--text)] placeholder:text-[var(--text-faint)] transition-colors resize-none max-sm:text-base',
            'focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]',
            error && 'border-[var(--status-danger)] focus:border-[var(--status-danger)] focus:ring-[var(--status-danger)]',
            disabled && 'opacity-30 cursor-not-allowed',
            className
          )}
          {...props}
        />

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

Textarea.displayName = 'Textarea';
