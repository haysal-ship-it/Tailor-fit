'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  Client,
  MeasurementSnapshot,
  Order,
  AppSettings,
  OrderStatus,
  HotspotDefinition,
  GarmentTemplate,
} from '@/types';
import {
  SAMPLE_CLIENTS,
  SAMPLE_SNAPSHOTS,
  SAMPLE_ORDERS,
  DEFAULT_SETTINGS,
  DEFAULT_HOTSPOTS,
  normalizeMeasurementsRecord,
  resolveCanonicalKey,
} from './initial-data';

interface StoreContextType {
  clients: Client[];
  snapshots: MeasurementSnapshot[];
  orders: Order[];
  settings: AppSettings;
  allHotspots: HotspotDefinition[];
  activeScreen: string;
  setActiveScreen: (screen: string) => void;
  selectedClientId: string | null;
  setSelectedClientId: (id: string | null) => void;
  selectedOrderId: string | null;
  setSelectedOrderId: (id: string | null) => void;
  selectedSnapshotId: string | null;
  setSelectedSnapshotId: (id: string | null) => void;

  // Actions
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => Client;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;

  addSnapshot: (snapshot: Omit<MeasurementSnapshot, 'id'>) => MeasurementSnapshot;
  updateSnapshot: (id: string, updates: Partial<MeasurementSnapshot>) => void;
  deleteSnapshot: (id: string) => void;

  addOrder: (order: Omit<Order, 'id' | 'createdAt'>) => Order;
  updateOrder: (id: string, updates: Partial<Order>) => void;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  deleteOrder: (id: string) => void;

  updateSettings: (updates: Partial<AppSettings>) => void;
  addCustomField: (field: HotspotDefinition) => void;
  deleteCustomField: (key: string) => void;
  addTemplate: (template: GarmentTemplate) => void;
  updateTemplate: (id: string, updates: Partial<GarmentTemplate>) => void;
  deleteTemplate: (id: string) => void;

  resetToDemoData: () => void;
  exportDataJson: () => void;

  // Nav helpers
  openClientProfile: (clientId: string) => void;
  openNewMeasurementForClient: (clientId?: string) => void;
  openNewOrderForClient: (clientId?: string) => void;
  openEditOrder: (orderId: string) => void;

  // Query helpers
  getClientById: (id: string) => Client | undefined;
  getClientOrders: (clientId: string) => Order[];
  getClientSnapshots: (clientId: string) => MeasurementSnapshot[];
  getSnapshotById: (id: string) => MeasurementSnapshot | undefined;
  getOrdersDueToday: () => Order[];
  getOrdersOverdue: () => Order[];
  getOrdersDueThisWeek: () => Order[];
  getOrdersReady: () => Order[];
}

const StoreContext = createContext<StoreContextType | null>(null);

const STORAGE_KEYS = {
  CLIENTS: 'tailorfit_clients_v2',
  SNAPSHOTS: 'tailorfit_snapshots_v2',
  ORDERS: 'tailorfit_orders_v2',
  SETTINGS: 'tailorfit_settings_v2',
};

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [clients, setClients] = useState<Client[]>(SAMPLE_CLIENTS);
  const [snapshots, setSnapshots] = useState<MeasurementSnapshot[]>(SAMPLE_SNAPSHOTS);
  const [orders, setOrders] = useState<Order[]>(SAMPLE_ORDERS);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  const [activeScreen, setActiveScreen] = useState<string>('overview');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(null);

  // Load from localStorage on mount with canonical key migration
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const savedClients = localStorage.getItem(STORAGE_KEYS.CLIENTS);
        const savedSnapshots = localStorage.getItem(STORAGE_KEYS.SNAPSHOTS);
        const savedOrders = localStorage.getItem(STORAGE_KEYS.ORDERS);
        const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);

        if (savedClients) {
          setClients(JSON.parse(savedClients));
        }
        if (savedSnapshots) {
          const parsed: MeasurementSnapshot[] = JSON.parse(savedSnapshots);
          setSnapshots(
            parsed.map((s) => ({
              ...s,
              measurements: normalizeMeasurementsRecord(s.measurements),
            }))
          );
        }
        if (savedOrders) {
          setOrders(JSON.parse(savedOrders));
        }
        if (savedSettings) {
          const parsedSettings: AppSettings = JSON.parse(savedSettings);
          const migratedTemplates = (parsedSettings.templates || DEFAULT_SETTINGS.templates)
            .filter((t) => t.id !== 'all')
            .map((t) => ({
              ...t,
              fieldKeys: Array.from(
                new Set((t.fieldKeys || []).map((k) => resolveCanonicalKey(k)))
              ),
            }));
          setSettings({
            ...DEFAULT_SETTINGS,
            ...parsedSettings,
            templates:
              migratedTemplates.length > 0 ? migratedTemplates : DEFAULT_SETTINGS.templates,
          });
        }
      } catch {
        // ignore storage error
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
    } catch {}
  }, [clients]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SNAPSHOTS, JSON.stringify(snapshots));
    } catch {}
  }, [snapshots]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    } catch {}
  }, [orders]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch {}
  }, [settings]);

  // Combined hotspots: defaults + custom fields from settings (deduplicated by key)
  const allHotspots: HotspotDefinition[] = React.useMemo(() => {
    const map = new Map<string, HotspotDefinition>();
    DEFAULT_HOTSPOTS.forEach((h) => map.set(h.key, h));
    (settings.customFields || []).forEach((h) => {
      if (!map.has(h.key)) {
        map.set(h.key, h);
      }
    });
    return Array.from(map.values());
  }, [settings.customFields]);

  // Client actions
  const addClient = (clientData: Omit<Client, 'id' | 'createdAt'>): Client => {
    const newClient: Client = {
      ...clientData,
      id: `c-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setClients((prev) => [newClient, ...prev]);
    return newClient;
  };

  const updateClient = (id: string, updates: Partial<Client>) => {
    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const deleteClient = (id: string) => {
    setClients((prev) => prev.filter((c) => c.id !== id));
    setOrders((prev) => prev.filter((o) => o.clientId !== id));
    setSnapshots((prev) => prev.filter((s) => s.clientId !== id));
    if (selectedClientId === id) {
      setSelectedClientId(null);
      setActiveScreen('clients');
    }
  };

  // Snapshot actions
  const addSnapshot = (snapshotData: Omit<MeasurementSnapshot, 'id'>): MeasurementSnapshot => {
    const newSnapshot: MeasurementSnapshot = {
      ...snapshotData,
      id: `ms-${Date.now()}`,
    };
    setSnapshots((prev) => [newSnapshot, ...prev]);
    return newSnapshot;
  };

  const updateSnapshot = (id: string, updates: Partial<MeasurementSnapshot>) => {
    setSnapshots((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const deleteSnapshot = (id: string) => {
    setSnapshots((prev) => prev.filter((s) => s.id !== id));
    if (selectedSnapshotId === id) setSelectedSnapshotId(null);
  };

  // Order actions
  const addOrder = (orderData: Omit<Order, 'id' | 'createdAt'>): Order => {
    const newOrder: Order = {
      ...orderData,
      id: `ord-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString(),
    };
    setOrders((prev) => [newOrder, ...prev]);
    return newOrder;
  };

  const updateOrder = (id: string, updates: Partial<Order>) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...updates } : o)));
  };

  const updateOrderStatus = (id: string, status: OrderStatus) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  };

  const deleteOrder = (id: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== id));
    if (selectedOrderId === id) setSelectedOrderId(null);
  };

  // Settings actions
  const updateSettings = (updates: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  const addCustomField = (field: HotspotDefinition) => {
    setSettings((prev) => ({
      ...prev,
      customFields: [...(prev.customFields || []).filter((f) => f.key !== field.key), field],
    }));
  };

  const deleteCustomField = (key: string) => {
    setSettings((prev) => ({
      ...prev,
      customFields: (prev.customFields || []).filter((f) => f.key !== key),
    }));
  };

  const addTemplate = (template: GarmentTemplate) => {
    setSettings((prev) => ({
      ...prev,
      templates: [...prev.templates.filter((t) => t.id !== template.id), template],
    }));
  };

  const updateTemplate = (id: string, updates: Partial<GarmentTemplate>) => {
    setSettings((prev) => ({
      ...prev,
      templates: prev.templates.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
  };

  const deleteTemplate = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      templates: prev.templates.filter((t) => t.id !== id),
    }));
  };

  const resetToDemoData = () => {
    setClients(SAMPLE_CLIENTS);
    setSnapshots(SAMPLE_SNAPSHOTS);
    setOrders(SAMPLE_ORDERS);
    setSettings(DEFAULT_SETTINGS);
    try {
      localStorage.clear();
    } catch {}
  };

  const exportDataJson = () => {
    const payload = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      clients,
      snapshots,
      orders,
      settings,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tailorfit-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Nav helpers
  const openClientProfile = (clientId: string) => {
    setSelectedClientId(clientId);
    setActiveScreen('clients');
  };

  const openNewMeasurementForClient = (clientId?: string) => {
    if (clientId) setSelectedClientId(clientId);
    setSelectedSnapshotId(null);
    setActiveScreen('new-measurement');
  };

  const openNewOrderForClient = (clientId?: string) => {
    if (clientId) setSelectedClientId(clientId);
    setSelectedOrderId(null);
    setActiveScreen('clients');
  };

  const openEditOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    setActiveScreen('orders');
  };

  // Query helpers
  const getClientById = (id: string) => clients.find((c) => c.id === id);

  const getClientOrders = (clientId: string) =>
    orders
      .filter((o) => o.clientId === clientId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const getClientSnapshots = (clientId: string) =>
    snapshots.filter((s) => s.clientId === clientId);

  const getSnapshotById = (id: string) => snapshots.find((s) => s.id === id);

  const getTodayStr = () => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  };

  const getOrdersDueToday = () => {
    const today = getTodayStr();
    return orders.filter((o) => {
      if (o.status === 'Picked Up') return false;
      const pickupDate = o.pickupDateTime ? o.pickupDateTime.slice(0, 10) : '';
      return pickupDate === today;
    });
  };

  const getOrdersOverdue = () => {
    const today = getTodayStr();
    return orders.filter((o) => {
      if (o.status === 'Picked Up') return false;
      const pickupDate = o.pickupDateTime ? o.pickupDateTime.slice(0, 10) : '';
      return pickupDate && pickupDate < today;
    });
  };

  const getOrdersDueThisWeek = () => {
    const now = new Date();
    const startOfWeek = new Date(now);
    const endOfWeek = new Date(now);
    endOfWeek.setDate(now.getDate() + 7);

    return orders.filter((o) => {
      if (o.status === 'Picked Up') return false;
      if (!o.pickupDateTime) return false;
      const p = new Date(o.pickupDateTime);
      return p >= startOfWeek && p <= endOfWeek;
    });
  };

  const getOrdersReady = () => {
    return orders.filter((o) => o.status === 'Ready');
  };

  return (
    <StoreContext.Provider
      value={{
        clients,
        snapshots,
        orders,
        settings,
        allHotspots,
        activeScreen,
        setActiveScreen,
        selectedClientId,
        setSelectedClientId,
        selectedOrderId,
        setSelectedOrderId,
        selectedSnapshotId,
        setSelectedSnapshotId,

        addClient,
        updateClient,
        deleteClient,

        addSnapshot,
        updateSnapshot,
        deleteSnapshot,

        addOrder,
        updateOrder,
        updateOrderStatus,
        deleteOrder,

        updateSettings,
        addCustomField,
        deleteCustomField,
        addTemplate,
        updateTemplate,
        deleteTemplate,

        resetToDemoData,
        exportDataJson,

        openClientProfile,
        openNewMeasurementForClient,
        openNewOrderForClient,
        openEditOrder,

        getClientById,
        getClientOrders,
        getClientSnapshots,
        getSnapshotById,
        getOrdersDueToday,
        getOrdersOverdue,
        getOrdersDueThisWeek,
        getOrdersReady,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
