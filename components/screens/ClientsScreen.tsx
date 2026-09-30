'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  Calendar, 
  Scissors, 
  ArrowRight, 
  X,
  UserPlus,
  Sparkles,
  Check
} from 'lucide-react';

interface ClientsScreenProps {
  onOpenClient: (clientId: string) => void;
  onNewMeasurement: (clientId: string) => void;
  onNewOrder: (clientId: string) => void;
}

export function ClientsScreen({ 
  onOpenClient, 
  onNewMeasurement, 
  onNewOrder 
}: ClientsScreenProps) {
  const { clients, orders, snapshots, addClient, settings, setActiveScreen, setSelectedClientId } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const currency = settings.currency || '₦';

  // New Client form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+234 - ');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  // Filter clients by query
  const filteredClients = clients.filter((client) => {
    const q = searchQuery.toLowerCase();
    return (
      client.name.toLowerCase().includes(q) ||
      client.phone.toLowerCase().includes(q) ||
      client.email.toLowerCase().includes(q) ||
      (client.notes && client.notes.toLowerCase().includes(q))
    );
  });

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newClient = addClient({
      name: name.trim(),
      phone: phone.trim() || '+234 000 000 0000',
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@client.ng`,
      notes: notes.trim(),
    });

    setName('');
    setPhone('+234 - ');
    setEmail('');
    setNotes('');
    setShowNewClientModal(false);
    onOpenClient(newClient.id);
  };

  const getClientInitials = (clientName: string) => {
    return clientName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 py-4 space-y-6">
      {/* Top Banner & Search Bar */}
      <div className="bg-white rounded-3xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-gray-100/90 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-950 tracking-tight font-sans">
            Client Directory
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            {clients.length} active atelier clientele & bespoke measurement dossiers
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Search Bar */}
          <div className="relative flex-1 md:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clients by name, phone..."
              className="w-full h-11 pl-11 pr-8 rounded-full bg-[#f7f8fa] border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#1d4ed8] focus:bg-white transition-all placeholder:text-gray-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* New Client Button */}
          <button
            type="button"
            id="btn-add-client-page"
            onClick={() => setShowNewClientModal(true)}
            className="px-5 py-2.5 rounded-full bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-xs font-semibold shadow-xs transition-colors shrink-0 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>New Client</span>
          </button>
        </div>
      </div>

      {/* Clients Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredClients.map((client) => {
          const clientOrders = orders.filter((o) => o.clientId === client.id);
          const clientSnapshots = snapshots.filter((s) => s.clientId === client.id);
          const activeOrders = clientOrders.filter((o) => o.status !== 'Completed' && o.status !== 'Picked Up');
          const initials = getClientInitials(client.name);

          return (
            <div
              key={client.id}
              className="bg-white rounded-3xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-gray-100/90 hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Header: Avatar + Client Name */}
                <div className="flex items-center gap-3.5 pb-3 border-b border-gray-100">
                  <div className="w-12 h-12 rounded-full bg-[#e5e7eb] text-gray-800 font-bold text-sm flex items-center justify-center shrink-0 border border-gray-200/60 group-hover:bg-[#1d4ed8] group-hover:text-white transition-colors">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold text-gray-900 truncate">
                      {client.name}
                    </h3>
                    <p className="text-xs text-gray-400 truncate">
                      {client.phone}
                    </p>
                  </div>
                  {activeOrders.length > 0 ? (
                    <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[11px] font-semibold border border-amber-200/60 shrink-0">
                      ● {activeOrders.length} In Progress
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-[11px] font-medium shrink-0">
                      No active orders
                    </span>
                  )}
                </div>

                {/* Body Details */}
                <div className="py-3.5 space-y-2 text-xs text-gray-600">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="truncate">{client.email}</span>
                  </div>

                  {client.notes && (
                    <p className="text-[11px] text-gray-500 bg-[#f7f8fa] p-2.5 rounded-xl border border-gray-100 line-clamp-2 italic">
                      &ldquo;{client.notes}&rdquo;
                    </p>
                  )}

                  {/* Summary Metric Chips */}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="px-2.5 py-1 rounded-lg bg-gray-50 text-gray-700 text-[11px] font-medium border border-gray-100">
                      {clientSnapshots.length} Body Snapshot{clientSnapshots.length === 1 ? '' : 's'}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-gray-50 text-gray-700 text-[11px] font-medium border border-gray-100">
                      {clientOrders.length} Commission{clientOrders.length === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onOpenClient(client.id)}
                  className="flex-1 py-2 px-3 rounded-full border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors text-center"
                >
                  View Dossier
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedClientId(client.id);
                    setActiveScreen('overview');
                  }}
                  className="py-2 px-4 rounded-full bg-[#1d4ed8] text-white text-xs font-semibold hover:bg-[#1e40af] transition-colors flex items-center gap-1.5 shadow-xs"
                  title="Load to 3D Mannequin Workstation"
                >
                  <Scissors className="w-3.5 h-3.5" />
                  <span>Measure</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredClients.length === 0 && (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100/90 shadow-xs">
          <p className="text-gray-500 text-sm">No clients matched &quot;{searchQuery}&quot;</p>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="mt-3 text-xs font-semibold text-[#1d4ed8] hover:underline"
          >
            Clear search filters
          </button>
        </div>
      )}

      {/* New Client Modal */}
      {showNewClientModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-950 font-sans">
                  New Client Profile
                </h3>
                <p className="text-xs text-gray-400">Add client to atelier records</p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewClientModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:text-gray-900 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Adriana Kunle"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-[#f7f8fa] border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#1d4ed8] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+234 - "
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-[#f7f8fa] border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#1d4ed8] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-[#f7f8fa] border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#1d4ed8] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Bespoke Notes / Style Preferences
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Silk lining preference, monogram cuff..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[#f7f8fa] border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-[#1d4ed8] focus:bg-white resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowNewClientModal(false)}
                  className="px-4 py-2 rounded-full border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-[#1d4ed8] text-white text-xs font-semibold hover:bg-[#1e40af] shadow-xs"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
