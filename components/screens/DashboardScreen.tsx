'use client';

import React from 'react';
import { useStore } from '@/lib/store';
import { 
  Plus, 
  Calendar, 
  Clock, 
  ShoppingBag, 
  Users, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  Scissors, 
  Sparkles
} from 'lucide-react';

interface DashboardScreenProps {
  onNewClient: () => void;
  onNewOrder: () => void;
  onOpenClient: (clientId: string) => void;
  onOpenOrder: (orderId: string) => void;
}

export function DashboardScreen({
  onNewClient,
  onNewOrder,
  onOpenClient,
  onOpenOrder,
}: DashboardScreenProps) {
  const { 
    clients, 
    orders, 
    snapshots, 
    setActiveScreen, 
    getOrdersDueToday, 
    getOrdersOverdue, 
    getOrdersDueThisWeek, 
    getOrdersReady,
    getClientById,
    updateOrderStatus
  } = useStore();

  const ordersDueToday = getOrdersDueToday();
  const ordersOverdue = getOrdersOverdue();
  const ordersDueThisWeek = getOrdersDueThisWeek();
  const ordersReady = getOrdersReady();

  // Sort recent clients by createdAt or last visit
  const recentClients = [...clients].slice(0, 5);

  const urgentOrders = [...ordersOverdue, ...ordersDueToday];

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 py-8 pb-24 space-y-10">
      {/* Studio Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-[#ebe8e4]">
        <div>
          <span className="text-[11px] font-mono tracking-wider text-[#a59f97] uppercase">
            Atelier Overview · Today is {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </span>
          <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-[#000000] mt-1">
            Studio Workshop
          </h1>
          <p className="text-[14px] text-[#777169] mt-1">
            Bespoke client fittings, active garment commissions & scheduled pickups
          </p>
        </div>

        {/* Primary Quick-Add Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onNewClient}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#ebe8e4] bg-[#fdfcfc] text-[#000000] text-[13px] font-medium hover:bg-[#f5f3f1] transition-colors"
          >
            <Users className="w-3.5 h-3.5 text-[#44403b]" />
            <span>New Client</span>
          </button>
          <button
            type="button"
            onClick={onNewOrder}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#000000] text-white text-[13px] font-medium hover:bg-[#222222] transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Order</span>
          </button>
        </div>
      </div>

      {/* Primary Status Bands Above the Fold (Taupe Surface Cards) */}
      <div className="space-y-4">
        <h2 className="text-[13px] font-mono uppercase tracking-wider text-[#a59f97]">
          Order Priorities & Pickup Schedule
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Orders Due Today & Overdue */}
          <div className="bg-[#f5f3f1] rounded-[20px] p-6 flex flex-col justify-between transition-all hover:bg-[#f2efe9]">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[13px] font-medium text-[#44403b]">
                  Due Today / Overdue
                </span>
                {urgentOrders.length > 0 ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-[#ff4704] text-white text-[11px] font-medium font-mono">
                    {urgentOrders.length} Urgent
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-[#ebe8e4] text-[#777169] text-[11px]">
                    All Clear
                  </span>
                )}
              </div>
              <div className="text-3xl sm:text-4xl font-light font-mono text-[#000000]">
                {urgentOrders.length}
              </div>
              <p className="text-[12px] text-[#777169] mt-2 leading-snug">
                {urgentOrders.length > 0
                  ? `${urgentOrders.length} order${urgentOrders.length === 1 ? '' : 's'} scheduled for client collection today`
                  : 'No overdue or due-today pickups at this hour'}
              </p>
            </div>

            {urgentOrders.length > 0 && (
              <div className="mt-5 pt-4 border-t border-[#ebe8e4] space-y-2">
                {urgentOrders.slice(0, 2).map((ord) => {
                  const client = getClientById(ord.clientId);
                  return (
                    <div
                      key={ord.id}
                      onClick={() => onOpenClient(ord.clientId)}
                      className="text-[12px] flex items-center justify-between p-2 rounded-[10px] bg-[#fdfcfc] cursor-pointer hover:border-[#000000] border border-[#ebe8e4]"
                    >
                      <span className="font-medium text-[#000000] truncate">
                        {client?.name || 'Client'} · {ord.garmentType}
                      </span>
                      <span className="font-mono text-[#ff4704] font-medium text-[11px] shrink-0 ml-2">
                        {ord.pickupDateTime.slice(11, 16)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Card 2: Orders Due This Week */}
          <div className="bg-[#f5f3f1] rounded-[20px] p-6 flex flex-col justify-between transition-all hover:bg-[#f2efe9]">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[13px] font-medium text-[#44403b]">
                  Due This Week
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#ebe8e4] text-[#44403b] text-[11px] font-mono">
                  Next 7 Days
                </span>
              </div>
              <div className="text-3xl sm:text-4xl font-light font-mono text-[#000000]">
                {ordersDueThisWeek.length}
              </div>
              <p className="text-[12px] text-[#777169] mt-2 leading-snug">
                Bespoke pieces nearing final fittings or readying for pressing
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-[#ebe8e4]">
              <button
                type="button"
                onClick={() => setActiveScreen('calendar')}
                className="text-[12px] font-medium text-[#000000] hover:underline flex items-center gap-1"
              >
                <span>View in Pickup Calendar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 3: Orders Ready for Pickup */}
          <div className="bg-[#f5f3f1] rounded-[20px] p-6 flex flex-col justify-between transition-all hover:bg-[#f2efe9]">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[13px] font-medium text-[#44403b]">
                  Ready for Pickup
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#ebe8e4] text-[#44403b] text-[11px] font-mono">
                  Finished
                </span>
              </div>
              <div className="text-3xl sm:text-4xl font-light font-mono text-[#000000]">
                {ordersReady.length}
              </div>
              <p className="text-[12px] text-[#777169] mt-2 leading-snug">
                Garments pressed, inspected & packaged in suit bags
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-[#ebe8e4]">
              <button
                type="button"
                onClick={() => setActiveScreen('orders')}
                className="text-[12px] font-medium text-[#000000] hover:underline flex items-center gap-1"
              >
                <span>View All Ready Orders</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Active Workroom Feed & Recent Clients Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Recent Clients List (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-light text-[#000000]">Recent Clients</h2>
              <p className="text-[12px] text-[#777169]">
                Tap any client to view measurement snapshots & style boards
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveScreen('clients')}
              className="text-[12px] font-medium text-[#000000] hover:underline flex items-center gap-1"
            >
              <span>All Clients ({clients.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {recentClients.map((client) => {
              const clientOrders = orders.filter((o) => o.clientId === client.id);
              const clientSnapshots = snapshots.filter((s) => s.clientId === client.id);
              const activeOrder = clientOrders.find((o) => o.status !== 'Picked Up');

              return (
                <div
                  key={client.id}
                  onClick={() => onOpenClient(client.id)}
                  className="bg-[#f5f3f1] rounded-[20px] p-4.5 sm:p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-[#ece8e2] transition-colors group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-full bg-[#000000] text-white flex items-center justify-center font-mono text-sm font-light shrink-0">
                      {client.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-[15px] font-medium text-[#000000] truncate group-hover:text-[#0447ff] transition-colors">
                          {client.name}
                        </h4>
                        {activeOrder && (
                          <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-[#ebe8e4] text-[#44403b] text-[10px] font-medium font-mono">
                            {activeOrder.garmentType}
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] text-[#777169] truncate font-mono">
                        {client.phone} · {clientSnapshots.length} snapshot{clientSnapshots.length === 1 ? '' : 's'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex items-center gap-3">
                    <div className="hidden sm:block">
                      <span className="text-[11px] font-mono text-[#a59f97]">
                        {clientOrders.length} order{clientOrders.length === 1 ? '' : 's'}
                      </span>
                    </div>
                    <div className="w-7 h-7 rounded-full border border-[#ebe8e4] bg-[#fdfcfc] flex items-center justify-center text-[#777169] group-hover:text-[#000000]">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Today's Pickups & Quick Tools (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Quick Schedule Today Card */}
          <div className="bg-[#f5f3f1] rounded-[20px] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-medium text-[#000000] flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#777169]" />
                <span>Today&apos;s Fitting & Pickup Desk</span>
              </h3>
              <span className="text-[11px] font-mono text-[#a59f97]">
                {new Date().toISOString().slice(0, 10)}
              </span>
            </div>

            {urgentOrders.length > 0 ? (
              <div className="space-y-2.5">
                {urgentOrders.map((ord) => {
                  const client = getClientById(ord.clientId);
                  return (
                    <div
                      key={ord.id}
                      className="p-3 rounded-[14px] bg-[#fdfcfc] border border-[#ebe8e4] space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-medium text-[#000000]">
                          {client?.name || 'Client'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-[#ff4704] text-white text-[10px] font-mono font-medium">
                          {ord.pickupDateTime.slice(11, 16) || 'Today'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[12px] text-[#777169]">
                        <span>{ord.garmentType}</span>
                        <span className="font-mono font-medium text-[#000000]">${ord.price}</span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-[#ebe8e4]">
                        <button
                          type="button"
                          onClick={() => onOpenOrder(ord.id)}
                          className="text-[11px] font-medium text-[#0447ff] hover:underline"
                        >
                          View Details
                        </button>
                        <button
                          type="button"
                          onClick={() => updateOrderStatus(ord.id, 'Picked Up')}
                          className="px-2.5 py-0.5 rounded-full border border-[#ebe8e4] text-[#44403b] text-[11px] hover:bg-[#ebe8e4]"
                        >
                          Mark Collected
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 text-center text-[#777169] text-[13px] bg-[#fdfcfc] rounded-[14px] border border-dashed border-[#ebe8e4]">
                No pending pickups scheduled for today.
              </div>
            )}
          </div>

          {/* Atelier Pro-Tip: 2D Mannequin Quick Launch */}
          <div className="bg-[#f5f3f1] rounded-[20px] p-6 relative overflow-hidden">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[#000000] text-white flex items-center justify-center shrink-0">
                <Scissors className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h4 className="text-[14px] font-medium text-[#000000]">
                  Interactive Body Diagram
                </h4>
                <p className="text-[12px] text-[#777169] leading-relaxed">
                  Record exact anatomical landmarks directly on front and back silhouettes. Filter points by garment job.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveScreen('new-measurement')}
                  className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-medium text-[#000000] hover:underline"
                >
                  <span>Open Measurement Mannequin</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
