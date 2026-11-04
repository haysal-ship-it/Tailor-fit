'use client';

import React, { useState } from 'react';
import { StoreProvider, useStore } from '@/lib/store';
import { TourProvider } from '@/components/onboarding/TourProvider';
import { Navbar } from '@/components/Navbar';
import { OverviewScreen } from '@/components/screens/OverviewScreen';
import { ClientsScreen } from '@/components/screens/ClientsScreen';
import { SettingsScreen } from '@/components/screens/SettingsScreen';
import { OrderFormModal } from '@/components/screens/OrderFormModal';
import { ToastContainer, type ToastMessage } from '@/components/ui/Toasts';

function TailorFitApp() {
  const {
    activeScreen,
    setActiveScreen,
    setSelectedClientId,
    setSelectedSnapshotId,
  } = useStore();

  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderModalOrderId, setOrderModalOrderId] = useState<string | undefined>(undefined);
  const [orderModalClientId, setOrderModalClientId] = useState<string | undefined>(undefined);

  // System toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
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
    setActiveScreen('overview');
  };

  // Scroll restoration on screen navigation (A16)
  React.useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [activeScreen]);

  // Sync tab with URL query parameter for durable location & reload recovery (A16)
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const screenParam = params.get('tab');
    if (screenParam === 'clients' || screenParam === 'settings' || screenParam === 'overview') {
      setActiveScreen(screenParam as any);
    }
  }, [setActiveScreen]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const currentTab = activeScreen === 'client-profile' ? 'clients' : activeScreen;
    const url = new URL(window.location.href);
    if (url.searchParams.get('tab') !== currentTab) {
      url.searchParams.set('tab', currentTab);
      window.history.replaceState({}, '', url.toString());
    }
  }, [activeScreen]);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)] transition-colors">
      {/* Skip to Content Accessible Link (A11, A16) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-[var(--primary)] focus:text-white focus:rounded-md focus:shadow-md focus:outline-none"
      >
        Skip to content
      </a>

      {/* Navigation Header & Mobile Dock */}
      <Navbar />

      {/* Main Content Area */}
      <main id="main-content" className="flex-1 w-full">
        {(activeScreen === 'overview' ||
          activeScreen === 'dashboard' ||
          activeScreen === 'new-measurement' ||
          activeScreen === 'edit-measurement') && (
          <OverviewScreen
            onOpenClient={handleOpenClient}
            onOpenOrder={handleEditOrder}
          />
        )}

        {(activeScreen === 'clients' || activeScreen === 'client-profile') && (
          <ClientsScreen
            onOpenClient={handleOpenClient}
            onNewMeasurement={handleNewMeasurement}
            onNewOrder={(cid) => handleOpenNewOrder(cid)}
            onEditOrder={handleEditOrder}
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

      {/* Floating System Toasts */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default function Page() {
  return (
    <StoreProvider>
      <TourProvider>
        <TailorFitApp />
      </TourProvider>
    </StoreProvider>
  );
}
