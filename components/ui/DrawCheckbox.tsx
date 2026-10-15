'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { springSnappy } from '@/lib/motion-tokens';

interface DrawCheckboxProps {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  className?: string;
  disabled?: boolean;
}

export function DrawCheckbox({
  checked,
  onChange,
  className,
  disabled = false,
}: DrawCheckboxProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange && !disabled && onChange(!checked)}
      whileTap={disabled || shouldReduceMotion ? undefined : { scale: 0.9 }}
      transition={springSnappy}
      className={cn(
        'w-6 h-6 rounded-md flex items-center justify-center transition-colors cursor-pointer select-none border',
        checked
          ? 'bg-[var(--status-success)]/15 border-[var(--status-success)] text-[var(--status-success)]'
          : 'bg-transparent border-[var(--border)] text-transparent hover:border-[var(--border-strong)]',
        disabled && 'opacity-30 cursor-not-allowed',
        className
      )}
    >
      <svg
        className="w-3.5 h-3.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <motion.path
          d="M4 12.5l5.5 5.5L20 6.5"
          initial={false}
          animate={{
            pathLength: checked ? 1 : 0,
            opacity: checked ? 1 : 0,
          }}
          transition={
            shouldReduceMotion
              ? { duration: 0.05 }
              : {
                  type: 'spring',
                  stiffness: 400,
                  damping: 24,
                  mass: 0.5,
                }
          }
        />
      </svg>
    </motion.button>
  );
}
