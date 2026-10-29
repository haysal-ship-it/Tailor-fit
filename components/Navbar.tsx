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
      aria-hidden="true"
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
      mobileIcon: <House className="w-4 h-4 shrink-0" />,
      isActive: isOverview,
    },
    {
      id: 'clients',
      label: 'Clients',
      icon: <UsersRound className="w-6 h-6 shrink-0" />,
      mobileIcon: <UsersRound className="w-4 h-4 shrink-0" />,
      isActive: isClients,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-6 h-6 shrink-0" />,
      mobileIcon: <Settings className="w-4 h-4 shrink-0" />,
      isActive: isSettings,
    },
  ];

  return (
    <>
      <div className="w-full max-w-[1216px] mx-auto pt-4 px-3 sm:px-4 xl:px-0 select-none">
        {/* Outer white bar (2px padding, radius 8) */}
        <header className="w-full p-[2px] rounded-[8px] bg-[var(--surface)]">
          {/* Inner --card bar (radius 6, padding 4px 24px) */}
          <div className="w-full rounded-[6px] bg-[var(--card)] px-4 sm:px-6 py-1 flex items-center justify-between min-h-[56px]">
            {/* Left: logo mark (about 44x31) and TailorFit wordmark, 8px apart */}
            <button
              type="button"
              onClick={() => setActiveScreen('overview')}
              aria-label="TailorFit — Go to Overview"
              className="flex items-center gap-2 cursor-pointer text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] rounded-[6px]"
              id="brand-logo-button"
            >
              <OrigamiTailorFitLogo className="w-[44px] h-[31px] text-black" />
              <span className="text-[20px] sm:text-[24px] font-bold text-black tracking-[-0.02em]">
                TailorFit
              </span>
            </button>

            {/* Center: black nav capsule (radius 32, 4px padding, 4px gaps) */}
            <nav
              className="hidden lg:flex items-center bg-black rounded-[32px] p-1 gap-1"
              aria-label="Main Navigation"
            >
              {navItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  id={`nav-pill-${item.id}`}
                  aria-current={item.isActive ? 'page' : undefined}
                  onClick={() => setActiveScreen(item.id as any)}
                  className={cn(
                    'relative z-10 flex items-center gap-1 text-[12px] px-3 py-2 rounded-[28px] transition-colors cursor-pointer',
                    item.isActive
                      ? 'bg-white text-black font-semibold'
                      : 'text-white font-medium hover:text-white/80'
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

            {/* Right: Notification bell */}
            <div className="flex items-center gap-2">
              <NotificationDropdown />
            </div>
          </div>
        </header>
      </div>

      {/* Global Mobile/Tablet Floating Bottom Nav Dock (< 1024px) */}
      <div className="lg:hidden fixed bottom-[max(1rem,env(safe-area-inset-bottom))] inset-x-0 z-40 flex justify-center px-4 pointer-events-none select-none">
        <nav
          aria-label="Mobile Navigation"
          className="pointer-events-auto bg-black rounded-[32px] p-1.5 flex items-center gap-1 shadow-xl border border-white/10"
        >
          {navItems.map((item) => (
            <button
              key={`mobile-${item.id}`}
              type="button"
              aria-current={item.isActive ? 'page' : undefined}
              onClick={() => setActiveScreen(item.id as any)}
              className={cn(
                'relative z-10 flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-[28px] text-[12px] transition-colors cursor-pointer',
                item.isActive
                  ? 'bg-white text-black font-semibold'
                  : 'text-white font-medium hover:text-white/80'
              )}
            >
              {item.isActive && (
                <motion.div
                  layoutId="mobile-nav-capsule-active"
                  transition={shouldReduceMotion ? { duration: 0 } : springSnappy}
                  className="absolute inset-0 rounded-[28px] bg-white -z-10"
                />
              )}
              {item.mobileIcon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </>
  );
}
