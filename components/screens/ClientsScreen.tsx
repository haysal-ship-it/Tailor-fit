'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/lib/store';
import { 
  Search, 
  ChevronRight, 
  Phone, 
  Mail, 
  User, 
  ClipboardList, 
  X,
  Users,
  UserCheck,
  ShoppingBag
} from 'lucide-react';
import { SmallFloatingDock } from '@/components/ui/SmallFloatingDock';
import { AnimatedNumberMorph } from '@/components/ui/AnimatedNumberMorph';
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

  // Set Point Size Modal
  const [pointModalData, setPointModalData] = useState<{
    key?: string;
    name: string;
    value: string;
    isCustom?: boolean;
  } | null>(null);
  const [pointModalError, setPointModalError] = useState('');

  // Handle Escape key to close dialogs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && pointModalData) {
        setPointModalData(null);
        setPointModalError('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pointModalData]);

  const defaultClients = useMemo(() => [
    {
      id: 'c-1',
      initials: 'CD',
      name: 'Chloe Dallas',
      phone: '+234 809 489 2011',
      email: 'chloedallas@couture.com',
      since: 'Client since Aug 2025',
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
    {
      id: 'c-7',
      initials: 'KA',
      name: 'Kemi Adebayo',
      phone: '+234 802 334 5511',
      email: 'kemi.adebayo@couture.com',
      since: 'Client since Jan 2026',
    },
    {
      id: 'c-8',
      initials: 'BO',
      name: 'Bimpe Okonjo',
      phone: '+234 812 445 6677',
      email: 'bimpe.okonjo@gmail.com',
      since: 'Client since Mar 2026',
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
            ? `Client since ${new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
            : 'Client since Aug 2025',
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

  const handleOpenPoint = (key: string, name: string) => {
    const current = clientFields.find((f) => f.id === key);
    setPointModalData({
      key,
      name,
      value: current ? current.value : '0.0',
      isCustom: false,
    });
    setPointModalError('');
  };

  const handleSavePointModal = () => {
    if (!pointModalData) return;
    const num = parseFloat(pointModalData.value);
    if (isNaN(num) || num <= 0) {
      setPointModalError('Enter a valid positive number');
      return;
    }

    if (pointModalData.key) {
      setClientFields((prev) =>
        prev.map((f) =>
          f.id === pointModalData.key
            ? { ...f, value: num.toFixed(1) }
            : f
        )
      );
    } else if (pointModalData.isCustom && pointModalData.name.trim()) {
      const newId = pointModalData.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      setClientFields((prev) => [
        ...prev,
        {
          id: newId,
          name: pointModalData.name.trim(),
          value: num.toFixed(1),
          unit: 'cm',
        },
      ]);
    }

    setPointModalData(null);
    setPointModalError('');
  };

  // Section 4: Order History data with exact measurement dates ("Size taken on DD-MM-YYYY") and target colors
  const orderHistoryCards = [
    {
      id: 'ord-hist-1',
      title: 'Bespoke African Gown',
      badge: 'Urgent',
      badgeColor: '#F06B05',
      date: 'Size taken on 09-10-2025',
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
      badgeColor: '#0E9F5C',
      date: 'Size taken on 02-10-2025',
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
      badgeColor: '#A0B900',
      date: 'Size taken on 18-09-2025',
      price: 95000,
      images: [
        'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80',
        'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=300&q=80',
        'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80',
      ],
    },
  ];

  // Section 5: List up to 5 most recently viewed clients, EXCLUDING the one currently open
  const directoryClients = useMemo(() => {
    return allClientList
      .filter((c) => c.id !== selectedClientProfile.id)
      .filter((c) =>
        searchQuery.trim()
          ? c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.phone.includes(searchQuery) ||
            c.email.toLowerCase().includes(searchQuery.toLowerCase())
          : true
      )
      .slice(0, 5);
  }, [allClientList, selectedClientProfile.id, searchQuery]);

  return (
    <div className="w-full max-w-[1216px] mx-auto mt-4 px-4 sm:px-0 pb-20 select-none">
      {/* =======================================================================
          Page layout (1280px design width; build fluidly)
          Below header (16px gap): two blocks side by side with a 24px gap:
          - Client Directory column (about 27.4% of width, 333px at 1280)
          - Main panel (the rest, 852px at 1280)
          Both blocks are white containers (2px padding, radius 8) holding --card cards (radius 6).
          Directory column is only as tall as its content.
          Main panel's sections stack with 2px gaps.
          ======================================================================= */}
      <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
        
        {/* =====================================================================
            5. CLIENT DIRECTORY COLUMN
            White container (2px padding, radius 8) holding one flat --card card
            (12px padding, 16px gap between groups).
            ===================================================================== */}
        <div
          className={cn(
            'w-full lg:w-[333px] lg:shrink-0 p-[2px] rounded-[8px] bg-white',
            mobileTab !== 'directory' ? 'hidden lg:block' : 'block'
          )}
        >
          {/* Client Directory Card */}
          <div className="w-full rounded-[6px] bg-[var(--card)] p-3 flex flex-col gap-4">
            
            {/* Title & Search group */}
            <div>
              <h2 className="text-[16px] font-bold text-black leading-tight">
                Client Directory
              </h2>

              {/* Search field: --field-on-card fill, 1px #EDEDED border, radius 8, 8px padding, magnifier icon */}
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
                {directoryClients.length === 0 ? (
                  <div className="p-4 text-center text-[12px] text-[var(--muted)]">
                    No other clients match &ldquo;{searchQuery}&rdquo;
                  </div>
                ) : (
                  directoryClients.map((client) => {
                    return (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => handleSelectClient(client)}
                        className="w-full p-2 rounded-[8px] flex items-center justify-between text-left transition-colors cursor-pointer select-none bg-[var(--chip)] hover:bg-[#EAEAEA]"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1 pr-1">
                          {/* White circle avatar: 8px padding, initials 14px / 700 --text-strong */}
                          <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shrink-0">
                            <span className="text-[14px] font-bold text-[var(--text-strong)]">
                              {client.initials}
                            </span>
                          </div>

                          <div className="min-w-0 flex-1">
                            {/* Name 12px / 500 --text-strong above phone number 12px / 400 --muted */}
                            <h4 className="text-[12px] font-medium text-[var(--text-strong)] truncate leading-tight">
                              {client.name}
                            </h4>
                            <p className="text-[12px] font-normal text-[var(--muted)] truncate leading-tight mt-0.5">
                              {client.phone}
                            </p>
                          </div>
                        </div>

                        {/* 24px white circle button holding a 16px chevron */}
                        <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0 shadow-2xs">
                          <ChevronRight className="w-4 h-4 text-[var(--text-2)]" />
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        </div>

        {/* =====================================================================
            0. MAIN PANEL (852px at 1280)
            White (#FFFFFF) container with 2px padding, radius 8, and 2px gaps
            between sections. Sections are flat #F8F8F8 blocks with radius 6.
            No borders, no shadows, no white boxes inside grey sections.
            Exception: top header row is white.
            ===================================================================== */}
        <div
          className={cn(
            'flex-1 w-full min-w-0 p-[2px] rounded-[8px] bg-white flex flex-col gap-[2px]',
            mobileTab === 'directory' ? 'hidden lg:flex' : 'flex'
          )}
        >
          {/* ===================================================================
              1. MAIN PANEL HEADER ROW (WHITE)
              White background, 24px padding, content on one row.
              Left: Eyebrow "CLIENT PROFILE" (12px, --muted, 0.3px letter-spacing)
              above client name (18px / 600, black, 0.48px letter-spacing).
              Right: New Order button as secondary outline style: --chip fill,
              1px --outline border, radius 24, 8px padding, text --text-2 14px / 500,
              no plus icon and not blue.
              =================================================================== */}
          <div className="w-full rounded-[6px] bg-white p-6 flex items-center justify-between">
            <div>
              <span className="text-[12px] text-[var(--muted)] tracking-[0.3px] uppercase font-medium leading-none block mb-1">
                CLIENT PROFILE
              </span>
              <h1 className="text-[18px] font-semibold text-black tracking-[0.48px] leading-tight">
                {selectedClientProfile.name}
              </h1>
            </div>

            {/* Secondary outline style: --chip fill, 1px --outline border, radius 24, 8px padding, text --text-2 14px / 500, no plus icon */}
            <button
              type="button"
              onClick={() => onNewOrder(selectedClientProfile.id)}
              className="h-9 px-4 rounded-[24px] bg-[var(--chip)] border border-[var(--outline)] text-[var(--text-2)] text-[14px] font-medium hover:bg-[#EAEAEA] transition-colors cursor-pointer"
            >
              New Order
            </button>
          </div>

          {/* ===================================================================
              2. PROFILE CARD
              --card block, radius 6, 24px padding, content centered in column with 8px gaps:
              - 64px black circle with white initials (14px / 700)
              - Name (16px / 500, black)
              - "Client since Aug 2025" (12px, --muted)
              - Centered row with 16px gap: 16px phone icon + phone, 16px envelope icon + email
                (12px, black, icon 4px from text). Plain text and icons only, no chips.
              =================================================================== */}
          <div className="w-full rounded-[6px] bg-[var(--card)] p-6 flex flex-col items-center justify-center text-center gap-2">
            {/* 64px black circle with white initials */}
            <div className="w-16 h-16 rounded-full bg-black flex items-center justify-center text-[14px] font-bold text-white shadow-xs shrink-0">
              {selectedClientProfile.initials}
            </div>

            {/* Name */}
            <h2 className="text-[16px] font-medium text-black leading-tight">
              {selectedClientProfile.name}
            </h2>

            {/* Client since line */}
            <p className="text-[12px] text-[var(--muted)] leading-tight">
              {selectedClientProfile.since}
            </p>

            {/* One centered row with 16px gap: phone and email plain text + icons */}
            <div className="flex items-center justify-center gap-4 text-[12px] text-black pt-1">
              <div className="flex items-center gap-1">
                <Phone className="w-4 h-4 text-black shrink-0" />
                <span>{selectedClientProfile.phone}</span>
              </div>
              <div className="flex items-center gap-1">
                <Mail className="w-4 h-4 text-black shrink-0" />
                <span>{selectedClientProfile.email}</span>
              </div>
            </div>
          </div>

          {/* ===================================================================
              3. BODY MEASUREMENT HISTORY
              --card block, radius 6, 24px padding, 8px gap.
              No white bordered box around diagram. No "(Read-Only)" subtitle.
              Title "Body Measurement History" (16px / 600, black).
              Under it: left "Mannequin" (16px / 500) + "All available points • Feminine Form" (12px / 500, --muted).
              Right: Add Point outline button (same style as New Order) + View toggle group.
              View toggle group: --track background, radius 24, padding 6px 8px, 4px gap.
              Active item: --primary blue circle with white icon; inactive item: white circle with --text-2 icon.
              45px below header row: diagram horizontally centered on flat --card surface, min-height 633px at 1280.
              Points and labels: 6 Overview points with dashed leader lines and ring styles. Labels show point name ONLY.
              =================================================================== */}
          <div className="w-full rounded-[6px] bg-[var(--card)] p-6 flex flex-col gap-2">
            <h3 className="text-[16px] font-semibold text-black leading-tight">
              Body Measurement History
            </h3>

            {/* Header row */}
            <div className="flex items-start justify-between gap-2 mt-1">
              <div>
                <h4 className="text-[16px] font-medium text-black leading-tight">
                  Mannequin
                </h4>
                <div className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--muted)] mt-1">
                  <span>All available points</span>
                  <span className="w-1 h-1 rounded-full bg-[var(--muted)]" />
                  <span>Feminine Form</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Add Point outline button (same style as New Order: --chip fill, 1px --outline border, radius 24, text --text-2 14px / 500, no plus icon) */}
                <button
                  type="button"
                  onClick={() => {
                    setPointModalData({
                      name: '',
                      value: '0.0',
                      isCustom: true,
                    });
                    setPointModalError('');
                  }}
                  className="h-9 px-4 rounded-[24px] bg-[var(--chip)] border border-[var(--outline)] text-[var(--text-2)] text-[14px] font-medium hover:bg-[#EAEAEA] transition-colors cursor-pointer"
                >
                  Add Point
                </button>

                {/* View toggle group: --track background, radius 24, padding 6px 8px, 4px gap */}
                <div className="flex items-center bg-[var(--track)] rounded-[24px] px-2 py-1.5 gap-1">
                  <button
                    type="button"
                    onClick={() => setMannequinView('mannequin')}
                    className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer',
                      mannequinView === 'mannequin'
                        ? 'bg-[var(--primary)] text-white shadow-xs'
                        : 'bg-white text-[var(--text-2)] hover:text-black'
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
                        ? 'bg-[var(--primary)] text-white shadow-xs'
                        : 'bg-white text-[var(--text-2)] hover:text-black'
                    )}
                    title="Measurement List View"
                  >
                    <ClipboardList className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* 45px below the header row, the diagram horizontally centered on the flat --card surface. Minimum height of 633px at 1280 */}
            <div className="mt-[45px]">
              {mannequinView === 'mannequin' ? (
                <div className="w-full min-h-[633px] flex items-center justify-center select-none py-2">
                  <svg
                    viewBox="0 0 304 467"
                    className="w-full max-w-[304px] h-auto max-h-[467px] select-none"
                    style={{ overflow: 'visible' }}
                  >
                    {/* Plain transparent PNG, no background rectangle, filter, blend mode or mask */}
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

                    {/* Six Point Markers */}
                    {/* Neck */}
                    <g className="cursor-pointer group" onClick={() => handleOpenPoint('neck', 'Neck')}>
                      <circle cx="145.7" cy="80.9" r="5" fill="rgba(7, 155, 248, 0.15)" stroke="#079BF8" strokeWidth="1" />
                      <circle cx="145.7" cy="80.9" r="2" fill="#079BF8" />
                    </g>
                    {/* Shoulder */}
                    <g className="cursor-pointer group" onClick={() => handleOpenPoint('shoulder', 'Shoulder')}>
                      <circle cx="178.9" cy="93.1" r="5" fill="rgba(7, 155, 248, 0.15)" stroke="#079BF8" strokeWidth="1" />
                      <circle cx="178.9" cy="93.1" r="2" fill="#079BF8" />
                    </g>
                    {/* Bust */}
                    <g className="cursor-pointer group" onClick={() => handleOpenPoint('bust', 'Bust')}>
                      <circle cx="178.9" cy="124.0" r="5" fill="rgba(7, 155, 248, 0.15)" stroke="#079BF8" strokeWidth="1" />
                      <circle cx="178.9" cy="124.0" r="2" fill="#079BF8" />
                    </g>
                    {/* Sleeve */}
                    <g className="cursor-pointer group" onClick={() => handleOpenPoint('sleeve', 'Sleeve')}>
                      <circle cx="221.0" cy="185.7" r="5" fill="rgba(7, 155, 248, 0.15)" stroke="#079BF8" strokeWidth="1" />
                      <circle cx="221.0" cy="185.7" r="2" fill="#079BF8" />
                    </g>
                    {/* Waist */}
                    <g className="cursor-pointer group" onClick={() => handleOpenPoint('waist', 'Waist')}>
                      <circle cx="119.6" cy="208.5" r="5" fill="rgba(7, 155, 248, 0.15)" stroke="#079BF8" strokeWidth="1" />
                      <circle cx="119.6" cy="208.5" r="2" fill="#079BF8" />
                    </g>
                    {/* Thigh */}
                    <g className="cursor-pointer group" onClick={() => handleOpenPoint('thigh', 'Thigh')}>
                      <circle cx="178.9" cy="363.9" r="5" fill="rgba(7, 155, 248, 0.15)" stroke="#079BF8" strokeWidth="1" />
                      <circle cx="178.9" cy="363.9" r="2" fill="#079BF8" />
                    </g>

                    {/* Labels: Point name ONLY (Manrope 500, 13px, black) */}
                    {/* Neck (48.5, 69.7) */}
                    <text
                      x="48.5"
                      y="69.7"
                      fontFamily="var(--font-manrope), sans-serif"
                      fontSize="13"
                      fontWeight="500"
                      fill="#000000"
                      dominantBaseline="hanging"
                      className="cursor-pointer hover:fill-[#079BF8] transition-colors"
                      onClick={() => handleOpenPoint('neck', 'Neck')}
                    >
                      Neck
                    </text>
                    {/* Waist (0, 165.5) */}
                    <text
                      x="0"
                      y="165.5"
                      fontFamily="var(--font-manrope), sans-serif"
                      fontSize="13"
                      fontWeight="500"
                      fill="#000000"
                      dominantBaseline="hanging"
                      className="cursor-pointer hover:fill-[#079BF8] transition-colors"
                      onClick={() => handleOpenPoint('waist', 'Waist')}
                    >
                      Waist
                    </text>
                    {/* Shoulder (244.3, 50.5) */}
                    <text
                      x="244.3"
                      y="50.5"
                      fontFamily="var(--font-manrope), sans-serif"
                      fontSize="13"
                      fontWeight="500"
                      fill="#000000"
                      dominantBaseline="hanging"
                      className="cursor-pointer hover:fill-[#079BF8] transition-colors"
                      onClick={() => handleOpenPoint('shoulder', 'Shoulder')}
                    >
                      Shoulder
                    </text>
                    {/* Bust (252.9, 114.4) */}
                    <text
                      x="252.9"
                      y="114.4"
                      fontFamily="var(--font-manrope), sans-serif"
                      fontSize="13"
                      fontWeight="500"
                      fill="#000000"
                      dominantBaseline="hanging"
                      className="cursor-pointer hover:fill-[#079BF8] transition-colors"
                      onClick={() => handleOpenPoint('bust', 'Bust')}
                    >
                      Bust
                    </text>
                    {/* Sleeve (259.9, 175.5) */}
                    <text
                      x="259.9"
                      y="175.5"
                      fontFamily="var(--font-manrope), sans-serif"
                      fontSize="13"
                      fontWeight="500"
                      fill="#000000"
                      dominantBaseline="hanging"
                      className="cursor-pointer hover:fill-[#079BF8] transition-colors"
                      onClick={() => handleOpenPoint('sleeve', 'Sleeve')}
                    >
                      Sleeve
                    </text>
                    {/* Thigh (271.3, 383.3) */}
                    <text
                      x="271.3"
                      y="383.3"
                      fontFamily="var(--font-manrope), sans-serif"
                      fontSize="13"
                      fontWeight="500"
                      fill="#000000"
                      dominantBaseline="hanging"
                      className="cursor-pointer hover:fill-[#079BF8] transition-colors"
                      onClick={() => handleOpenPoint('thigh', 'Thigh')}
                    >
                      Thigh
                    </text>
                  </svg>
                </div>
              ) : (
                /* Field grid as Measurement List View with saved values: 3 columns, X icons hidden */
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 py-1">
                  {clientFields.map((field) => (
                    <div
                      key={field.id}
                      className="bg-white rounded-[16px] p-4 flex flex-col justify-between gap-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[14px] font-semibold text-black truncate">
                          {field.name}
                        </span>
                        {/* X icons hidden as requested */}
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
          </div>

          {/* ===================================================================
              4. ORDER HISTORY
              --card block, radius 6, 24px padding, 8px gap.
              Title "Order History" (16px / 600, black). No "3 recorded" caption.
              Three cards in a row with 8px gaps.
              Each order card is rebuilt as a white container (--surface, radius 8, 2px padding, 2px gap between parts).
              - Header: white, radius 8, padding 12px 8px, 12px gap. Left: garment name (14px / 600) + "Size taken on DD-MM-YYYY" (14px / 500, --sub). Right: status pill (radius 24, padding 2px 4px, 12px white text).
              - Style references band: dark --band (#222222) block, radius 6, 8px padding, 4px gap. Label "Style references" (12px / 600, white), 3 thumbnails (equal widths, 66px tall, radius 8, object-fit cover, 4px gaps).
              - Price row: white, radius 8, 8px padding, space-between: "Price" (12px, --price-label) on left, amount on right (16px / 600, black, tabular numerals). No hairline.
              =================================================================== */}
          <div className="w-full rounded-[6px] bg-[var(--card)] p-6 flex flex-col gap-2">
            <h3 className="text-[16px] font-semibold text-black leading-tight">
              Order History
            </h3>

            {/* Three cards in a row with 8px gaps */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {orderHistoryCards.map((card) => (
                <div
                  key={card.id}
                  className="bg-white rounded-[8px] p-[2px] flex flex-col gap-[2px]"
                >
                  {/* Part 1: Header - white, radius 8, padding 12px 8px, 12px gap */}
                  <div className="bg-white rounded-[8px] px-2 py-3 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-[14px] font-semibold text-black truncate leading-tight">
                        {card.title}
                      </h4>
                      <p className="text-[14px] font-medium text-[var(--sub)] mt-1 leading-tight">
                        {card.date}
                      </p>
                    </div>

                    {/* Status pill: radius 24, padding 2px 4px, 12px white text */}
                    <span
                      style={{ backgroundColor: card.badgeColor }}
                      className="px-2 py-0.5 rounded-[24px] text-[12px] font-medium text-white shrink-0 leading-tight"
                    >
                      {card.badge}
                    </span>
                  </div>

                  {/* Part 2: Style references band: dark --band (#222222), radius 6, 8px padding, 4px gap */}
                  <div className="bg-[var(--band)] rounded-[6px] p-2 flex flex-col gap-1">
                    <span className="text-[12px] font-semibold text-white leading-tight">
                      Style references
                    </span>
                    <div className="grid grid-cols-3 gap-1">
                      {card.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt="Style reference"
                          className="w-full h-[66px] rounded-[8px] object-cover"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Part 3: Price row: white, radius 8, 8px padding, space-between: "Price" on left, amount on right. No hairline. */}
                  <div className="bg-white rounded-[8px] p-2 flex items-center justify-between">
                    <span className="text-[12px] text-[var(--price-label)]">
                      Price
                    </span>
                    <span className="text-[16px] font-semibold text-black tabular-nums">
                      <AnimatedNumberMorph value={card.price} prefix="₦" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* =======================================================================
          SET POINT SIZE DIALOG (prefilled with saved value)
          ======================================================================= */}
      <AnimatePresence>
        {pointModalData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[8px]"
          >
            <div
              className="absolute inset-0"
              onClick={() => {
                setPointModalData(null);
                setPointModalError('');
              }}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="client-point-dialog-title"
              variants={{
                initial: { opacity: 0, scale: 0.94 },
                animate: {
                  opacity: 1,
                  scale: 1,
                  transition: { type: 'spring', stiffness: 300, damping: 22, mass: 0.9 },
                },
                exit: {
                  opacity: 0,
                  scale: 0.96,
                  transition: { duration: 0.15, ease: [0.2, 0, 0, 1] },
                },
              }}
              initial="initial"
              animate="animate"
              exit="exit"
              style={{
                boxShadow: '-1px 3px 4.2px rgba(182, 182, 182, 0.15)',
              }}
              className="relative w-[400px] max-w-[calc(100vw-32px)] rounded-[16px] bg-white p-6 z-10 flex flex-col gap-6"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 id="client-point-dialog-title" className="text-[16px] font-bold text-black">
                  {pointModalData.key
                    ? `Set ${pointModalData.name} Point Size`
                    : pointModalData.isCustom
                    ? 'Add Custom Point'
                    : `Add ${pointModalData.name}`}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setPointModalData(null);
                    setPointModalError('');
                  }}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[var(--muted)] hover:text-black transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSavePointModal();
                }}
                className="flex flex-col gap-4"
              >
                {pointModalData.isCustom && (
                  <div>
                    <label className="block text-[11px] font-normal text-black mb-[2px]">
                      Point Name
                    </label>
                    <div className="w-full bg-[var(--card)] border border-[#EDEDED] rounded-[8px] p-2">
                      <input
                        type="text"
                        value={pointModalData.name}
                        placeholder="e.g. Jacket Length"
                        onChange={(e) => {
                          setPointModalError('');
                          setPointModalData({ ...pointModalData, name: e.target.value });
                        }}
                        autoFocus
                        className="w-full bg-transparent text-[12px] text-black placeholder:text-[var(--muted)] focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-normal text-black mb-[2px]">
                    Measurement (CM)
                  </label>
                  <div className="w-full bg-[var(--card)] border border-[#EDEDED] rounded-[8px] p-2 flex items-center">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={pointModalData.value}
                      placeholder="0.0"
                      onChange={(e) => {
                        setPointModalError('');
                        setPointModalData({ ...pointModalData, value: e.target.value });
                      }}
                      autoFocus={!pointModalData.isCustom}
                      className="w-full bg-transparent text-[12px] text-black placeholder:text-[var(--muted)] focus:outline-none tabular-nums"
                    />
                    <span className="pr-1 text-[12px] font-medium text-black select-none shrink-0">
                      cm
                    </span>
                  </div>
                </div>

                {pointModalError && (
                  <p className="text-[12px] text-[var(--paused)] font-normal">
                    {pointModalError}
                  </p>
                )}

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPointModalData(null);
                      setPointModalError('');
                    }}
                    className="h-9 px-4 rounded-[24px] bg-[var(--chip)] border border-[var(--outline)] text-[var(--text-2)] text-[14px] font-medium hover:bg-[#eaeaea] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="h-9 px-6 rounded-[24px] bg-[var(--primary)] text-white text-[14px] font-medium hover:opacity-95 transition-opacity cursor-pointer shadow-xs"
                  >
                    Save
                  </button>
                </div>
              </form>
            </motion.div>
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
