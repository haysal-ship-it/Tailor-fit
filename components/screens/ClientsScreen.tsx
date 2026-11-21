'use client';
import {workspaceLayout} from '@/components/workspace/layout';
import {WorkspaceActions,workspaceSecondaryAction} from '@/components/workspace/WorkspaceActions';
import {BackButton} from '@/components/ui/BackButton';
import {LegacyDialog} from '@/components/ui/LegacyDialog';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/lib/store';
import { OrderWorkspace } from '@/components/orders/OrderWorkspace';
import { ChoiceMenu } from '@/components/ui/ChoiceMenu';
import { ClientDetailsDialog } from '@/components/clients/ClientDetailsDialog';
import { ClientPickerDialog } from '@/components/clients/ClientPickerDialog';
import type { ClientDetailsTarget } from '@/lib/client-details';
import {
  Phone,
  AtSign,
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
  Ruler,
  Package,
  ArrowLeft,
} from 'lucide-react';
import { ToastContainer, type ToastMessage } from '@/components/ui/Toasts';
import { AnimatedNumberMorph } from '@/components/ui/AnimatedNumberMorph';
import { AnimatedFileUpload } from '@/components/ui/AnimatedFileUpload';
import {GarmentTemplateDialog} from '@/components/mannequin/GarmentTemplateDialog';
import { RotatableMannequin } from '@/components/mannequin/RotatableMannequin';
import {
  ANATOMICAL_ZONES,
  getZoneLabel,
  normalizeZoneId,
  resolveCanonicalKey,
  normalizeMeasurementsRecord,
  parseDueDateToISO,
} from '@/lib/initial-data';
import { formatPriceInput, parsePriceInput, formatDateInput } from '@/lib/smart-inputs';
import { springSmooth, springSnappy } from '@/lib/motion-tokens';
import { cn } from '@/lib/utils';
import { convertMeasurement } from '@/lib/units';
import { PencilSimple } from '@phosphor-icons/react';
import { getOrderStatusPresentation, formatDate } from '@/lib/status';
import { ContextualTip } from '@/components/onboarding/ContextualTip';

interface ClientsScreenProps {
  onReuseFitting?:(clientId:string,snapshotId:string)=>void;reuseSnapshotId?:string;
  orderId?:string;newOrder?:boolean;orderClientId?:string;onOrderBack?:()=>boolean;onOrderSaved?:(id:string,clientId:string)=>void;
  onOpenClient?: (clientId: string) => void;
  onNewMeasurement?: (clientId: string) => void;
  onNewOrder?: (clientId: string) => void;
  onEditOrder?: (orderId: string) => void;
  onBackToDirectory?: () => void;
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

export function ClientsScreen({
  onOpenClient,
  onReuseFitting,reuseSnapshotId,
  onNewMeasurement,
  onNewOrder,
  onEditOrder, orderId, newOrder, orderClientId, onOrderBack, onOrderSaved,
  onBackToDirectory,
}: ClientsScreenProps) {
  const {
    clients,
    orders,
    saveStatus,
    settings,
    allHotspots,
    selectedClientId,
    setSelectedClientId,
    saveIntake,
    addClient,
    updateClient,
    deleteClient,
    addSnapshot,
    updateSnapshot,
    addOrder,
    deleteTemplate,
    getClientSnapshots,
    getClientOrders,
    error: clientSaveError,
  } = useStore();

  const handleBackToDirectory = () => {
    setSelectedClientId(null);
    onBackToDirectory?.();
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (url.searchParams.has('client') || url.searchParams.has('order')) {
        url.searchParams.delete('client');
        url.searchParams.delete('order');
        window.history.replaceState({}, '', url.toString());
      }
    }
  };

  const showingOrder=!!(orderId||newOrder);
  const unitLabel = settings?.defaultUnit || 'cm';
  const currencySymbol = settings?.currency || '₦';

  // Primary 4-view state machine matching the 9 Figma frames
  const [viewState, setViewState] = useState<ClientsViewState>('SavedMeasurements_Default');
  useEffect(()=>{if(showingOrder)queueMicrotask(()=>setViewState('OrderHistory_Grid'));},[showingOrder,orderId]);

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

  // Separate client details and switching dialogs; other workspace modals.
  const [clientDialog, setClientDialog] = useState<ClientDetailsTarget | null>(null);
  const [isClientPickerOpen, setIsClientPickerOpen] = useState(false);
  const [directorySearch, setDirectorySearch] = useState('');

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Garment Template Modal
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
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
        if(document.querySelector('dialog[open]'))return;
        setIsOverflowMenuOpen(false);
        setIsSnapshotDropdownOpen(false);
        setIsNewOrderTemplateDropdownOpen(false);
        setPointModalData(null);
        setPointModalError('');
        setIsTemplateModalOpen(false);
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
          .filter(Boolean)
          .map((n) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase() || 'CL';
      const clientOrders = orders.filter((o) => o.clientId === c.id);
      const clientSnaps = getClientSnapshots(c.id);
      const latestSnap = clientSnaps[0];
      const latestOrder = clientOrders[0];

      const latestFittingGarment =
        latestSnap?.garmentType ||
        latestOrder?.garmentType ||
        'Bespoke Fitting';

      let latestFittingDate = '—';
      const rawDate = latestSnap?.date || latestOrder?.createdAt || c.createdAt;
      if (rawDate) {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) {
          const day = d.getDate();
          const month = d.getMonth() + 1;
          const yr = String(d.getFullYear()).slice(-2);
          latestFittingDate = `${day}/${month}/${yr}`;
        }
      }

      const bodyPointsCount = latestSnap
        ? Object.keys(normalizeMeasurementsRecord(latestSnap.measurements))
            .length
        : 0;

      return {
        id: c.id,
        initials,
        name: c.name,
        phone: c.phone || '',
        email: c.email || '',
        notes: c.notes || '',
        totalOrdersCount: clientOrders.length,
        latestFittingGarment,
        latestFittingDate,
        bodyPointsCount,
      };
    });
  }, [clients, orders, getClientSnapshots]);

  const activeClientId = orderClientId || selectedClientId || null;
  const selectedClientProfile = useMemo(() => {
    if (allClientList.length === 0 || !activeClientId) return null;
    return allClientList.find((c) => c.id === activeClientId) || null;
  }, [allClientList, activeClientId]);

  const filteredDirectoryClients = useMemo(() => {
    const q = directorySearch.trim().toLowerCase();
    if (!q) return allClientList;
    return allClientList.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.notes.toLowerCase().includes(q)
    );
  }, [allClientList, directorySearch]);

  // Client's saved snapshots from store
  const clientSnapshots = useMemo(() => {
    if (!selectedClientProfile) return [];
    return getClientSnapshots(selectedClientProfile.id);
  }, [getClientSnapshots, selectedClientProfile]);

  const [activeSnapshotId, setActiveSnapshotId] = useState<string>('');
  const [activePointKeys, setActivePointKeys] = useState<string[]>([]);
  const [measurements, setMeasurements] = useState<Record<string, number>>({});

  // Sync active snapshot & measurements when selected client changes
  useEffect(() => {
    if (!selectedClientProfile) {
      setActiveSnapshotId('');
      setSelectedTemplateName('');
      setSelectedTemplateId('');
      setActivePointKeys([]);
      setMeasurements({});
      return;
    }
    const snaps = getClientSnapshots(selectedClientProfile.id);
    if (snaps.length > 0) {
      const latest = snaps.find(snapshot=>snapshot.id===activeSnapshotId) || snaps[0];
      const normalized = normalizeMeasurementsRecord(latest.measurements);
      const keys = Object.keys(normalized);

      // Convert measurements if the snapshot's recorded unit differs from the active view unit (A02)
      let measurementsToUse = normalized;
      if (latest.unit && latest.unit !== unitLabel) {
        measurementsToUse = {};
        Object.entries(normalized).forEach(([k, val]) => {
          measurementsToUse[k] = convertMeasurement(val, latest.unit, unitLabel);
        });
      }

      setActiveSnapshotId(latest.id);
      setSelectedTemplateName(latest.garmentType || 'Bespoke fitting');
      setSelectedTemplateId('');
      setActivePointKeys(keys);
      setMeasurements(measurementsToUse);
    } else {
      setActiveSnapshotId('');
      setSelectedTemplateName('');
      setSelectedTemplateId('');
      setActivePointKeys([]);
      setMeasurements({});
    }
  }, [selectedClientProfile?.id, getClientSnapshots, activeSnapshotId, unitLabel]);

  const activeSnapshot = useMemo(() => {
    return clientSnapshots.find((s) => s.id === activeSnapshotId) || clientSnapshots[0];
  }, [clientSnapshots, activeSnapshotId]);

  // Persist measurement changes directly to store snapshot (unless in Inline_NewOrder)
  const persistMeasurementsToStore = async (
    nextKeys: string[],
    nextMeasurements: Record<string, number>,
    garmentLabel?: string
  ) => {
    if (viewState === 'Inline_NewOrder') return true;
    if (!selectedClientProfile) return false;

    const filteredObj: Record<string, number> = {};
    nextKeys.forEach((k) => {
      if (nextMeasurements[k] !== undefined && !isNaN(nextMeasurements[k])) {
        filteredObj[k] = nextMeasurements[k];
      } else {
        filteredObj[k] = 0;
      }
    });

    if (activeSnapshotId) {
      return await updateSnapshot(activeSnapshotId, {
        measurements: filteredObj,
        unit: unitLabel,
        ...(garmentLabel ? { garmentType: garmentLabel } : {}),
      });
    } else {
      const created = await addSnapshot({
        clientId: selectedClientProfile.id,
        date: new Date().toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }),
        unit: unitLabel,
        garmentType: garmentLabel || selectedTemplateName || 'Bespoke fitting',
        measurements: filteredObj,
      });
      if(!created)return false;
      setActiveSnapshotId(created.id);
      return true;
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
    setMeasurements(found.unit!==unitLabel?Object.fromEntries(Object.entries(normalized).map(([key,value])=>[key,convertMeasurement(value,found.unit,unitLabel)])):normalized);
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

  const handleSavePointModal = async () => {
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

    if(!await persistMeasurementsToStore(nextKeys,nextMeasurements)){setPointModalError('Measurement was not saved. Check your connection and retry.');return;}
    setActivePointKeys(nextKeys);
    setMeasurements(nextMeasurements);

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
    if (!selectedClientProfile) return [];
    const clientOrders = getClientOrders(selectedClientProfile.id);
    return clientOrders.map((ord) => {
      const createdDateStr = ord.createdAt ? formatDate(ord.createdAt, '-') : '';
      const dateStr = createdDateStr ? `Order created ${createdDateStr}` : 'Order created';

      const statusPres = getOrderStatusPresentation(ord.status, ord.pickupDateTime);
      const badge = statusPres.badgeLabel;
      const badgeColor = statusPres.badgeColor;

      const imgs =
        ord.referenceImages && ord.referenceImages.length > 0
          ? ord.referenceImages.map((r) => r.url)
          : [];

      return {
        id: ord.id,
        title: ord.garmentType || 'Gown/ Dress',
        badge,
        badgeColor,
        date: dateStr,
        price: ord.price ?? 0,
        currency: ord.currency || currencySymbol,
        images: imgs,
      };
    });
  }, [getClientOrders, selectedClientProfile?.id, currencySymbol]);

  const handleOpenCreateClient = () => {
    setIsOverflowMenuOpen(false);
    setClientDialog({ kind: 'create' });
  };
  const handleOpenEditClient = (clientId?: string) => {
    const client = clientId ? clients.find(c => c.id === clientId) : selectedClientProfile;
    if (!client) return;
    setIsOverflowMenuOpen(false);
    setClientDialog({ kind: 'edit', client: { id: client.id, name: client.name, phone: client.phone || '', email: client.email || '', notes: client.notes || '' } });
  };
  const handleOpenClientPicker = () => {
    setIsOverflowMenuOpen(false);
    setIsClientPickerOpen(true);
  };
  const handleClientSaved = (result: { id: string; name: string; created: boolean }) => {
    setClientDialog(null);
    if (result.created) {
      setSelectedClientId(result.id);
      setViewState('SavedMeasurements_Default');
      onOpenClient?.(result.id);
      requestAnimationFrame(() => document.querySelector<HTMLElement>('[data-client-profile-heading]')?.focus());
    }
    showToast({ type: 'success', title: result.created ? 'Client added' : 'Client updated',
      message: result.created ? `${result.name} is ready. Add measurements or an order when you're ready.` : `${result.name}'s details have been updated.`, duration: 4000 });
  };

  const workspaceBusy=saveStatus==='saving';
  const handleConfirmDeleteClient = async () => {
    if (!selectedClientProfile || workspaceBusy) return;
    const name = selectedClientProfile.name;
    if(!await deleteClient(selectedClientProfile.id))return;
    setIsDeleteConfirmOpen(false);
    handleBackToDirectory();
    showToast({
      type: 'success',
      title: 'Client Deleted',
      message: `${name} was removed from your client records.`,
      duration: 3000,
    });
  };

  // Create Order from Use Measurement Flow (Desktop Frame 3 / Mobile Frame 1)
  const handleCreateOrderFromUseFlow = async () => {
    if (!selectedClientProfile) return;
    const parsedPrice = parsePriceInput(useFlowPrice);
    const refImgs =
      useFlowImages.length > 0
        ? useFlowImages.map((url, idx) => ({
            id: `img-${Date.now()}-${idx}`,
            url,
            title: `Style Reference ${idx + 1}`,
          }))
        : [];

    const savedOrder=await addOrder({
      clientId: selectedClientProfile.id,
      garmentType: activeSnapshot?.garmentType || 'Gown/ Dress',
      measurementSnapshotId: activeSnapshot?.id,
      referenceImages: refImgs,
      price: parsedPrice,
      notes: useFlowNotes.trim() || 'Custom atelier order created from saved measurements.',
      status: 'In Progress',
      pickupDateTime: parseDueDateToISO(useFlowDueDate),
    });

    if(!savedOrder)return;
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
  const inlineRequest=useRef('');
  const handleSaveInlineNewOrder = async () => {
    const typedName=newOrderClientName.trim();
    const selected=selectedClientProfile && (!typedName||typedName===selectedClientProfile.name)?selectedClientProfile:undefined;
    const parsedPrice = parsePriceInput(newOrderPrice);
    const refImgs =
      newOrderImages.length > 0
        ? newOrderImages.map((url, idx) => ({
            id: `img-${Date.now()}-${idx}`,
            url,
            title: `Style Reference ${idx + 1}`,
          }))
        : [];

    const filteredMeasurements: Record<string, number> = {};
    activePointKeys.forEach((k) => {
      if (measurements[k] !== undefined && !isNaN(measurements[k])) {
        filteredMeasurements[k] = measurements[k];
      } else {
        filteredMeasurements[k] = 0;
      }
    });

    const saved=await saveIntake({
      requestId:inlineRequest.current||(inlineRequest.current=crypto.randomUUID()),
      client:selected||{name:typedName||'New Client',phone:newOrderPhone.trim(),email:newOrderEmail.trim(),notes:newOrderNotes.trim()},
      snapshot:{date:new Date().toISOString().slice(0,10),unit:unitLabel,garmentType:newOrderGarmentType.trim()||selectedTemplateName||'Gown/ Dress',measurements:filteredMeasurements,notes:newOrderNotes.trim()},
      order:{garmentType:newOrderGarmentType.trim()||'Gown/ Dress',referenceImages:refImgs,price:parsedPrice,notes:newOrderNotes.trim(),status:'In Progress',pickupDateTime:parseDueDateToISO(newOrderDueDate)}
    });
    if(!saved)return;
    inlineRequest.current='';setSelectedClientId(saved.clientId);setActiveSnapshotId(saved.snapshotId||'');

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
    <div className={workspaceLayout.shell}>
      {/* Accessible Landmark Heading (A11, A16) */}
      <h1 className="sr-only">Client Management &amp; Measurements Atelier</h1>
      {Boolean(orderId) || newOrder || (!selectedClientProfile && showingOrder) ? (<OrderWorkspace key={orderId || `new:${orderClientId || 'generic'}:${reuseSnapshotId || ''}`} orderId={orderId} clientId={orderClientId} reuseSnapshotId={reuseSnapshotId} onBack={()=>onOrderBack?.()} onSaved={(id,cid)=>onOrderSaved?.(id,cid)} onEditClient={id=>handleOpenEditClient(id)}/>) : !selectedClientProfile && allClientList.length === 0 ? (
        <section className="w-full rounded-[8px] bg-[var(--surface)] p-[2px]">
          <header className="flex flex-col gap-2 p-6">
            <h2 className="text-[16px] font-semibold text-[var(--text)]">Client Directory</h2>
            <p className="text-[12px] leading-normal text-[var(--text-2)]">Versioned anatomical measurements across customer visits.</p>
          </header>
          <div className="flex min-h-[502px] items-center rounded-[6px] bg-[var(--card)] p-4 lg:p-6">
            <div className="flex w-full flex-col items-center justify-center gap-3 rounded-[8px] border border-[var(--outline)] bg-[var(--surface)] p-8 text-center sm:p-12">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--chip)] text-[var(--text-2)]"><Users className="h-6 w-6" aria-hidden="true"/></div>
              <div>
                <h3 className="text-[15px] font-semibold text-[var(--text)]">No clients yet</h3>
                <p className="mt-1.5 max-w-sm text-[12px] leading-relaxed text-[var(--muted)]">Add a client to keep their contact details, measurements and orders together.</p>
              </div>
              <div className="mt-2 w-full sm:w-auto"><WorkspaceActions firstClient onAddClient={handleOpenCreateClient} onNewOrder={()=>onNewOrder?.('')}/></div>
            </div>
          </div>
        </section>
      ) : !selectedClientProfile ? (
        /* ===================================================================
           CLIENT DIRECTORY VIEW (Figma Redesign: Desktop 664:2188 & Mobile 664:2080)
           =================================================================== */
        <div className="w-full bg-white rounded-[8px] p-[2px] flex flex-col gap-[2px]">
          {/* Header Bar */}
          <div className="w-full px-4 py-4 sm:px-6 flex flex-col lg:flex-row items-start justify-between gap-[16px]">
            <div className="flex flex-col gap-[4px] lg:gap-[8px] items-start">
              <h2 className="text-[16px] font-semibold text-black leading-normal">
                Client Directory
              </h2>
              <p className="text-[12px] font-normal text-[#595959] leading-normal">
                Versioned anatomical measurements across customer visits.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-[8px] w-full lg:w-auto shrink-0">
              {/* Search Pill */}
              <div className="bg-[#f1f1f1] border border-transparent border-solid rounded-[32px] px-[12px] lg:px-[10px] py-[8px] flex items-center gap-[8px] w-full lg:w-[350px] transition-colors focus-within:border-[#CCCCCC]">
                <Search className="size-[16px] text-[#a3a3a3] shrink-0" />
                <input
                  type="text"
                  value={directorySearch}
                  onChange={(e) => setDirectorySearch(e.target.value)}
                  placeholder="Search clients by name, phone number, email..."
                  className="w-full bg-transparent border-0 p-0 text-[11px] sm:text-[12px] font-normal text-black placeholder:text-[#a3a3a3] focus:outline-none focus:ring-0 leading-normal"
                />
                {directorySearch && (
                  <button
                    type="button"
                    onClick={() => setDirectorySearch('')}
                    className="text-[#a3a3a3] hover:text-black transition-colors cursor-pointer shrink-0"
                    title="Clear search"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              <WorkspaceActions onAddClient={handleOpenCreateClient} onNewOrder={()=>onNewOrder?.('')}/>
            </div>
          </div>

          {/* Clients Cards Grid Container */}
          <div className="w-full bg-[#f8f8f8] rounded-[6px] p-3 min-h-[502px]">
            {filteredDirectoryClients.length === 0 ? (
              <div className="py-16 text-center flex flex-col items-center justify-center gap-2">
                <p className="text-[14px] text-[#595959]">
                  No clients match &ldquo;{directorySearch}&rdquo;
                </p>
                <button
                  type="button"
                  onClick={() => setDirectorySearch('')}
                  className="text-[13px] text-[#1d49e8] font-medium hover:underline cursor-pointer"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[16px] items-start w-full">
                {filteredDirectoryClients.map((client, index) => (
                  <div
                    key={client.id}
                    onClick={() => {setSelectedClientId(client.id);onOpenClient?.(client.id);}}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedClientId(client.id);onOpenClient?.(client.id);
                      }
                    }}
                    className="bg-white rounded-[24px] p-[16px] flex flex-col gap-[16px] justify-center w-full cursor-pointer text-left transition-shadow hover:shadow-sm"
                  >
                    <div className="flex flex-col gap-[16px] items-start w-full">
                      {/* Identity Row */}
                      <div className="flex items-center gap-[8px] w-full">
                        <div
                          className={cn(
                            'rounded-[100px] size-[32px] p-[8px] flex items-center justify-center shrink-0',
                            index % 4 === 3 ? 'bg-black' : 'bg-[#595959]'
                          )}
                        >
                          <span className="text-[12px] font-bold text-white leading-normal whitespace-nowrap">
                            {client.initials}
                          </span>
                        </div>

                        <div className="flex flex-col gap-[2px] items-start justify-center min-w-0 flex-1">
                          <p className="text-[14px] font-semibold text-black leading-normal truncate w-full">
                            {client.name}
                          </p>
                          <div className="flex items-center gap-[4px]">
                            <Phone className="size-[14px] text-[#595959] fill-current shrink-0" />
                            <span className="text-[10px] font-normal text-black leading-normal whitespace-nowrap tabular-nums">
                              {client.phone || 'No phone number'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Fitting Summary Box */}
                      <div className="bg-[#f8f8f8] rounded-[8px] p-[8px] flex flex-col gap-[16px] items-start text-[10px] leading-normal w-full">
                        <div className="flex items-center justify-between gap-[16px] w-full">
                          <span className="font-normal text-[#4f4f4f] whitespace-nowrap shrink-0">
                            Latest Fitting:
                          </span>
                          <span className="font-semibold text-black text-right truncate flex-1">
                            {client.latestFittingGarment}
                          </span>
                        </div>

                        <div className="flex items-center justify-between font-normal text-[#4f4f4f] w-full whitespace-nowrap tabular-nums">
                          <span>{client.latestFittingDate}</span>
                          <span>{client.bodyPointsCount} body points</span>
                        </div>
                      </div>
                    </div>

                    {/* View Profile Button */}
                    <div className="bg-[#f2f2f2] hover:bg-[#eaeaea] border border-[#dddbdb] border-solid rounded-[24px] p-[8px] flex items-center justify-center w-full transition-colors">
                      <span className="text-[14px] font-medium text-[#595959] leading-normal whitespace-nowrap">
                        View Profile
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
      /* =====================================================================
          OUTER SHELL CONTAINER (2px white frame, rounded-[8px], gap-[2px])
          ===================================================================== */
      <div className="w-full bg-[var(--surface)] p-[2px] rounded-[8px] flex flex-col gap-[2px]">
        {/* ===================================================================
            TOP CLIENT HEADER BAR (Present in all 9 Figma frames)
            =================================================================== */}
        <div className="w-full bg-[var(--surface)] rounded-[6px] px-4 sm:px-6 py-4 flex flex-col gap-4 relative">
          <BackButton
            type="button"
            onClick={handleBackToDirectory}

            title="Back to client directory"
          />

          <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Left Identity Cluster */}
            <div
              id="clients-roster"
              className="flex items-center gap-3.5 sm:gap-4 min-w-0"
            >
              {/* 64px Dark Charcoal Initials Circle (#595959) */}
              <button
                type="button"
                onClick={() => handleOpenClientPicker()}
                title="Switch client"
                aria-label={`Switch client (${selectedClientProfile.name})`}
                className="w-[56px] h-[56px] sm:w-[64px] sm:h-[64px] rounded-full bg-[var(--text-2)] flex items-center justify-center text-white text-[15px] sm:text-[16px] font-semibold shrink-0 cursor-pointer hover:opacity-95 transition-opacity"
              >
                {selectedClientProfile.initials}
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <h2 tabIndex={-1} data-client-profile-heading className="min-w-0 text-[17px] font-semibold leading-tight text-[var(--text)] focus:outline-none sm:text-[18px]">{selectedClientProfile.name}</h2>
                  <button type="button" onClick={handleOpenClientPicker} className="min-h-11 rounded-md px-2 text-xs font-medium text-[var(--primary)] hover:bg-[var(--chip)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]">Switch client</button>
                </div>

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
            <div className="flex items-center gap-2.5 w-full sm:w-auto relative">
              <button
                type="button"
                onClick={() => {
                  setIsOverflowMenuOpen(false);
                  onNewOrder?.(selectedClientProfile.id);
                }}
                className={workspaceSecondaryAction+" w-full sm:w-auto"}
              >
                <Plus size={16} aria-hidden="true"/>New order
              </button>

              <ChoiceMenu kind="menu" iconOnly placeholder="Client profile actions" options={[{"value":"0","label":"Edit client","destructive":false},{"value":"1","label":"Delete client","destructive":true}]} onChoose={value=>{const actions:Record<string,()=>void|Promise<void>>={"0":() => {
                        setIsOverflowMenuOpen(false);
                        handleOpenEditClient();
                      },"1":() => {
                        setIsOverflowMenuOpen(false);
                        setIsDeleteConfirmOpen(true);
                      }};void actions[value]?.();}}/>
            </div>
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
              <ContextualTip id="reuse-fitting" variant="inline" className="mb-1" />

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
                  onClick={() => {if(showingOrder&&onOrderBack?.()===false)return;setViewState('SavedMeasurements_Default');}}
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
                  onClick={() => {if(showingOrder&&onOrderBack?.()===false)return;setViewState('OrderHistory_Grid');}}
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
              {!showingOrder && viewState === 'SavedMeasurements_Default' && (
                <div className="flex flex-col gap-4 pt-1">
                  {/* Snapshot Selector Pill + Metadata Header + Use Measurement CTA */}
                  <div
                    ref={snapshotDropdownRef}
                    className="flex flex-col gap-3 relative"
                  >
                    <ChoiceMenu className="w-[300px] max-w-full" label="Saved fitting" placeholder="No saved measurements" disabled={!clientSnapshots.length} value={activeSnapshot?.id||''} options={clientSnapshots.map(s=>({value:s.id,label:`${s.garmentType} · ${s.date}`}))} onChoose={handleSelectSnapshot}/>

                    {/* Snapshot Title + Subtitle + CTA Pill Button */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative">
                      <div>
                        <h2 className="text-[14px] font-semibold text-[var(--text)] leading-snug">
                          {clientSnapshots.length > 0 && activeSnapshot
                            ? `${activeSnapshot.garmentType}.`
                            : 'No Saved Measurements'}
                        </h2>
                        <p className="text-[11px] text-[var(--muted)] mt-0.5">
                          {clientSnapshots.length > 0
                            ? `${activePointKeys.length} ${
                                activePointKeys.length === 1 ? 'point' : 'points'
                              } • ${
                                mannequinGender === 'female' ? 'Female' : 'Male'
                              } • Recorded on ${activeSnapshot?.date || ''}`
                            : `No measurement snapshots recorded for ${selectedClientProfile.name} yet.`}
                        </p>


                      </div>

                      {clientSnapshots.length > 0 ? (
                        <button
                          type="button"
                          id="clients-use-measurement-btn"
                          onClick={() => {
                            setIsSnapshotDropdownOpen(false);
                            if(activeSnapshot)onReuseFitting?.(selectedClientProfile.id,activeSnapshot.id);
                          }}
                          className="w-full sm:w-auto h-9 px-4 rounded-[24px] bg-[var(--chip)] border border-[var(--outline)] text-[12px] font-medium text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[#E8E8E8] transition-colors flex items-center justify-center cursor-pointer shrink-0"
                        >
                          Create order from these measurements
                        </button>
                      ) : (
                        <button
                          type="button"
                          id="clients-use-measurement-btn"
                          onClick={() => {
                            setViewState('SavedMeasurements_Default');handleOpenAddPoint();
                          }}
                          className="w-full sm:w-auto h-9 px-4 rounded-[24px] bg-[var(--primary)] text-white text-[12px] font-semibold hover:bg-[var(--primary)]/90 transition-colors flex items-center gap-1.5 justify-center cursor-pointer shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Take Measurements</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 2-Column Split: Left 3D Mannequin + Right 3-Column (Desktop) / 2-Column (Mobile) Measurement Cards */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pt-2">
                    {/* Left Mannequin on #F8F8F8 canvas */}
                    <div className="lg:col-span-5 flex items-center justify-center">
                      <RotatableMannequin
                        gender={mannequinGender}
                        onGenderChange={setMannequinGender}
                        showControls={true}
                        showGenderToggle={true}
                        compact={false}
                        measurements={measurements}
                        activePointKeys={activePointKeys}
                        selectedPointKey={pointModalData?.key || null}
                        unit={unitLabel}
                        onSelectPoint={handleOpenPoint}
                      />
                    </div>

                    {/* Right Measurement Cards Grid OR Empty State */}
                    <div className="lg:col-span-7">
                      {clientSnapshots.length === 0 ? (
                        <div className="w-full bg-[var(--surface)] rounded-[12px] p-8 sm:p-12 border border-[var(--outline)] flex flex-col items-center justify-center text-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-[var(--chip)] flex items-center justify-center text-[var(--text-2)]">
                            <Ruler className="w-6 h-6 text-[var(--text-strong)]" />
                          </div>
                          <div>
                            <h3 className="text-[15px] font-semibold text-[var(--text)]">
                              No Saved Measurements
                            </h3>
                            <p className="text-[12px] text-[var(--muted)] max-w-sm mt-1.5 leading-relaxed">
                              No anatomical measurements have been recorded for {selectedClientProfile.name} yet. Use the 3D mannequin here to record their first fitting.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setViewState('SavedMeasurements_Default');handleOpenAddPoint();
                            }}
                            className="mt-2 h-9 px-5 rounded-[24px] bg-[var(--primary)] text-white text-[12px] font-medium hover:bg-[var(--primary)]/90 transition-colors cursor-pointer flex items-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Capture Measurements</span>
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
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

                              <div className="w-full h-9 rounded-[8px] bg-[#F8F8F8] px-3 flex items-center border border-transparent focus-within:border-[#CCCCCC] transition-colors">
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  aria-label={`${field.name} (${field.unit})`}
                                  value={field.value}
                                  onChange={(e) =>
                                    handleFieldValueChange(field.id, e.target.value)
                                  }
                                  placeholder="0.0"
                                  className="w-full bg-transparent border-0 text-[12px] font-medium text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-0 tabular-nums"
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
                  VIEW STATE 2: `SavedMeasurements_UseFlow`
                  (Desktop Frame 3, Mobile Frame 1)
                  ============================================================= */}
              {!showingOrder && viewState === 'SavedMeasurements_UseFlow' && (
                <div className="flex flex-col gap-3.5 pt-0.5">
                  {/* Back Link */}
                  <BackButton onClick={()=>{if(showingOrder&&onOrderBack?.()===false)return;setViewState('SavedMeasurements_Default');}}/>

                  <ChoiceMenu className="w-[300px] max-w-full" label="Saved fitting" placeholder="No saved measurements" value={activeSnapshot?.id||''} options={clientSnapshots.map(s=>({value:s.id,label:`${s.garmentType} · ${s.date}`}))} onChoose={handleSelectSnapshot}/>

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
                            {selectedClientProfile.phone || '—'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[var(--muted)]">Email Address</span>
                          <span className="font-medium text-[var(--text)]">
                            {selectedClientProfile.email || '—'}
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
                            onChange={(e) => setUseFlowPrice(formatPriceInput(e.target.value))}
                            placeholder={`${currencySymbol}0.00`}
                            className="w-full h-9 rounded-[8px] bg-[#F8F8F8] px-3 text-[12px] text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none border border-transparent focus:border-[#CCCCCC] tabular-nums transition-colors"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-medium text-[var(--text)] mb-1 block">
                            Due Date
                          </label>
                          <input
                            type="text"
                            value={useFlowDueDate}
                            onChange={(e) => setUseFlowDueDate(formatDateInput(e.target.value, useFlowDueDate))}
                            placeholder="09/10/2026"
                            className="w-full h-9 rounded-[8px] bg-[#F8F8F8] px-3 text-[12px] text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none border border-transparent focus:border-[#CCCCCC] tabular-nums transition-colors"
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
                          className="w-full min-h-[100px] rounded-[8px] bg-[#F8F8F8] p-3 text-[12px] text-[var(--text)] placeholder:text-[var(--muted)] resize-none focus:outline-none border border-transparent focus:border-[#CCCCCC] transition-colors"
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
                            showControls={true}
                            showGenderToggle={true}
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
                              <div className="w-full h-9 rounded-[8px] bg-[#F8F8F8] border border-transparent focus-within:border-[#CCCCCC] px-3 flex items-center transition-colors">
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
                                  className="w-full bg-transparent border-0 text-[12px] font-medium text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-0 tabular-nums"
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
              {showingOrder&&<OrderWorkspace key={orderId||`new:${orderClientId||'choose'}`} orderId={orderId} clientId={orderClientId} onBack={()=>onOrderBack?.()} onSaved={(id,cid)=>onOrderSaved?.(id,cid)} onEditClient={id=>handleOpenEditClient(id)}/>}
              {!showingOrder && viewState === 'OrderHistory_Grid' && (
                <div className="pt-1">
                  {orderHistoryCards.length === 0 ? (
                    <div className="w-full bg-[var(--surface)] rounded-[12px] p-10 sm:p-14 border border-[var(--outline)] flex flex-col items-center justify-center text-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-[var(--chip)] flex items-center justify-center text-[var(--text-2)]">
                        <Package className="w-6 h-6 text-[var(--text-strong)]" />
                      </div>
                      <div>
                        <h3 className="text-[15px] font-semibold text-[var(--text)]">
                          No Garment Orders Yet
                        </h3>
                        <p className="text-[12px] text-[var(--muted)] max-w-sm mt-1.5 leading-relaxed">
                          There are no orders recorded for {selectedClientProfile.name}. Create an order to track garment specifications, pricing, fabric swatches, and pickup schedules.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (onNewOrder) {
                            onNewOrder(selectedClientProfile.id);
                          }
                        }}
                        className="mt-2 h-9 px-5 rounded-[24px] bg-[var(--primary)] text-white text-[12px] font-medium hover:bg-[var(--primary)]/90 transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create First Order</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {orderHistoryCards.map((card) => (
                        <div
                          key={card.id}
                          role="button"
                          tabIndex={0}
                          aria-label={`Order: ${card.title}, status ${card.badge}`}
                          onClick={() => {
                            if (onEditOrder) onEditOrder(card.id);
                          }}
                          onKeyDown={(e) => {
                            if ((e.key === 'Enter' || e.key === ' ') && onEditOrder) {
                              e.preventDefault();
                              onEditOrder(card.id);
                            }
                          }}
                          className={cn(
                            'bg-[var(--surface)] rounded-[8px] p-[2px] flex flex-col gap-[2px] border border-transparent hover:border-[var(--selected)] focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:outline-none transition-all text-left select-none',
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
                            {card.images.length > 0 ? (
                              <div className="grid grid-cols-3 gap-1">
                                {card.images.map((img, idx) => (
                                  <img
                                    key={idx}
                                    src={img}
                                    alt="Style reference"
                                    className="w-full h-[64px] rounded-[4px] object-cover bg-neutral-800"
                                  />
                                ))}
                              </div>
                            ) : (
                              <div className="h-[64px] rounded-[4px] bg-white/5 border border-white/10 flex items-center justify-center text-[11px] text-white/50">
                                No reference photos
                              </div>
                            )}
                          </div>

                          {/* Bottom Price Row */}
                          <div className="bg-[var(--surface)] rounded-b-[6px] px-2.5 py-2 flex items-center justify-between">
                            <span className="text-[11px] text-[var(--price-label)]">
                              Price
                            </span>
                            <span className="text-[14px] font-bold text-[var(--text)] tabular-nums">
                              <AnimatedNumberMorph
                                value={card.price}
                                prefix={card.currency || currencySymbol}
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
            {!showingOrder && viewState === 'SavedMeasurements_UseFlow' && (
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
                <div className="flex flex-col gap-2 px-0.5">
                  <BackButton onClick={()=>{if(showingOrder&&onOrderBack?.()===false)return;setViewState('SavedMeasurements_Default');}}/>
                  <h2 className="text-[14px] sm:text-[15px] font-bold text-[var(--text)]">
                    New Order
                  </h2>
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
                          className="w-full h-10 rounded-[8px] bg-[#F8F8F8] border border-transparent px-3 text-[13px] font-medium text-[#1D1D1D] placeholder:text-[#8E8E8E] focus:outline-none focus:border-[#CCCCCC] transition-colors"
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
                          className="w-full h-10 rounded-[8px] bg-[#F8F8F8] border border-transparent px-3 text-[13px] font-medium text-[#1D1D1D] placeholder:text-[#8E8E8E] focus:outline-none focus:border-[#CCCCCC] transition-colors"
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
                          className="w-full h-10 rounded-[8px] bg-[#F8F8F8] border border-transparent px-3 text-[13px] font-medium text-[#1D1D1D] placeholder:text-[#8E8E8E] focus:outline-none focus:border-[#CCCCCC] transition-colors tabular-nums"
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
                          className="w-full h-10 rounded-[8px] bg-[#F8F8F8] border border-transparent px-3 text-[13px] font-medium text-[#1D1D1D] placeholder:text-[#8E8E8E] focus:outline-none focus:border-[#CCCCCC] transition-colors"
                        />
                      </div>
                    </div>

                    {/* Saved Measurements Selector */}
                    <ChoiceMenu className="mt-2 w-full" label="Saved Measurements" placeholder="Choose saved fitting" value={activeSnapshot?.id||''} options={clientSnapshots.map(snap=>({value:snap.id,label:snap.garmentType+' · '+snap.date}))} onChoose={id=>{const snap=clientSnapshots.find(s=>s.id===id);if(!snap)return;(() => {
                                  handleSelectSnapshot(snap.id);
                                  setNewOrderSavedTemplateLabel(
                                    `${snap.garmentType}. ${snap.date}`
                                  );
                                  if (!newOrderGarmentType) {
                                    setNewOrderGarmentType(snap.garmentType);
                                  }
                                  setIsNewOrderTemplateDropdownOpen(false);
                                })();}}/>
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
                          onChange={(e) => setNewOrderPrice(formatPriceInput(e.target.value))}
                          placeholder={`${currencySymbol}0.00`}
                          className="w-full h-10 rounded-[8px] bg-[#F8F8F8] border border-transparent px-3 text-[13px] font-medium text-[#1D1D1D] placeholder:text-[#8E8E8E] focus:outline-none focus:border-[#CCCCCC] transition-colors tabular-nums"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-medium text-[var(--text)] mb-1 block">
                          Due Date
                        </label>
                        <input
                          type="text"
                          value={newOrderDueDate}
                          onChange={(e) => setNewOrderDueDate(formatDateInput(e.target.value, newOrderDueDate))}
                          placeholder="09/10/2026"
                          className="w-full h-10 rounded-[8px] bg-[#F8F8F8] border border-transparent px-3 text-[13px] font-medium text-[#1D1D1D] placeholder:text-[#8E8E8E] focus:outline-none focus:border-[#CCCCCC] transition-colors tabular-nums"
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
                      className="w-full min-h-[96px] rounded-[8px] bg-[#F8F8F8] border border-transparent p-3 text-[13px] font-medium text-[#1D1D1D] placeholder:text-[#8E8E8E] resize-none focus:outline-none focus:border-[#CCCCCC] transition-colors"
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
                      showControls={true}
                      showGenderToggle={true}
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
                        <div className="w-full h-10 rounded-[8px] bg-[#F8F8F8] border border-transparent px-3 flex items-center transition-colors focus-within:border-[#CCCCCC]">
                          <input
                            type="text"
                            inputMode="decimal"
                            aria-label={`${field.name} (${field.unit})`}
                            value={field.value}
                            onChange={(e) =>
                              handleFieldValueChange(field.id, e.target.value)
                            }
                            placeholder="0.0"
                            className="w-full bg-transparent border-0 p-0 text-[13px] font-medium text-[#1D1D1D] placeholder:text-[#8E8E8E] focus:outline-none focus:ring-0 tabular-nums"
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

      {clientDialog && <ClientDetailsDialog
        key={clientDialog.kind === 'create' ? 'create-client' : 'edit-client:' + clientDialog.client.id}
        target={clientDialog} onCreate={addClient} onUpdate={updateClient}
        persistenceError={clientSaveError} onSaved={handleClientSaved} onClose={() => setClientDialog(null)}
      />}
      {isClientPickerOpen && <ClientPickerDialog clients={allClientList} selectedClientId={selectedClientProfile?.id || null}
        onClose={() => setIsClientPickerOpen(false)} onSelect={id => {
          setIsClientPickerOpen(false); setSelectedClientId(id); setViewState('SavedMeasurements_Default'); onOpenClient?.(id);
        }}
      />}

      {/* =====================================================================
          DELETE CLIENT CONFIRMATION DIALOG
          ===================================================================== */}
      <AnimatePresence>
        {isDeleteConfirmOpen && (
          <LegacyDialog busy={workspaceBusy} label="Delete client" onClose={()=>setIsDeleteConfirmOpen(false)}><motion.div className="relative w-full max-w-sm rounded-[16px] bg-[var(--surface)] p-6 shadow-2xl z-10 flex flex-col gap-4"
            >
              <h3 className="text-[16px] font-bold text-[var(--text)]">
                Delete {selectedClientProfile?.name || 'Client'}?
              </h3>
              <p className="text-[12px] text-[var(--text-2)] leading-relaxed">
                This will remove {selectedClientProfile?.name || 'this client'}&apos;s profile,
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
          </LegacyDialog>
        )}
      </AnimatePresence>

      {/* =====================================================================
          GARMENT TEMPLATES MODAL
          ===================================================================== */}
      <AnimatePresence>
        {isTemplateModalOpen && (
          <GarmentTemplateDialog templates={storeTemplates} initialId={selectedTemplateId || ''}
            onSelect={applyTemplateById} onClose={() => setIsTemplateModalOpen(false)} />
        )}
      </AnimatePresence>

      {/* =====================================================================
          SET POINT SIZE / ADD POINT DIALOG
          ===================================================================== */}
      <AnimatePresence>
        {pointModalData && (
          <LegacyDialog label="Measurement size" onClose={()=>setPointModalData(null)}><motion.div className="relative w-[430px] max-w-[calc(100vw-32px)] max-h-[90dvh] overflow-y-auto rounded-[16px] bg-[var(--surface)] p-4 sm:p-6 z-10 flex flex-col gap-5 shadow-2xl"
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
                  <div className="w-full h-11 bg-[#F8F8F8] border border-transparent rounded-[8px] px-3 flex items-center transition-colors focus-within:border-[#CCCCCC]">
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
                      className="w-full bg-transparent border-0 p-0 text-[14px] font-medium text-[#1D1D1D] placeholder:text-[#8E8E8E] focus:outline-none focus:ring-0 tabular-nums"
                    />
                    <span className="pl-2 text-[12px] font-semibold text-[#727272] select-none shrink-0 uppercase">
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
          </LegacyDialog>
        )}
      </AnimatePresence>

      {/* Global Toast Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
