'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useStore } from '@/lib/store';
import { House, UsersRound, Settings } from 'lucide-react';
import { springSnappy } from '@/lib/motion-tokens';
import { NotificationDropdown } from '@/components/ui/NotificationDropdown';
import { cn } from '@/lib/utils';

export function OrigamiTailorFitLogo({ className = 'w-[44px] h-[31px]' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 44 31"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M6 4L22 4L16 14L6 4Z" fill="currentColor" opacity="0.9" />
      <path d="M22 4L38 4L30 14L22 4Z" fill="currentColor" opacity="0.7" />
      <path d="M16 14L22 4L28 14L22 19Z" fill="currentColor" opacity="1.0" />
      <path d="M18 17L22 19L22 29L18 25Z" fill="currentColor" opacity="0.8" />
      <path d="M22 19L26 17L26 25L22 29Z" fill="currentColor" opacity="0.6" />
      <path d="M18 25L22 29L26 25L22 31Z" fill="currentColor" opacity="0.5" />
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
      icon: <House className="w-6 h-6 shrink-0" />,
      isActive: isOverview,
    },
    {
      id: 'clients',
      label: 'Clients',
      icon: <UsersRound className="w-6 h-6 shrink-0" />,
      isActive: isClients,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-6 h-6 shrink-0" />,
      isActive: isSettings,
    },
  ];

  return (
    <div className="w-full max-w-[1216px] mx-auto pt-4 px-4 sm:px-0 select-none">
      {/* Outer white bar (2px padding, radius 8) */}
      <header className="w-full p-[2px] rounded-[8px] bg-[var(--surface)]">
        {/* Inner --card bar (radius 6, padding 4px 24px) */}
        <div className="w-full rounded-[6px] bg-[var(--card)] px-6 py-1 flex items-center justify-between min-h-[56px]">
          {/* Left: logo mark (about 44x31) and TailorFit wordmark, 8px apart */}
          <div
            onClick={() => setActiveScreen('overview')}
            className="flex items-center gap-2 cursor-pointer text-black"
            id="brand-logo-button"
          >
            <OrigamiTailorFitLogo className="w-[44px] h-[31px] text-black" />
            <span className="text-[24px] font-bold text-black tracking-[-0.02em]">
              TailorFit
            </span>
          </div>

          {/* Center: black nav capsule (radius 32, 4px padding, 4px gaps) */}
          <nav
            className="hidden md:flex items-center bg-black rounded-[32px] p-1 gap-1"
            aria-label="Main Navigation"
          >
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                id={`nav-pill-${item.id}`}
                onClick={() => setActiveScreen(item.id as any)}
                className={cn(
                  'relative z-10 flex items-center gap-1 text-[12px] font-medium transition-colors cursor-pointer',
                  item.isActive
                    ? 'bg-white text-black rounded-[28px] px-3 py-2'
                    : 'text-white px-2 py-2 hover:text-white/80'
                )}
              >
                {item.isActive && (
                  <motion.div
                    layoutId="nav-capsule-active"
                    transition={shouldReduceMotion ? { duration: 0 } : springSnappy}
                    className="absolute inset-0 rounded-[28px] bg-white -z-10"
                  />
                )}
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Right: white circular bell button (8px padding, 24px icon). No badge by default. */}
          <div className="flex items-center gap-2">
            <NotificationDropdown />
          </div>
        </div>
      </header>
    </div>
  );
}
