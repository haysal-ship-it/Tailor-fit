'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Bell, CheckCircle2 } from 'lucide-react';
import { useStore } from '@/lib/store';
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
  const { clients, getOrdersDueToday, getOrdersOverdue, getOrdersReady } = useStore();
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [shake, setShake] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const notifications = useMemo(() => {
    const list: NotificationItem[] = [];
    const clientMap = new Map(clients.map((c) => [c.id, c.name]));

    const overdue = getOrdersOverdue();
    overdue.forEach((o) => {
      const id = `notif-overdue-${o.id}`;
      list.push({
        id,
        title: `Overdue pickup: ${clientMap.get(o.clientId) || 'Client'}`,
        time: 'Urgent',
        description: `${o.garmentType || 'Bespoke Order'} is past its scheduled delivery date.`,
        isNew: !readIds.has(id),
      });
    });

    const dueToday = getOrdersDueToday();
    dueToday.forEach((o) => {
      const id = `notif-today-${o.id}`;
      list.push({
        id,
        title: `${clientMap.get(o.clientId) || 'Client'} fitting due today`,
        time: 'Today',
        description: `${o.garmentType || 'Bespoke Order'} is scheduled for collection.`,
        isNew: !readIds.has(id),
      });
    });

    const ready = getOrdersReady();
    ready.slice(0, 3).forEach((o) => {
      const id = `notif-ready-${o.id}`;
      list.push({
        id,
        title: `${clientMap.get(o.clientId) || 'Client'} order ready`,
        time: 'Ready',
        description: `${o.garmentType || 'Bespoke Order'} marked finished and ready.`,
        isNew: !readIds.has(id),
      });
    });

    return list;
  }, [clients, getOrdersDueToday, getOrdersOverdue, getOrdersReady, readIds]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => n.isNew).length;
  }, [notifications]);

  const handleMarkAllRead = () => {
    setReadIds(new Set(notifications.map((n) => n.id)));
  };

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
                <div className="py-8 text-center flex flex-col items-center justify-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-[var(--surface-2)] flex items-center justify-center text-[var(--text-muted)] mb-0.5">
                    <CheckCircle2 className="w-5 h-5 text-[var(--completed)]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[var(--text)]">All Caught Up</p>
                    <p className="text-[11px] text-[var(--text-muted)] mt-1 max-w-[200px] leading-snug">
                      No pending fittings, overdue collections, or studio alerts at this time.
                    </p>
                  </div>
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
