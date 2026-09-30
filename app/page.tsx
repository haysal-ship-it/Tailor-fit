'use client';

import React, { useState } from 'react';
import { StoreProvider, useStore } from '@/lib/store';
import { Navbar } from '@/components/Navbar';
import { OverviewScreen } from '@/components/screens/OverviewScreen';
import { DashboardScreen } from '@/components/screens/DashboardScreen';
import { ClientsScreen } from '@/components/screens/ClientsScreen';
import { ClientProfileScreen } from '@/components/screens/ClientProfileScreen';
import { MeasurementCaptureScreen } from '@/components/screens/MeasurementCaptureScreen';
import { OrdersScreen } from '@/components/screens/OrdersScreen';
import { PickupCalendarScreen } from '@/components/screens/PickupCalendarScreen';
import { SettingsScreen } from '@/components/screens/SettingsScreen';
import { OrderFormModal } from '@/components/screens/OrderFormModal';
import { X, UserPlus } from 'lucide-react';

function TailorFitApp() {
  const { 
    activeScreen, 
    setActiveScreen, 
    setSelectedClientId, 
    setSelectedOrderId, 
    setSelectedSnapshotId,
    addClient 
  } = useStore();

  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderModalOrderId, setOrderModalOrderId] = useState<string | undefined>(undefined);
  const [orderModalClientId, setOrderModalClientId] = useState<string | undefined>(undefined);

  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientNotes, setNewClientNotes] = useState('');

  // Handlers for cross-screen navigation
  const handleOpenClient = (clientId: string) => {
    setSelectedClientId(clientId);
    setActiveScreen('client-profile');
  };

  const handleOpenNewOrder = (clientId?: string) => {
    setOrderModalClientId(clientId);
    setOrderModalOrderId(undefined);
    setIsOrderModalOpen(true);
  };

  const handleEditOrder = (orderId: string) => {
    setOrderModalOrderId(orderId);
    setOrderModalClientId(undefined);
    setIsOrderModalOpen(true);
  };

  const handleNewMeasurement = (clientId?: string) => {
    if (clientId) {
      setSelectedClientId(clientId);
    }
    setSelectedSnapshotId(null);
    setActiveScreen('new-measurement');
  };

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;

    const created = addClient({
      name: newClientName.trim(),
      phone: newClientPhone.trim() || '+1 (555) 000-0000',
      email: newClientEmail.trim() || `${newClientName.toLowerCase().replace(/\s+/g, '.')}@client.com`,
      notes: newClientNotes.trim(),
    });

    setNewClientName('');
    setNewClientPhone('');
    setNewClientEmail('');
    setNewClientNotes('');
    setIsNewClientModalOpen(false);
    setSelectedClientId(created.id);
    setActiveScreen('client-profile');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#eaedf0] text-gray-950">
      {/* Navigation Header */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 w-full pb-16">
        {(activeScreen === 'overview' || activeScreen === 'dashboard') && (
          <OverviewScreen
            onOpenClient={handleOpenClient}
            onOpenOrder={handleEditOrder}
          />
        )}

        {activeScreen === 'clients' && (
          <ClientsScreen
            onOpenClient={handleOpenClient}
            onNewMeasurement={handleNewMeasurement}
            onNewOrder={(cid) => handleOpenNewOrder(cid)}
          />
        )}

        {activeScreen === 'client-profile' && (
          <ClientProfileScreen
            onNewOrder={(cid) => handleOpenNewOrder(cid)}
            onNewMeasurement={handleNewMeasurement}
            onEditOrder={handleEditOrder}
          />
        )}

        {(activeScreen === 'new-measurement' || activeScreen === 'edit-measurement') && (
          <MeasurementCaptureScreen />
        )}

        {activeScreen === 'orders' && (
          <OrdersScreen
            onNewOrder={() => handleOpenNewOrder()}
            onEditOrder={handleEditOrder}
            onOpenClient={handleOpenClient}
          />
        )}

        {activeScreen === 'calendar' && (
          <PickupCalendarScreen
            onNewOrder={() => handleOpenNewOrder()}
            onOpenOrder={handleEditOrder}
            onOpenClient={handleOpenClient}
          />
        )}

        {activeScreen === 'settings' && <SettingsScreen />}
      </main>

      {/* Order Create/Edit Modal */}
      {isOrderModalOpen && (
        <OrderFormModal
          orderId={orderModalOrderId}
          initialClientId={orderModalClientId}
          onClose={() => setIsOrderModalOpen(false)}
        />
      )}

      {/* Quick New Client Modal */}
      {isNewClientModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-950 font-sans">New Client Profile</h3>
                <p className="text-xs text-gray-400">Add client to atelier records</p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewClientModalOpen(false)}
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
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
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
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
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
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-[#f7f8fa] border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#1d4ed8] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Bespoke Notes / Style Preferences
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Sloped posture, silk lining preference..."
                  value={newClientNotes}
                  onChange={(e) => setNewClientNotes(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[#f7f8fa] border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-[#1d4ed8] focus:bg-white resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsNewClientModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-[#1d4ed8] text-white text-xs font-semibold hover:bg-[#1e40af] shadow-xs"
                >
                  Create Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <StoreProvider>
      <TailorFitApp />
    </StoreProvider>
  );
}
