'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { springSnappy } from '@/lib/motion-tokens';

export interface SegmentedOption<T extends string = string> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
}

interface SegmentedControlProps<T extends string = string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (val: T) => void;
  size?: 'sm' | 'md';
  className?: string;
  name?: string;
}

export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  size = 'md',
  className,
  name = 'segmented-control',
}: SegmentedControlProps<T>) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      role="radiogroup"
      className={cn(
        'inline-flex items-center p-1 rounded-full bg-[var(--surface-2)] border border-[var(--border)] relative select-none',
        className
      )}
    >
      {options.map((opt) => {
        const isSelected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(opt.value)}
            className={cn(
              'relative z-10 inline-flex items-center justify-center font-medium transition-colors cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]',
              size === 'sm'
                ? 'min-w-[36px] h-7 px-2.5 text-xs gap-1.5 max-sm:min-h-[44px] max-sm:min-w-[44px]'
                : 'min-w-[40px] h-9 px-3.5 text-xs gap-2 max-sm:min-h-[44px] max-sm:min-w-[44px]',
              isSelected ? 'text-[var(--text)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            )}
          >
            {isSelected && (
              <motion.div
                layoutId={`pill-indicator-${name}`}
                transition={shouldReduceMotion ? { duration: 0 } : springSnappy}
                className="absolute inset-0 rounded-full bg-[var(--surface-1)] border border-[var(--border)] shadow-xs -z-10"
              />
            )}
            {opt.icon && <span className="inline-flex shrink-0">{opt.icon}</span>}
            {opt.label && <span>{opt.label}</span>}
          </button>
        );
      })}
    </div>
  );
}
