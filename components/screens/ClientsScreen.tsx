'use client';

import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/lib/store';
import { 
  Search, 
  ChevronRight, 
  Phone, 
  Mail, 
  User, 
  ClipboardList, 
  Plus, 
  X,
  Users,
  UserCheck,
  ShoppingBag
} from 'lucide-react';
import { SmallFloatingDock } from '@/components/ui/SmallFloatingDock';
import { AnimatedNumberMorph } from '@/components/ui/AnimatedNumberMorph';
import { springSmooth } from '@/lib/motion-tokens';
import { cn } from '@/lib/utils';

interface ClientsScreenProps {
  onOpenClient?: (clientId: string) => void;
  onNewMeasurement?: (clientId: string) => void;
  onNewOrder: (clientId: string) => void;
}

interface MeasurementFieldItem {
  id: string;
  name: string;
  value: string;
  unit: string;
}

const DEFAULT_MEASUREMENT_FIELDS: MeasurementFieldItem[] = [
  { id: 'shoulder', name: 'Shoulder width', value: '42.0', unit: 'cm' },
  { id: 'neck', name: 'Neck', value: '36.0', unit: 'cm' },
  { id: 'bust', name: 'Bust/Chest', value: '92.0', unit: 'cm' },
  { id: 'ankle', name: 'Ankle', value: '24.0', unit: 'cm' },
  { id: 'hip', name: 'Hip', value: '96.0', unit: 'cm' },
  { id: 'wrist', name: 'Wrist', value: '16.5', unit: 'cm' },
  { id: 'sleeve', name: 'Sleeve', value: '60.0', unit: 'cm' },
  { id: 'waist', name: 'Waist', value: '72.0', unit: 'cm' },
  { id: 'back', name: 'Back', value: '40.0', unit: 'cm' },
  { id: 'neckToWaist', name: 'Neck to Waist', value: '41.5', unit: 'cm' },
  { id: 'neckToAnkle', name: 'Neck to Ankle', value: '135.0', unit: 'cm' },
];

export function ClientsScreen({ 
  onNewOrder 
}: ClientsScreenProps) {
  const { clients, selectedClientId, setSelectedClientId, getClientSnapshots } = useStore();

  const [mobileTab, setMobileTab] = useState<'directory' | 'profile' | 'orders'>('directory');
  const [searchQuery, setSearchQuery] = useState('');
  const [mannequinView, setMannequinView] = useState<'mannequin' | 'table'>('mannequin');

  // Floating Undo Toast state
  const [undoToast, setUndoToast] = useState<{ id: string; item: MeasurementFieldItem } | null>(null);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Combine store clients with fallback clients
  const allClientList = useMemo(() => {
    const list = [...defaultClients];
    clients.forEach((c) => {
      if (!list.some((item) => item.id === c.id)) {
        const initials = c.name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase() || 'CL';
        list.push({
          id: c.id,
          initials,
          name: c.name,
          phone: c.phone || '+234 800 000 0000',
          email: c.email || 'client@couture.com',
          since: c.createdAt
            ? `Client since ${new Date(c.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
            : 'Client since October 2026',
        });
      }
    });
    return list;
  }, [clients, defaultClients]);

  const activeClientId = selectedClientId || 'c-1';
  const selectedClientProfile = useMemo(() => {
    return allClientList.find((c) => c.id === activeClientId) || allClientList[0];
  }, [allClientList, activeClientId]);

  // Measurements list for active client
  const [clientFields, setClientFields] = useState<MeasurementFieldItem[]>(DEFAULT_MEASUREMENT_FIELDS);

  // Sync measurements when client changes
  const handleSelectClient = (client: { id: string }) => {
    setSelectedClientId(client.id);
    const snapshots = getClientSnapshots(client.id);
    const snap = snapshots[0];
    if (snap?.measurements) {
      const snapObj = snap.measurements as Record<string, number>;
      setClientFields((prev) =>
        prev.map((f) => ({
          ...f,
          value: snapObj[f.id] !== undefined ? Number(snapObj[f.id]).toFixed(1) : f.value,
        }))
      );
    }
    setMobileTab('profile');
  };

  const handleFieldValueChange = (id: string, value: string) => {
    setClientFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, value } : f))
    );
  };

  const handleRemoveField = (id: string) => {
    const itemToRemove = clientFields.find((f) => f.id === id);
    if (!itemToRemove) return;

    setClientFields((prev) => prev.filter((f) => f.id !== id));

    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    setUndoToast({ id, item: itemToRemove });
    undoTimeoutRef.current = setTimeout(() => {
      setUndoToast(null);
    }, 5000);
  };

  const handleUndoRemove = () => {
    if (!undoToast) return;
    setClientFields((prev) => [...prev, undoToast.item]);
    setUndoToast(null);
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
  };

  const orderHistoryCards = [
    {
      id: 'ord-hist-1',
      title: 'Bespoke African Gown',
      badge: 'Urgent',
      isUrgent: true,
      badgeColor: 'var(--pill-urgent)',
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
      badgeColor: 'var(--pill-completed)',
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
      badgeColor: 'var(--pill-pending)',
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
    return allClientList.filter((c) =>
      searchQuery.trim()
        ? c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.phone.includes(searchQuery) ||
          c.email.toLowerCase().includes(searchQuery.toLowerCase())
        : true
    );
  }, [allClientList, searchQuery]);

  // Lookup values for mannequin points
  const getFieldVal = (id: string, fallback: string) => {
    const found = clientFields.find((f) => f.id === id);
    return found ? `${found.value} cm` : `${fallback} cm`;
  };

  return (
    <div className="w-full max-w-[1216px] mx-auto mt-4 px-4 sm:px-0 pb-20 select-none">
      {/* =======================================================================
          A. Page layout (1280px design width; build fluidly)
          Below header (16px gap): two blocks side by side with a 24px gap:
          - Client Directory column (about 27.4% of width, 333px at 1280)
          - Main panel (the rest, 852px at 1280)
          Both blocks are white containers (2px padding, radius 8) holding --card cards (radius 6).
          Directory column is only as tall as its content.
          Main panel's sections stack with 2px gaps.
          ======================================================================= */}
      <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
        
        {/* =====================================================================
            B. Client Directory column
            ===================================================================== */}
        <div
          className={cn(
            'w-full lg:w-[333px] lg:shrink-0 p-[2px] rounded-[8px] bg-white shadow-xs',
            mobileTab !== 'directory' ? 'hidden lg:block' : 'block'
          )}
        >
          {/* Client Directory Card: --card fill, radius 6, 12px padding, 16px gap between groups */}
          <div className="w-full rounded-[6px] bg-[var(--card)] p-3 flex flex-col gap-4">
            
            {/* Title & Search group */}
            <div>
              <h2 className="text-[16px] font-bold text-black leading-tight">
                Client Directory
              </h2>

              {/* Search field: 8px below title, --field-on-card fill, 1px #EDEDED border, radius 8, 8px padding, 8px gap */}
              <div className="mt-2 flex items-center gap-2 bg-[var(--field-on-card)] border border-[#EDEDED] rounded-[8px] p-2">
                <Search className="w-4 h-4 text-[var(--muted)] shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search clients by name, phone number, email..."
                  className="w-full bg-transparent text-[12px] text-black placeholder:text-[var(--muted)] focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-[var(--muted)] hover:text-black p-0.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Recently Viewed Clients group */}
            <div>
              <h3 className="text-[14px] font-semibold text-[var(--text-strong)] leading-tight mb-2">
                Recently Viewed Clients
              </h3>

              {/* White list container (radius 8, 2px padding, 2px gaps) */}
              <div className="bg-white rounded-[8px] p-[2px] flex flex-col gap-[2px]">
                {filteredClients.length === 0 ? (
                  <div className="p-4 text-center text-[12px] text-[var(--muted)]">
                    No clients match &ldquo;{searchQuery}&rdquo;
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
                          'w-full p-2 rounded-[8px] flex items-center justify-between text-left transition-colors cursor-pointer border select-none',
                          isSelected
                            ? 'bg-[var(--selected-bg)] border-[var(--selected)]'
                            : 'bg-[var(--chip)] border-transparent hover:bg-[#EAEAEA]'
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1 pr-1">
                          {/* White circle avatar: 8px padding, initials 14px / 700 --text-strong */}
                          <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shrink-0 shadow-xs border border-[#EDEDED]">
                            <span className="text-[14px] font-bold text-[var(--text-strong)]">
                              {client.initials}
                            </span>
                          </div>

                          <div className="min-w-0 flex-1">
                            <h4 className="text-[12px] font-bold text-black truncate leading-tight">
                              {client.name}
                            </h4>
                            <p className="text-[12px] text-[var(--sub)] truncate mt-0.5 leading-tight">
                              {client.since}
                            </p>
                          </div>
                        </div>

                        <ChevronRight className="w-4 h-4 text-[var(--muted)] shrink-0 ml-1" />
                      </button>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        </div>

        {/* =====================================================================
            MAIN PANEL (852px at 1280)
            White container (2px padding, radius 8) holding --card cards (radius 6)
            Sections stack with 2px gaps.
            ===================================================================== */}
        <div
          className={cn(
            'flex-1 w-full min-w-0 p-[2px] rounded-[8px] bg-white flex flex-col gap-[2px] shadow-xs',
            mobileTab === 'directory' ? 'hidden lg:flex' : 'flex'
          )}
        >
          {/* SECTION 1: Client Profile (Dossier) */}
          <div className="w-full rounded-[6px] bg-[var(--card)] p-3 flex flex-col gap-3">
            {/* Header row: Eyebrow + Name (18px) on left, exactly ONE primary button on right */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[12px] tracking-[0.3px] uppercase font-semibold text-[var(--sub)] leading-none block mb-1">
                  CLIENT PROFILE
                </span>
                <h1 className="text-[18px] font-bold text-black leading-tight">
                  {selectedClientProfile.name}
                </h1>
              </div>

              {/* Exactly ONE primary button on this screen: New Order (14px) */}
              <button
                type="button"
                onClick={() => onNewOrder(selectedClientProfile.id)}
                className="h-9 px-4 rounded-[24px] bg-[var(--primary)] text-white text-[14px] font-medium flex items-center gap-1.5 hover:opacity-95 transition-opacity cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4 stroke-[2.2]" />
                <span>New Order</span>
              </button>
            </div>

            {/* Profile Detail Row */}
            <div className="bg-white rounded-[8px] p-3 border border-[#EDEDED] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-[var(--card)] border border-[#EDEDED] flex items-center justify-center text-[14px] font-bold text-[var(--text-strong)] shadow-xs shrink-0">
                  {selectedClientProfile.initials}
                </div>
                <div>
                  <h2 className="text-[14px] font-bold text-black leading-tight">
                    {selectedClientProfile.name}
                  </h2>
                  <p className="text-[12px] text-[var(--sub)] mt-0.5">
                    {selectedClientProfile.since}
                  </p>
                </div>
              </div>

              {/* Contact Pills */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[var(--field-on-card)] border border-[#EDEDED] text-[12px] text-black font-medium">
                  <Phone className="w-3.5 h-3.5 text-[var(--muted)]" />
                  <span>{selectedClientProfile.phone}</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[var(--field-on-card)] border border-[#EDEDED] text-[12px] text-black font-medium">
                  <Mail className="w-3.5 h-3.5 text-[var(--muted)]" />
                  <span>{selectedClientProfile.email}</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: Body Measurement History (Read-Only) */}
          <div className="w-full rounded-[6px] bg-[var(--card)] p-3 flex flex-col gap-3">
            {/* Header: Title (16px) & Subtitle (12px, --sub) + Toggle Group on --card surface */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[16px] font-bold text-black leading-tight">
                  Body Measurement History
                </h3>
                <p className="text-[12px] text-[var(--sub)] mt-0.5">
                  Recorded anatomical landmarks (Read-Only)
                </p>
              </div>

              {/* Toggle Group on --card surface uses --track (#D9D8D8) background */}
              <div className="flex items-center bg-[var(--track)] rounded-[24px] p-0.5 gap-0.5">
                <button
                  type="button"
                  onClick={() => setMannequinView('mannequin')}
                  className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer',
                    mannequinView === 'mannequin'
                      ? 'bg-white text-black shadow-xs'
                      : 'text-black/60 hover:text-black'
                  )}
                  title="Diagram View"
                >
                  <User className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setMannequinView('table')}
                  className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer',
                    mannequinView === 'table'
                      ? 'bg-[var(--selected)] text-white shadow-xs'
                      : 'text-black/60 hover:text-black'
                  )}
                  title="Measurement List View"
                >
                  <ClipboardList className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Mannequin View OR Measurement List View */}
            {mannequinView === 'mannequin' ? (
              <div className="w-full flex items-center justify-center py-4 bg-white rounded-[8px] border border-[#EDEDED]">
                <svg
                  viewBox="0 0 304 467"
                  className="w-full max-w-[304px] h-auto max-h-[467px] select-none"
                  style={{ overflow: 'visible' }}
                >
                  {/* Plain transparent PNG mannequin, no code treatments/manipulations */}
                  <image
                    href="/assets/mannequin-female-front.png"
                    x="20.7"
                    y="0"
                    width="262.8"
                    height="467.2"
                    preserveAspectRatio="xMidYMid meet"
                  />

                  {/* Leader lines: 1px, dashed (3px dash, 3px gap), #079BF8 */}
                  {/* Neck: (77.5, 80.9) → (145.7, 80.9) */}
                  <polyline
                    points="77.5,80.9 145.7,80.9"
                    fill="none"
                    stroke="#079BF8"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                  {/* Bust: (178.9, 124.0) → (252.9, 124.0) */}
                  <polyline
                    points="178.9,124.0 252.9,124.0"
                    fill="none"
                    stroke="#079BF8"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                  {/* Sleeve: (221.0, 185.5) → (257.3, 185.5) */}
                  <polyline
                    points="221.0,185.5 257.3,185.5"
                    fill="none"
                    stroke="#079BF8"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                  {/* Shoulder: (178.9, 93.1) → (210.5, 61.5) → (244.3, 61.5) */}
                  <polyline
                    points="178.9,93.1 210.5,61.5 244.3,61.5"
                    fill="none"
                    stroke="#079BF8"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                  {/* Waist: (28.6, 177.1) → (60.2, 208.7) → (119.6, 208.7) */}
                  <polyline
                    points="28.6,177.1 60.2,208.7 119.6,208.7"
                    fill="none"
                    stroke="#079BF8"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                  {/* Thigh: (178.9, 363.9) → (210.6, 393.0) → (267.8, 393.0) */}
                  <polyline
                    points="178.9,363.9 210.6,393.0 267.8,393.0"
                    fill="none"
                    stroke="#079BF8"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />

                  {/* Six Point Markers: 10px circle (r=5) with 1px stroke, 15% fill, 4px solid center dot */}
                  {/* Neck */}
                  <g>
                    <circle cx="145.7" cy="80.9" r="5" fill="rgba(7, 155, 248, 0.15)" stroke="#079BF8" strokeWidth="1" />
                    <circle cx="145.7" cy="80.9" r="2" fill="#079BF8" />
                  </g>
                  {/* Shoulder */}
                  <g>
                    <circle cx="178.9" cy="93.1" r="5" fill="rgba(7, 155, 248, 0.15)" stroke="#079BF8" strokeWidth="1" />
                    <circle cx="178.9" cy="93.1" r="2" fill="#079BF8" />
                  </g>
                  {/* Bust */}
                  <g>
                    <circle cx="178.9" cy="124.0" r="5" fill="rgba(7, 155, 248, 0.15)" stroke="#079BF8" strokeWidth="1" />
                    <circle cx="178.9" cy="124.0" r="2" fill="#079BF8" />
                  </g>
                  {/* Sleeve */}
                  <g>
                    <circle cx="221.0" cy="185.7" r="5" fill="rgba(7, 155, 248, 0.15)" stroke="#079BF8" strokeWidth="1" />
                    <circle cx="221.0" cy="185.7" r="2" fill="#079BF8" />
                  </g>
                  {/* Waist */}
                  <g>
                    <circle cx="119.6" cy="208.5" r="5" fill="rgba(7, 155, 248, 0.15)" stroke="#079BF8" strokeWidth="1" />
                    <circle cx="119.6" cy="208.5" r="2" fill="#079BF8" />
                  </g>
                  {/* Thigh */}
                  <g>
                    <circle cx="178.9" cy="363.9" r="5" fill="rgba(7, 155, 248, 0.15)" stroke="#079BF8" strokeWidth="1" />
                    <circle cx="178.9" cy="363.9" r="2" fill="#079BF8" />
                  </g>

                  {/* Labels: Manrope 500, 13px, black */}
                  {/* Neck */}
                  <text
                    x="48.5"
                    y="69.7"
                    fontFamily="var(--font-manrope), sans-serif"
                    fontSize="13"
                    fontWeight="500"
                    fill="#000000"
                    dominantBaseline="hanging"
                  >
                    Neck: {getFieldVal('neck', '36.0')}
                  </text>
                  {/* Waist */}
                  <text
                    x="0"
                    y="165.5"
                    fontFamily="var(--font-manrope), sans-serif"
                    fontSize="13"
                    fontWeight="500"
                    fill="#000000"
                    dominantBaseline="hanging"
                  >
                    Waist: {getFieldVal('waist', '72.0')}
                  </text>
                  {/* Shoulder */}
                  <text
                    x="244.3"
                    y="50.5"
                    fontFamily="var(--font-manrope), sans-serif"
                    fontSize="13"
                    fontWeight="500"
                    fill="#000000"
                    dominantBaseline="hanging"
                  >
                    Shoulder: {getFieldVal('shoulder', '42.0')}
                  </text>
                  {/* Bust */}
                  <text
                    x="252.9"
                    y="114.4"
                    fontFamily="var(--font-manrope), sans-serif"
                    fontSize="13"
                    fontWeight="500"
                    fill="#000000"
                    dominantBaseline="hanging"
                  >
                    Bust: {getFieldVal('bust', '92.0')}
                  </text>
                  {/* Sleeve */}
                  <text
                    x="259.9"
                    y="175.5"
                    fontFamily="var(--font-manrope), sans-serif"
                    fontSize="13"
                    fontWeight="500"
                    fill="#000000"
                    dominantBaseline="hanging"
                  >
                    Sleeve: {getFieldVal('sleeve', '60.0')}
                  </text>
                  {/* Thigh */}
                  <text
                    x="271.3"
                    y="383.3"
                    fontFamily="var(--font-manrope), sans-serif"
                    fontSize="13"
                    fontWeight="500"
                    fill="#000000"
                    dominantBaseline="hanging"
                  >
                    Ankle: {getFieldVal('ankle', '24.0')}
                  </text>
                </svg>
              </div>
            ) : (
              /* Measurement List View: 3 equal columns, 8px gaps */
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {clientFields.map((field) => (
                  <div
                    key={field.id}
                    className="bg-white rounded-[16px] p-3 border border-[#EDEDED] flex flex-col justify-between gap-3 shadow-2xs"
                  >
                    {/* Top row: 14px / 600 black field name and 16px X remove icon */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[14px] font-semibold text-black truncate">
                        {field.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveField(field.id)}
                        className="w-5 h-5 flex items-center justify-center text-[var(--muted)] hover:text-black transition-colors cursor-pointer shrink-0"
                        title="Remove field"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Input wrapper: --card fill, 1px border, radius 8, 2px padding */}
                    <div className="w-full bg-[var(--card)] border border-[#EDEDED] rounded-[8px] p-[2px] flex items-center">
                      <input
                        type="text"
                        value={field.value}
                        onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
                        placeholder="0.0"
                        className="w-full bg-transparent px-2 py-1 text-[12px] text-black placeholder:text-[var(--muted)] focus:outline-none tabular-nums"
                      />
                      <span className="pr-2 text-[12px] font-medium text-black select-none shrink-0">
                        {field.unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 3: Order History */}
          <div className="w-full rounded-[6px] bg-[var(--card)] p-3 flex flex-col gap-3">
            {/* Header: Title (16px) & Subtitle (12px, --sub) */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[16px] font-bold text-black leading-tight">
                  Order History
                </h3>
                <p className="text-[12px] text-[var(--sub)] mt-0.5">
                  {orderHistoryCards.length} recorded
                </p>
              </div>
            </div>

            {/* 3 Order History Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {orderHistoryCards.map((card) => (
                <div
                  key={card.id}
                  className="bg-white rounded-[12px] p-3 border border-[#EDEDED] flex flex-col justify-between gap-3 shadow-2xs"
                >
                  {/* Top row: Order name (14px) + Date (12px) + Status Pill */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-[14px] font-semibold text-black truncate leading-tight">
                        {card.title}
                      </h4>
                      <p className="text-[12px] text-[var(--sub)] mt-0.5 leading-tight">
                        {card.date}
                      </p>
                    </div>

                    {/* Status Pill */}
                    <span
                      style={{
                        backgroundColor: card.badgeColor,
                        color: card.badgeColor === 'var(--pill-pending)' ? '#000000' : '#FFFFFF',
                      }}
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide shrink-0"
                    >
                      {card.badge}
                    </span>
                  </div>

                  {/* 3-Up Thumbnail Grid */}
                  <div className="grid grid-cols-3 gap-1.5">
                    {card.images.map((img, idx) => (
                      <div
                        key={idx}
                        className="aspect-square rounded-[8px] overflow-hidden bg-[var(--chip)] border border-[#EDEDED]"
                      >
                        <img
                          src={img}
                          alt="Style"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Hairline-separated Price Row */}
                  <div className="pt-2 border-t border-[#EDEDED] flex items-center justify-between">
                    <span className="text-[12px] text-[var(--price-label)]">
                      Order Total
                    </span>
                    <span className="text-[14px] font-bold text-black tabular-nums">
                      <AnimatedNumberMorph value={card.price} prefix="₦" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Floating Undo Toast (5 seconds) when a measurement field is removed */}
      <AnimatePresence>
        {undoToast && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={springSmooth}
            className="fixed bottom-6 right-6 z-50 bg-white rounded-[16px] px-4 py-3 shadow-xl border border-[var(--outline)] flex items-center gap-3 select-none"
          >
            <span className="text-[12px] font-medium text-[var(--text-strong)]">
              Removed &quot;{undoToast.item.name}&quot;
            </span>
            <button
              type="button"
              onClick={handleUndoRemove}
              className="text-[12px] font-bold text-[var(--primary)] hover:underline cursor-pointer"
            >
              Undo
            </button>
            <button
              type="button"
              onClick={() => {
                setUndoToast(null);
                if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
              }}
              className="p-1 text-[var(--muted)] hover:text-black cursor-pointer"
              aria-label="Dismiss toast"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

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
