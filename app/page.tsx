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
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';

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
    setActiveScreen('clients');
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
      phone: newClientPhone.trim() || '+234 800 000 0000',
      email: newClientEmail.trim() || `${newClientName.toLowerCase().replace(/\s+/g, '.')}@client.com`,
      notes: newClientNotes.trim(),
    });

    setNewClientName('');
    setNewClientPhone('');
    setNewClientEmail('');
    setNewClientNotes('');
    setIsNewClientModalOpen(false);
    setSelectedClientId(created.id);
    setActiveScreen('clients');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)] transition-colors">
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
            onEditOrder={handleEditOrder}
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
          <div className="w-full max-w-md rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div>
                <h3 className="text-base font-semibold tracking-[-0.01em] text-[var(--text)]">
                  New Client Profile
                </h3>
                <p className="text-xs text-[var(--text-muted)]">Add client to atelier records</p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewClientModalOpen(false)}
                className="w-7 h-7 rounded-full bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text)] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-3.5 pt-1">
              <Input
                label="Full Name *"
                required
                placeholder="e.g. Adriana Kunle"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
              />

              <Input
                label="Phone Number"
                type="tel"
                placeholder="+234 - "
                value={newClientPhone}
                onChange={(e) => setNewClientPhone(e.target.value)}
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="name@example.com"
                value={newClientEmail}
                onChange={(e) => setNewClientEmail(e.target.value)}
              />

              <Textarea
                label="Bespoke Notes / Style Preferences"
                rows={2}
                placeholder="e.g. Sloped posture, silk lining preference..."
                value={newClientNotes}
                onChange={(e) => setNewClientNotes(e.target.value)}
              />

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsNewClientModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Create Client
                </Button>
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
