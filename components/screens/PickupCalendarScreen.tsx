'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { Order } from '@/types';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Phone, 
  ShoppingBag, 
  Plus,
  CheckCircle2
} from 'lucide-react';

interface PickupCalendarScreenProps {
  onNewOrder: () => void;
  onOpenOrder: (orderId: string) => void;
  onOpenClient: (clientId: string) => void;
}

export function PickupCalendarScreen({
  onNewOrder,
  onOpenOrder,
  onOpenClient,
}: PickupCalendarScreenProps) {
  const { orders, getClientById, updateOrderStatus } = useStore();

  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 8, 9)); // September 9, 2026
  const [selectedDayStr, setSelectedDayStr] = useState<string>('2026-09-09');
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');

  const todayStr = '2026-09-09';

  // Calendar calculations for Month view
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  // Day of week index (0 is Sunday, 1 is Monday...)
  const startDayIndex = firstDayOfMonth.getDay();
  const totalDays = lastDayOfMonth.getDate();

  // Prev month filler days
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  const calendarDays: { dayNum: number; dateStr: string; isCurrentMonth: boolean }[] = [];

  for (let i = startDayIndex - 1; i >= 0; i--) {
    const d = prevMonthLastDay - i;
    const m = month === 0 ? 12 : month;
    const y = month === 0 ? year - 1 : year;
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarDays.push({ dayNum: d, dateStr, isCurrentMonth: false });
  }

  for (let i = 1; i <= totalDays; i++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    calendarDays.push({ dayNum: i, dateStr, isCurrentMonth: true });
  }

  // Next month filler days to complete 35 or 42 grid
  const remainingDays = 35 - calendarDays.length;
  if (remainingDays > 0) {
    for (let i = 1; i <= remainingDays; i++) {
      const m = month + 2 > 12 ? 1 : month + 2;
      const y = month + 2 > 12 ? year + 1 : year;
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      calendarDays.push({ dayNum: i, dateStr, isCurrentMonth: false });
    }
  }

  const navigateMonth = (delta: number) => {
    setCurrentDate(new Date(year, month + delta, 1));
  };

  const jumpToToday = () => {
    const now = new Date(2026, 8, 9);
    setCurrentDate(now);
    setSelectedDayStr('2026-09-09');
  };

  // Orders on selected day
  const ordersOnSelectedDay = orders.filter((o) => {
    const pDate = o.pickupDateTime ? o.pickupDateTime.slice(0, 10) : '';
    return pDate === selectedDayStr;
  });

  // Week View generator
  const getWeekDates = () => {
    const base = new Date(selectedDayStr);
    const dayOfWeek = base.getDay(); // 0 is Sunday
    const week: { dayNum: number; dateStr: string; dayName: string }[] = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() - dayOfWeek + i);
      const str = d.toISOString().slice(0, 10);
      week.push({
        dayNum: d.getDate(),
        dateStr: str,
        dayName: dayNames[i],
      });
    }
    return week;
  };

  const weekDates = getWeekDates();

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 py-8 pb-24 space-y-8">
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#ebe8e4]">
        <div>
          <span className="text-[11px] font-mono tracking-wider text-[#a59f97] uppercase">
            Atelier Schedule
          </span>
          <h1 className="text-3xl font-light tracking-tight text-[#000000] mt-1">
            Pickup Calendar
          </h1>
          <p className="text-[13px] text-[#777169] mt-0.5">
            Client garment appointments, fitting collections & status tracking
          </p>
        </div>

        {/* View Switcher & Today */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="inline-flex rounded-full bg-[#f5f3f1] p-1 border border-[#ebe8e4]">
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-all ${
                viewMode === 'month'
                  ? 'bg-[#000000] text-white shadow-xs'
                  : 'text-[#777169] hover:text-[#000000]'
              }`}
            >
              Month View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-all ${
                viewMode === 'week'
                  ? 'bg-[#000000] text-white shadow-xs'
                  : 'text-[#777169] hover:text-[#000000]'
              }`}
            >
              Week View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-all ${
                viewMode === 'day'
                  ? 'bg-[#000000] text-white shadow-xs'
                  : 'text-[#777169] hover:text-[#000000]'
              }`}
            >
              Day View
            </button>
          </div>

          <button
            type="button"
            onClick={jumpToToday}
            className="px-3.5 py-1.5 rounded-full border border-[#ebe8e4] bg-[#fdfcfc] text-[#000000] text-[12px] font-medium hover:bg-[#f5f3f1] transition-colors"
          >
            Today
          </button>
        </div>
      </div>

      {/* Navigation Controls: Month Title & Arrows */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-light text-[#000000] font-sans">
          {currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </h2>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => navigateMonth(-1)}
            className="w-8 h-8 rounded-full border border-[#ebe8e4] bg-[#fdfcfc] flex items-center justify-center text-[#44403b] hover:bg-[#f5f3f1] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => navigateMonth(1)}
            className="w-8 h-8 rounded-full border border-[#ebe8e4] bg-[#fdfcfc] flex items-center justify-center text-[#44403b] hover:bg-[#f5f3f1] transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* View 1: Month View Grid */}
      {viewMode === 'month' && (
        <div className="bg-[#f5f3f1] rounded-[24px] p-4 sm:p-6 border border-[#ebe8e4]">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 text-center pb-3 border-b border-[#ebe8e4] text-[11px] font-mono text-[#a59f97] uppercase">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Calendar Day Cells */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mt-2">
            {calendarDays.map((cell, idx) => {
              const isSelected = selectedDayStr === cell.dateStr;
              const isToday = todayStr === cell.dateStr;

              // Find orders on this date
              const dayOrders = orders.filter((o) => {
                const d = o.pickupDateTime ? o.pickupDateTime.slice(0, 10) : '';
                return d === cell.dateStr;
              });

              // Check if any order is overdue or due today
              const hasUrgent = dayOrders.some(
                (o) => o.status !== 'Picked Up' && cell.dateStr <= todayStr
              );

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDayStr(cell.dateStr)}
                  className={`min-h-[84px] sm:min-h-[96px] p-2 rounded-[14px] cursor-pointer transition-all flex flex-col justify-between border ${
                    isSelected
                      ? 'bg-[#fdfcfc] border-[#000000] shadow-xs'
                      : cell.isCurrentMonth
                      ? 'bg-[#fdfcfc]/70 border-[#ebe8e4] hover:bg-[#fdfcfc]'
                      : 'bg-transparent border-transparent opacity-40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[12px] font-mono font-medium ${
                        isToday
                          ? 'w-5 h-5 rounded-full bg-[#000000] text-white flex items-center justify-center'
                          : isSelected
                          ? 'text-[#000000] font-bold'
                          : 'text-[#44403b]'
                      }`}
                    >
                      {cell.dayNum}
                    </span>

                    {dayOrders.length > 0 && (
                      <span
                        className={`w-2 h-2 rounded-full ${
                          hasUrgent ? 'bg-[#ff4704]' : 'bg-[#44403b]'
                        }`}
                        title={`${dayOrders.length} pickups`}
                      />
                    )}
                  </div>

                  {/* Micro list of orders on this date */}
                  <div className="space-y-1 mt-1 overflow-hidden">
                    {dayOrders.slice(0, 2).map((ord) => {
                      const client = getClientById(ord.clientId);
                      const isOrderUrgent =
                        ord.status !== 'Picked Up' && cell.dateStr <= todayStr;

                      return (
                        <div
                          key={ord.id}
                          className={`text-[10px] px-1.5 py-0.5 rounded-[4px] truncate font-mono ${
                            isOrderUrgent
                              ? 'bg-[#ff4704]/10 text-[#ff4704] font-medium'
                              : 'bg-[#ebe8e4] text-[#44403b]'
                          }`}
                        >
                          {client?.name.split(' ')[0] || 'Client'} · {ord.garmentType.split('/')[0]}
                        </div>
                      );
                    })}
                    {dayOrders.length > 2 && (
                      <span className="text-[9px] font-mono text-[#a59f97] block pl-1">
                        +{dayOrders.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* View 2: Week View Strip */}
      {viewMode === 'week' && (
        <div className="bg-[#f5f3f1] rounded-[24px] p-5 border border-[#ebe8e4] space-y-4">
          <div className="grid grid-cols-7 gap-2 text-center">
            {weekDates.map((w, idx) => {
              const isSelected = selectedDayStr === w.dateStr;
              const isToday = todayStr === w.dateStr;
              const dayOrders = orders.filter((o) => o.pickupDateTime?.slice(0, 10) === w.dateStr);
              const hasUrgent = dayOrders.some(
                (o) => o.status !== 'Picked Up' && w.dateStr <= todayStr
              );

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedDayStr(w.dateStr)}
                  className={`p-3 rounded-[16px] border transition-all text-center flex flex-col items-center gap-1 ${
                    isSelected
                      ? 'bg-[#fdfcfc] border-[#000000] shadow-xs'
                      : 'bg-[#fdfcfc]/60 border-[#ebe8e4] hover:bg-[#fdfcfc]'
                  }`}
                >
                  <span className="text-[11px] font-mono text-[#a59f97] uppercase">{w.dayName}</span>
                  <span
                    className={`text-[16px] font-mono font-medium ${
                      isToday
                        ? 'w-7 h-7 rounded-full bg-[#000000] text-white flex items-center justify-center'
                        : 'text-[#000000]'
                    }`}
                  >
                    {w.dayNum}
                  </span>
                  {dayOrders.length > 0 && (
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                        hasUrgent
                          ? 'bg-[#ff4704] text-white font-semibold'
                          : 'bg-[#ebe8e4] text-[#44403b]'
                      }`}
                    >
                      {dayOrders.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Day View Detail Section: Lists scheduled orders for selected day */}
      <div className="bg-[#f5f3f1] rounded-[24px] p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#ebe8e4]">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-light text-[#000000]">
                {new Date(selectedDayStr).toLocaleDateString(undefined, {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </h3>
              {selectedDayStr === todayStr && (
                <span className="px-2.5 py-0.5 rounded-full bg-[#000000] text-white text-[11px] font-mono font-medium">
                  Today
                </span>
              )}
            </div>
            <p className="text-[12px] text-[#777169] mt-0.5">
              {ordersOnSelectedDay.length} pickup commission{ordersOnSelectedDay.length === 1 ? '' : 's'} scheduled
            </p>
          </div>

          <button
            type="button"
            onClick={onNewOrder}
            className="px-4 py-2 rounded-full bg-[#000000] text-white text-[12px] font-medium hover:bg-[#222222] inline-flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule Pickup</span>
          </button>
        </div>

        {/* List of Orders on Selected Day */}
        {ordersOnSelectedDay.length > 0 ? (
          <div className="space-y-3">
            {ordersOnSelectedDay.map((order) => {
              const client = getClientById(order.clientId);
              const isUrgent =
                order.status !== 'Picked Up' && selectedDayStr <= todayStr;

              return (
                <div
                  key={order.id}
                  className="bg-[#fdfcfc] rounded-[18px] p-5 border border-[#ebe8e4] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[14px] font-semibold text-[#000000]">
                        {order.pickupDateTime.slice(11, 16) || '14:00'}
                      </span>
                      <span className="text-[15px] font-medium text-[#000000]">
                        {order.garmentType}
                      </span>
                      {isUrgent ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-[#ff4704] text-white text-[10px] font-mono font-medium">
                          {selectedDayStr === todayStr ? 'Due Today' : 'Overdue'}
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-[#ebe8e4] text-[#44403b] text-[10px] font-mono font-medium">
                          {order.status}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[13px] text-[#777169] flex-wrap">
                      <button
                        type="button"
                        onClick={() => onOpenClient(order.clientId)}
                        className="text-[#000000] font-medium hover:underline flex items-center gap-1"
                      >
                        <User className="w-3.5 h-3.5 text-[#a59f97]" />
                        <span>{client?.name || 'Client'}</span>
                      </button>
                      {client?.phone && (
                        <a
                          href={`tel:${client.phone}`}
                          className="flex items-center gap-1 hover:underline font-mono text-[12px]"
                        >
                          <Phone className="w-3 h-3 text-[#a59f97]" />
                          <span>{client.phone}</span>
                        </a>
                      )}
                      <span className="font-mono font-medium text-[#000000]">
                        ${order.price}
                      </span>
                    </div>

                    {order.notes && (
                      <p className="text-[12px] text-[#44403b] italic">
                        &ldquo;{order.notes}&rdquo;
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value as any)}
                      className="h-8 px-3 rounded-full border border-[#ebe8e4] bg-[#f5f3f1] text-[#000000] text-[12px] font-medium focus:outline-none"
                    >
                      <option value="In Progress">In Progress</option>
                      <option value="Ready">Ready</option>
                      <option value="Picked Up">Picked Up</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => onOpenOrder(order.id)}
                      className="px-3 py-1.5 rounded-full border border-[#ebe8e4] text-[#44403b] text-[12px] font-medium hover:bg-[#ebe8e4] transition-colors"
                    >
                      View Order
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-10 text-center text-[#777169] text-[13px]">
            No client pickups scheduled for this date.
          </div>
        )}
      </div>
    </div>
  );
}
