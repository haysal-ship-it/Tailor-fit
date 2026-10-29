'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/lib/store';
import {
  Phone,
  AtSign,
  MoreVertical,
  Pencil,
  Trash2,
  ChevronDown,
  CornerUpLeft,
  PersonStanding,
  ClipboardList,
  Save,
  X,
  Check,
  Plus,
  Search,
  Users,
} from 'lucide-react';
import { ToastContainer, type ToastMessage } from '@/components/ui/Toasts';
import { AnimatedNumberMorph } from '@/components/ui/AnimatedNumberMorph';
import { AnimatedFileUpload } from '@/components/ui/AnimatedFileUpload';
import { RotatableMannequin } from '@/components/mannequin/RotatableMannequin';
import {
  ANATOMICAL_ZONES,
  getZoneLabel,
  normalizeZoneId,
  resolveCanonicalKey,
  normalizeMeasurementsRecord,
  parseDueDateToISO,
} from '@/lib/initial-data';
import { springSmooth, springSnappy } from '@/lib/motion-tokens';
import { cn } from '@/lib/utils';

interface ClientsScreenProps {
  onOpenClient?: (clientId: string) => void;
  onNewMeasurement?: (clientId: string) => void;
  onNewOrder?: (clientId: string) => void;
  onEditOrder?: (orderId: string) => void;
}

type ClientsViewState =
  | 'SavedMeasurements_Default'
  | 'SavedMeasurements_UseFlow'
  | 'OrderHistory_Grid'
  | 'Inline_NewOrder';

const DEFAULT_FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=300&q=80',
];

/**
 * Exact Figma display labels for the 11 saved measurement cards in Frames 1, 2, M3, M4:
 * Shoulder width, Neck, Bust/Chest, Ankle, Hip, Wrist, Sleeve, Waist, Back, Neck to Waist, Neck to Ankle
 */
const SAVED_CARD_DISPLAY_LABELS: Record<string, string> = {
  shoulder_width: 'Shoulder width',
  neck_circumference: 'Neck',
  bust_chest: 'Bust/Chest',
  outseam: 'Ankle',
  hip_height: 'Hip',
  wrist_circumference: 'Wrist',
  sleeve_length: 'Sleeve',
  waist_circumference: 'Waist',
  shoulder_to_neck: 'Back',
  front_length: 'Neck to Waist',
  body_length: 'Neck to Ankle',
};

export function ClientsScreen({ onEditOrder }: ClientsScreenProps) {
  const {
    clients,
    orders,
    settings,
    allHotspots,
    selectedClientId,
    setSelectedClientId,
    addClient,
    updateClient,
    deleteClient,
    addSnapshot,
    updateSnapshot,
    addOrder,
    deleteTemplate,
    getClientSnapshots,
    getClientOrders,
  } = useStore();

  const unitLabel = settings?.defaultUnit || 'cm';
  const currencySymbol = settings?.currency || '₦';

  // Primary 4-view state machine matching the 9 Figma frames
  const [viewState, setViewState] = useState<ClientsViewState>('SavedMeasurements_Default');

  // Mannequin state
  const [mannequinGender, setMannequinGender] = useState<'female' | 'male'>('female');
  const [mannequinDisplayMode, setMannequinDisplayMode] = useState<'mannequin' | 'list'>(
    'mannequin'
  );

  // Header overflow `⋮` menu & Snapshot dropdown states
  const [isOverflowMenuOpen, setIsOverflowMenuOpen] = useState(false);
  const [isSnapshotDropdownOpen, setIsSnapshotDropdownOpen] = useState(false);
  const [isNewOrderTemplateDropdownOpen, setIsNewOrderTemplateDropdownOpen] = useState(false);

  const overflowMenuRef = useRef<HTMLDivElement>(null);
  const snapshotDropdownRef = useRef<HTMLDivElement>(null);
  const newOrderTemplateDropdownRef = useRef<HTMLDivElement>(null);

  // Modals: Edit Profile, Delete Confirmation, Client Directory Switcher, Garment Templates, Point Size
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [editProfileMode, setEditProfileMode] = useState<'edit' | 'create' | 'switch'>('edit');
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [directorySearch, setDirectorySearch] = useState('');

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Garment Template Modal
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [dialogSelectedTemplateId, setDialogSelectedTemplateId] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedTemplateName, setSelectedTemplateName] = useState<string>('');

  // Set Point Size / Add Point Modal
  const [pointModalData, setPointModalData] = useState<{
    mode: 'edit' | 'add';
    key: string;
    name: string;
    zone: string;
    value: string;
  } | null>(null);
  const [pointModalError, setPointModalError] = useState('');

  // Use Measurement Flow form state (Desktop Frame 3, Mobile Frame 1)
  const [useFlowImages, setUseFlowImages] = useState<string[]>([]);
  const [useFlowPrice, setUseFlowPrice] = useState('');
  const [useFlowDueDate, setUseFlowDueDate] = useState('');
  const [useFlowNotes, setUseFlowNotes] = useState('');

  // Inline New Order form state (Desktop Frame 5, Mobile Frame 2)
  const [newOrderClientName, setNewOrderClientName] = useState('');
  const [newOrderGarmentType, setNewOrderGarmentType] = useState('');
  const [newOrderPhone, setNewOrderPhone] = useState('');
  const [newOrderEmail, setNewOrderEmail] = useState('');
  const [newOrderSavedTemplateLabel, setNewOrderSavedTemplateLabel] = useState('');
  const [newOrderImages, setNewOrderImages] = useState<string[]>([]);
  const [newOrderPrice, setNewOrderPrice] = useState('');
  const [newOrderDueDate, setNewOrderDueDate] = useState('');
  const [newOrderNotes, setNewOrderNotes] = useState('');

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const showToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
  };
  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Close popovers on outside click or Escape
  useEffect(() => {
    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (overflowMenuRef.current && !overflowMenuRef.current.contains(target)) {
        setIsOverflowMenuOpen(false);
      }
      if (snapshotDropdownRef.current && !snapshotDropdownRef.current.contains(target)) {
        setIsSnapshotDropdownOpen(false);
      }
      if (
        newOrderTemplateDropdownRef.current &&
        !newOrderTemplateDropdownRef.current.contains(target)
      ) {
        setIsNewOrderTemplateDropdownOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOverflowMenuOpen(false);
        setIsSnapshotDropdownOpen(false);
        setIsNewOrderTemplateDropdownOpen(false);
        setPointModalData(null);
        setPointModalError('');
        setIsTemplateModalOpen(false);
        setIsEditProfileModalOpen(false);
        setIsDeleteConfirmOpen(false);
      }
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

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

  // Enrich store clients
  const allClientList = useMemo(() => {
    return clients.map((c) => {
      const initials =
        c.name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase() || 'CD';
      const clientOrders = orders.filter((o) => o.clientId === c.id);
      return {
        id: c.id,
        initials,
        name: c.name,
        phone: c.phone || '+234 8141 432 211',
        email: c.email || 'chloe@atelier.fit',
        notes: c.notes || '',
        totalOrdersCount: clientOrders.length,
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
        phone: '+234 8141 432 211',
        email: 'chloe@atelier.fit',
        notes: '',
        totalOrdersCount: 4,
      }
    );
  }, [allClientList, activeClientId]);

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
      setSelectedTemplateName(latest.garmentType || 'Bespoke wedding gown');
      setSelectedTemplateId('');
      setActivePointKeys(keys);
      setMeasurements(normalized);
    } else {
      setActiveSnapshotId('');
      setSelectedTemplateName('');
      setSelectedTemplateId('');
      setActivePointKeys([]);
      setMeasurements({});
    }
  }, [selectedClientProfile.id, getClientSnapshots]);

  const activeSnapshot = useMemo(() => {
    return clientSnapshots.find((s) => s.id === activeSnapshotId) || clientSnapshots[0];
  }, [clientSnapshots, activeSnapshotId]);

  const otherSnapshots = useMemo(() => {
    const filtered = clientSnapshots.filter((s) => s.id !== activeSnapshot?.id);
    return filtered.length > 0 ? filtered : clientSnapshots;
  }, [clientSnapshots, activeSnapshot]);

  // Persist measurement changes directly to store snapshot (unless in Inline_NewOrder)
  const persistMeasurementsToStore = (
    nextKeys: string[],
    nextMeasurements: Record<string, number>,
    garmentLabel?: string
  ) => {
    if (viewState === 'Inline_NewOrder') return;

    const filteredObj: Record<string, number> = {};
    nextKeys.forEach((k) => {
      if (nextMeasurements[k] !== undefined && !isNaN(nextMeasurements[k])) {
        filteredObj[k] = nextMeasurements[k];
      } else {
        filteredObj[k] = 0;
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
        date: new Date().toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }),
        unit: unitLabel,
        garmentType: garmentLabel || selectedTemplateName || 'Bespoke wedding gown',
        measurements: filteredObj,
      });
      setActiveSnapshotId(created.id);
    }
  };

  // Switch between client's saved snapshots
  const handleSelectSnapshot = (snapId: string) => {
    const found = clientSnapshots.find((s) => s.id === snapId);
    if (!found) return;
    const normalized = normalizeMeasurementsRecord(found.measurements);
    setActiveSnapshotId(found.id);
    setSelectedTemplateName(found.garmentType || 'Bespoke wedding gown');
    setActivePointKeys(Object.keys(normalized));
    setMeasurements(normalized);
    setIsSnapshotDropdownOpen(false);
  };

  // Apply a Garment Blueprint template from Settings
  const applyTemplateById = (tmplId: string) => {
    const tmpl = storeTemplates.find((t) => t.id === tmplId);
    if (!tmpl) return;

    const canonicalKeys = Array.from(
      new Set((tmpl.fieldKeys || []).map((k) => resolveCanonicalKey(k)))
    );

    const nextMeasurements = { ...measurements };
    canonicalKeys.forEach((k) => {
      if (nextMeasurements[k] === undefined) {
        nextMeasurements[k] = 0;
      }
    });

    setSelectedTemplateId(tmpl.id);
    setSelectedTemplateName(tmpl.name);
    setActivePointKeys(canonicalKeys);
    setMeasurements(nextMeasurements);
    persistMeasurementsToStore(canonicalKeys, nextMeasurements, tmpl.name);
  };

  const handleFieldValueChange = (key: string, strVal: string) => {
    const nextMeasurements = { ...measurements };
    if (strVal.trim() === '') {
      nextMeasurements[key] = 0;
      setMeasurements(nextMeasurements);
      persistMeasurementsToStore(activePointKeys, nextMeasurements);
      return;
    }
    const num = parseFloat(strVal);
    if (!isNaN(num) && num >= 0) {
      nextMeasurements[key] = num;
      setMeasurements(nextMeasurements);
      persistMeasurementsToStore(activePointKeys, nextMeasurements);
    }
  };

  const handleRemovePoint = (key: string) => {
    const nextKeys = activePointKeys.filter((k) => k !== key);
    setActivePointKeys(nextKeys);
    persistMeasurementsToStore(nextKeys, measurements);
  };

  // Tap on active mannequin touchpoint opens size-only modal
  const handleOpenPoint = (key: string, name: string) => {
    const canonical = resolveCanonicalKey(key);
    const meta = hotspotMap[canonical];
    const currentNum = measurements[canonical];
    const currentVal = currentNum !== undefined && currentNum > 0 ? String(currentNum) : '';
    setPointModalData({
      mode: 'edit',
      key: canonical,
      name: SAVED_CARD_DISPLAY_LABELS[canonical] || meta?.label || name,
      zone: meta?.zone || 'Torso',
      value: currentVal,
    });
    setPointModalError('');
  };

  // Click "Add Point" opens selector from the 21 standard Sizing/Measurements
  const handleOpenAddPoint = () => {
    const firstUnadded =
      allHotspots.find((h) => !activePointKeys.includes(h.key)) || allHotspots[0];
    const key = firstUnadded?.key || 'neck_circumference';
    const existingNum = measurements[key];
    const existingVal = existingNum !== undefined && existingNum > 0 ? String(existingNum) : '';
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

  // Measurement cards list for SavedMeasurements_Default & List toggle
  const visibleMeasurementFields = useMemo(() => {
    return activePointKeys.map((key) => {
      const meta = hotspotMap[key];
      const rawVal = measurements[key];
      return {
        id: key,
        name: SAVED_CARD_DISPLAY_LABELS[key] || meta?.label || key,
        zone: meta?.zone || 'Torso',
        value: rawVal !== undefined && rawVal > 0 ? String(rawVal) : '',
        unit: unitLabel,
      };
    });
  }, [activePointKeys, hotspotMap, measurements, unitLabel]);

  // Points that have a non-zero value to highlight on the mannequin
  const populatedMannequinPointKeys = useMemo(() => {
    return activePointKeys.filter((k) => (measurements[k] ?? 0) > 0);
  }, [activePointKeys, measurements]);

  // Order History cards (Desktop Frame 4)
  const orderHistoryCards = useMemo(() => {
    const clientOrders = getClientOrders(selectedClientProfile.id);
    return clientOrders.map((ord) => {
      const createdDateStr = ord.createdAt
        ? new Date(ord.createdAt).toLocaleDateString('en-GB').replace(/\//g, '-')
        : '09-10-2025';
      const dateStr = `Size taken on ${createdDateStr}`;

      let badge = 'Urgent';
      let badgeColor = 'var(--pill-urgent)';
      if (ord.status === 'Ready' || ord.status === 'Completed' || ord.status === 'Picked Up') {
        badge = ord.status;
        badgeColor = 'var(--pill-completed)';
      } else if (ord.status === 'Paused') {
        badge = 'Paused';
        badgeColor = 'var(--pill-paused)';
      } else if (ord.status === 'Pending') {
        badge = 'Pending';
        badgeColor = 'var(--pill-pending)';
      }

      const imgs =
        ord.referenceImages && ord.referenceImages.length > 0
          ? ord.referenceImages.map((r) => r.url)
          : DEFAULT_FALLBACK_IMAGES;

      const paddedImages = [
        imgs[0] || DEFAULT_FALLBACK_IMAGES[0],
        imgs[1] || imgs[0] || DEFAULT_FALLBACK_IMAGES[1],
        imgs[2] || imgs[0] || DEFAULT_FALLBACK_IMAGES[2],
      ];

      return {
        id: ord.id,
        title: ord.garmentType || 'Gown/ Dress',
        badge,
        badgeColor,
        date: dateStr,
        price: ord.price ?? 0,
        images: paddedImages,
      };
    });
  }, [getClientOrders, selectedClientProfile.id]);

  // Open Edit Profile modal prefilled with current client
  const handleOpenEditProfile = (mode: 'edit' | 'create' | 'switch' = 'edit') => {
    setIsOverflowMenuOpen(false);
    setEditProfileMode(mode);
    if (mode === 'create') {
      setEditName('');
      setEditPhone('');
      setEditEmail('');
      setEditNotes('');
    } else {
      setEditName(selectedClientProfile.name);
      setEditPhone(selectedClientProfile.phone);
      setEditEmail(selectedClientProfile.email);
      setEditNotes(selectedClientProfile.notes);
    }
    setIsEditProfileModalOpen(true);
  };

  const handleSaveProfileModal = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = editName.trim();
    if (!trimmedName) return;

    if (editProfileMode === 'create') {
      const created = addClient({
        name: trimmedName,
        phone: editPhone.trim() || '+234 8141 432 211',
        email: editEmail.trim() || 'client@atelier.fit',
        notes: editNotes.trim(),
      });
      setSelectedClientId(created.id);
      showToast({
        type: 'success',
        title: 'Client Created',
        message: `${created.name} added to your atelier directory.`,
        duration: 3000,
      });
    } else {
      updateClient(selectedClientProfile.id, {
        name: trimmedName,
        phone: editPhone.trim(),
        email: editEmail.trim(),
        notes: editNotes.trim(),
      });
      showToast({
        type: 'success',
        title: 'Profile Updated',
        message: `${trimmedName}'s profile has been updated.`,
        duration: 3000,
      });
    }
    setIsEditProfileModalOpen(false);
  };

  const handleConfirmDeleteClient = () => {
    const name = selectedClientProfile.name;
    deleteClient(selectedClientProfile.id);
    setIsDeleteConfirmOpen(false);
    showToast({
      type: 'success',
      title: 'Client Deleted',
      message: `${name} was removed from your client records.`,
      duration: 3000,
    });
  };

  // Create Order from Use Measurement Flow (Desktop Frame 3 / Mobile Frame 1)
  const handleCreateOrderFromUseFlow = () => {
    const raw = parseFloat(useFlowPrice.replace(/[^0-9.]/g, ''));
    const parsedPrice = isNaN(raw) ? 0 : raw;
    const refImgs =
      useFlowImages.length > 0
        ? useFlowImages.map((url, idx) => ({
            id: `img-${Date.now()}-${idx}`,
            url,
            title: `Style Reference ${idx + 1}`,
          }))
        : DEFAULT_FALLBACK_IMAGES.map((url, idx) => ({
            id: `img-${Date.now()}-${idx}`,
            url,
            title: `Style Reference ${idx + 1}`,
          }));

    addOrder({
      clientId: selectedClientProfile.id,
      garmentType: activeSnapshot?.garmentType || 'Gown/ Dress',
      measurementSnapshotId: activeSnapshot?.id,
      referenceImages: refImgs,
      price: parsedPrice,
      notes: useFlowNotes.trim() || 'Custom atelier order created from saved measurements.',
      status: 'In Progress',
      pickupDateTime: parseDueDateToISO(useFlowDueDate),
    });

    setUseFlowImages([]);
    setUseFlowPrice('');
    setUseFlowDueDate('');
    setUseFlowNotes('');
    setViewState('OrderHistory_Grid');
    showToast({
      type: 'success',
      title: 'Order Created',
      message: `New order for ${selectedClientProfile.name} has been added to Order History.`,
      duration: 3500,
    });
  };

  // Save Order from Inline New Order Workspace (Desktop Frame 5 / Mobile Frame 2)
  const handleSaveInlineNewOrder = () => {
    let targetClientId = selectedClientProfile.id;
    const typedName = newOrderClientName.trim();
    if (
      typedName &&
      typedName.toLowerCase() !== selectedClientProfile.name.toLowerCase()
    ) {
      const existing = clients.find(
        (c) => c.name.toLowerCase() === typedName.toLowerCase()
      );
      if (existing) {
        targetClientId = existing.id;
      } else {
        const created = addClient({
          name: typedName,
          phone: newOrderPhone.trim() || '+234 8141 432 211',
          email: newOrderEmail.trim() || 'client@atelier.fit',
          notes: newOrderNotes.trim(),
        });
        targetClientId = created.id;
        setSelectedClientId(created.id);
      }
    }

    const raw = parseFloat(newOrderPrice.replace(/[^0-9.]/g, ''));
    const parsedPrice = isNaN(raw) ? 0 : raw;
    const refImgs =
      newOrderImages.length > 0
        ? newOrderImages.map((url, idx) => ({
            id: `img-${Date.now()}-${idx}`,
            url,
            title: `Style Reference ${idx + 1}`,
          }))
        : DEFAULT_FALLBACK_IMAGES.map((url, idx) => ({
            id: `img-${Date.now()}-${idx}`,
            url,
            title: `Style Reference ${idx + 1}`,
          }));

    const filteredMeasurements: Record<string, number> = {};
    activePointKeys.forEach((k) => {
      if (measurements[k] !== undefined && !isNaN(measurements[k])) {
        filteredMeasurements[k] = measurements[k];
      } else {
        filteredMeasurements[k] = 0;
      }
    });

    const createdSnapshot = addSnapshot({
      clientId: targetClientId,
      date: new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),
      unit: unitLabel,
      garmentType: newOrderGarmentType.trim() || selectedTemplateName || 'Gown/ Dress',
      measurements: filteredMeasurements,
      notes: newOrderNotes.trim(),
    });
    setActiveSnapshotId(createdSnapshot.id);

    addOrder({
      clientId: targetClientId,
      garmentType: newOrderGarmentType.trim() || 'Gown/ Dress',
      measurementSnapshotId: createdSnapshot.id,
      referenceImages: refImgs,
      price: parsedPrice,
      notes: newOrderNotes.trim() || 'Bespoke order created in workspace.',
      status: 'In Progress',
      pickupDateTime: parseDueDateToISO(newOrderDueDate),
    });

    setNewOrderClientName('');
    setNewOrderGarmentType('');
    setNewOrderPhone('');
    setNewOrderEmail('');
    setNewOrderSavedTemplateLabel('');
    setNewOrderImages([]);
    setNewOrderPrice('');
    setNewOrderDueDate('');
    setNewOrderNotes('');
    setViewState('OrderHistory_Grid');
    showToast({
      type: 'success',
      title: 'Order Saved',
      message: 'Your bespoke order has been saved to Order History.',
      duration: 3500,
    });
  };

  return (
    <div className="w-full max-w-[1216px] mx-auto mt-3 lg:mt-4 px-3 sm:px-4 xl:px-0 pb-24 lg:pb-12 select-none">
      {allClientList.length === 0 ? (
        <div className="w-full bg-[var(--surface)] p-8 rounded-[8px] flex flex-col items-center justify-center text-center gap-3">
          <p className="text-[15px] font-bold text-[var(--text)]">
            No clients in your atelier directory yet
          </p>
          <p className="text-[12px] text-[var(--text-2)] max-w-sm">
            Create your first client profile to record bespoke anatomical measurements and manage order history.
          </p>
          <button
            type="button"
            onClick={() => handleOpenEditProfile('create')}
            className="mt-1 h-9 px-5 rounded-[24px] bg-[var(--primary)] text-white text-[12px] font-medium hover:opacity-95 transition-opacity cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create First Client</span>
          </button>
        </div>
      ) : (
      /* =====================================================================
          OUTER SHELL CONTAINER (2px white frame, rounded-[8px], gap-[2px])
          ===================================================================== */
      <div className="w-full bg-[var(--surface)] p-[2px] rounded-[8px] flex flex-col gap-[2px]">
        {/* ===================================================================
            TOP CLIENT HEADER BAR (Present in all 9 Figma frames)
            =================================================================== */}
        <div className="w-full bg-[var(--surface)] rounded-[6px] px-4 sm:px-6 py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative">
          {/* Left Identity Cluster */}
          <div
            id="clients-roster"
            className="flex items-center gap-3.5 sm:gap-4 min-w-0"
          >
            {/* 64px Dark Charcoal Initials Circle (#595959) */}
            <button
              type="button"
              onClick={() => handleOpenEditProfile('switch')}
              title="Switch or manage client"
              aria-label={`Switch or manage client (${selectedClientProfile.name})`}
              className="w-[56px] h-[56px] sm:w-[64px] sm:h-[64px] rounded-full bg-[var(--text-2)] flex items-center justify-center text-white text-[15px] sm:text-[16px] font-semibold shrink-0 cursor-pointer hover:opacity-95 transition-opacity"
            >
              {selectedClientProfile.initials}
            </button>

            <div className="min-w-0 flex-1">
              <button
                type="button"
                onClick={() => handleOpenEditProfile('switch')}
                className="text-left group cursor-pointer block max-w-full"
              >
                <h1 className="text-[17px] sm:text-[18px] font-semibold text-[var(--text)] leading-tight truncate group-hover:text-[var(--primary)] transition-colors">
                  {selectedClientProfile.name}
                </h1>
              </button>

              {/* Contact Info Row */}
              <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 mt-1.5 text-[11px] sm:text-[12px] font-medium text-[var(--text)]">
                <span className="inline-flex items-center gap-1.5 tabular-nums">
                  <Phone className="w-3.5 h-3.5 fill-current text-[var(--text)] shrink-0" />
                  <span>{selectedClientProfile.phone}</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-[var(--text)] text-white inline-flex items-center justify-center shrink-0">
                    <AtSign className="w-2.5 h-2.5 stroke-[2.5]" />
                  </span>
                  <span>{selectedClientProfile.email}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right Action Cluster: `New order` pill + `⋮` Overflow Menu Button */}
          <div
            ref={overflowMenuRef}
            className="flex items-center gap-2.5 w-full sm:w-auto relative"
          >
            <button
              type="button"
              onClick={() => {
                setIsOverflowMenuOpen(false);
                setViewState((prev) =>
                  prev === 'Inline_NewOrder'
                    ? 'SavedMeasurements_Default'
                    : 'Inline_NewOrder'
                );
              }}
              className={cn(
                'flex-1 sm:flex-initial h-9 px-4 rounded-[24px] border text-[12px] font-medium transition-colors flex items-center justify-center cursor-pointer',
                viewState === 'Inline_NewOrder'
                  ? 'bg-[var(--selected-bg)] border-[var(--selected)] text-[var(--primary)]'
                  : 'bg-[var(--chip)] border-[var(--outline)] text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[#E8E8E8]'
              )}
            >
              New order
            </button>

            <button
              type="button"
              aria-label="Client profile actions"
              aria-haspopup="menu"
              aria-expanded={isOverflowMenuOpen}
              onClick={() => setIsOverflowMenuOpen((prev) => !prev)}
              className="w-9 h-9 rounded-full bg-[var(--chip)] hover:bg-[#E8E8E8] flex items-center justify-center text-[var(--text-2)] hover:text-[var(--text)] transition-colors shrink-0 cursor-pointer"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {/* Overflow Menu Popover (Desktop Frame 2 & Mobile Frame 4) */}
            <AnimatePresence>
              {isOverflowMenuOpen && (
                <motion.div
                  role="menu"
                  aria-label="Client profile actions"
                  initial={{ opacity: 0, y: -4, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                  transition={springSmooth}
                  className="absolute right-0 top-[calc(100%+6px)] z-40 w-[148px] bg-[var(--surface)] border border-[var(--outline)] rounded-[8px] p-1 shadow-[0_8px_24px_rgba(0,0,0,0.08)] flex flex-col gap-0.5"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handleOpenEditProfile('edit')}
                    className="w-full px-2.5 py-2 rounded-[6px] bg-[var(--card)] hover:bg-[#EFEFEF] flex items-center gap-2 text-[12px] font-medium text-[var(--text-2)] hover:text-[var(--text)] transition-colors text-left cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5 shrink-0" />
                    <span>Edit Profile</span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsOverflowMenuOpen(false);
                      setIsDeleteConfirmOpen(true);
                    }}
                    className="w-full px-2.5 py-2 rounded-[6px] hover:bg-[var(--card)] flex items-center gap-2 text-[12px] font-medium text-[var(--text-2)] hover:text-[var(--paused)] transition-colors text-left cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Delete</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ===================================================================
            MAIN WORKSPACE AREA
            - Views 1, 2, 3 render inside the #F8F8F8 (--card) workspace with Underline Tabs
            - View 4 (Inline_NewOrder) renders the 2-column New Order split
            =================================================================== */}
        {viewState !== 'Inline_NewOrder' ? (
          <>
            <div className="w-full bg-[var(--card)] rounded-[6px] px-4 sm:px-6 pt-4 pb-6 flex flex-col gap-4">
              {/* Underline Tabs: `Saved Measurements` | `Order History` */}
              <div
                role="tablist"
                aria-label="Client workspace sections"
                className="w-full border-b border-[var(--outline)] flex items-center gap-6"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={
                    viewState === 'SavedMeasurements_Default' ||
                    viewState === 'SavedMeasurements_UseFlow'
                  }
                  onClick={() => setViewState('SavedMeasurements_Default')}
                  className={cn(
                    'pb-2.5 text-[12px] sm:text-[13px] transition-colors relative cursor-pointer',
                    viewState === 'SavedMeasurements_Default' ||
                      viewState === 'SavedMeasurements_UseFlow'
                      ? 'font-semibold text-[var(--primary)]'
                      : 'font-medium text-[var(--muted)] hover:text-[var(--text-2)]'
                  )}
                >
                  Saved Measurements
                  {(viewState === 'SavedMeasurements_Default' ||
                    viewState === 'SavedMeasurements_UseFlow') && (
                    <motion.div
                      layoutId="clients-underline-tab"
                      transition={springSnappy}
                      className="absolute left-0 right-0 -bottom-[1px] h-[2px] bg-[var(--primary)]"
                    />
                  )}
                </button>
                <button
                  type="button"
                  id="clients-order-history-tab"
                  role="tab"
                  aria-selected={viewState === 'OrderHistory_Grid'}
                  onClick={() => setViewState('OrderHistory_Grid')}
                  className={cn(
                    'pb-2.5 text-[12px] sm:text-[13px] transition-colors relative cursor-pointer',
                    viewState === 'OrderHistory_Grid'
                      ? 'font-semibold text-[var(--primary)]'
                      : 'font-medium text-[var(--muted)] hover:text-[var(--text-2)]'
                  )}
                >
                  Order History
                  {viewState === 'OrderHistory_Grid' && (
                    <motion.div
                      layoutId="clients-underline-tab"
                      transition={springSnappy}
                      className="absolute left-0 right-0 -bottom-[1px] h-[2px] bg-[var(--primary)]"
                    />
                  )}
                </button>
              </div>

              {/* =============================================================
                  VIEW STATE 1: `SavedMeasurements_Default`
                  (Desktop Frames 1 & 2, Mobile Frames 3 & 4)
                  ============================================================= */}
              {viewState === 'SavedMeasurements_Default' && (
                <div className="flex flex-col gap-4 pt-1">
                  {/* Snapshot Selector Pill + Metadata Header + Use Measurement CTA */}
                  <div
                    ref={snapshotDropdownRef}
                    className="flex flex-col gap-3 relative"
                  >
                    {/* Snapshot Selector Dropdown Pill */}
                    <div
                      id="client-snapshot-selector"
                      className="relative w-[300px] max-w-full"
                    >
                      <button
                        type="button"
                        aria-haspopup="listbox"
                        aria-expanded={isSnapshotDropdownOpen}
                        onClick={() =>
                          setIsSnapshotDropdownOpen((prev) => !prev)
                        }
                        className="w-full h-8 px-3.5 rounded-[24px] bg-[var(--surface)] border border-[var(--outline)] flex items-center justify-between gap-2 text-[12px] text-[var(--text-2)] hover:border-[var(--muted)] transition-colors cursor-pointer"
                      >
                        <span className="truncate">
                          {activeSnapshot
                            ? `${activeSnapshot.garmentType}. ${activeSnapshot.date}`
                            : 'Bespoke wedding gown. 25/10/2026'}
                        </span>
                        <ChevronDown className="w-3.5 h-3.5 text-[var(--text-2)] shrink-0" />
                      </button>

                      {/* Mobile Dropdown Menu (anchors directly below selector pill on mobile as in Mobile Frame 4) */}
                      <AnimatePresence>
                        {isSnapshotDropdownOpen && (
                          <motion.div
                            role="listbox"
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={springSmooth}
                            className="sm:hidden absolute left-0 top-[calc(100%+4px)] w-full bg-[var(--surface)] border border-[var(--outline)] rounded-[8px] p-1 shadow-[0_8px_24px_rgba(0,0,0,0.06)] z-30 flex flex-col gap-0.5"
                          >
                            {otherSnapshots.map((snap, idx) => (
                              <button
                                key={snap.id}
                                type="button"
                                role="option"
                                aria-selected={snap.id === activeSnapshot?.id}
                                onClick={() => handleSelectSnapshot(snap.id)}
                                className={cn(
                                  'w-full px-3 py-2 rounded-[6px] text-left text-[12px] text-[var(--text-2)] hover:bg-[var(--card)] hover:text-[var(--text)] transition-colors cursor-pointer',
                                  idx === 0 && 'bg-[var(--card)]'
                                )}
                              >
                                {snap.garmentType}. {snap.date}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Snapshot Title + Subtitle + `Use Measurement` Pill Button */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative">
                      <div>
                        <h2 className="text-[14px] font-semibold text-[var(--text)] leading-snug">
                          {activeSnapshot
                            ? `${activeSnapshot.garmentType}.`
                            : 'Bespoke wedding gown.'}
                        </h2>
                        <p className="text-[11px] text-[var(--muted)] mt-0.5">
                          {activePointKeys.length}{' '}
                          {activePointKeys.length === 1 ? 'point' : 'points'}{' '}
                          &nbsp;•&nbsp;{' '}
                          {mannequinGender === 'female' ? 'Female' : 'Male'}{' '}
                          &nbsp;•&nbsp; Recorded on{' '}
                          {activeSnapshot ? activeSnapshot.date : '25/10/2026'}
                        </p>

                        {/* Desktop Dropdown Menu (positioned right below the title as in Desktop Frame 2) */}
                        <AnimatePresence>
                          {isSnapshotDropdownOpen && (
                            <motion.div
                              role="listbox"
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              transition={springSmooth}
                              className="hidden sm:flex absolute left-0 top-[26px] w-[260px] bg-[var(--surface)] border border-[var(--outline)] rounded-[8px] p-1 shadow-[0_8px_24px_rgba(0,0,0,0.06)] z-30 flex-col gap-0.5"
                            >
                              {otherSnapshots.map((snap, idx) => (
                                <button
                                  key={snap.id}
                                  type="button"
                                  role="option"
                                  aria-selected={snap.id === activeSnapshot?.id}
                                  onClick={() => handleSelectSnapshot(snap.id)}
                                  className={cn(
                                    'w-full px-3 py-2 rounded-[6px] text-left text-[12px] text-[var(--text-2)] hover:bg-[var(--card)] hover:text-[var(--text)] transition-colors cursor-pointer',
                                    idx === 0 && 'bg-[var(--card)]'
                                  )}
                                >
                                  {snap.garmentType}. {snap.date}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <button
                        type="button"
                        id="clients-use-measurement-btn"
                        onClick={() => {
                          setIsSnapshotDropdownOpen(false);
                          setViewState('SavedMeasurements_UseFlow');
                        }}
                        className="w-full sm:w-auto h-9 px-4 rounded-[24px] bg-[var(--chip)] border border-[var(--outline)] text-[12px] font-medium text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[#E8E8E8] transition-colors flex items-center justify-center cursor-pointer shrink-0"
                      >
                        Use Measurement
                      </button>
                    </div>
                  </div>

                  {/* 2-Column Split: Left 3D Mannequin + Right 3-Column (Desktop) / 2-Column (Mobile) Measurement Cards */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pt-2">
                    {/* Left Mannequin on #F8F8F8 canvas */}
                    <div className="lg:col-span-5 flex items-center justify-center">
                      <RotatableMannequin
                        gender={mannequinGender}
                        onGenderChange={setMannequinGender}
                        showControls={false}
                        compact={false}
                        measurements={measurements}
                        activePointKeys={activePointKeys}
                        selectedPointKey={pointModalData?.key || null}
                        unit={unitLabel}
                        onSelectPoint={handleOpenPoint}
                      />
                    </div>

                    {/* Right Measurement Cards Grid (2 cols on mobile, 3 cols on desktop) */}
                    <div className="lg:col-span-7 grid grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {visibleMeasurementFields.map((field) => (
                        <div
                          key={field.id}
                          className="bg-[var(--surface)] rounded-[12px] p-3 flex flex-col justify-between gap-2.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[12px] font-semibold text-[var(--text)] truncate">
                              {field.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemovePoint(field.id)}
                              title={`Remove ${field.name}`}
                              aria-label={`Remove ${field.name}`}
                              className="w-6 h-6 -mr-1 -mt-0.5 rounded-full flex items-center justify-center text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--chip)] transition-colors cursor-pointer shrink-0"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="w-full h-9 rounded-[8px] bg-[var(--field-on-card)] px-3 flex items-center border border-transparent focus-within:border-[var(--primary)] transition-colors">
                            <input
                              type="text"
                              inputMode="decimal"
                              aria-label={`${field.name} (${field.unit})`}
                              value={field.value}
                              onChange={(e) =>
                                handleFieldValueChange(field.id, e.target.value)
                              }
                              placeholder="0.0"
                              className="w-full bg-transparent text-[12px] font-medium text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none tabular-nums"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* =============================================================
                  VIEW STATE 2: `SavedMeasurements_UseFlow`
                  (Desktop Frame 3, Mobile Frame 1)
                  ============================================================= */}
              {viewState === 'SavedMeasurements_UseFlow' && (
                <div className="flex flex-col gap-3.5 pt-0.5">
                  {/* Back Link */}
                  <button
                    type="button"
                    onClick={() => setViewState('SavedMeasurements_Default')}
                    className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--text-2)] hover:text-[var(--text)] transition-colors w-fit cursor-pointer"
                  >
                    <CornerUpLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>

                  {/* Snapshot Selector Dropdown Pill */}
                  <div
                    ref={snapshotDropdownRef}
                    className="relative w-[260px] max-w-full"
                  >
                    <button
                      type="button"
                      aria-haspopup="listbox"
                      aria-expanded={isSnapshotDropdownOpen}
                      onClick={() => setIsSnapshotDropdownOpen((prev) => !prev)}
                      className="w-full h-8 px-3.5 rounded-[24px] bg-[var(--surface)] border border-[var(--outline)] flex items-center justify-between gap-2 text-[12px] text-[var(--text-2)] hover:border-[var(--muted)] transition-colors cursor-pointer"
                    >
                      <span className="truncate">
                        {activeSnapshot
                          ? `${activeSnapshot.garmentType}. ${activeSnapshot.date}`
                          : 'Bespoke wedding gown. 25/10/2026'}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-[var(--text-2)] shrink-0" />
                    </button>

                    <AnimatePresence>
                      {isSnapshotDropdownOpen && (
                        <motion.div
                          role="listbox"
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={springSmooth}
                          className="absolute left-0 top-[calc(100%+4px)] w-full bg-[var(--surface)] border border-[var(--outline)] rounded-[8px] p-1 shadow-[0_8px_24px_rgba(0,0,0,0.06)] z-30 flex flex-col gap-0.5"
                        >
                          {otherSnapshots.map((snap, idx) => (
                            <button
                              key={snap.id}
                              type="button"
                              role="option"
                              aria-selected={snap.id === activeSnapshot?.id}
                              onClick={() => handleSelectSnapshot(snap.id)}
                              className={cn(
                                'w-full px-3 py-2 rounded-[6px] text-left text-[12px] text-[var(--text-2)] hover:bg-[var(--card)] hover:text-[var(--text)] transition-colors cursor-pointer',
                                idx === 0 && 'bg-[var(--card)]'
                              )}
                            >
                              {snap.garmentType}. {snap.date}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* 2-Column Split wrapped in white surface frame for crisp seam separation */}
                  <div className="bg-[var(--surface)] p-[2px] rounded-[8px] flex flex-col lg:flex-row gap-[2px] items-stretch">
                    {/* Left White Card */}
                    <div className="w-full lg:w-[35%] bg-[var(--surface)] rounded-[6px] p-4 flex flex-col gap-3.5 shrink-0">
                      <h3 className="text-[15px] font-bold text-[var(--text)] leading-snug">
                        {activeSnapshot?.garmentType || 'Bespoke wedding gown'}
                      </h3>

                      {/* Read-only Client Summary Key-Value Rows */}
                      <div className="flex flex-col gap-2 text-[12px]">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[var(--muted)]">Client Name:</span>
                          <span className="font-medium text-[var(--text)]">
                            {selectedClientProfile.name}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[var(--muted)]">Phone Number</span>
                          <span className="font-medium text-[var(--text)] tabular-nums">
                            {selectedClientProfile.id === 'c-1'
                              ? '+234 693828199'
                              : selectedClientProfile.phone}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[var(--muted)]">Email Address</span>
                          <span className="font-medium text-[var(--text)]">
                            {selectedClientProfile.id === 'c-1'
                              ? 'chloe@atelier.com'
                              : selectedClientProfile.email}
                          </span>
                        </div>
                      </div>

                      {/* Style References */}
                      <div>
                        <label className="text-[11px] font-medium text-[var(--text)] mb-1.5 block">
                          Style References
                        </label>
                        <AnimatedFileUpload
                          images={useFlowImages}
                          onChange={setUseFlowImages}
                          label="Drop fabric style, sketches or style photos here"
                        />
                      </div>

                      {/* Price & Due Date */}
                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="text-[11px] font-medium text-[var(--text)] mb-1 block">
                            Price ({currencySymbol})
                          </label>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={useFlowPrice}
                            onChange={(e) => setUseFlowPrice(e.target.value)}
                            placeholder={`${currencySymbol}0.00`}
                            className="w-full h-9 rounded-[8px] bg-[var(--field-on-card)] px-3 text-[12px] text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none border border-transparent focus:border-[var(--primary)] tabular-nums"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-medium text-[var(--text)] mb-1 block">
                            Due Date
                          </label>
                          <input
                            type="text"
                            value={useFlowDueDate}
                            onChange={(e) => setUseFlowDueDate(e.target.value)}
                            placeholder="09/10/2026"
                            className="w-full h-9 rounded-[8px] bg-[var(--field-on-card)] px-3 text-[12px] text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none border border-transparent focus:border-[var(--primary)] tabular-nums"
                          />
                        </div>
                      </div>

                      {/* Workroom notes and fabric details */}
                      <div>
                        <label className="text-[11px] font-medium text-[var(--text)] mb-1 block">
                          Workroom notes and fabric details
                        </label>
                        <textarea
                          value={useFlowNotes}
                          onChange={(e) => setUseFlowNotes(e.target.value)}
                          placeholder="e.g. hand-stitched, monogram design on wrist and gold buttons"
                          className="w-full min-h-[100px] rounded-[8px] bg-[var(--field-on-card)] p-3 text-[12px] text-[var(--text)] placeholder:text-[var(--muted)] resize-none focus:outline-none border border-transparent focus:border-[var(--primary)]"
                        />
                      </div>
                    </div>

                    {/* Right Mannequin Pane */}
                    <div className="w-full lg:flex-1 bg-[var(--card)] rounded-[6px] p-3 sm:p-4 flex flex-col gap-3">
                      <div>
                        <h3 className="text-[14px] font-bold text-[var(--text)] leading-tight">
                          Mannequin
                        </h3>
                        <p className="text-[11px] text-[var(--muted)] mt-0.5">
                          All available points &nbsp;•&nbsp;{' '}
                          {mannequinGender === 'female'
                            ? 'Feminine Form'
                            : 'Masculine Form'}
                        </p>
                      </div>

                      {/* Compact White Pill Toolbar: [Mannequin | List] + [Add Point] */}
                      <div className="w-fit rounded-[32px] bg-[var(--surface)] p-1.5 flex items-center gap-2">
                        <div className="h-8 bg-[var(--chip)] rounded-[24px] p-1 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setMannequinDisplayMode('mannequin')}
                            title="Mannequin view"
                            aria-label="Mannequin view"
                            aria-pressed={mannequinDisplayMode === 'mannequin'}
                            className={cn(
                              'w-6 h-6 rounded-full flex items-center justify-center transition-colors cursor-pointer',
                              mannequinDisplayMode === 'mannequin'
                                ? 'bg-[var(--primary)] text-white'
                                : 'bg-[var(--surface)] text-[var(--text-2)] hover:text-[var(--text)]'
                            )}
                          >
                            <PersonStanding className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setMannequinDisplayMode('list')}
                            title="Measurement list view"
                            aria-label="Measurement list view"
                            aria-pressed={mannequinDisplayMode === 'list'}
                            className={cn(
                              'w-6 h-6 rounded-full flex items-center justify-center transition-colors cursor-pointer',
                              mannequinDisplayMode === 'list'
                                ? 'bg-[var(--primary)] text-white'
                                : 'bg-[var(--surface)] text-[var(--text-2)] hover:text-[var(--text)]'
                            )}
                          >
                            <ClipboardList className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={handleOpenAddPoint}
                          className="h-8 px-3.5 rounded-[24px] bg-[var(--chip)] border border-[var(--outline)] text-[12px] font-medium text-[var(--text-2)] hover:text-[var(--text)] transition-colors cursor-pointer"
                        >
                          Add Point
                        </button>
                      </div>

                      {/* Mannequin or List View */}
                      {mannequinDisplayMode === 'mannequin' ? (
                        <div className="flex-1 flex items-center justify-center py-2">
                          <RotatableMannequin
                            gender={mannequinGender}
                            onGenderChange={setMannequinGender}
                            showControls={false}
                            compact={false}
                            measurements={measurements}
                            activePointKeys={activePointKeys}
                            selectedPointKey={pointModalData?.key || null}
                            unit={unitLabel}
                            onSelectPoint={handleOpenPoint}
                          />
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
                          {visibleMeasurementFields.map((field) => (
                            <div
                              key={field.id}
                              className="bg-[var(--surface)] rounded-[12px] p-3 flex flex-col justify-between gap-2.5"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[12px] font-semibold text-[var(--text)] truncate">
                                  {field.name}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemovePoint(field.id)}
                                  title={`Remove ${field.name}`}
                                  aria-label={`Remove ${field.name}`}
                                  className="w-6 h-6 -mr-1 -mt-0.5 rounded-full flex items-center justify-center text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--chip)] cursor-pointer shrink-0"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <div className="w-full h-9 rounded-[8px] bg-[var(--field-on-card)] px-3 flex items-center">
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  aria-label={`${field.name} (${field.unit})`}
                                  value={field.value}
                                  onChange={(e) =>
                                    handleFieldValueChange(
                                      field.id,
                                      e.target.value
                                    )
                                  }
                                  placeholder="0.0"
                                  className="w-full bg-transparent text-[12px] font-medium text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none tabular-nums"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* =============================================================
                  VIEW STATE 3: `OrderHistory_Grid`
                  (Desktop Frame 4: 4-Column Order Card Grid)
                  ============================================================= */}
              {viewState === 'OrderHistory_Grid' && (
                <div className="pt-1">
                  {orderHistoryCards.length === 0 ? (
                    <div className="w-full bg-[var(--surface)] rounded-[8px] p-8 text-center flex flex-col items-center justify-center gap-2">
                      <p className="text-[14px] font-semibold text-[var(--text)]">
                        No orders recorded for {selectedClientProfile.name} yet
                      </p>
                      <button
                        type="button"
                        onClick={() => setViewState('Inline_NewOrder')}
                        className="mt-1 h-9 px-4 rounded-[24px] bg-[var(--primary)] text-white text-[12px] font-medium hover:opacity-95 transition-opacity cursor-pointer"
                      >
                        Create First Order
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {orderHistoryCards.map((card) => (
                        <div
                          key={card.id}
                          onClick={() => {
                            if (onEditOrder) onEditOrder(card.id);
                          }}
                          className={cn(
                            'bg-[var(--surface)] rounded-[8px] p-[2px] flex flex-col gap-[2px] border border-transparent hover:border-[var(--selected)] transition-all',
                            onEditOrder && 'cursor-pointer'
                          )}
                        >
                          {/* Card Header */}
                          <div className="bg-[var(--surface)] rounded-t-[6px] px-2.5 pt-2.5 pb-2 flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <h4 className="text-[13px] font-semibold text-[var(--text)] truncate leading-tight">
                                {card.title}
                              </h4>
                              <p className="text-[11px] font-normal text-[var(--sub)] mt-1 leading-tight">
                                {card.date}
                              </p>
                            </div>

                            <span
                              style={{ backgroundColor: card.badgeColor }}
                              className="px-2.5 py-0.5 rounded-[24px] text-[10px] font-medium text-white shrink-0 leading-tight"
                            >
                              {card.badge}
                            </span>
                          </div>

                          {/* Dark Style References Band (#222222) */}
                          <div className="bg-[var(--band)] rounded-[6px] p-2 flex flex-col gap-1.5">
                            <span className="text-[10px] font-medium text-white leading-tight">
                              Style references
                            </span>
                            <div className="grid grid-cols-3 gap-1">
                              {card.images.map((img, idx) => (
                                <img
                                  key={idx}
                                  src={img}
                                  alt="Style reference"
                                  className="w-full h-[64px] rounded-[4px] object-cover"
                                />
                              ))}
                            </div>
                          </div>

                          {/* Bottom Price Row */}
                          <div className="bg-[var(--surface)] rounded-b-[6px] px-2.5 py-2 flex items-center justify-between">
                            <span className="text-[11px] text-[var(--price-label)]">
                              Price
                            </span>
                            <span className="text-[14px] font-bold text-[var(--text)] tabular-nums">
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
              )}
            </div>

            {/* Bottom White Action Bar for `SavedMeasurements_UseFlow` (Desktop Frame 3 & Mobile Frame 1) */}
            {viewState === 'SavedMeasurements_UseFlow' && (
              <div className="w-full bg-[var(--surface)] rounded-[6px] px-4 sm:px-6 py-3 flex items-center justify-end">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  transition={springSnappy}
                  onClick={handleCreateOrderFromUseFlow}
                  className="h-9 px-5 rounded-[24px] bg-[var(--primary)] text-white text-[12px] font-medium hover:opacity-95 transition-opacity flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Create Order</span>
                </motion.button>
              </div>
            )}
          </>
        ) : (
          /* =================================================================
             VIEW STATE 4: `Inline_NewOrder`
             (Desktop Frame 5, Mobile Frame 2)
             ================================================================= */
          <>
            <div className="flex flex-col lg:flex-row gap-[2px] w-full">
              {/* Left Column: New Order Form */}
              <div className="w-full lg:w-[34%] bg-[var(--card)] rounded-[6px] p-3 flex flex-col gap-2.5 shrink-0">
                <div className="flex items-center justify-between px-0.5">
                  <h2 className="text-[14px] sm:text-[15px] font-bold text-[var(--text)]">
                    New Order
                  </h2>
                  <button
                    type="button"
                    onClick={() => setViewState('SavedMeasurements_Default')}
                    className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--text-2)] hover:text-[var(--text)] transition-colors cursor-pointer"
                  >
                    <CornerUpLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                </div>

                <div className="bg-[var(--surface)] rounded-[8px] p-3.5 flex flex-col gap-3.5">
                  {/* Basic Information */}
                  <div>
                    <h3 className="text-[13px] sm:text-[14px] font-semibold text-[var(--text)]">
                      Basic Information
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2">
                      <div>
                        <label className="text-[11px] font-medium text-[var(--text)] mb-1 block">
                          Client
                        </label>
                        <input
                          type="text"
                          value={newOrderClientName}
                          onChange={(e) => setNewOrderClientName(e.target.value)}
                          placeholder="e.g. Adriana Kunle"
                          className="w-full h-9 rounded-[8px] bg-[var(--field-on-card)] px-2.5 text-[11px] sm:text-[12px] text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none border border-transparent focus:border-[var(--primary)]"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-medium text-[var(--text)] mb-1 block">
                          Garment Type
                        </label>
                        <input
                          type="text"
                          value={newOrderGarmentType}
                          onChange={(e) =>
                            setNewOrderGarmentType(e.target.value)
                          }
                          placeholder="Bespoke African Gown"
                          className="w-full h-9 rounded-[8px] bg-[var(--field-on-card)] px-2.5 text-[11px] sm:text-[12px] text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none border border-transparent focus:border-[var(--primary)]"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-medium text-[var(--text)] mb-1 block">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={newOrderPhone}
                          onChange={(e) => setNewOrderPhone(e.target.value)}
                          placeholder="+234 -"
                          className="w-full h-9 rounded-[8px] bg-[var(--field-on-card)] px-2.5 text-[11px] sm:text-[12px] text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none border border-transparent focus:border-[var(--primary)] tabular-nums"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-medium text-[var(--text)] mb-1 block">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={newOrderEmail}
                          onChange={(e) => setNewOrderEmail(e.target.value)}
                          placeholder="name@example.com"
                          className="w-full h-9 rounded-[8px] bg-[var(--field-on-card)] px-2.5 text-[11px] sm:text-[12px] text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none border border-transparent focus:border-[var(--primary)]"
                        />
                      </div>
                    </div>

                    {/* Saved Measurements Selector */}
                    <div
                      ref={newOrderTemplateDropdownRef}
                      className="mt-2.5 relative"
                    >
                      <label className="text-[11px] font-medium text-[var(--muted)] mb-1 block">
                        Saved Measurements
                      </label>
                      <button
                        type="button"
                        aria-haspopup="listbox"
                        aria-expanded={isNewOrderTemplateDropdownOpen}
                        onClick={() =>
                          setIsNewOrderTemplateDropdownOpen((prev) => !prev)
                        }
                        className="w-full h-9 px-3.5 rounded-[24px] bg-[var(--surface)] border border-[var(--outline)] flex items-center justify-between gap-2 text-[12px] text-[var(--text-2)] hover:border-[var(--muted)] transition-colors cursor-pointer"
                      >
                        <span className="truncate">
                          {newOrderSavedTemplateLabel ||
                            'Choose Saved Template'}
                        </span>
                        <ChevronDown className="w-3.5 h-3.5 text-[var(--text-2)] shrink-0" />
                      </button>

                      <AnimatePresence>
                        {isNewOrderTemplateDropdownOpen && (
                          <motion.div
                            role="listbox"
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={springSmooth}
                            className="absolute left-0 top-[calc(100%+4px)] w-full bg-[var(--surface)] border border-[var(--outline)] rounded-[8px] p-1 shadow-[0_8px_24px_rgba(0,0,0,0.06)] z-30 flex flex-col gap-0.5"
                          >
                            {clientSnapshots.map((snap, idx) => (
                              <button
                                key={snap.id}
                                type="button"
                                role="option"
                                aria-selected={snap.id === activeSnapshot?.id}
                                onClick={() => {
                                  handleSelectSnapshot(snap.id);
                                  setNewOrderSavedTemplateLabel(
                                    `${snap.garmentType}. ${snap.date}`
                                  );
                                  if (!newOrderGarmentType) {
                                    setNewOrderGarmentType(snap.garmentType);
                                  }
                                  setIsNewOrderTemplateDropdownOpen(false);
                                }}
                                className={cn(
                                  'w-full px-3 py-2 rounded-[6px] text-left text-[12px] text-[var(--text-2)] hover:bg-[var(--card)] hover:text-[var(--text)] transition-colors cursor-pointer',
                                  idx === 0 && 'bg-[var(--card)]'
                                )}
                              >
                                {snap.garmentType}. {snap.date}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Style References */}
                  <div>
                    <h3 className="text-[13px] sm:text-[14px] font-semibold text-[var(--text)] mb-1.5">
                      Style References
                    </h3>
                    <AnimatedFileUpload
                      images={newOrderImages}
                      onChange={setNewOrderImages}
                      label="Tap to upload image"
                    />
                  </div>

                  {/* Price/Due date */}
                  <div>
                    <h3 className="text-[13px] sm:text-[14px] font-semibold text-[var(--text)] mb-1.5">
                      Price/Due date
                    </h3>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[11px] font-medium text-[var(--text)] mb-1 block">
                          Price ({currencySymbol})
                        </label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={newOrderPrice}
                          onChange={(e) => setNewOrderPrice(e.target.value)}
                          placeholder={`${currencySymbol}0.00`}
                          className="w-full h-9 rounded-[8px] bg-[var(--field-on-card)] px-2.5 text-[11px] sm:text-[12px] text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none border border-transparent focus:border-[var(--primary)] tabular-nums"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-medium text-[var(--text)] mb-1 block">
                          Due Date
                        </label>
                        <input
                          type="text"
                          value={newOrderDueDate}
                          onChange={(e) => setNewOrderDueDate(e.target.value)}
                          placeholder="09/10/2026"
                          className="w-full h-9 rounded-[8px] bg-[var(--field-on-card)] px-2.5 text-[11px] sm:text-[12px] text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none border border-transparent focus:border-[var(--primary)] tabular-nums"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <h3 className="text-[13px] sm:text-[14px] font-semibold text-[var(--text)] leading-tight">
                      Notes
                    </h3>
                    <span className="text-[11px] font-medium text-[var(--text)] mt-0.5 mb-1.5 block">
                      Workroom notes and fabric details
                    </span>
                    <textarea
                      value={newOrderNotes}
                      onChange={(e) => setNewOrderNotes(e.target.value)}
                      placeholder="e.g. hand-stitched, monogram design on wrist and gold buttons"
                      className="w-full min-h-[96px] rounded-[8px] bg-[var(--field-on-card)] p-2.5 text-[11px] sm:text-[12px] text-[var(--text)] placeholder:text-[var(--muted)] resize-none focus:outline-none border border-transparent focus:border-[var(--primary)]"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Mannequin Workspace */}
              <div className="w-full lg:flex-1 bg-[var(--card)] rounded-[6px] p-4 flex flex-col gap-3">
                <div>
                  <h3 className="text-[14px] font-bold text-[var(--text)] leading-tight">
                    Mannequin
                  </h3>
                  <p className="text-[11px] text-[var(--muted)] mt-0.5">
                    All available points &nbsp;•&nbsp;{' '}
                    {mannequinGender === 'female'
                      ? 'Feminine Form'
                      : 'Masculine Form'}
                  </p>
                </div>

                {/* White Pill Toolbar (Desktop Frame 5 & Mobile Frame 2) */}
                <div className="w-fit max-w-full rounded-[32px] bg-[var(--surface)] p-1.5 flex flex-wrap items-center gap-1.5 sm:gap-2">
                  {/* 1. Template Button (`Template` on mobile, `Choose Template` on desktop) */}
                  <button
                    type="button"
                    onClick={() => {
                      setDialogSelectedTemplateId(
                        selectedTemplateId || storeTemplates[0]?.id || ''
                      );
                      setIsTemplateModalOpen(true);
                    }}
                    className="h-8 sm:h-9 px-3.5 sm:px-5 rounded-[24px] bg-[var(--chip)] text-[12px] sm:text-[13px] font-medium text-[var(--text-2)] hover:text-[var(--text)] transition-colors cursor-pointer"
                  >
                    <span className="sm:hidden">Template</span>
                    <span className="hidden sm:inline">Choose Template</span>
                  </button>

                  {/* 2. M / F Gender Toggle Pill */}
                  <div className="h-8 sm:h-9 bg-[var(--chip)] rounded-[24px] p-1 flex items-center gap-1">
                    <button
                      type="button"
                      aria-label="Masculine form"
                      aria-pressed={mannequinGender === 'male'}
                      onClick={() => setMannequinGender('male')}
                      className={cn(
                        'w-6 h-6 sm:w-7 sm:h-7 rounded-full text-[11px] font-semibold flex items-center justify-center transition-colors cursor-pointer',
                        mannequinGender === 'male'
                          ? 'bg-[var(--primary)] text-white'
                          : 'bg-[var(--surface)] text-[var(--text-2)] hover:text-[var(--text)]'
                      )}
                    >
                      M
                    </button>
                    <button
                      type="button"
                      aria-label="Feminine form"
                      aria-pressed={mannequinGender === 'female'}
                      onClick={() => setMannequinGender('female')}
                      className={cn(
                        'w-6 h-6 sm:w-7 sm:h-7 rounded-full text-[11px] font-semibold flex items-center justify-center transition-colors cursor-pointer',
                        mannequinGender === 'female'
                          ? 'bg-[var(--primary)] text-white'
                          : 'bg-[var(--surface)] text-[var(--text-2)] hover:text-[var(--text)]'
                      )}
                    >
                      F
                    </button>
                  </div>

                  {/* 3. Mannequin / List View Toggle Pill */}
                  <div className="h-8 sm:h-9 bg-[var(--chip)] rounded-[24px] p-1 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setMannequinDisplayMode('mannequin')}
                      title="Mannequin view"
                      aria-label="Mannequin view"
                      aria-pressed={mannequinDisplayMode === 'mannequin'}
                      className={cn(
                        'w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer',
                        mannequinDisplayMode === 'mannequin'
                          ? 'bg-[var(--primary)] text-white'
                          : 'bg-[var(--surface)] text-[var(--text-2)] hover:text-[var(--text)]'
                      )}
                    >
                      <PersonStanding className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setMannequinDisplayMode('list')}
                      title="Measurement list view"
                      aria-label="Measurement list view"
                      aria-pressed={mannequinDisplayMode === 'list'}
                      className={cn(
                        'w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer',
                        mannequinDisplayMode === 'list'
                          ? 'bg-[var(--primary)] text-white'
                          : 'bg-[var(--surface)] text-[var(--text-2)] hover:text-[var(--text)]'
                      )}
                    >
                      <ClipboardList className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* 4. Add Point Button */}
                  <button
                    type="button"
                    onClick={handleOpenAddPoint}
                    className="h-8 sm:h-9 px-3.5 sm:px-4 rounded-[24px] bg-[var(--chip)] border border-[var(--outline)] text-[12px] sm:text-[13px] font-medium text-[var(--text-2)] hover:text-[var(--text)] transition-colors cursor-pointer"
                  >
                    Add Point
                  </button>
                </div>

                {/* Mannequin Stage or List View */}
                {mannequinDisplayMode === 'mannequin' ? (
                  <div className="flex-1 flex items-center justify-center py-2">
                    <RotatableMannequin
                      gender={mannequinGender}
                      onGenderChange={setMannequinGender}
                      showControls={false}
                      compact={false}
                      measurements={measurements}
                      activePointKeys={activePointKeys}
                      selectedPointKey={pointModalData?.key || null}
                      unit={unitLabel}
                      onSelectPoint={handleOpenPoint}
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
                    {visibleMeasurementFields.map((field) => (
                      <div
                        key={field.id}
                        className="bg-[var(--surface)] rounded-[12px] p-3 flex flex-col justify-between gap-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[12px] font-semibold text-[var(--text)] truncate">
                            {field.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemovePoint(field.id)}
                            title={`Remove ${field.name}`}
                            aria-label={`Remove ${field.name}`}
                            className="w-6 h-6 -mr-1 -mt-0.5 rounded-full flex items-center justify-center text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--chip)] cursor-pointer shrink-0"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="w-full h-9 rounded-[8px] bg-[var(--field-on-card)] px-3 flex items-center">
                          <input
                            type="text"
                            inputMode="decimal"
                            aria-label={`${field.name} (${field.unit})`}
                            value={field.value}
                            onChange={(e) =>
                              handleFieldValueChange(field.id, e.target.value)
                            }
                            placeholder="0.0"
                            className="w-full bg-transparent text-[12px] font-medium text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none tabular-nums"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom White Action Bar (`Save`) */}
            <div className="w-full bg-[var(--surface)] rounded-[6px] px-4 sm:px-6 py-3 flex items-center justify-end">
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                transition={springSnappy}
                onClick={handleSaveInlineNewOrder}
                className="h-9 px-5 rounded-[24px] bg-[var(--primary)] text-white text-[12px] font-medium hover:opacity-95 transition-opacity flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save</span>
              </motion.button>
            </div>
          </>
        )}
      </div>
      )}

      {/* =====================================================================
          EDIT PROFILE / SWITCH CLIENT MODAL
          ===================================================================== */}
      <AnimatePresence>
        {isEditProfileModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-60 bg-black/50 backdrop-blur-[6px] flex items-center justify-center p-4"
          >
            <div
              className="absolute inset-0"
              onClick={() => setIsEditProfileModalOpen(false)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Edit or switch client profile"
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={springSmooth}
              className="relative w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-[16px] bg-[var(--surface)] p-4 sm:p-6 shadow-2xl z-10 flex flex-col gap-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[var(--hairline)]">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditProfileMode('edit')}
                    className={cn(
                      'px-3 py-1 rounded-full text-[12px] font-semibold transition-colors cursor-pointer',
                      editProfileMode === 'edit'
                        ? 'bg-[var(--primary)] text-white'
                        : 'bg-[var(--chip)] text-[var(--text-2)]'
                    )}
                  >
                    Edit Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditProfileMode('switch')}
                    className={cn(
                      'px-3 py-1 rounded-full text-[12px] font-semibold transition-colors cursor-pointer flex items-center gap-1',
                      editProfileMode === 'switch'
                        ? 'bg-[var(--primary)] text-white'
                        : 'bg-[var(--chip)] text-[var(--text-2)]'
                    )}
                  >
                    <Users className="w-3 h-3" />
                    <span>Clients ({allClientList.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditProfileMode('create');
                      setEditName('');
                      setEditPhone('');
                      setEditEmail('');
                      setEditNotes('');
                    }}
                    className={cn(
                      'px-3 py-1 rounded-full text-[12px] font-semibold transition-colors cursor-pointer flex items-center gap-1',
                      editProfileMode === 'create'
                        ? 'bg-[var(--primary)] text-white'
                        : 'bg-[var(--chip)] text-[var(--text-2)]'
                    )}
                  >
                    <Plus className="w-3 h-3" />
                    <span>New</span>
                  </button>
                </div>
                <button
                  type="button"
                  aria-label="Close modal"
                  onClick={() => setIsEditProfileModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-[var(--chip)] text-[var(--muted)] hover:text-[var(--text)] flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {editProfileMode === 'switch' ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 bg-[var(--field-on-card)] rounded-[8px] px-3 py-2">
                    <Search className="w-4 h-4 text-[var(--muted)] shrink-0" />
                    <input
                      type="text"
                      value={directorySearch}
                      onChange={(e) => setDirectorySearch(e.target.value)}
                      placeholder="Search clients..."
                      className="w-full bg-transparent text-[12px] text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 max-h-[280px] overflow-y-auto">
                    {allClientList
                      .filter(
                        (c) =>
                          !directorySearch.trim() ||
                          c.name
                            .toLowerCase()
                            .includes(directorySearch.toLowerCase()) ||
                          c.phone
                            .toLowerCase()
                            .includes(directorySearch.toLowerCase())
                      )
                      .map((client) => {
                        const isSelected =
                          client.id === selectedClientProfile.id;
                        return (
                          <button
                            key={client.id}
                            type="button"
                            onClick={() => {
                              setSelectedClientId(client.id);
                              setIsEditProfileModalOpen(false);
                            }}
                            className={cn(
                              'w-full p-2.5 rounded-[10px] flex items-center justify-between text-left transition-colors cursor-pointer border',
                              isSelected
                                ? 'bg-[var(--selected-bg)] border-[var(--selected)]'
                                : 'bg-[var(--card)] border-transparent hover:bg-[var(--chip)]'
                            )}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-[var(--text-2)] text-white flex items-center justify-center text-[12px] font-semibold shrink-0">
                                {client.initials}
                              </div>
                              <div className="min-w-0">
                                <p className="text-[13px] font-semibold text-[var(--text)] truncate">
                                  {client.name}
                                </p>
                                <p className="text-[11px] text-[var(--muted)] truncate">
                                  {client.phone} • {client.email}
                                </p>
                              </div>
                            </div>
                            {isSelected && (
                              <Check className="w-4 h-4 text-[var(--primary)] shrink-0" />
                            )}
                          </button>
                        );
                      })}
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={handleSaveProfileModal}
                  className="flex flex-col gap-3.5"
                >
                  <div>
                    <label className="text-[11px] font-semibold text-[var(--text)] mb-1 block">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="e.g. Chloe Dallas"
                      required
                      className="w-full h-9 rounded-[8px] bg-[var(--field-on-card)] px-3 text-[12px] text-[var(--text)] focus:outline-none border border-transparent focus:border-[var(--primary)]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[var(--text)] mb-1 block">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="+234 8141 432 211"
                      className="w-full h-9 rounded-[8px] bg-[var(--field-on-card)] px-3 text-[12px] text-[var(--text)] focus:outline-none border border-transparent focus:border-[var(--primary)] tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[var(--text)] mb-1 block">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="chloe@atelier.fit"
                      className="w-full h-9 rounded-[8px] bg-[var(--field-on-card)] px-3 text-[12px] text-[var(--text)] focus:outline-none border border-transparent focus:border-[var(--primary)]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[var(--text)] mb-1 block">
                      Client Notes
                    </label>
                    <textarea
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Fit preferences, fabric notes..."
                      className="w-full min-h-[80px] rounded-[8px] bg-[var(--field-on-card)] p-3 text-[12px] text-[var(--text)] resize-none focus:outline-none border border-transparent focus:border-[var(--primary)]"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditProfileModalOpen(false)}
                      className="h-9 px-4 rounded-[24px] bg-[var(--chip)] border border-[var(--outline)] text-[12px] font-medium text-[var(--text-2)] cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="h-9 px-5 rounded-[24px] bg-[var(--primary)] text-white text-[12px] font-medium hover:opacity-95 cursor-pointer"
                    >
                      {editProfileMode === 'create'
                        ? 'Create Client'
                        : 'Save Changes'}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =====================================================================
          DELETE CLIENT CONFIRMATION DIALOG
          ===================================================================== */}
      <AnimatePresence>
        {isDeleteConfirmOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-60 bg-black/50 backdrop-blur-[6px] flex items-center justify-center p-4"
          >
            <div
              className="absolute inset-0"
              onClick={() => setIsDeleteConfirmOpen(false)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={`Delete ${selectedClientProfile.name}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={springSnappy}
              className="relative w-full max-w-sm rounded-[16px] bg-[var(--surface)] p-6 shadow-2xl z-10 flex flex-col gap-4"
            >
              <h3 className="text-[16px] font-bold text-[var(--text)]">
                Delete {selectedClientProfile.name}?
              </h3>
              <p className="text-[12px] text-[var(--text-2)] leading-relaxed">
                This will remove {selectedClientProfile.name}&apos;s profile,
                saved measurements, and order history from your workspace.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDeleteConfirmOpen(false)}
                  className="h-9 px-4 rounded-[24px] bg-[var(--chip)] border border-[var(--outline)] text-[12px] font-medium text-[var(--text-2)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteClient}
                  className="h-9 px-5 rounded-[24px] bg-[var(--paused)] text-white text-[12px] font-medium hover:opacity-95 cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =====================================================================
          GARMENT TEMPLATES MODAL
          ===================================================================== */}
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
              aria-label="Garment Templates"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={springSnappy}
              className="relative w-[435px] max-w-[calc(100vw-32px)] max-h-[90dvh] overflow-y-auto rounded-[16px] bg-[var(--surface)] p-4 sm:p-6 z-10 flex flex-col gap-5 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-[16px] font-bold text-[var(--text)]">
                  Garment Templates
                </h3>
                <button
                  type="button"
                  aria-label="Close templates modal"
                  onClick={() => setIsTemplateModalOpen(false)}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] cursor-pointer"
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
                          : 'border-[var(--outline)] bg-[var(--card)] hover:bg-[var(--chip)]'
                      )}
                    >
                      <div className="flex-1 pr-3 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-semibold text-[var(--text)] truncate">
                            {tmpl.name}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-[var(--surface)] text-[10px] font-medium text-[var(--text-2)] border border-[var(--hairline)] shrink-0">
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
                              const rem = storeTemplates.filter(
                                (t) => t.id !== tmpl.id
                              );
                              setDialogSelectedTemplateId(rem[0]?.id || '');
                            }
                          }}
                          title={`Delete ${tmpl.name}`}
                          aria-label={`Delete ${tmpl.name}`}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--muted)] hover:text-[var(--paused)] hover:bg-[var(--surface)] transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <div
                          className={cn(
                            'w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors',
                            isSelected
                              ? 'bg-[var(--selected)] text-white'
                              : 'border border-[var(--outline)] bg-[var(--surface)]'
                          )}
                        >
                          {isSelected && (
                            <Check className="w-3 h-3 stroke-[2.5]" />
                          )}
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
                  className="h-9 px-4 rounded-[24px] bg-[var(--chip)] border border-[var(--outline)] text-[var(--text-2)] text-[14px] font-medium hover:opacity-90 cursor-pointer"
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

      {/* =====================================================================
          SET POINT SIZE / ADD POINT DIALOG
          ===================================================================== */}
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
              className="relative w-[430px] max-w-[calc(100vw-32px)] max-h-[90dvh] overflow-y-auto rounded-[16px] bg-[var(--surface)] p-4 sm:p-6 z-10 flex flex-col gap-5 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3
                  id="client-point-dialog-title"
                  className="text-[16px] font-bold text-[var(--text)]"
                >
                  {pointModalData.mode === 'edit'
                    ? `Update ${pointModalData.name}`
                    : 'Add Measurement Point'}
                </h3>
                <button
                  type="button"
                  aria-label="Close point dialog"
                  onClick={() => {
                    setPointModalData(null);
                    setPointModalError('');
                  }}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
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
                  <div className="rounded-[10px] bg-[var(--card)] p-3 border border-[var(--hairline)] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.3px] text-[var(--muted)] block">
                        {pointModalData.zone}
                      </span>
                      <span className="text-[14px] font-semibold text-[var(--text)]">
                        {pointModalData.name}
                      </span>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-[var(--surface)] text-[11px] font-medium text-[var(--text-2)] border border-[var(--hairline)]">
                      Size Only
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <label className="block text-[11px] font-semibold text-[var(--text)]">
                      Select Sizing Measurement
                    </label>
                    <div className="flex flex-col gap-2.5 max-h-[210px] overflow-y-auto rounded-[10px] bg-[var(--card)] p-2.5 border border-[var(--hairline)]">
                      {hotspotsByZone.map((zone) => (
                        <div key={zone.id} className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold uppercase tracking-[0.3px] text-[var(--muted)]">
                            {zone.label}
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {zone.items.map((item) => {
                              const isSelected = pointModalData.key === item.key;
                              const isAlreadyActive = activePointKeys.includes(
                                item.key
                              );
                              return (
                                <button
                                  key={item.key}
                                  type="button"
                                  onClick={() => {
                                    setPointModalError('');
                                    const existingNum = measurements[item.key];
                                    const existing =
                                      existingNum !== undefined &&
                                      existingNum > 0
                                        ? String(existingNum)
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
                                      ? 'bg-[var(--chip)] border-[var(--outline)] text-[var(--text)]'
                                      : 'bg-[var(--surface)] border-[var(--hairline)] text-[var(--text-2)] hover:text-[var(--text)]'
                                  )}
                                >
                                  <span>{item.label}</span>
                                  {isSelected && (
                                    <Check className="w-3 h-3 stroke-[2.5]" />
                                  )}
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
                  <label className="block text-[11px] font-semibold text-[var(--text)] mb-1">
                    Measurement Size ({unitLabel.toUpperCase()})
                  </label>
                  <div className="w-full bg-[var(--card)] border border-[var(--hairline)] rounded-[8px] p-2 flex items-center">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={pointModalData.value}
                      placeholder="0.0"
                      onChange={(e) => {
                        setPointModalError('');
                        setPointModalData({
                          ...pointModalData,
                          value: e.target.value,
                        });
                      }}
                      autoFocus
                      className="w-full bg-transparent text-[14px] font-semibold text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none tabular-nums"
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
                    className="h-9 px-4 rounded-[24px] bg-[var(--chip)] border border-[var(--outline)] text-[var(--text-2)] text-[14px] font-medium hover:opacity-90 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="h-9 px-6 rounded-[24px] bg-[var(--primary)] text-white text-[14px] font-medium hover:opacity-95 transition-opacity cursor-pointer shadow-xs"
                  >
                    {pointModalData.mode === 'edit'
                      ? 'Update Size'
                      : 'Add Point'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Toast Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
