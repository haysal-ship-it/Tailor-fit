'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronDown, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { springGentle, springSmooth } from '@/lib/motion-tokens';
import { AnimatedNumberMorph } from './AnimatedNumberMorph';

export interface OrderRowData {
  id: string;
  clientId: string;
  clientName: string;
  initials: string;
  garment: string;
  price: string | number;
  dueDate: string;
  status: 'In Progress' | 'Ready' | 'Picked Up' | 'Pending' | 'Urgent' | string;
  isUrgent?: boolean;
}

interface ExpandableDataRowProps {
  order: OrderRowData;
  onOpenOrder?: (orderId: string, clientId: string) => void;
  className?: string;
}

export function ExpandableDataRow({
  order,
  onOpenOrder,
  className,
}: ExpandableDataRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const getStatusBadge = (status: string, isUrgent?: boolean) => {
    if (isUrgent || status.toLowerCase() === 'urgent') {
      return 'bg-[var(--status-danger)]/15 text-[var(--status-danger)] border-[var(--status-danger)]/30';
    }
    if (status.toLowerCase() === 'ready' || status.toLowerCase() === 'completed') {
      return 'bg-[var(--status-success)]/15 text-[var(--status-success)] border-[var(--status-success)]/30';
    }
    if (status.toLowerCase() === 'in progress' || status.toLowerCase() === 'pending') {
      return 'bg-[var(--status-warning)]/15 text-[var(--status-warning)] border-[var(--status-warning)]/30';
    }
    return 'bg-[var(--surface-2)] text-[var(--text-muted)] border-[var(--border)]';
  };

  return (
    <div
      className={cn(
        'w-full rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] transition-colors overflow-hidden',
        'hover:border-[var(--border-strong)]',
        isExpanded && 'border-[var(--border-strong)]',
        className
      )}
    >
      {/* Collapsed Header Bar */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3.5 flex items-center justify-between text-left cursor-pointer select-none transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] font-semibold text-xs flex items-center justify-center shrink-0">
            {order.initials}
          </div>
          <div>
            <h4 className="text-xs font-semibold text-[var(--text)] tracking-[-0.01em]">
              {order.clientName}
            </h4>
            <p className="text-[11px] text-[var(--text-muted)]">{order.garment}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-xs text-[var(--text)] font-mono">
            <AnimatedNumberMorph value={order.price} />
          </span>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={shouldReduceMotion ? { duration: 0.1 } : springSmooth}
            className="text-[var(--text-muted)] p-0.5"
          >
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </div>
      </button>

      {/* Expanded Details Tray */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={shouldReduceMotion ? { duration: 0.1 } : springGentle}
            className="overflow-hidden border-t border-[var(--border)] bg-[var(--surface-2)]"
          >
            <div className="p-3.5 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-muted)]">Order Status</span>
                <span
                  className={cn(
                    'px-2.5 py-0.5 rounded-full text-[10px] font-medium border',
                    getStatusBadge(order.status, order.isUrgent)
                  )}
                >
                  {order.status}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[var(--text-muted)]">Due Date</span>
                <span className="font-mono text-[var(--text)]">{order.dueDate}</span>
              </div>

              <div className="pt-2 border-t border-[var(--border)] flex justify-end">
                {onOpenOrder && (
                  <button
                    type="button"
                    onClick={() => onOpenOrder(order.id, order.clientId)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text)] hover:text-[var(--accent)] transition-colors cursor-pointer"
                  >
                    <span>Open order dossier</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
