'use client';

import React, { useSyncExternalStore } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { springSnappy } from '@/lib/motion-tokens';

interface ThemeToggleProps {
  className?: string;
}

function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback);
  if (typeof document !== 'undefined') {
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
  }
  return () => observer.disconnect();
}

function getSnapshot() {
  if (typeof document === 'undefined') return false;
  return document.documentElement.classList.contains('dark');
}

function getServerSnapshot() {
  return false;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const isDark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const shouldReduceMotion = useReducedMotion();

  const toggleTheme = () => {
    const nextDark = !isDark;
    if (nextDark) {
      document.documentElement.classList.add('dark');
      try {
        localStorage.setItem('tailorfit_theme', 'dark');
      } catch {}
    } else {
      document.documentElement.classList.remove('dark');
      try {
        localStorage.setItem('tailorfit_theme', 'light');
      } catch {}
    }
  };

  return (
    <motion.button
      type="button"
      onClick={toggleTheme}
      whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
      transition={springSnappy}
      className={cn(
        'w-9 h-9 min-h-[40px] min-w-[40px] max-sm:min-h-[44px] max-sm:min-w-[44px] rounded-full border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text)] flex items-center justify-center transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--surface-2)] cursor-pointer select-none',
        className
      )}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Light theme' : 'Dark theme'}
    >
      <motion.div
        key={isDark ? 'dark' : 'light'}
        initial={{ rotate: -30, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={shouldReduceMotion ? { duration: 0.1 } : springSnappy}
      >
        {isDark ? <Sun className="w-4 h-4 text-[var(--text)]" /> : <Moon className="w-4 h-4 text-[var(--text)]" />}
      </motion.div>
    </motion.button>
  );
}
