'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useStore } from '@/lib/store';
import { House, Users, Settings } from 'lucide-react';
import { springSnappy } from '@/lib/motion-tokens';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { NotificationDropdown } from '@/components/ui/NotificationDropdown';
import { cn } from '@/lib/utils';

// Precision Origami Folded "T" Icon with monochrome neutral style in EasyUI
export function OrigamiTailorFitLogo({ className = 'w-7 h-7' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M6 10L20 10L14 18L6 10Z" fill="currentColor" opacity="0.9" />
      <path d="M20 10L34 10L26 18L20 10Z" fill="currentColor" opacity="0.7" />
      <path d="M14 18L20 10L26 18L20 22Z" fill="currentColor" opacity="1.0" />
      <path d="M16 20L20 22L20 34L16 30Z" fill="currentColor" opacity="0.8" />
      <path d="M20 22L24 20L24 30L20 34Z" fill="currentColor" opacity="0.6" />
      <path d="M16 30L20 34L24 30L20 36Z" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

export function Navbar() {
  const { activeScreen, setActiveScreen } = useStore();
  const shouldReduceMotion = useReducedMotion();

  const isOverview =
    activeScreen === 'overview' ||
    activeScreen === 'dashboard' ||
    activeScreen === 'new-measurement' ||
    activeScreen === 'edit-measurement';
  const isClients = activeScreen === 'clients' || activeScreen === 'client-profile';
  const isSettings = activeScreen === 'settings';

  const navItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <House className="w-3.5 h-3.5" />,
      isActive: isOverview,
    },
    {
      id: 'clients',
      label: 'Clients',
      icon: <Users className="w-3.5 h-3.5" />,
      isActive: isClients,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-3.5 h-3.5" />,
      isActive: isSettings,
    },
  ];

  return (
    <div className="w-full px-4 sm:px-6 pt-3 pb-2 select-none">
      <header className="max-w-[1440px] mx-auto rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] px-4 sm:px-6 py-2.5 flex items-center justify-between">
        {/* Brand Logo */}
        <div
          onClick={() => setActiveScreen('overview')}
          className="flex items-center gap-2.5 cursor-pointer text-[var(--text)] group"
          id="brand-logo-button"
        >
          <div className="w-8 h-8 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center transition-colors group-hover:border-[var(--border-strong)]">
            <OrigamiTailorFitLogo className="w-5 h-5 text-[var(--text)]" />
          </div>
          <span className="text-base font-semibold tracking-[-0.01em] text-[var(--text)]">
            TailorFit
          </span>
        </div>

        {/* Central Pill Navigation (Active pill is inverted --text fill with springSnappy layoutId) */}
        <nav
          className="hidden md:flex items-center p-1 rounded-full bg-[var(--surface-2)] border border-[var(--border)]"
          aria-label="Main Navigation"
        >
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              id={`nav-pill-${item.id}`}
              onClick={() => setActiveScreen(item.id as any)}
              className={cn(
                'relative z-10 flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer',
                item.isActive
                  ? 'text-[var(--bg)] font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              )}
            >
              {item.isActive && (
                <motion.div
                  layoutId="navbar-active-pill"
                  transition={shouldReduceMotion ? { duration: 0 } : springSnappy}
                  className="absolute inset-0 rounded-full bg-[var(--text)] shadow-xs -z-10"
                />
              )}
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Right Actions: Theme Toggle + Notification Bell */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <NotificationDropdown />
        </div>
      </header>
    </div>
  );
}
