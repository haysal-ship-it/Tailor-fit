'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useStore } from '@/lib/store';
import { AtelierMannequin } from '@/components/AtelierMannequin';
import { 
  Search, 
  ChevronRight, 
  Phone, 
  Mail, 
  User, 
  Ruler, 
  Plus, 
  X, 
  UserCheck,
  ShoppingBag,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { DrawCheckbox } from '@/components/ui/DrawCheckbox';
import { ToastContainer, ToastMessage } from '@/components/ui/Toasts';
import { SmallFloatingDock } from '@/components/ui/SmallFloatingDock';
import { AnimatedNumberMorph } from '@/components/ui/AnimatedNumberMorph';
import { springSmooth } from '@/lib/motion-tokens';
import { cn } from '@/lib/utils';

interface ClientsScreenProps {
  onOpenClient: (clientId: string) => void;
  onNewMeasurement: (clientId: string) => void;
  onNewOrder: (clientId: string) => void;
}

let clientToastSeq = 0;

export function ClientsScreen({ 
  onOpenClient, 
  onNewMeasurement, 
  onNewOrder 
}: ClientsScreenProps) {
  const { clients, selectedClientId, setSelectedClientId, getClientSnapshots } = useStore();
  const shouldReduceMotion = useReducedMotion();

  const [mobileTab, setMobileTab] = useState<'directory' | 'profile' | 'orders'>('directory');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [mannequinView, setMannequinView] = useState<'mannequin' | 'table'>('mannequin');

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${++clientToastSeq}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
  };
  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const defaultClients = useMemo(() => [
    {
      id: 'c-1',
      initials: 'CD',
      name: 'Chloe Dallas',
      phone: '+234 809 489 2011',
      email: 'chloedallas@couture.com',
      since: 'Client since October 2026',
    },
    {
      id: 'c-2',
      initials: 'TR',
      name: 'Taylor Razaq',
      phone: '+234 803 929 1100',
      email: 't.razaq@tailorfit.design',
      since: 'Client since May 2024',
    },
    {
      id: 'c-6',
      initials: 'AB',
      name: 'Amanda Billings',
      phone: '+237 409 302 990',
      email: 'a.billings@couture.com',
      since: 'Client since Aug 2025',
    },
  ], []);

  const activeClientId = selectedClientId || 'c-1';
  const activeClientFromStore = clients.find((c) => c.id === activeClientId);

  const selectedClientProfile = useMemo(() => {
    if (activeClientFromStore) {
      const calcInitials = activeClientFromStore.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

      return {
        id: activeClientFromStore.id,
        initials: calcInitials || 'CL',
        name: activeClientFromStore.name,
        since: activeClientFromStore.createdAt
          ? `Client since ${new Date(activeClientFromStore.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
          : 'Client since October 2026',
        phone: activeClientFromStore.phone || '+234 - ',
        email: activeClientFromStore.email || 'client@example.com',
      };
    }
    return defaultClients[0];
  }, [activeClientFromStore, defaultClients]);

  const clientSnapshots = getClientSnapshots(selectedClientProfile.id);
  const activeSnapshot = clientSnapshots[0];

  const [measurements, setMeasurements] = useState<Record<string, number>>({
    shoulder: 42,
    neck: 36,
    bust: 92,
    waist: 72,
    sleeve: 60,
    thigh: 54,
    hip: 96,
    ankle: 24,
    back: 40,
    ...(activeSnapshot?.measurements as Record<string, number> || {}),
  });

  const [measurementList, setMeasurementList] = useState([
    { id: 'shoulder', label: 'Shoulder width', value: '42.0', confirmed: true },
    { id: 'neck', label: 'Neck Circumference', value: '36.0', confirmed: true },
    { id: 'bust', label: 'Bust / Chest', value: '92.0', confirmed: true },
    { id: 'waist', label: 'Waist Circumference', value: '72.0', confirmed: true },
    { id: 'sleeve', label: 'Sleeve Length', value: '60.0', confirmed: true },
    { id: 'thigh', label: 'Thigh Width', value: '54.0', confirmed: true },
    { id: 'hip', label: 'Hip Circumference', value: '96.0', confirmed: true },
    { id: 'ankle', label: 'Ankle Opening', value: '24.0', confirmed: true },
    { id: 'back', label: 'Back Width', value: '40.0', confirmed: true },
  ]);

  const handleSelectClient = (client: { id: string }) => {
    setSelectedClientId(client.id);
    const snapshots = getClientSnapshots(client.id);
    const snap = snapshots[0];
    if (snap?.measurements) {
      const snapMeasurements = snap.measurements as Record<string, number>;
      setMeasurements({ ...snapMeasurements });
      setMeasurementList((prev) =>
        prev.map((item) => ({
          ...item,
          value: snapMeasurements[item.id] !== undefined
            ? Number(snapMeasurements[item.id]).toFixed(1)
            : item.value,
        }))
      );
    }
    setMobileTab('profile');
  };

  const handleListValueChange = (id: string, value: string) => {
    setMeasurementList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, value } : item))
    );
    const num = parseFloat(value);
    if (!isNaN(num)) {
      setMeasurements((prev) => ({ ...prev, [id]: num }));
    }
  };

  const handleDeleteListItem = (id: string) => {
    const itemToDelete = measurementList.find((item) => item.id === id);
    if (!itemToDelete) return;

    setMeasurementList((prev) => prev.filter((item) => item.id !== id));

    addToast({
      type: 'undo',
      message: `Removed "${itemToDelete.label}"`,
      onUndo: () => {
        setMeasurementList((prev) => [...prev, itemToDelete]);
      },
    });
  };

  const orderHistoryCards = [
    {
      id: 'ord-hist-1',
      title: 'Bespoke African Gown',
      badge: 'Urgent',
      isUrgent: true,
      date: 'Fitting on 09-10-2026',
      price: 130000,
      images: [
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=300&q=80',
        'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=300&q=80',
      ],
    },
    {
      id: 'ord-hist-2',
      title: 'Oxford Three Piece Suit',
      badge: 'Ready',
      isUrgent: false,
      date: 'Completed 02-10-2026',
      price: 230000,
      images: [
        'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=300&q=80',
        'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=300&q=80',
        'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=300&q=80',
      ],
    },
    {
      id: 'ord-hist-3',
      title: 'Silk Evening Corset',
      badge: 'In Progress',
      isUrgent: false,
      date: 'Scheduled 18-10-2026',
      price: 95000,
      images: [
        'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80',
        'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=300&q=80',
        'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80',
      ],
    },
  ];

  const filteredClients = useMemo(() => {
    return defaultClients.filter((c) =>
      searchQuery.trim()
        ? c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.phone.includes(searchQuery) ||
          c.email.toLowerCase().includes(searchQuery.toLowerCase())
        : true
    );
  }, [defaultClients, searchQuery]);

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 py-3 space-y-4 pb-28 md:pb-6">
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
        
        {/* =====================================================================
            LEFT COLUMN: Client Directory with Expandable Search Pill
            ===================================================================== */}
        <div
          className={cn(
            'md:col-span-5 xl:col-span-4 rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] p-4 sm:p-6 space-y-4 transition-colors hover:border-[var(--border-strong)]',
            mobileTab !== 'directory' ? 'hidden md:block' : 'block'
          )}
        >
          <div className="flex items-center justify-between pb-1 border-b border-[var(--border)]">
            <h2 className="text-base font-semibold tracking-[-0.01em] text-[var(--text)]">
              Client Directory
            </h2>
            <span className="text-xs font-mono text-[var(--text-muted)]">
              {filteredClients.length} clients
            </span>
          </div>

          {/* Expandable Search Pill with spring transition */}
          <motion.div
            animate={{
              borderColor: isSearchFocused ? 'var(--accent)' : 'var(--border)',
            }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.15 }}
            className="relative flex items-center rounded-full bg-[var(--surface-2)] border px-3 h-10 min-h-[40px] max-sm:min-h-[44px]"
          >
            <Search className="w-4 h-4 text-[var(--text-muted)] shrink-0 mr-2" />
            <input
              type="text"
              value={searchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clients..."
              className="w-full bg-transparent text-xs text-[var(--text)] placeholder:text-[var(--text-faint)] focus:outline-none max-sm:text-base"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-[var(--text-muted)] hover:text-[var(--text)] p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </motion.div>

          {/* Directory Rows */}
          <div className="space-y-2 pt-1">
            {!searchQuery.trim() && (
              <div className="border-b border-[var(--border)] pb-1 mb-2">
                <h3 className="text-xs font-medium text-[var(--text-muted)]">
                  Recently Viewed Clients
                </h3>
              </div>
            )}

            <div className="flex flex-col gap-2">
              {filteredClients.length === 0 ? (
                <div className="p-4 text-center rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
                  <p className="text-xs text-[var(--text-muted)]">
                    No clients match &ldquo;{searchQuery}&rdquo;
                  </p>
                </div>
              ) : (
                filteredClients.map((client) => {
                  const isSelected = selectedClientProfile.id === client.id;
                  return (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => handleSelectClient(client)}
                      className={cn(
                        'w-full p-3 rounded-xl border text-left transition-colors flex items-center justify-between cursor-pointer select-none',
                        isSelected
                          ? 'bg-[var(--surface-2)] border-[var(--border-strong)]'
                          : 'bg-[var(--surface-1)] border-[var(--border)] hover:bg-[var(--surface-2)] hover:border-[var(--border-strong)]'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'w-8 h-8 rounded-full font-semibold text-xs flex items-center justify-center shrink-0 border',
                            isSelected
                              ? 'bg-[var(--text)] text-[var(--bg)] border-transparent'
                              : 'bg-[var(--surface-2)] text-[var(--text)] border-[var(--border)]'
                          )}
                        >
                          {client.initials}
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-[var(--text)] tracking-[-0.01em]">
                            {client.name}
                          </h4>
                          <p className="text-[11px] text-[var(--text-muted)] font-mono">
                            {client.phone}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* =====================================================================
            RIGHT COLUMN: Client Dossier + Measurements + Order History
            ===================================================================== */}
        <div
          className={cn(
            'md:col-span-7 xl:col-span-8 space-y-4',
            mobileTab === 'directory' ? 'hidden md:block' : 'block'
          )}
        >
          {/* Client Profile Header Card */}
          <div
            className={cn(
              'rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] p-4 sm:p-6 space-y-4 transition-colors hover:border-[var(--border-strong)]',
              mobileTab === 'orders' ? 'hidden md:block' : 'block'
            )}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div>
                <span className="text-[11px] font-medium text-[var(--text-muted)] tracking-wider uppercase block">
                  CLIENT PROFILE
                </span>
                <h1 className="text-base font-semibold tracking-[-0.01em] text-[var(--text)]">
                  {selectedClientProfile.name}
                </h1>
              </div>

              {/* EXACTLY ONE PRIMARY BUTTON: New Order */}
              <Button
                variant="primary"
                size="md"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => onNewOrder(selectedClientProfile.id)}
              >
                New Order
              </Button>
            </div>

            <div className="flex flex-col items-center justify-center text-center space-y-2 py-2">
              <div className="w-14 h-14 rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] font-semibold text-base flex items-center justify-center shadow-xs">
                {selectedClientProfile.initials}
              </div>
              <div>
                <h2 className="text-sm font-semibold text-[var(--text)]">
                  {selectedClientProfile.name}
                </h2>
                <p className="text-xs text-[var(--text-muted)]">{selectedClientProfile.since}</p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] font-mono">
                  <Phone className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  {selectedClientProfile.phone}
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)]">
                  <Mail className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  {selectedClientProfile.email}
                </span>
              </div>
            </div>
          </div>

          {/* Body Measurement History: EXPLICIT READ-ONLY MANNEQUIN */}
          <div
            className={cn(
              'rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] p-4 sm:p-6 space-y-4 transition-colors hover:border-[var(--border-strong)]',
              mobileTab === 'orders' ? 'hidden md:block' : 'block'
            )}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div>
                <h3 className="text-sm font-semibold tracking-[-0.01em] text-[var(--text)]">
                  Body Measurement History
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Recorded anatomical landmarks (Read-Only)
                </p>
              </div>

              {/* No Add Point button in read-only state. Only view toggle */}
              <SegmentedControl
                name="client-profile-view-toggle"
                size="sm"
                value={mannequinView}
                onChange={(v) => setMannequinView(v as 'mannequin' | 'table')}
                options={[
                  { value: 'mannequin', label: '', icon: <User className="w-3.5 h-3.5" /> },
                  { value: 'table', label: '', icon: <Ruler className="w-3.5 h-3.5" /> },
                ]}
              />
            </div>

            {mannequinView === 'mannequin' ? (
              <div className="w-full flex items-center justify-center py-2">
                <AtelierMannequin
                  gender="F"
                  unit="cm"
                  measurements={measurements}
                  readOnly={true}
                />
              </div>
            ) : (
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5 self-start py-2">
                {measurementList.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] flex flex-col justify-between h-24 transition-colors hover:border-[var(--border-strong)]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-[var(--text)] truncate pr-1">
                        {item.label}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteListItem(item.id)}
                        className="text-[var(--text-faint)] hover:text-[var(--text)] p-1 transition-colors cursor-pointer"
                        title="Remove point"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between bg-[var(--surface-2)] px-3 py-1.5 rounded-xl border border-[var(--border)]">
                      <input
                        type="text"
                        value={item.value}
                        onChange={(e) => handleListValueChange(item.id, e.target.value)}
                        className="w-16 font-mono text-xs font-semibold text-[var(--text)] focus:outline-none bg-transparent tabular-nums"
                      />
                      <DrawCheckbox
                        checked={item.confirmed}
                        onChange={(chk) => {
                          setMeasurementList((prev) =>
                            prev.map((i) => (i.id === item.id ? { ...i, confirmed: chk } : i))
                          );
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order History Container with 3-Up Thumbnails and Hairline Price Row */}
          <div
            className={cn(
              'rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] p-4 sm:p-6 space-y-4 transition-colors hover:border-[var(--border-strong)]',
              mobileTab === 'profile' ? 'hidden md:block' : 'block'
            )}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
              <h3 className="text-sm font-semibold tracking-[-0.01em] text-[var(--text)]">
                Order History
              </h3>
              <span className="text-xs font-mono text-[var(--text-muted)]">3 recorded</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {orderHistoryCards.map((card) => (
                <div
                  key={card.id}
                  className="rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] p-4 flex flex-col justify-between space-y-3 transition-colors hover:border-[var(--border-strong)]"
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <div>
                      <h4 className="text-xs font-semibold text-[var(--text)] tracking-[-0.01em]">
                        {card.title}
                      </h4>
                      <p className="text-[11px] text-[var(--text-muted)] font-mono mt-0.5">
                        {card.date}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 border',
                        card.isUrgent
                          ? 'bg-[var(--status-danger)]/15 text-[var(--status-danger)] border-[var(--status-danger)]/30'
                          : 'bg-[var(--status-success)]/15 text-[var(--status-success)] border-[var(--status-success)]/30'
                      )}
                    >
                      {card.badge}
                    </span>
                  </div>

                  {/* 3-Up Grid of Rounded-xl Thumbnails */}
                  <div className="grid grid-cols-3 gap-1.5 py-1">
                    {card.images.map((img, i) => (
                      <div
                        key={i}
                        className="aspect-square rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--surface-2)]"
                      >
                        <img
                          src={img}
                          alt="Garment style"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Hairline-separated Price Row in Geist Mono */}
                  <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between text-xs">
                    <span className="text-[var(--text-muted)]">Order Total</span>
                    <span className="font-mono font-semibold text-[var(--text)]">
                      <AnimatedNumberMorph value={card.price} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Floating Dock on Mobile */}
      <SmallFloatingDock
        activeTab={mobileTab}
        onChange={setMobileTab}
        tabs={[
          { id: 'directory', label: 'Directory', icon: <Users className="w-4 h-4" /> },
          { id: 'profile', label: 'Profile', icon: <UserCheck className="w-4 h-4" /> },
          { id: 'orders', label: 'Orders', icon: <ShoppingBag className="w-4 h-4" /> },
        ]}
      />
    </div>
  );
}
