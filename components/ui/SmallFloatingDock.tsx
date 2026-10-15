'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { springSnappy } from '@/lib/motion-tokens';

export interface DockTabItem<T extends string = string> {
  id: T;
  label: string;
  icon: React.ReactNode;
}

interface SmallFloatingDockProps<T extends string = string> {
  tabs: DockTabItem<T>[];
  activeTab: T;
  onChange: (tab: T) => void;
  className?: string;
}

export function SmallFloatingDock<T extends string = string>({
  tabs,
  activeTab,
  onChange,
  className,
}: SmallFloatingDockProps<T>) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      className={cn(
        'md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-40 p-1 rounded-full bg-[var(--surface-1)] border border-[var(--border)] shadow-xl flex items-center gap-1 select-none',
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative z-10 flex items-center gap-1.5 px-4 py-2 min-h-[44px] rounded-full text-xs font-medium transition-colors cursor-pointer',
              isActive
                ? 'text-[var(--bg)] font-semibold'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            )}
          >
            {isActive && (
              <motion.div
                layoutId="floating-dock-active-pill"
                transition={shouldReduceMotion ? { duration: 0 } : springSnappy}
                className="absolute inset-0 rounded-full bg-[var(--text)] shadow-xs -z-10"
              />
            )}
            <span className="shrink-0">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
