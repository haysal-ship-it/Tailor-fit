'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/lib/store';
import {
  Search,
  ChevronRight,
  Phone,
  Mail,
  User,
  ClipboardList,
  Columns2,
  X,
  Users,
  UserCheck,
  ShoppingBag,
  Check,
  Trash2,
  Plus,
} from 'lucide-react';
import { SmallFloatingDock } from '@/components/ui/SmallFloatingDock';
import { AnimatedNumberMorph } from '@/components/ui/AnimatedNumberMorph';
import { RotatableMannequin } from '@/components/mannequin/RotatableMannequin';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import {
  ANATOMICAL_ZONES,
  getZoneLabel,
  normalizeZoneId,
  resolveCanonicalKey,
  normalizeMeasurementsRecord,
} from '@/lib/initial-data';
import { springSmooth, springSnappy } from '@/lib/motion-tokens';
import { cn } from '@/lib/utils';

interface ClientsScreenProps {
  onOpenClient?: (clientId: string) => void;
  onNewMeasurement?: (clientId: string) => void;
  onNewOrder: (clientId: string) => void;
  onEditOrder?: (orderId: string) => void;
}

const DEFAULT_FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=300&q=80',
];

export function ClientsScreen({
  onNewOrder,
  onEditOrder,
}: ClientsScreenProps) {
  const {
    clients,
    orders,
    settings,
    allHotspots,
    selectedClientId,
    setSelectedClientId,
    addClient,
    addSnapshot,
    updateSnapshot,
    deleteTemplate,
    getClientSnapshots,
    getClientOrders,
  } = useStore();

  const unitLabel = settings?.defaultUnit || 'cm';
  const currencySymbol = settings?.currency || '₦';

  const [mobileTab, setMobileTab] = useState<'directory' | 'profile' | 'orders'>('directory');
  const [searchQuery, setSearchQuery] = useState('');
  const [directoryFilter, setDirectoryFilter] = useState<'all' | 'active'>('all');

  // Workspace view mode on desktop: 'split' (Mannequin + Measurements side-by-side), 'mannequin', or 'table'
  const [mannequinView, setMannequinView] = useState<'split' | 'mannequin' | 'table'>('split');
  const [mannequinGender, setMannequinGender] = useState<'female' | 'male'>('female');
  const [zoneFilter, setZoneFilter] = useState<
    'all' | 'head_neck' | 'torso' | 'upper_limb' | 'lower_limb'
  >('all');

  //Garment Template modal state
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [dialogSelectedTemplateId, setDialogSelectedTemplateId] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedTemplateName, setSelectedTemplateName] = useState<string>('');

  // New Client Modal state
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientNotes, setNewClientNotes] = useState('');

  // Set Point Size / Add Point Modal (Requirement C & D)
  const [pointModalData, setPointModalData] = useState<{
    mode: 'edit' | 'add';
    key: string;
    name: string;
    zone: string;
    value: string;
  } | null>(null);
  const [pointModalError, setPointModalError] = useState('');

  // Saved indicator toast
  const [savedIndicator, setSavedIndicator] = useState<string | null>(null);
  const saveIndicatorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Map canonical key -> hotspot metadata
  const hotspotMap = useMemo(() => {
    const map: Record<
      string,
      { key: string; label: string; zone: string; zoneId: string; defaultValCm: number }
    > = {};
    allHotspots.forEach((h) => {
      map[h.key] = {
        key: h.key,
        label: h.label,
        zone: getZoneLabel(h.category),
        zoneId: normalizeZoneId(h.category),
        defaultValCm: h.defaultValCm ?? 40,
      };
    });
    return map;
  }, [allHotspots]);

  const hotspotsByZone = useMemo(() => {
    return ANATOMICAL_ZONES.map((zone) => ({
      ...zone,
      items: allHotspots.filter((h) => normalizeZoneId(h.category) === zone.id),
    }));
  }, [allHotspots]);

  const storeTemplates = useMemo(() => {
    return settings?.templates || [];
  }, [settings?.templates]);

  // Handle Escape key to close dialogs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (pointModalData) {
          setPointModalData(null);
          setPointModalError('');
        }
        if (isTemplateModalOpen) {
          setIsTemplateModalOpen(false);
        }
        if (isNewClientModalOpen) {
          setIsNewClientModalOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pointModalData, isTemplateModalOpen, isNewClientModalOpen]);

  // Enrich store clients with display fields & order counts
  const allClientList = useMemo(() => {
    return clients.map((c) => {
      const initials =
        c.name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase() || 'CL';
      const clientOrders = orders.filter((o) => o.clientId === c.id);
      const activeOrdersCount = clientOrders.filter(
        (o) => o.status !== 'Completed' && o.status !== 'Picked Up'
      ).length;
      return {
        id: c.id,
        initials,
        name: c.name,
        phone: c.phone || '+234 800 000 0000',
        email: c.email || 'client@couture.com',
        notes: c.notes || '',
        totalOrdersCount: clientOrders.length,
        activeOrdersCount,
        since: c.createdAt
          ? `Client since ${new Date(c.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              year: 'numeric',
            })}`
          : 'Client since Aug 2025',
      };
    });
  }, [clients, orders]);

  const activeClientId = selectedClientId || allClientList[0]?.id || 'c-1';
  const selectedClientProfile = useMemo(() => {
    return (
      allClientList.find((c) => c.id === activeClientId) ||
      allClientList[0] || {
        id: 'c-1',
        initials: 'CD',
        name: 'Chloe Dallas',
        phone: '+234 809 489 2011',
        email: 'chloedallas@couture.com',
        notes: '',
        totalOrdersCount: 0,
        activeOrdersCount: 0,
        since: 'Client since Aug 2025',
      }
    );
  }, [allClientList, activeClientId]);

  /**
   * Directory Clients List:
   * Never filters out the currently selected client! Keeps the list stable and highlights
   * the selected client with `--selected` & `--selected-bg`.
   */
  const directoryClients = useMemo(() => {
    return allClientList
      .filter((c) => {
        if (directoryFilter === 'active' && c.activeOrdersCount === 0) return false;
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q)
        );
      });
  }, [allClientList, searchQuery, directoryFilter]);

  // Client's saved snapshots from store
  const clientSnapshots = useMemo(() => {
    return getClientSnapshots(selectedClientProfile.id);
  }, [getClientSnapshots, selectedClientProfile.id]);

  const [activeSnapshotId, setActiveSnapshotId] = useState<string>('');
  const [activePointKeys, setActivePointKeys] = useState<string[]>([]);
  const [measurements, setMeasurements] = useState<Record<string, number>>({});

  // Sync active snapshot & measurements when selected client changes
  useEffect(() => {
    const snaps = getClientSnapshots(selectedClientProfile.id);
    if (snaps.length > 0) {
      const latest = snaps[0];
      const normalized = normalizeMeasurementsRecord(latest.measurements);
      const keys = Object.keys(normalized);
      setActiveSnapshotId(latest.id);
      setSelectedTemplateName(latest.garmentType || '');
      setSelectedTemplateId('');
      setActivePointKeys(keys);
      setMeasurements(normalized);
    } else {
      // Requirement D: Clean empty state when no points/template are selected
      setActiveSnapshotId('');
      setSelectedTemplateName('');
      setSelectedTemplateId('');
      setActivePointKeys([]);
      setMeasurements({});
    }
    setZoneFilter('all');
  }, [selectedClientProfile.id, getClientSnapshots]);

  const triggerSavedIndicator = (msg = 'Saved to client profile') => {
    setSavedIndicator(msg);
    if (saveIndicatorTimeoutRef.current) clearTimeout(saveIndicatorTimeoutRef.current);
    saveIndicatorTimeoutRef.current = setTimeout(() => {
      setSavedIndicator(null);
    }, 2400);
  };

  // Persist measurement changes directly to store snapshot
  const persistMeasurementsToStore = (
    nextKeys: string[],
    nextMeasurements: Record<string, number>,
    garmentLabel?: string
  ) => {
    const filteredObj: Record<string, number> = {};
    nextKeys.forEach((k) => {
      if (nextMeasurements[k] !== undefined && !isNaN(nextMeasurements[k])) {
        filteredObj[k] = nextMeasurements[k];
      }
    });

    if (activeSnapshotId) {
      updateSnapshot(activeSnapshotId, {
        measurements: filteredObj,
        ...(garmentLabel ? { garmentType: garmentLabel } : {}),
      });
    } else {
      const created = addSnapshot({
        clientId: selectedClientProfile.id,
        date: new Date()
          .toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })
          .replace(/\//g, '-'),
        unit: unitLabel,
        garmentType: garmentLabel || selectedTemplateName || 'Custom Fit',
        measurements: filteredObj,
      });
      setActiveSnapshotId(created.id);
    }
    triggerSavedIndicator();
  };

  const handleSelectClient = (client: { id: string }) => {
    setSelectedClientId(client.id);
    setMobileTab('profile');
  };

  // Switch between client's saved snapshots
  const handleSelectSnapshot = (snapId: string) => {
    const found = clientSnapshots.find((s) => s.id === snapId);
    if (!found) return;
    const normalized = normalizeMeasurementsRecord(found.measurements);
    setActiveSnapshotId(found.id);
    setSelectedTemplateName(found.garmentType || '');
    setActivePointKeys(Object.keys(normalized));
    setMeasurements(normalized);
  };

  // Apply a Garment Blueprint template from Settings (Requirement B & D)
  const applyTemplateById = (tmplId: string) => {
    const tmpl = storeTemplates.find((t) => t.id === tmplId);
    if (!tmpl) return;

    const canonicalKeys = Array.from(
      new Set((tmpl.fieldKeys || []).map((k) => resolveCanonicalKey(k)))
    );

    const nextMeasurements = { ...measurements };
    canonicalKeys.forEach((k) => {
      if (nextMeasurements[k] === undefined) {
        const defaultCm = hotspotMap[k]?.defaultValCm ?? 40;
        nextMeasurements[k] =
          unitLabel === 'in'
            ? parseFloat((defaultCm / 2.54).toFixed(1))
            : defaultCm;
      }
    });

    setSelectedTemplateId(tmpl.id);
    setSelectedTemplateName(tmpl.name);
    setActivePointKeys(canonicalKeys);
    setMeasurements(nextMeasurements);
    persistMeasurementsToStore(canonicalKeys, nextMeasurements, tmpl.name);
  };

  const handleFieldValueChange = (key: string, strVal: string) => {
    const num = parseFloat(strVal);
    const nextMeasurements = { ...measurements };
    if (!isNaN(num) && num > 0) {
      nextMeasurements[key] = num;
      setMeasurements(nextMeasurements);
      persistMeasurementsToStore(activePointKeys, nextMeasurements);
    } else if (strVal === '') {
      delete nextMeasurements[key];
      setMeasurements(nextMeasurements);
    }
  };

  const handleRemovePoint = (key: string) => {
    const nextKeys = activePointKeys.filter((k) => k !== key);
    setActivePointKeys(nextKeys);
    persistMeasurementsToStore(nextKeys, measurements);
  };

  // Requirement C: Tap on active mannequin touchpoint opens size-only modal
  const handleOpenPoint = (key: string, name: string) => {
    const canonical = resolveCanonicalKey(key);
    const meta = hotspotMap[canonical];
    const currentVal =
      measurements[canonical] !== undefined ? String(measurements[canonical]) : '';
    setPointModalData({
      mode: 'edit',
      key: canonical,
      name: meta?.label || name,
      zone: meta?.zone || 'Torso',
      value: currentVal,
    });
    setPointModalError('');
  };

  // Requirement D: Click "Add Point" opens selector from the 21 standard Sizing/Measurements
  const handleOpenAddPoint = () => {
    const firstUnadded =
      allHotspots.find((h) => !activePointKeys.includes(h.key)) || allHotspots[0];
    const key = firstUnadded?.key || 'neck_circumference';
    const existingVal =
      measurements[key] !== undefined ? String(measurements[key]) : '';
    setPointModalData({
      mode: 'add',
      key,
      name: firstUnadded?.label || 'Neck circumference',
      zone: firstUnadded ? getZoneLabel(firstUnadded.category) : 'Head/Neck',
      value: existingVal,
    });
    setPointModalError('');
  };

  const handleSavePointModal = () => {
    if (!pointModalData) return;
    const num = parseFloat(pointModalData.value);
    if (isNaN(num) || num <= 0 || num > 300) {
      setPointModalError('Enter a valid positive size (0.1 – 300)');
      return;
    }

    const canonical = resolveCanonicalKey(pointModalData.key);
    const nextKeys = activePointKeys.includes(canonical)
      ? activePointKeys
      : [...activePointKeys, canonical];
    const nextMeasurements = {
      ...measurements,
      [canonical]: num,
    };

    setActivePointKeys(nextKeys);
    setMeasurements(nextMeasurements);
    persistMeasurementsToStore(nextKeys, nextMeasurements);

    setPointModalData(null);
    setPointModalError('');
  };

  // Create New Client handler
  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;
    const created = addClient({
      name: newClientName.trim(),
      phone: newClientPhone.trim() || '+234 800 000 0000',
      email:
        newClientEmail.trim() ||
        `${newClientName.trim().toLowerCase().replace(/\s+/g, '.')}@couture.com`,
      notes: newClientNotes.trim(),
    });
    setNewClientName('');
    setNewClientPhone('');
    setNewClientEmail('');
    setNewClientNotes('');
    setIsNewClientModalOpen(false);
    setSelectedClientId(created.id);
    setMobileTab('profile');
    triggerSavedIndicator(`Client "${created.name}" added`);
  };

  // Active measurement cards filtered by zoneFilter
  const visibleMeasurementFields = useMemo(() => {
    return activePointKeys
      .map((key) => {
        const meta = hotspotMap[key];
        return {
          id: key,
          name: meta?.label || key,
          zone: meta?.zone || 'Torso',
          zoneId: meta?.zoneId || 'torso',
          value: measurements[key] !== undefined ? String(measurements[key]) : '',
          unit: unitLabel,
        };
      })
      .filter((f) => (zoneFilter === 'all' ? true : f.zoneId === zoneFilter));
  }, [activePointKeys, hotspotMap, measurements, unitLabel, zoneFilter]);

  // Live Order History cards for the selected client from store
  const orderHistoryCards = useMemo(() => {
    const clientOrders = getClientOrders(selectedClientProfile.id);
    return clientOrders.map((ord) => {
      const snap = ord.measurementSnapshotId
        ? clientSnapshots.find((s) => s.id === ord.measurementSnapshotId)
        : clientSnapshots[0];
      const dateStr = snap?.date
        ? `Size taken on ${snap.date}`
        : `Created ${new Date(ord.createdAt).toLocaleDateString('en-GB').replace(/\//g, '-')}`;

      let badge = ord.status || 'In Progress';
      let badgeColor = '#F06B05';
      if (ord.status === 'Ready' || ord.status === 'Completed' || ord.status === 'Picked Up') {
        badgeColor = '#0E9F5C';
      } else if (ord.status === 'Paused') {
        badgeColor = '#D93A4D';
      } else if (ord.status === 'Pending') {
        badgeColor = '#A0B900';
      }

      const imgs =
        ord.referenceImages && ord.referenceImages.length > 0
          ? ord.referenceImages.map((r) => r.url)
          : DEFAULT_FALLBACK_IMAGES;

      // Ensure 3 thumbnails for the signature dark style-reference band
      const paddedImages = [
        imgs[0] || DEFAULT_FALLBACK_IMAGES[0],
        imgs[1] || imgs[0] || DEFAULT_FALLBACK_IMAGES[1],
        imgs[2] || imgs[0] || DEFAULT_FALLBACK_IMAGES[2],
      ];

      return {
        id: ord.id,
        title: ord.garmentType || 'Bespoke Order',
        badge,
        badgeColor,
        date: dateStr,
        price: ord.price || 0,
        images: paddedImages,
      };
    });
  }, [getClientOrders, selectedClientProfile.id, clientSnapshots]);

  return (
    <div className="w-full max-w-[1216px] mx-auto mt-4 px-2 sm:px-4 lg:px-0 pb-24 select-none">
      {/* =======================================================================
          Master-Detail Layout (1280px design width; fluid)
          - Left Column: Sticky Client Directory (333px on lg)
          - Right Column: Unified Client Workspace (flex-1, ~852px on lg)
          Both blocks are white containers (2px padding, radius 8) holding --card cards (radius 6).
          ======================================================================= */}
      <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
        {/* =====================================================================
            LEFT COLUMN: STATEFUL CLIENT DIRECTORY (333px)
            ===================================================================== */}
        <div
          className={cn(
            'w-full lg:w-[333px] lg:shrink-0 p-[2px] rounded-[8px] bg-white lg:sticky lg:top-20',
            mobileTab !== 'directory' ? 'hidden lg:block' : 'block'
          )}
        >
          <div className="w-full rounded-[6px] bg-[var(--card)] p-3 flex flex-col gap-3.5">
            {/* Header Row: Title + "+ New Client" Pill */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <h2 className="text-[16px] font-bold text-black leading-tight">
                  Client Directory
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-white text-[11px] font-semibold text-[var(--text-2)] border border-[#EDEDED]">
                  {allClientList.length}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsNewClientModalOpen(true)}
                className="h-7 px-3 rounded-[24px] bg-white border border-[var(--outline)] text-[var(--text-strong)] text-[12px] font-semibold hover:bg-[#EAEAEA] transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Client</span>
              </button>
            </div>

            {/* Search field */}
            <div className="flex items-center gap-2 bg-[var(--field-on-card)] border border-[#EDEDED] rounded-[8px] p-2">
              <Search className="w-4 h-4 text-[var(--muted)] shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search clients by name, phone, email..."
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

            {/* Quick Directory Filter Pills */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 bg-white p-1 rounded-full border border-[#EDEDED]">
                <button
                  type="button"
                  onClick={() => setDirectoryFilter('all')}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer',
                    directoryFilter === 'all'
                      ? 'bg-[var(--primary)] text-white'
                      : 'text-[var(--text-2)] hover:text-black'
                  )}
                >
                  All Clients ({allClientList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setDirectoryFilter('active')}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer',
                    directoryFilter === 'active'
                      ? 'bg-[var(--primary)] text-white'
                      : 'text-[var(--text-2)] hover:text-black'
                  )}
                >
                  Active Orders
                </button>
              </div>
            </div>

            {/* Client List (Keeps selected client visible and highlighted!) */}
            <div className="bg-white rounded-[8px] p-[2px] flex flex-col gap-[2px] max-h-[520px] overflow-y-auto">
              {directoryClients.length === 0 ? (
                <div className="p-6 text-center text-[12px] text-[var(--muted)]">
                  No clients match &ldquo;{searchQuery}&rdquo;
                </div>
              ) : (
                directoryClients.map((client) => {
                  const isSelected = client.id === selectedClientProfile.id;
                  return (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => handleSelectClient(client)}
                      className={cn(
                        'w-full p-2.5 rounded-[8px] flex items-center justify-between text-left transition-all cursor-pointer select-none border',
                        isSelected
                          ? 'bg-[var(--selected-bg)] border-[var(--selected)]'
                          : 'bg-[var(--chip)] border-transparent hover:bg-[#EAEAEA]'
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                        <div
                          className={cn(
                            'w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors',
                            isSelected
                              ? 'bg-[var(--primary)] text-white'
                              : 'bg-white text-[var(--text-strong)]'
                          )}
                        >
                          <span className="text-[13px] font-bold">
                            {client.initials}
                          </span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h4
                              className={cn(
                                'text-[13px] truncate leading-tight',
                                isSelected
                                  ? 'font-bold text-[var(--primary)]'
                                  : 'font-semibold text-[var(--text-strong)]'
                              )}
                            >
                              {client.name}
                            </h4>
                            {client.activeOrdersCount > 0 && (
                              <span className="px-1.5 py-0.2 rounded-full bg-white text-[10px] font-semibold text-[var(--text-2)] border border-[#E5E5E5] shrink-0">
                                {client.activeOrdersCount} active
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] font-normal text-[var(--muted)] truncate leading-tight mt-0.5 tabular-nums">
                            {client.phone}
                          </p>
                        </div>
                      </div>

                      <div
                        className={cn(
                          'w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors',
                          isSelected
                            ? 'bg-[var(--primary)] text-white'
                            : 'bg-white text-[var(--text-2)] shadow-2xs'
                        )}
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* =====================================================================
            RIGHT COLUMN: UNIFIED CLIENT WORKSPACE
            ===================================================================== */}
        <div
          className={cn(
            'flex-1 w-full min-w-0 p-[2px] rounded-[8px] bg-white flex flex-col gap-[2px]',
            mobileTab === 'directory' ? 'hidden lg:flex' : 'flex'
          )}
        >
          {/* ===================================================================
              1. CONSOLIDATED CLIENT IDENTITY & QUICK-STATS HEADER BAR
              Replaces the redundant double-stacked headers with a single sleek
              horizontal bar in TailorFit's signature style.
              =================================================================== */}
          <div className="w-full rounded-[6px] bg-[var(--card)] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              {/* 52px Black Initials Circle */}
              <div className="w-[52px] h-[52px] rounded-full bg-black flex items-center justify-center text-[15px] font-bold text-white shadow-xs shrink-0">
                {selectedClientProfile.initials}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] text-[var(--muted)] tracking-[0.4px] uppercase font-bold">
                    CLIENT PROFILE
                  </span>
                  <span className="w-1 h-1 rounded-full bg-[var(--muted)]" />
                  <span className="text-[11px] text-[var(--muted)] font-medium">
                    {selectedClientProfile.since}
                  </span>
                </div>

                <h1 className="text-[18px] sm:text-[20px] font-bold text-black leading-tight truncate mt-0.5">
                  {selectedClientProfile.name}
                </h1>

                {/* Contact Info Row */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-[var(--text-2)] mt-1">
                  <span className="inline-flex items-center gap-1.5 text-black font-medium tabular-nums">
                    <Phone className="w-3.5 h-3.5 text-[var(--text-2)] shrink-0" />
                    {selectedClientProfile.phone}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-black font-medium">
                    <Mail className="w-3.5 h-3.5 text-[var(--text-2)] shrink-0" />
                    {selectedClientProfile.email}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Actions: Quick Stats + Choose Template + New Order */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {savedIndicator && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#ECFDF5] text-[#0E9F5C] text-[11px] font-semibold">
                  <Check className="w-3 h-3 stroke-[2.5]" />
                  {savedIndicator}
                </span>
              )}

              <button
                type="button"
                onClick={() => onNewOrder(selectedClientProfile.id)}
                className="h-9 px-4 rounded-[24px] bg-[var(--primary)] text-white text-[13px] font-semibold hover:opacity-95 transition-opacity cursor-pointer shadow-xs"
              >
                New Order
              </button>
            </div>
          </div>

          {/* ===================================================================
              2. BODY MEASUREMENT WORKSPACE (Side-by-Side Split on Desktop)
              Visible on Desktop always, and on Mobile when mobileTab === 'profile'
              =================================================================== */}
          <div
            className={cn(
              'w-full rounded-[6px] bg-[var(--card)] p-4 sm:p-5 flex flex-col gap-4',
              mobileTab === 'orders' ? 'hidden lg:flex' : 'flex'
            )}
          >
            {/* Workspace Toolbar Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-[16px] font-bold text-black leading-tight">
                  Body Measurements &amp; Fit
                </h3>
                <div className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--muted)] mt-0.5">
                  <span>
                    {activePointKeys.length === 0
                      ? 'Empty state · Choose a template or add a point'
                      : `${activePointKeys.length} active ${
                          activePointKeys.length === 1 ? 'measurement' : 'measurements'
                        }`}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-[var(--muted)]" />
                  <span>
                    {mannequinGender === 'female' ? 'Feminine Form' : 'Masculine Form'}
                  </span>
                </div>
              </div>

              {/* Right Controls: Snapshot/Template Switcher + Add Point + View Mode Toggle */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Saved Snapshot selector if client has multiple snapshots */}
                {clientSnapshots.length > 0 && (
                  <select
                    value={activeSnapshotId}
                    onChange={(e) => handleSelectSnapshot(e.target.value)}
                    aria-label="Select saved measurement snapshot"
                    className="h-9 px-3 rounded-[24px] bg-white border border-[var(--outline)] text-[12px] font-medium text-black focus:outline-none cursor-pointer"
                  >
                    {clientSnapshots.map((snap) => (
                      <option key={snap.id} value={snap.id}>
                        {snap.date} · {snap.garmentType || 'Saved Fit'}
                      </option>
                    ))}
                  </select>
                )}

                {/* Choose Garment Blueprint Template */}
                <button
                  type="button"
                  onClick={() => {
                    setDialogSelectedTemplateId(
                      selectedTemplateId || storeTemplates[0]?.id || ''
                    );
                    setIsTemplateModalOpen(true);
                  }}
                  className={cn(
                    'h-9 px-3.5 rounded-[24px] text-[13px] font-medium transition-colors cursor-pointer border',
                    selectedTemplateName
                      ? 'bg-[var(--selected-bg)] border-[var(--selected)] text-[var(--primary)] font-semibold'
                      : 'bg-white border-[var(--outline)] text-[var(--text-2)] hover:bg-[#EAEAEA]'
                  )}
                >
                  {selectedTemplateName || 'Choose Template'}
                </button>

                {/* Add Point button */}
                <button
                  type="button"
                  onClick={handleOpenAddPoint}
                  className="h-9 px-3.5 rounded-[24px] bg-white border border-[var(--outline)] text-black text-[13px] font-medium hover:bg-[#EAEAEA] transition-colors cursor-pointer"
                >
                  Add Point
                </button>

                {/* View Mode Toggle: Split (Desktop) | Mannequin | Table */}
                <div className="flex items-center bg-[var(--track)] rounded-[24px] p-1 gap-1">
                  <button
                    type="button"
                    onClick={() => setMannequinView('split')}
                    className={cn(
                      'hidden lg:flex w-7 h-7 rounded-full items-center justify-center transition-all cursor-pointer',
                      mannequinView === 'split'
                        ? 'bg-[var(--primary)] text-white shadow-xs'
                        : 'bg-white text-[var(--text-2)] hover:text-black'
                    )}
                    title="Side-by-Side Split View"
                  >
                    <Columns2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setMannequinView('mannequin')}
                    className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer',
                      mannequinView === 'mannequin'
                        ? 'bg-[var(--primary)] text-white shadow-xs'
                        : 'bg-white text-[var(--text-2)] hover:text-black'
                    )}
                    title="Mannequin Only View"
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

            {/* Main Workspace Body */}
            <div
              className={cn(
                'w-full grid gap-4 items-start',
                mannequinView === 'split'
                  ? 'grid-cols-1 lg:grid-cols-12'
                  : 'grid-cols-1'
              )}
            >
              {/* LEFT PANE: Interactive 360° Mannequin */}
              {(mannequinView === 'split' || mannequinView === 'mannequin') && (
                <div
                  className={cn(
                    'w-full bg-white rounded-[12px] p-4 flex flex-col items-center justify-center',
                    mannequinView === 'split' ? 'lg:col-span-5' : 'min-h-[540px]'
                  )}
                >
                  <RotatableMannequin
                    gender={mannequinGender}
                    onGenderChange={setMannequinGender}
                    showGenderToggle={true}
                    compact={mannequinView === 'split'}
                    measurements={measurements}
                    activePointKeys={activePointKeys}
                    selectedPointKey={pointModalData?.key || null}
                    unit={unitLabel}
                    onSelectPoint={handleOpenPoint}
                  />
                </div>
              )}

              {/* RIGHT PANE: Categorized 4-Zone Measurement Cards */}
              {(mannequinView === 'split' || mannequinView === 'table') && (
                <div
                  className={cn(
                    'w-full flex flex-col gap-3',
                    mannequinView === 'split' ? 'lg:col-span-7' : 'w-full'
                  )}
                >
                  {/* 4 Anatomical Zone Filter Pills */}
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-white rounded-[12px] p-2.5">
                    <div className="flex flex-wrap items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setZoneFilter('all')}
                        className={cn(
                          'px-3 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer',
                          zoneFilter === 'all'
                            ? 'bg-[var(--primary)] text-white'
                            : 'bg-[var(--chip)] text-[var(--text-2)] hover:text-black'
                        )}
                      >
                        All ({activePointKeys.length})
                      </button>
                      {ANATOMICAL_ZONES.map((z) => {
                        const count = activePointKeys.filter(
                          (k) => hotspotMap[k]?.zoneId === z.id
                        ).length;
                        return (
                          <button
                            key={z.id}
                            type="button"
                            onClick={() => setZoneFilter(z.id)}
                            className={cn(
                              'px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer',
                              zoneFilter === z.id
                                ? 'bg-[var(--primary)] text-white font-semibold'
                                : 'bg-[var(--chip)] text-[var(--text-2)] hover:text-black'
                            )}
                          >
                            {z.shortLabel} ({count})
                          </button>
                        );
                      })}
                    </div>

                    {activePointKeys.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTemplateId('');
                          setSelectedTemplateName('');
                          setActivePointKeys([]);
                          setMeasurements({});
                          persistMeasurementsToStore([], {});
                        }}
                        className="text-[11px] font-medium text-[var(--muted)] hover:text-[var(--paused)] cursor-pointer px-1.5"
                      >
                        Clear all
                      </button>
                    )}
                  </div>

                  {/* Measurement Cards Grid or Clean Empty State */}
                  {activePointKeys.length === 0 ? (
                    <div className="w-full min-h-[360px] bg-white rounded-[12px] p-6 flex flex-col items-center justify-center text-center gap-3">
                      <p className="text-[14px] font-semibold text-black">
                        No measurement points active for {selectedClientProfile.name}
                      </p>
                      <p className="text-[12px] text-[var(--text-2)] max-w-sm">
                        Select a saved Garment Template to load its standard points onto the mannequin, or add individual points from the sizing catalog.
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setDialogSelectedTemplateId(
                              selectedTemplateId || storeTemplates[0]?.id || ''
                            );
                            setIsTemplateModalOpen(true);
                          }}
                          className="h-9 px-4 rounded-[24px] bg-[var(--primary)] text-white text-[13px] font-medium hover:opacity-95 transition-opacity cursor-pointer"
                        >
                          Choose Template
                        </button>
                        <button
                          type="button"
                          onClick={handleOpenAddPoint}
                          className="h-9 px-4 rounded-[24px] bg-[var(--chip)] border border-[var(--outline)] text-black text-[13px] font-medium hover:bg-[#EAEAEA] transition-colors cursor-pointer"
                        >
                          Add Point
                        </button>
                      </div>
                    </div>
                  ) : visibleMeasurementFields.length === 0 ? (
                    <div className="w-full min-h-[220px] bg-white rounded-[12px] p-6 flex flex-col items-center justify-center text-center gap-2">
                      <p className="text-[13px] font-medium text-[var(--text-2)]">
                        No active points in this anatomical zone.
                      </p>
                      <button
                        type="button"
                        onClick={() => setZoneFilter('all')}
                        className="text-[12px] font-semibold text-[var(--primary)] hover:underline cursor-pointer"
                      >
                        Show all {activePointKeys.length} active points
                      </button>
                    </div>
                  ) : (
                    <div
                      className={cn(
                        'w-full grid gap-2 max-h-[500px] overflow-y-auto pr-0.5',
                        mannequinView === 'split'
                          ? 'grid-cols-1 sm:grid-cols-2'
                          : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                      )}
                    >
                      {visibleMeasurementFields.map((field) => (
                        <div
                          key={field.id}
                          className="bg-white rounded-[14px] p-3.5 flex flex-col justify-between gap-3 border border-transparent hover:border-[#EDEDED] transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <span className="text-[13px] font-semibold text-black block truncate">
                                {field.name}
                              </span>
                              <span className="text-[10px] font-medium text-[var(--muted)] block">
                                {field.zone}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemovePoint(field.id)}
                              className="w-5 h-5 rounded-full flex items-center justify-center text-[var(--muted)] hover:text-black hover:bg-[#F2F2F2] transition-colors cursor-pointer shrink-0"
                              title={`Remove ${field.name}`}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="w-full bg-[var(--card)] border border-[#EDEDED] focus-within:!border-[var(--primary)] rounded-[8px] p-[2px] flex items-center">
                            <input
                              type="text"
                              inputMode="decimal"
                              value={field.value}
                              onChange={(e) =>
                                handleFieldValueChange(field.id, e.target.value)
                              }
                              placeholder="0.0"
                              className="w-full bg-transparent px-2.5 py-1.5 text-[13px] font-semibold text-black placeholder:text-[var(--muted)] focus:outline-none tabular-nums"
                            />
                            <span className="pr-2.5 text-[11px] font-semibold text-[var(--text-2)] select-none shrink-0">
                              {field.unit}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ===================================================================
              3. LIVE ORDER HISTORY SECTION (Connected to store.orders)
              Visible on Desktop always, and on Mobile when mobileTab === 'orders'
              =================================================================== */}
          <div
            className={cn(
              'w-full rounded-[6px] bg-[var(--card)] p-4 sm:p-5 flex flex-col gap-3',
              mobileTab === 'profile' ? 'hidden lg:flex' : 'flex'
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-[16px] font-bold text-black leading-tight">
                  Order History
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-white text-[11px] font-semibold text-[var(--text-2)] border border-[#EDEDED]">
                  {orderHistoryCards.length}
                </span>
              </div>

              <button
                type="button"
                onClick={() => onNewOrder(selectedClientProfile.id)}
                className="text-[12px] font-semibold text-[var(--primary)] hover:underline cursor-pointer"
              >
                + Add Order
              </button>
            </div>

            {orderHistoryCards.length === 0 ? (
              <div className="w-full bg-white rounded-[8px] p-8 text-center flex flex-col items-center justify-center gap-2">
                <p className="text-[14px] font-semibold text-black">
                  No orders recorded for {selectedClientProfile.name} yet
                </p>
                <p className="text-[12px] text-[var(--muted)] max-w-xs">
                  Create a bespoke order for this client using their saved measurements or a garment template.
                </p>
                <button
                  type="button"
                  onClick={() => onNewOrder(selectedClientProfile.id)}
                  className="mt-1 h-9 px-4 rounded-[24px] bg-[var(--primary)] text-white text-[13px] font-medium hover:opacity-95 transition-opacity cursor-pointer"
                >
                  Create First Order
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {orderHistoryCards.map((card) => (
                  <div
                    key={card.id}
                    onClick={() => {
                      if (onEditOrder) onEditOrder(card.id);
                    }}
                    className={cn(
                      'bg-white rounded-[8px] p-[2px] flex flex-col gap-[2px] border border-transparent hover:border-[var(--selected)] transition-all',
                      onEditOrder && 'cursor-pointer'
                    )}
                  >
                    {/* Part 1: Header */}
                    <div className="bg-white rounded-[8px] px-2.5 py-3 flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-[14px] font-semibold text-black truncate leading-tight">
                          {card.title}
                        </h4>
                        <p className="text-[12px] font-medium text-[var(--sub)] mt-1 leading-tight">
                          {card.date}
                        </p>
                      </div>

                      <span
                        style={{ backgroundColor: card.badgeColor }}
                        className="px-2.5 py-0.5 rounded-[24px] text-[11px] font-semibold text-white shrink-0 leading-tight"
                      >
                        {card.badge}
                      </span>
                    </div>

                    {/* Part 2: Style references band (#222222) */}
                    <div className="bg-[var(--band)] rounded-[6px] p-2 flex flex-col gap-1.5">
                      <span className="text-[11px] font-semibold text-white leading-tight">
                        Style references
                      </span>
                      <div className="grid grid-cols-3 gap-1">
                        {card.images.map((img, idx) => (
                          <img
                            key={idx}
                            src={img}
                            alt="Style reference"
                            className="w-full h-[66px] rounded-[6px] object-cover"
                          />
                        ))}
                      </div>
                    </div>

                    {/* Part 3: Price row */}
                    <div className="bg-white rounded-[8px] p-2.5 flex items-center justify-between">
                      <span className="text-[12px] text-[var(--price-label)]">
                        Price
                      </span>
                      <span className="text-[16px] font-semibold text-black tabular-nums">
                        <AnimatedNumberMorph
                          value={card.price}
                          prefix={currencySymbol}
                        />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =======================================================================
          GARMENT TEMPLATES MODAL (Requirement B & D)
          ======================================================================= */}
      <AnimatePresence>
        {isTemplateModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[6px]"
          >
            <div
              className="absolute inset-0"
              onClick={() => setIsTemplateModalOpen(false)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={springSnappy}
              className="relative w-[435px] max-w-[calc(100vw-32px)] rounded-[16px] bg-white p-6 z-10 flex flex-col gap-5 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-[16px] font-bold text-black">
                  Garment Templates
                </h3>
                <button
                  type="button"
                  onClick={() => setIsTemplateModalOpen(false)}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[var(--muted)] hover:text-black cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col gap-2.5 max-h-[360px] overflow-y-auto">
                {storeTemplates.map((tmpl) => {
                  const isSelected = dialogSelectedTemplateId === tmpl.id;
                  return (
                    <div
                      key={tmpl.id}
                      onClick={() => setDialogSelectedTemplateId(tmpl.id)}
                      className={cn(
                        'w-full p-3.5 rounded-[12px] text-left transition-all flex items-center justify-between cursor-pointer border',
                        isSelected
                          ? 'border-[var(--selected)] bg-[var(--selected-bg)]'
                          : 'border-[var(--outline)] bg-[var(--card)] hover:bg-[#F3F3F3]'
                      )}
                    >
                      <div className="flex-1 pr-3 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-semibold text-black truncate">
                            {tmpl.name}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-white text-[10px] font-medium text-[var(--text-2)] border border-[#EDEDED] shrink-0">
                            {tmpl.fieldKeys.length} pts
                          </span>
                        </div>
                        <div className="text-[12px] font-normal text-[var(--text-2)] mt-0.5 leading-snug">
                          {tmpl.description}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTemplate(tmpl.id);
                            if (dialogSelectedTemplateId === tmpl.id) {
                              const rem = storeTemplates.filter((t) => t.id !== tmpl.id);
                              setDialogSelectedTemplateId(rem[0]?.id || '');
                            }
                          }}
                          title={`Delete ${tmpl.name}`}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--muted)] hover:text-[var(--paused)] hover:bg-white transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <div
                          className={cn(
                            'w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors',
                            isSelected
                              ? 'bg-[var(--selected)] text-white'
                              : 'border border-[var(--outline)] bg-white'
                          )}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsTemplateModalOpen(false)}
                  className="h-9 px-4 rounded-[24px] bg-[var(--chip)] border border-[var(--outline)] text-[var(--text-2)] text-[14px] font-medium hover:bg-[#eaeaea] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!dialogSelectedTemplateId}
                  onClick={() => {
                    applyTemplateById(dialogSelectedTemplateId);
                    setIsTemplateModalOpen(false);
                  }}
                  className="h-9 px-6 rounded-[24px] bg-[var(--primary)] text-white text-[14px] font-medium hover:opacity-95 cursor-pointer shadow-xs disabled:opacity-40"
                >
                  Select Template
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =======================================================================
          SET POINT SIZE / ADD POINT DIALOG (Requirement C & D)
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
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={springSnappy}
              className="relative w-[430px] max-w-[calc(100vw-32px)] rounded-[16px] bg-white p-6 z-10 flex flex-col gap-5 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3
                  id="client-point-dialog-title"
                  className="text-[16px] font-bold text-black"
                >
                  {pointModalData.mode === 'edit'
                    ? `Update ${pointModalData.name}`
                    : 'Add Measurement Point'}
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

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSavePointModal();
                }}
                className="flex flex-col gap-4"
              >
                {pointModalData.mode === 'edit' ? (
                  /* Requirement C: Read-Only Measurement Info — user can update ONLY the size */
                  <div className="rounded-[10px] bg-[var(--card)] p-3 border border-[#EDEDED] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.3px] text-[var(--muted)] block">
                        {pointModalData.zone}
                      </span>
                      <span className="text-[14px] font-semibold text-black">
                        {pointModalData.name}
                      </span>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-white text-[11px] font-medium text-[var(--text-2)] border border-[#EDEDED]">
                      Size Only
                    </span>
                  </div>
                ) : (
                  /* Requirement B & D: Add Point chooses from the 21 standard Sizing/Measurements */
                  <div className="flex flex-col gap-2">
                    <label className="block text-[11px] font-semibold text-black">
                      Select Sizing Measurement
                    </label>
                    <div className="flex flex-col gap-2.5 max-h-[210px] overflow-y-auto rounded-[10px] bg-[var(--card)] p-2.5 border border-[#EDEDED]">
                      {hotspotsByZone.map((zone) => (
                        <div key={zone.id} className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold uppercase tracking-[0.3px] text-[var(--muted)]">
                            {zone.label}
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {zone.items.map((item) => {
                              const isSelected = pointModalData.key === item.key;
                              const isAlreadyActive = activePointKeys.includes(item.key);
                              return (
                                <button
                                  key={item.key}
                                  type="button"
                                  onClick={() => {
                                    setPointModalError('');
                                    const existing =
                                      measurements[item.key] !== undefined
                                        ? String(measurements[item.key])
                                        : pointModalData.value;
                                    setPointModalData({
                                      ...pointModalData,
                                      key: item.key,
                                      name: item.label,
                                      zone: zone.label,
                                      value: existing,
                                    });
                                  }}
                                  className={cn(
                                    'px-2.5 py-1 rounded-[16px] text-[11px] font-medium transition-all flex items-center gap-1 cursor-pointer border',
                                    isSelected
                                      ? 'bg-[var(--selected-bg)] border-[var(--selected)] text-[var(--primary)] font-semibold'
                                      : isAlreadyActive
                                      ? 'bg-[#F2F2F2] border-[#E0E0E0] text-black'
                                      : 'bg-white border-[#E5E5E5] text-[var(--text-2)] hover:text-black'
                                  )}
                                >
                                  <span>{item.label}</span>
                                  {isSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-black mb-1">
                    Measurement Size ({unitLabel.toUpperCase()})
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
                      autoFocus
                      className="w-full bg-transparent text-[14px] font-semibold text-black placeholder:text-[var(--muted)] focus:outline-none tabular-nums"
                    />
                    <span className="pr-1 text-[12px] font-semibold text-[var(--text-2)] select-none shrink-0">
                      {unitLabel}
                    </span>
                  </div>
                </div>

                {pointModalError && (
                  <p className="text-[12px] text-[var(--paused)] font-medium">
                    {pointModalError}
                  </p>
                )}

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
                    {pointModalData.mode === 'edit' ? 'Update Size' : 'Add Point'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =======================================================================
          NEW CLIENT MODAL
          ======================================================================= */}
      <AnimatePresence>
        {isNewClientModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-60 bg-black/50 backdrop-blur-[6px] flex items-center justify-center p-4"
          >
            <div
              className="absolute inset-0"
              onClick={() => setIsNewClientModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={springSmooth}
              className="relative w-full max-w-md rounded-[16px] bg-white p-6 shadow-2xl z-10 flex flex-col gap-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[var(--hairline)]">
                <div>
                  <h3 className="text-[16px] font-bold text-black">
                    New Client Profile
                  </h3>
                  <p className="text-[12px] text-[var(--muted)]">
                    Add a client to your atelier directory
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsNewClientModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-[#F2F2F2] text-[var(--muted)] hover:text-black flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateClient} className="flex flex-col gap-3.5">
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
                  placeholder="+234 800 000 0000"
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                />
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="name@couture.com"
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

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--hairline)]">
                  <button
                    type="button"
                    onClick={() => setIsNewClientModalOpen(false)}
                    className="h-9 px-4 rounded-[24px] bg-[var(--chip)] border border-[var(--outline)] text-[var(--text-2)] text-[14px] font-medium hover:bg-[#EAEAEA] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="h-9 px-5 rounded-[24px] bg-[var(--primary)] text-white text-[14px] font-medium hover:opacity-95 cursor-pointer shadow-xs"
                  >
                    Create Client
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
          { id: 'profile', label: 'Measurements', icon: <UserCheck className="w-4 h-4" /> },
          { id: 'orders', label: 'Orders', icon: <ShoppingBag className="w-4 h-4" /> },
        ]}
      />
    </div>
  );
}
