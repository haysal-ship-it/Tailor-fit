'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { springSmooth, springSnappy } from '@/lib/motion-tokens';

interface NotificationItem {
  id: string;
  title: string;
  time: string;
  description: string;
  isNew: boolean;
}

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [shake, setShake] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      title: 'Chloe Dallas fitting due today',
      time: '10:00 AM',
      description: 'Bespoke African Gown ready for final fitting in main studio.',
      isNew: false,
    },
    {
      id: 'notif-2',
      title: 'Urgent order: Bryan Muhammed',
      time: '04:15 PM',
      description: 'Silk Evening Gown requested priority completion.',
      isNew: false,
    },
    {
      id: 'notif-3',
      title: 'Taylor Razaq pickup completed',
      time: 'Yesterday',
      description: 'Oxford Three Piece Suit marked picked up.',
      isNew: false,
    },
  ]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isNew: false })));
    setUnreadCount(0);
  };

  return (
    <div ref={containerRef} className="relative">
      <motion.button
        type="button"
        aria-label="Studio alerts"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && unreadCount > 0) {
            setShake(true);
            setTimeout(() => setShake(false), 500);
          }
        }}
        transition={
          shake && !shouldReduceMotion
            ? { type: 'tween', duration: 0.4, ease: [0.2, 0, 0, 1] }
            : springSnappy
        }
        animate={shake && !shouldReduceMotion ? { rotate: [-8, 8, -6, 6, 0] } : { rotate: 0 }}
        className={cn(
          'relative w-10 h-10 rounded-full bg-white flex items-center justify-center p-2 text-black cursor-pointer select-none transition-colors hover:bg-neutral-100',
          isOpen && 'bg-neutral-100'
        )}
      >
        <Bell className="w-6 h-6 text-black shrink-0" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[var(--primary)] ring-2 ring-white" />
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="dialog"
            aria-label="Studio Alerts"
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={shouldReduceMotion ? { duration: 0.1 } : springSmooth}
            style={{ transformOrigin: 'top right' }}
            className="absolute right-0 top-full mt-2 w-[min(20rem,calc(100vw-1.5rem))] sm:w-88 z-50 rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] p-3.5 shadow-xl"
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-[var(--border)]">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-[var(--text)]">Studio Alerts</span>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-[10px] font-mono text-[var(--text-muted)] tabular-nums">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-[11px] text-[var(--accent)] hover:underline cursor-pointer"
                >
                  Mark read
                </button>
              )}
            </div>

            <div className="py-2 space-y-2 max-h-72 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-6 text-center text-xs text-[var(--text-muted)]">
                  No studio alerts right now.
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      'p-2.5 rounded-xl transition-colors border text-left',
                      n.isNew
                        ? 'bg-[var(--surface-2)] border-[var(--border-strong)]'
                        : 'bg-[var(--surface-1)] border-transparent hover:bg-[var(--surface-2)]'
                    )}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-medium text-[var(--text)] line-clamp-1">
                        {n.title}
                      </span>
                      <span className="text-[10px] font-mono text-[var(--text-faint)] shrink-0 tabular-nums">
                        {n.time}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] mt-1 leading-snug">
                      {n.description}
                    </p>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
