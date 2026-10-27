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
import { X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { ToastContainer, type ToastMessage } from '@/components/ui/Toasts';

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
  const [clientFormErrors, setClientFormErrors] = useState<{
    name?: string;
    phone?: string;
    email?: string;
  }>({});
  const [clientModalAlert, setClientModalAlert] = useState<string | null>(null);

  // System toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const showToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
  };
  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

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

    const trimmedName = newClientName.trim();
    const trimmedPhone = newClientPhone.trim();
    const trimmedEmail = newClientEmail.trim();

    const errors: { name?: string; phone?: string; email?: string } = {};
    const missing: string[] = [];

    if (!trimmedName) {
      errors.name = 'Full Name is required';
      missing.push('Full Name');
    }
    if (!trimmedPhone) {
      errors.phone = 'Phone Number is required';
      missing.push('Phone Number');
    }
    if (!trimmedEmail) {
      errors.email = 'Email Address is required';
      missing.push('Email Address');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = 'Enter a valid email address';
      missing.push('Valid Email Address');
    }

    if (missing.length > 0) {
      setClientFormErrors(errors);
      setClientModalAlert(`Please complete: ${missing.join(', ')}`);
      showToast({
        type: 'warning',
        title: 'Incomplete Client Profile',
        message: `Please complete all required fields (${missing.join(', ')}) before creating the client profile.`,
        duration: 5000,
      });
      return;
    }

    setClientFormErrors({});
    setClientModalAlert(null);

    const created = addClient({
      name: trimmedName,
      phone: trimmedPhone,
      email: trimmedEmail,
      notes: newClientNotes.trim(),
    });

    setNewClientName('');
    setNewClientPhone('');
    setNewClientEmail('');
    setNewClientNotes('');
    setIsNewClientModalOpen(false);
    setSelectedClientId(created.id);
    setActiveScreen('clients');
    showToast({
      type: 'success',
      title: 'Client Profile Created',
      message: `"${created.name}" has been added to records.`,
      duration: 3500,
    });
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

            <form onSubmit={handleCreateClient} noValidate className="space-y-3.5 pt-1">
              {clientModalAlert && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="p-3 rounded-[12px] bg-amber-50 border border-amber-300 flex items-start gap-2.5 text-amber-900"
                >
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-[12px] font-semibold">Incomplete Client Profile</p>
                    <p className="text-[11px] text-amber-800 leading-normal">{clientModalAlert}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setClientModalAlert(null)}
                    className="text-amber-700 hover:text-black p-0.5 transition-colors cursor-pointer"
                    aria-label="Dismiss alert"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <Input
                label="Full Name *"
                placeholder="e.g. Adriana Kunle"
                value={newClientName}
                error={clientFormErrors.name}
                onChange={(e) => {
                  setNewClientName(e.target.value);
                  if (clientFormErrors.name) {
                    setClientFormErrors((prev) => {
                      const next = { ...prev };
                      delete next.name;
                      return next;
                    });
                  }
                }}
              />

              <Input
                label="Phone Number *"
                type="tel"
                placeholder="+234 - "
                value={newClientPhone}
                error={clientFormErrors.phone}
                onChange={(e) => {
                  setNewClientPhone(e.target.value);
                  if (clientFormErrors.phone) {
                    setClientFormErrors((prev) => {
                      const next = { ...prev };
                      delete next.phone;
                      return next;
                    });
                  }
                }}
              />

              <Input
                label="Email Address *"
                type="email"
                placeholder="name@example.com"
                value={newClientEmail}
                error={clientFormErrors.email}
                onChange={(e) => {
                  setNewClientEmail(e.target.value);
                  if (clientFormErrors.email) {
                    setClientFormErrors((prev) => {
                      const next = { ...prev };
                      delete next.email;
                      return next;
                    });
                  }
                }}
              />

              <Textarea
                label="Bespoke Notes / Style Preferences (Optional)"
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
                  onClick={() => {
                    setIsNewClientModalOpen(false);
                    setClientFormErrors({});
                    setClientModalAlert(null);
                  }}
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

      {/* Floating System Toasts */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
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
