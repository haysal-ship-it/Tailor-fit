'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { OrderStatus, Order } from '@/types';
import { 
  Search, 
  Plus, 
  Calendar, 
  Clock, 
  ShoppingBag, 
  Image as ImageIcon, 
  User, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle,
  Filter,
  X
} from 'lucide-react';

interface OrdersScreenProps {
  onNewOrder: () => void;
  onEditOrder: (orderId: string) => void;
  onOpenClient: (clientId: string) => void;
}

export function OrdersScreen({ onNewOrder, onEditOrder, onOpenClient }: OrdersScreenProps) {
  const { orders, clients, getClientById, updateOrderStatus } = useStore();

  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [timeFilter, setTimeFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const todayStr = new Date().toISOString().slice(0, 10);

  // Filter logic
  const filteredOrders = orders.filter((order) => {
    const client = getClientById(order.clientId);
    const clientName = client?.name || '';
    const q = searchQuery.toLowerCase();

    // Search
    if (q) {
      const matchSearch =
        clientName.toLowerCase().includes(q) ||
        order.garmentType.toLowerCase().includes(q) ||
        order.id.toLowerCase().includes(q) ||
        (order.notes && order.notes.toLowerCase().includes(q));
      if (!matchSearch) return false;
    }

    // Status filter
    if (statusFilter !== 'All' && order.status !== statusFilter) {
      return false;
    }

    // Time filter
    const pickupDate = order.pickupDateTime ? order.pickupDateTime.slice(0, 10) : '';
    if (timeFilter === 'urgent') {
      if (order.status === 'Picked Up') return false;
      return pickupDate <= todayStr;
    } else if (timeFilter === 'this-week') {
      const now = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(now.getDate() + 7);
      const nextWeekStr = nextWeek.toISOString().slice(0, 10);
      return pickupDate >= todayStr && pickupDate <= nextWeekStr;
    }

    return true;
  });

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 py-8 pb-24 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#ebe8e4]">
        <div>
          <span className="text-[11px] font-mono tracking-wider text-[#a59f97] uppercase">
            Commissions & Fittings
          </span>
          <h1 className="text-3xl font-light tracking-tight text-[#000000] mt-1">
            Garment Orders
          </h1>
          <p className="text-[13px] text-[#777169] mt-0.5">
            Active atelier jobs, pickup appointments & progress status
          </p>
        </div>

        <button
          type="button"
          onClick={onNewOrder}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#000000] text-white text-[13px] font-medium hover:bg-[#222222] transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Order</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
        {/* Status Tabs */}
        <div className="inline-flex rounded-full bg-[#f5f3f1] p-1 border border-[#ebe8e4] overflow-x-auto no-scrollbar">
          {['All', 'In Progress', 'Ready', 'Picked Up'].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-all shrink-0 ${
                statusFilter === status
                  ? 'bg-[#000000] text-white shadow-xs'
                  : 'text-[#777169] hover:text-[#000000]'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Time Filters & Search */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="h-9 px-3 rounded-full border border-[#ebe8e4] bg-[#f5f3f1] text-[#000000] text-[12px] font-medium focus:outline-none"
          >
            <option value="All">All Dates</option>
            <option value="urgent">Due Today / Overdue</option>
            <option value="this-week">Due This Week</option>
          </select>

          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-[#a59f97] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search orders..."
              className="w-full h-9 pl-9 pr-3 rounded-full border border-[#ebe8e4] bg-[#f5f3f1] text-[#000000] text-[13px] focus:outline-none focus:bg-[#fdfcfc] focus:border-[#000000]"
            />
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => {
            const client = getClientById(order.clientId);
            const pickupDate = order.pickupDateTime ? order.pickupDateTime.slice(0, 10) : '';
            const isUrgent = order.status !== 'Picked Up' && pickupDate && pickupDate <= todayStr;

            return (
              <div
                key={order.id}
                className="bg-[#f5f3f1] rounded-[20px] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:bg-[#ece8e2]"
              >
                {/* Left info */}
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-[16px] font-medium text-[#000000]">
                      {order.garmentType}
                    </span>

                    {/* Status badge */}
                    {isUrgent ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-[#ff4704] text-white text-[11px] font-medium font-mono">
                        {pickupDate === todayStr ? 'Due Today' : 'Overdue'}
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-[#ebe8e4] text-[#44403b] text-[11px] font-medium font-mono">
                        {order.status}
                      </span>
                    )}

                    <span className="text-[11px] font-mono text-[#a59f97]">
                      #{order.id}
                    </span>
                  </div>

                  {/* Client & Pickup details */}
                  <div className="flex items-center gap-4 text-[13px] text-[#777169] flex-wrap">
                    <button
                      type="button"
                      onClick={() => onOpenClient(order.clientId)}
                      className="text-[#000000] font-medium hover:underline flex items-center gap-1.5"
                    >
                      <User className="w-3.5 h-3.5 text-[#a59f97]" />
                      <span>{client?.name || 'Unknown Client'}</span>
                    </button>

                    <span className="flex items-center gap-1.5 font-mono text-[12px]">
                      <Calendar className="w-3.5 h-3.5 text-[#a59f97]" />
                      <span>
                        Pickup:{' '}
                        {new Date(order.pickupDateTime).toLocaleDateString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        at {order.pickupDateTime.slice(11, 16)}
                      </span>
                    </span>

                    <span className="font-mono font-medium text-[#000000]">
                      ${order.price}
                    </span>
                  </div>

                  {order.notes && (
                    <p className="text-[12px] text-[#44403b] italic line-clamp-1">
                      &ldquo;{order.notes}&rdquo;
                    </p>
                  )}

                  {/* Reference Image Thumbnails */}
                  {order.referenceImages.length > 0 && (
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[11px] font-mono text-[#a59f97] flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" />
                        <span>{order.referenceImages.length} references:</span>
                      </span>
                      <div className="flex items-center gap-1.5">
                        {order.referenceImages.slice(0, 4).map((img, i) => (
                          <img
                            key={img.id || i}
                            src={img.url}
                            alt={img.title || 'Swatch'}
                            className="w-6 h-6 rounded-[6px] object-cover border border-[#ebe8e4]"
                            title={img.title || img.note}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right actions: Status select & Edit */}
                <div className="flex items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-[#ebe8e4]">
                  <select
                    value={order.status}
                    onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                    className="h-9 px-3 rounded-full border border-[#ebe8e4] bg-[#fdfcfc] text-[#000000] text-[12px] font-medium focus:outline-none"
                  >
                    <option value="In Progress">In Progress</option>
                    <option value="Ready">Ready</option>
                    <option value="Picked Up">Picked Up</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => onEditOrder(order.id)}
                    className="px-4 py-2 rounded-full border border-[#ebe8e4] bg-[#fdfcfc] text-[#000000] text-[12px] font-medium hover:bg-[#ebe8e4] transition-colors"
                  >
                    Edit
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-[#f5f3f1] rounded-[20px] p-12 text-center">
            <ShoppingBag className="w-10 h-10 text-[#a59f97] mx-auto mb-3" />
            <p className="text-[16px] text-[#44403b] font-light">No orders match filter</p>
            <p className="text-[13px] text-[#777169] mt-1">
              Clear filters or create a new commission order.
            </p>
            <button
              type="button"
              onClick={onNewOrder}
              className="mt-4 px-5 py-2.5 rounded-full bg-[#000000] text-white text-[13px] font-medium"
            >
              Create New Order
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
