'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { OrderStatus } from '@/types';
import { 
  Search, 
  Plus, 
  Calendar, 
  ShoppingBag, 
  User, 
  X,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AnimatedNumberMorph } from '@/components/ui/AnimatedNumberMorph';
import { cn } from '@/lib/utils';

interface OrdersScreenProps {
  onNewOrder: () => void;
  onEditOrder: (orderId: string) => void;
  onOpenClient: (clientId: string) => void;
}

export function OrdersScreen({ onNewOrder, onEditOrder, onOpenClient }: OrdersScreenProps) {
  const { orders, getClientById, updateOrderStatus } = useStore();

  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredOrders = orders.filter((order) => {
    const client = getClientById(order.clientId);
    const clientName = client?.name || '';
    const q = searchQuery.toLowerCase();

    if (q) {
      const matchSearch =
        clientName.toLowerCase().includes(q) ||
        order.garmentType.toLowerCase().includes(q) ||
        order.id.toLowerCase().includes(q) ||
        (order.notes && order.notes.toLowerCase().includes(q));
      if (!matchSearch) return false;
    }

    if (statusFilter !== 'All' && order.status !== statusFilter) {
      return false;
    }

    return true;
  });

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 py-3 space-y-4 pb-28 md:pb-6">
      {/* Top Header Card */}
      <div className="rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-semibold tracking-[-0.01em] text-[var(--text)]">
            Garment Orders &amp; Commissions
          </h1>
          <p className="text-xs text-[var(--text-muted)]">
            Active atelier workroom orders and pickup pipeline
          </p>
        </div>

        {/* Primary Action Button */}
        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          onClick={onNewOrder}
        >
          New Order
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter orders..."
            className="w-full h-9 pl-9 pr-8 rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)] p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['All', 'In Progress', 'Ready', 'Picked Up'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer shrink-0 border',
                statusFilter === st
                  ? 'bg-[var(--text)] text-[var(--bg)] border-transparent'
                  : 'bg-[var(--surface-2)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text)]'
              )}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-2.5">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => {
            const client = getClientById(order.clientId);
            return (
              <div
                key={order.id}
                className="rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] p-4 flex flex-col md:flex-row md:items-center justify-between gap-3.5 transition-colors hover:border-[var(--border-strong)]"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-[var(--text-faint)]">
                      #{order.id.slice(-4)}
                    </span>
                    <h3 className="text-sm font-semibold text-[var(--text)]">
                      {order.garmentType}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] flex-wrap">
                    <button
                      type="button"
                      onClick={() => onOpenClient(order.clientId)}
                      className="text-[var(--text)] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <User className="w-3 h-3 text-[var(--text-muted)]" />
                      <span>{client?.name || 'Unknown Client'}</span>
                    </button>

                    <span className="flex items-center gap-1 font-mono text-[11px]">
                      <Calendar className="w-3 h-3 text-[var(--text-muted)]" />
                      <span>Due: {order.pickupDateTime ? order.pickupDateTime.slice(0, 10) : 'TBD'}</span>
                    </span>

                    <span className="font-mono font-semibold text-[var(--text)]">
                      <AnimatedNumberMorph value={order.price} />
                    </span>
                  </div>

                  {order.notes && (
                    <p className="text-xs text-[var(--text-muted)] italic line-clamp-1">
                      &ldquo;{order.notes}&rdquo;
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between md:justify-end gap-2.5 pt-2 md:pt-0 border-t md:border-t-0 border-[var(--border)]">
                  <select
                    value={order.status}
                    onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                    className="h-8 px-2.5 rounded-full border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] text-xs font-medium focus:outline-none"
                  >
                    <option value="In Progress">In Progress</option>
                    <option value="Ready">Ready</option>
                    <option value="Picked Up">Picked Up</option>
                  </select>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEditOrder(order.id)}
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    <span>Edit</span>
                  </Button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] p-12 text-center">
            <ShoppingBag className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2" />
            <p className="text-sm text-[var(--text)] font-medium">No orders found</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Adjust your search filter or create a new commission.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={onNewOrder}
              className="mt-4"
            >
              New Order
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
