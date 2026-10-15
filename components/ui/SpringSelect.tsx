'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { springSmooth } from '@/lib/motion-tokens';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

interface SpringSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

export function SpringSelect({
  options,
  value,
  onChange,
  placeholder = 'Select option',
  label,
  className,
}: SpringSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const selectedOption = options.find((o) => o.value === value);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      {label && (
        <label className="block text-xs font-normal text-[var(--text-muted)] mb-1.5">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between rounded-xl px-3.5 bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--text)] transition-colors cursor-pointer select-none',
          'h-10 min-h-[40px] max-sm:min-h-[44px] max-sm:text-base',
          'focus-visible:outline-none focus-visible:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]',
          isOpen && 'border-[var(--accent)]'
        )}
        aria-expanded={isOpen}
      >
        <span className={cn('truncate', !selectedOption && 'text-[var(--text-muted)]')}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 190 : 0 }}
          transition={shouldReduceMotion ? { duration: 0.1 } : springSmooth}
          className="ml-2 inline-flex shrink-0 text-[var(--text-muted)]"
        >
          <ChevronDown className="w-4 h-4" />
        </motion.span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={shouldReduceMotion ? { duration: 0.1 } : springSmooth}
            style={{ transformOrigin: 'top center' }}
            className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl bg-[var(--surface-1)] border border-[var(--border)] p-1.5 shadow-lg max-h-60 overflow-y-auto"
          >
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center justify-between rounded-lg px-3 py-2 text-xs text-left transition-colors cursor-pointer',
                    isSelected
                      ? 'bg-[var(--surface-2)] text-[var(--text)] font-medium'
                      : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
                  )}
                >
                  <div className="pr-2">
                    <div className="font-medium">{opt.label}</div>
                    {opt.description && (
                      <div className="text-[11px] text-[var(--text-faint)] mt-0.5">
                        {opt.description}
                      </div>
                    )}
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
