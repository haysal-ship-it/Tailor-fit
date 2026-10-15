'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { springSmooth } from '@/lib/motion-tokens';

interface AnimatedNumberMorphProps {
  value: number | string;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function AnimatedNumberMorph({
  value,
  prefix = '₦',
  suffix = '',
  className,
}: AnimatedNumberMorphProps) {
  const shouldReduceMotion = useReducedMotion();

  // Parse numeric string like "₦130,000" or raw number 130000
  const parseNum = (val: number | string): number => {
    if (typeof val === 'number') return val;
    const clean = val.replace(/[^0-9.-]+/g, '');
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : parsed;
  };

  const num = parseNum(value);
  const formatted = num.toLocaleString('en-NG');

  return (
    <span
      className={cn(
        'font-mono tabular-nums inline-flex items-baseline font-medium select-none',
        className
      )}
    >
      {prefix && <span className="mr-0.5">{prefix}</span>}
      <span className="inline-flex overflow-hidden">
        {shouldReduceMotion ? (
          <span>{formatted}</span>
        ) : (
          formatted.split('').map((char, index) => {
            if (char === ',' || char === '.') {
              return <span key={`sep-${index}`}>{char}</span>;
            }
            return (
              <span key={`digit-${index}-${char}`} className="inline-block relative">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={char}
                    initial={{ y: -8, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 8, opacity: 0 }}
                    transition={springSmooth}
                    className="inline-block"
                  >
                    {char}
                  </motion.span>
                </AnimatePresence>
              </span>
            );
          })
        )}
      </span>
      {suffix && <span className="ml-0.5">{suffix}</span>}
    </span>
  );
}
