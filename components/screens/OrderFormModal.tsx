'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useStore } from '@/lib/store';
import { ReferenceImage, OrderStatus } from '@/types';
import {
  Save,
  CloudUpload,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronLeft,
  User,
  ClipboardList,
  X,
  Check,
  Loader2,
} from 'lucide-react';
import { springSmooth } from '@/lib/motion-tokens';
import { RotatableMannequin } from '@/components/mannequin/RotatableMannequin';
import {
  ANATOMICAL_ZONES,
  getZoneLabel,
  normalizeZoneId,
  resolveCanonicalKey,
  normalizeMeasurementsRecord,
  parseDueDateToISO,
  formatISOToDMY,
} from '@/lib/initial-data';
import { cn } from '@/lib/utils';

interface OrderFormModalProps {
  orderId?: string | null;
  initialClientId?: string | null;
  onClose: () => void;
}

let refImgSeq = 0;

interface MeasurementFieldItem {
  id: string;
  name: string;
  zone: string;
  value: string;
  unit: string;
}

export function OrderFormModal({ orderId, initialClientId, onClose }: OrderFormModalProps) {
  const {
    clients,
    orders,
    settings,
    allHotspots,
    addClient,
    addOrder,
    updateOrder,
    addSnapshot,
    updateSnapshot,
    getClientSnapshots,
    getSnapshotById,
  } = useStore();
  const shouldReduceMotion = useReducedMotion();

  const unitLabel = settings?.defaultUnit || 'cm';
  const currencySymbol = settings?.currency || '₦';

  const existingOrder = orderId ? orders.find((o) => o.id === orderId) : null;

  // Map canonical key -> hotspot metadata
  const hotspotMap = useMemo(() => {
    const map: Record<
      string,
      { key: string; label: string; zone: string; defaultValCm: number }
    > = {};
    allHotspots.forEach((h) => {
      map[h.key] = {
        key: h.key,
        label: h.label,
        zone: getZoneLabel(h.category),
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

  // Responsive state: >= 1024px is desktop right-docked sheet, < 1024px is bottom sheet
  const [isDesktop, setIsDesktop] = useState(true);
  const [visualViewportHeight, setVisualViewportHeight] = useState<number | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;
    const updateVp = () => {
      if (window.visualViewport) {
        setVisualViewportHeight(window.visualViewport.height);
      }
    };
    window.visualViewport.addEventListener('resize', updateVp);
    window.visualViewport.addEventListener('scroll', updateVp);
    updateVp();
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateVp);
        window.visualViewport.removeEventListener('scroll', updateVp);
      }
    };
  }, []);

  // Client resolution
  const clientId = initialClientId || existingOrder?.clientId || clients[0]?.id || null;
  const activeClient = useMemo(() => {
    if (!clientId) {
      if (clients.length > 0) {
        return {
          id: clients[0].id,
          name: clients[0].name,
          phone: clients[0].phone || '—',
          email: clients[0].email || '—',
        };
      }
      return null;
    }
    const found = clients.find((c) => c.id === clientId);
    if (found) {
      return {
        id: found.id,
        name: found.name,
        phone: found.phone || '—',
        email: found.email || '—',
      };
    }
    return clients[0]
      ? {
          id: clients[0].id,
          name: clients[0].name,
          phone: clients[0].phone || '—',
          email: clients[0].email || '—',
        }
      : null;
  }, [clients, clientId]);

  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');

  // Combined saved measurement snapshots for this client + Garment Blueprints from Settings
  const savedTemplates = useMemo(() => {
    const list: Array<{
      id: string;
      label: string;
      garmentType: string;
      measurements: Record<string, number>;
      fieldKeys: string[];
    }> = [];

    // 1. Client's saved measurement snapshots
    if (activeClient) {
      const fromStore = getClientSnapshots(activeClient.id);
      if (fromStore && fromStore.length > 0) {
        fromStore.forEach((s) => {
          const normalized = normalizeMeasurementsRecord(s.measurements);
          const keys = Object.keys(normalized);
          if (keys.length > 0) {
            list.push({
              id: s.id,
              label: `Saved (${s.date || ''}) · ${s.garmentType || 'Gown/Dress'}`,
              garmentType: s.garmentType || 'Bespoke Order',
              measurements: normalized,
              fieldKeys: keys,
            });
          }
        });
      }
    }

    // 2. Garment Blueprint Templates from Settings
    const blueprints = settings?.templates || [];
    blueprints.forEach((bp) => {
      const canonicalKeys = Array.from(
        new Set((bp.fieldKeys || []).map((k) => resolveCanonicalKey(k)))
      );
      const defaultMeasurements: Record<string, number> = {};
      canonicalKeys.forEach((k) => {
        const baseCm = hotspotMap[k]?.defaultValCm ?? 40;
        defaultMeasurements[k] =
          unitLabel === 'in' ? parseFloat((baseCm / 2.54).toFixed(1)) : baseCm;
      });
      list.push({
        id: `blueprint:${bp.id}`,
        label: `Blueprint · ${bp.name}`,
        garmentType: bp.name,
        measurements: defaultMeasurements,
        fieldKeys: canonicalKeys,
      });
    });

    return list;
  }, [getClientSnapshots, activeClient?.id, settings?.templates, hotspotMap, unitLabel]);

  // Initial state if editing an existing order vs creating a new order (Requirement D: new order starts EMPTY)
  const initialFieldsForOrder = useMemo<MeasurementFieldItem[]>(() => {
    if (!existingOrder) return [];
    const snap = existingOrder.measurementSnapshotId
      ? getSnapshotById(existingOrder.measurementSnapshotId)
      : getClientSnapshots(existingOrder.clientId)[0];
    if (!snap) return [];
    const normalized = normalizeMeasurementsRecord(snap.measurements);
    return Object.entries(normalized).map(([key, val]) => {
      const meta = hotspotMap[key];
      return {
        id: key,
        name: meta?.label || key,
        zone: meta?.zone || 'Torso',
        value: Number(val).toFixed(1),
        unit: unitLabel,
      };
    });
  }, [existingOrder, getSnapshotById, getClientSnapshots, hotspotMap, unitLabel]);

  // Desktop states
  const [isExpanded, setIsExpanded] = useState(Boolean(existingOrder));
  const [paneView, setPaneView] = useState<'mannequin' | 'table'>('mannequin');
  const [mannequinGender, setMannequinGender] = useState<'female' | 'male'>('female');

  // Mobile subscreen state: 'form' | 'mannequin'
  const [mobileSubScreen, setMobileSubScreen] = useState<'form' | 'mannequin'>('form');

  // Form fields (starts empty for new order per Requirement D, or populated if editing existingOrder)
  const [selectedSavedTemplateId, setSelectedSavedTemplateId] = useState<string>(
    existingOrder?.measurementSnapshotId || ''
  );
  const [garmentType, setGarmentType] = useState<string>(existingOrder?.garmentType || '');
  const [orderStatus, setOrderStatus] = useState<OrderStatus>(
    existingOrder?.status || 'In Progress'
  );
  const [price, setPrice] = useState<string>(
    existingOrder?.price ? String(existingOrder.price) : ''
  );
  const [dueDate, setDueDate] = useState<string>(
    existingOrder?.pickupDateTime ? formatISOToDMY(existingOrder.pickupDateTime) : ''
  );
  const [notes, setNotes] = useState<string>(existingOrder?.notes || '');
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>(
    existingOrder?.referenceImages || []
  );

  // Diagram & Measurement list state (EMPTY for new order until user picks template or adds point)
  const [fields, setFields] = useState<MeasurementFieldItem[]>(initialFieldsForOrder);
  const [hasDiagramEdited, setHasDiagramEdited] = useState(false);
  const [hasFormEdited, setHasFormEdited] = useState(false);
  const [measurementValidationError, setMeasurementValidationError] = useState('');
  const [garmentTypeValidationError, setGarmentTypeValidationError] = useState('');

  // Discard Confirmation Dialog state
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Save button morphing state
  const [saveStatus, setSaveStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [createdToastMessage, setCreatedToastMessage] = useState<string | null>(null);

  // Date picker popover
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);

  /**
   * Requirement C & D:
   * - mode 'edit': Tapping an active touchpoint opens modal to update ONLY the size value (read-only name).
   * - mode 'add': Clicking "Add Point" lets user pick from the 21 standard Sizing/Measurements.
   */
  const [pointModalData, setPointModalData] = useState<{
    mode: 'edit' | 'add';
    key: string;
    name: string;
    zone: string;
    value: string;
  } | null>(null);
  const [pointModalError, setPointModalError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const savedMeasurementsBlockRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  // Active point keys and measurements map derived from `fields`
  const activePointKeys = useMemo(() => fields.map((f) => f.id), [fields]);
  const measurementsMap = useMemo(() => {
    const map: Record<string, number> = {};
    fields.forEach((f) => {
      const num = parseFloat(f.value);
      if (!isNaN(num) && num >= 0) {
        map[f.id] = num;
      }
    });
    return map;
  }, [fields]);

  // Compute dirty state
  const isDirty = () => {
    if (existingOrder) return hasDiagramEdited || hasFormEdited;
    return (
      garmentType.trim() !== '' ||
      price.trim() !== '' ||
      dueDate.trim() !== '' ||
      notes.trim() !== '' ||
      referenceImages.length > 0 ||
      selectedSavedTemplateId !== '' ||
      fields.length > 0
    );
  };

  const handleRequestClose = () => {
    if (isDirty()) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  useEffect(() => {
    previouslyFocusedElementRef.current = document.activeElement as HTMLElement | null;
    return () => {
      if (previouslyFocusedElementRef.current) {
        previouslyFocusedElementRef.current.focus();
      }
    };
  }, []);

  useEffect(() => {
    if (!isDesktop) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isDesktop]);

  // Back button handling on mobile
  const didPushStateRef = useRef(false);
  useEffect(() => {
    if (!isDesktop) {
      window.history.pushState({ newOrderSheetOpen: true }, '');
      didPushStateRef.current = true;

      const handlePop = () => {
        didPushStateRef.current = false;
        if (isDirty()) {
          setShowDiscardConfirm(true);
        } else {
          onClose();
        }
      };

      window.addEventListener('popstate', handlePop);
      return () => {
        window.removeEventListener('popstate', handlePop);
        if (didPushStateRef.current) {
          window.history.back();
        }
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDesktop]);

  // Handle Escape key and focus trap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showDiscardConfirm) {
          setShowDiscardConfirm(false);
          return;
        }
        if (pointModalData) {
          setPointModalData(null);
          setPointModalError('');
          return;
        }
        if (isDatePickerOpen) {
          setIsDatePickerOpen(false);
          return;
        }
        handleRequestClose();
        return;
      }

      if (e.key === 'Tab' && sheetRef.current) {
        const focusables = sheetRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    pointModalData,
    isDatePickerOpen,
    showDiscardConfirm,
    garmentType,
    price,
    dueDate,
    notes,
    referenceImages,
    selectedSavedTemplateId,
    fields,
  ]);

  // Choose saved template or blueprint (Requirement D: populates the mannequin points)
  const handleSelectSavedTemplate = (tmplId: string) => {
    setSelectedSavedTemplateId(tmplId);
    setHasDiagramEdited(true);
    setMeasurementValidationError('');
    if (!tmplId) {
      setFields([]);
      return;
    }
    const tmpl = savedTemplates.find((t) => t.id === tmplId);
    if (tmpl) {
      if (!garmentType.trim()) {
        setGarmentType(tmpl.garmentType);
        setGarmentTypeValidationError('');
      }
      const nextFields: MeasurementFieldItem[] = tmpl.fieldKeys.map((key) => {
        const meta = hotspotMap[key];
        const val = tmpl.measurements[key];
        return {
          id: key,
          name: meta?.label || key,
          zone: meta?.zone || 'Torso',
          value: val !== undefined ? Number(val).toFixed(1) : '40.0',
          unit: unitLabel,
        };
      });
      setFields(nextFields);
    }
  };

  const handleFieldChange = (id: string, value: string) => {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, value } : f)));
    setHasDiagramEdited(true);
    setMeasurementValidationError('');
  };

  const handleRemoveField = (id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
    setHasDiagramEdited(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    Array.from(fileList).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          const newImg: ReferenceImage = {
            id: `ref-${++refImgSeq}`,
            url: ev.target.result as string,
            title: file.name.replace(/\.[^/.]+$/, ''),
          };
          setReferenceImages((prev) => [...prev, newImg]);
          setHasFormEdited(true);
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveRefImage = (id: string) => {
    setReferenceImages((prev) => prev.filter((img) => img.id !== id));
    setHasFormEdited(true);
  };

  // Requirement C: Tap on active mannequin touchpoint opens modal to update ONLY its size value
  const handleOpenPoint = (key: string, name: string) => {
    const canonical = resolveCanonicalKey(key);
    const currentField = fields.find((f) => f.id === canonical);
    const meta = hotspotMap[canonical];
    setPointModalData({
      mode: 'edit',
      key: canonical,
      name: currentField?.name || meta?.label || name,
      zone: currentField?.zone || meta?.zone || 'Torso',
      value: currentField ? currentField.value : '',
    });
    setPointModalError('');
  };

  // Requirement D: Click "Add Point" opens modal to select from the 21 standard Sizing/Measurements
  const handleOpenAddPoint = () => {
    const firstUnadded =
      allHotspots.find((h) => !activePointKeys.includes(h.key)) || allHotspots[0];
    const key = firstUnadded?.key || 'neck_circumference';
    const existingField = fields.find((f) => f.id === key);
    setPointModalData({
      mode: 'add',
      key,
      name: firstUnadded?.label || 'Neck circumference',
      zone: firstUnadded ? getZoneLabel(firstUnadded.category) : 'Head/Neck',
      value: existingField ? existingField.value : '',
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
    const meta = hotspotMap[canonical];

    setFields((prev) => {
      const exists = prev.some((f) => f.id === canonical);
      if (exists) {
        return prev.map((f) =>
          f.id === canonical ? { ...f, value: num.toFixed(1) } : f
        );
      }
      return [
        ...prev,
        {
          id: canonical,
          name: meta?.label || pointModalData.name,
          zone: meta?.zone || pointModalData.zone || 'Torso',
          value: num.toFixed(1),
          unit: unitLabel,
        },
      ];
    });

    setHasDiagramEdited(true);
    setMeasurementValidationError('');
    setPointModalData(null);
    setPointModalError('');
  };

  // Submit order (Create or Update)
  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();

    let hasError = false;

    if (!garmentType.trim()) {
      setGarmentTypeValidationError('Garment type is required');
      hasError = true;
    } else {
      setGarmentTypeValidationError('');
    }

    if (!selectedSavedTemplateId && fields.length === 0) {
      setMeasurementValidationError('Choose saved measurements or add points on the diagram');
      if (savedMeasurementsBlockRef.current) {
        savedMeasurementsBlockRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
      hasError = true;
    } else {
      setMeasurementValidationError('');
    }

    if (hasError) return;

    setSaveStatus('loading');

    setTimeout(() => {
      const rawPrice = parseFloat(price.replace(/[^0-9.]/g, '')) || 0;

      const measurementObj: Record<string, number> = {};
      fields.forEach((f) => {
        const val = parseFloat(f.value);
        if (!isNaN(val) && val >= 0) measurementObj[f.id] = val;
      });

      let snapshotIdToUse = selectedSavedTemplateId.startsWith('blueprint:')
        ? ''
        : selectedSavedTemplateId;

      let resolvedClientId = activeClient?.id;
      if (!resolvedClientId) {
        const nameToUse = newClientName.trim() || 'New Client';
        const created = addClient({
          name: nameToUse,
          phone: newClientPhone.trim(),
          email: newClientEmail.trim(),
          notes: 'Created via Order Sheet',
        });
        resolvedClientId = created.id;
      }

      if (hasDiagramEdited || !snapshotIdToUse) {
        if (existingOrder?.measurementSnapshotId && snapshotIdToUse) {
          updateSnapshot(existingOrder.measurementSnapshotId, {
            measurements: measurementObj,
            garmentType: garmentType.trim() || 'Bespoke Order',
          });
          snapshotIdToUse = existingOrder.measurementSnapshotId;
        } else {
          const createdSnapshot = addSnapshot({
            clientId: resolvedClientId,
            date: new Date()
              .toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })
              .replace(/\//g, '-'),
            garmentType: garmentType.trim() || 'Bespoke Order',
            unit: unitLabel,
            measurements: measurementObj,
            notes: notes || 'Taken from Order diagram',
          });
          snapshotIdToUse = createdSnapshot.id;
        }
      }

      if (existingOrder) {
        updateOrder(existingOrder.id, {
          garmentType: garmentType.trim() || 'Bespoke Order',
          measurementSnapshotId: snapshotIdToUse || undefined,
          price: rawPrice,
          status: orderStatus,
          pickupDateTime: dueDate ? parseDueDateToISO(dueDate) : existingOrder.pickupDateTime,
          notes,
          referenceImages,
        });
        setSaveStatus('success');
        setCreatedToastMessage('Order updated');
      } else {
        addOrder({
          clientId: resolvedClientId,
          garmentType: garmentType.trim() || 'Bespoke Order',
          measurementSnapshotId: snapshotIdToUse || undefined,
          price: rawPrice,
          status: orderStatus,
          pickupDateTime: parseDueDateToISO(dueDate),
          notes,
          referenceImages,
        });
        setSaveStatus('success');
        setCreatedToastMessage('Order created');
      }

      setTimeout(() => {
        onClose();
      }, 650);
    }, 450);
  };

  // Shared Mannequin 3D Rotatable Diagram component
  const renderMannequinSvg = (isMobileView = false) => {
    return (
      <RotatableMannequin
        gender={mannequinGender}
        onGenderChange={setMannequinGender}
        showGenderToggle={true}
        compact={!isMobileView}
        measurements={measurementsMap}
        activePointKeys={activePointKeys}
        selectedPointKey={pointModalData?.key || null}
        unit={unitLabel}
        onSelectPoint={handleOpenPoint}
      />
    );
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={handleRequestClose}
        className={cn(
          'fixed inset-0 z-50 bg-black/50',
          isDesktop ? 'backdrop-blur-[8px]' : 'backdrop-blur-[4px]'
        )}
      />

      {isDesktop ? (
        /* DESKTOP RIGHT-DOCKED SHEET */
        <motion.div
          ref={sheetRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-order-sheet-title"
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: 24 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
          exit={
            shouldReduceMotion
              ? { opacity: 0 }
              : { opacity: 0, x: 24, transition: { duration: 0.15, ease: [0.2, 0, 0, 1] } }
          }
          transition={{ type: 'spring', stiffness: 300, damping: 26, mass: 0.9 }}
          style={{
            boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.12)',
            width: isExpanded ? 815 : 390,
          }}
          className="fixed z-50 bg-white rounded-[8px] p-2 flex flex-col top-2 right-2 max-h-[calc(100dvh-16px)] h-fit transition-[width] duration-300"
        >
          <div className="flex-1 min-h-0 flex items-stretch gap-[2px] overflow-hidden">
            {/* Expanded Mannequin Pane (410px wide on left) */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -16 }}
                  animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
                  exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -16 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 26, mass: 0.9 }}
                  className="w-[410px] shrink-0 self-stretch rounded-[6px] bg-[#F8F8F8] p-3 flex flex-col overflow-y-auto"
                >
                  <div className="rounded-[8px] bg-white p-[2px] flex-1 flex flex-col">
                    <div className="rounded-[6px] bg-[#F8F8F8] py-3 px-3 flex-1 flex flex-col gap-4">
                      {/* Pane header */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[16px] font-bold text-black leading-tight truncate">
                            Mannequin
                          </h3>
                          <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#A2A2A2] mt-1 whitespace-nowrap">
                            <span>
                              {activePointKeys.length === 0
                                ? 'No points selected'
                                : `${activePointKeys.length} active pts`}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-[#A2A2A2] shrink-0" />
                            <span>
                              {mannequinGender === 'female'
                                ? 'Feminine Form'
                                : 'Masculine Form'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={handleOpenAddPoint}
                            className="h-7 px-3 rounded-[24px] border border-[var(--outline)] bg-white text-[12px] font-medium text-black hover:bg-[#F3F3F3] transition-colors cursor-pointer"
                          >
                            Add Point
                          </button>

                          <div className="flex items-center bg-[#D9D8D8] rounded-[24px] p-0.5 gap-0.5">
                            <button
                              type="button"
                              onClick={() => setPaneView('mannequin')}
                              aria-label="Diagram View"
                              aria-pressed={paneView === 'mannequin'}
                              className={cn(
                                'w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer',
                                paneView === 'mannequin'
                                  ? 'bg-[var(--selected)] text-white shadow-xs'
                                  : 'bg-white text-[var(--text-2)] hover:text-black'
                              )}
                              title="Diagram View"
                            >
                              <User className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setPaneView('table')}
                              aria-label="Measurement List View"
                              aria-pressed={paneView === 'table'}
                              className={cn(
                                'w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer',
                                paneView === 'table'
                                  ? 'bg-[var(--selected)] text-white shadow-xs'
                                  : 'bg-white text-[var(--text-2)] hover:text-black'
                              )}
                              title="Measurement List View"
                            >
                              <ClipboardList className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Content: Mannequin Diagram or 2-column grid */}
                      {paneView === 'mannequin' ? (
                        <div className="flex-1 flex items-center justify-center select-none py-1">
                          {renderMannequinSvg(false)}
                        </div>
                      ) : fields.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-white rounded-[12px] gap-2">
                          <p className="text-[13px] font-semibold text-black">
                            No measurement points yet
                          </p>
                          <p className="text-[11px] text-[var(--text-2)]">
                            Choose a saved template/blueprint on the right or click &ldquo;Add Point&rdquo; to begin.
                          </p>
                        </div>
                      ) : (
                        <div className="flex-1 grid grid-cols-2 gap-2 overflow-y-auto max-h-[460px] pr-1 content-start">
                          {fields.map((f) => (
                            <div
                              key={f.id}
                              className="bg-white rounded-[16px] p-2.5 border border-[#EDEDED] flex flex-col justify-between gap-2 shadow-2xs"
                            >
                              <div className="flex items-start justify-between gap-1">
                                <div className="min-w-0">
                                  <span className="text-[12px] font-semibold text-black block truncate">
                                    {f.name}
                                  </span>
                                  <span className="text-[10px] text-[var(--muted)] block">
                                    {f.zone}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveField(f.id)}
                                  className="w-4 h-4 flex items-center justify-center text-[var(--muted)] hover:text-black transition-colors cursor-pointer shrink-0"
                                  title="Remove field"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="w-full bg-[var(--card)] border border-[#EDEDED] rounded-[8px] p-[2px] flex items-center">
                                <input
                                  type="text"
                                  value={f.value}
                                  onChange={(e) => handleFieldChange(f.id, e.target.value)}
                                  placeholder="0.0"
                                  className="w-full bg-transparent px-2 py-1 text-[12px] text-black placeholder:text-[var(--muted)] focus:outline-none tabular-nums"
                                />
                                <span className="pr-1.5 text-[11px] font-medium text-black select-none shrink-0">
                                  {f.unit}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form Card */}
            <div
              className={cn(
                'rounded-[6px] bg-white p-3 flex flex-col gap-5 overflow-y-auto self-stretch',
                isExpanded ? 'w-[386px]' : 'w-full'
              )}
            >
              <div className="pb-2 border-b border-[var(--card)] flex items-center justify-between">
                <h2
                  id="new-order-sheet-title"
                  className="text-[20px] font-bold text-black leading-tight"
                >
                  {existingOrder ? 'Edit Bespoke Order' : 'New Bespoke Order'}
                </h2>
                <button
                  type="button"
                  onClick={handleRequestClose}
                  className="w-7 h-7 rounded-full bg-[var(--card)] flex items-center justify-center text-[var(--muted)] hover:text-black cursor-pointer"
                  aria-label="Close order sheet"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                {/* Client summary OR New Client Input */}
                {activeClient ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[14px] font-medium text-[var(--muted)]">
                        Client Name:
                      </span>
                      <span className="text-[16px] font-semibold text-black">
                        {activeClient.name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[14px] font-medium text-[var(--muted)]">
                        Phone Number
                      </span>
                      <span className="text-[16px] font-semibold text-black">
                        {activeClient.phone}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[14px] font-medium text-[var(--muted)]">
                        Email Address
                      </span>
                      <span className="text-[16px] font-semibold text-black">
                        {activeClient.email}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[var(--card)] rounded-[8px] p-3 flex flex-col gap-2.5 border border-[var(--outline)]">
                    <span className="text-[12px] font-semibold text-black">
                      Client Information
                    </span>
                    <input
                      type="text"
                      placeholder="Client full name *"
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      className="w-full h-8 rounded-[6px] bg-white border border-[var(--outline)] px-2.5 text-[12px] text-black focus:outline-none focus:border-[var(--primary)]"
                      required
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="tel"
                        placeholder="Phone number"
                        value={newClientPhone}
                        onChange={(e) => setNewClientPhone(e.target.value)}
                        className="w-full h-8 rounded-[6px] bg-white border border-[var(--outline)] px-2.5 text-[12px] text-black focus:outline-none focus:border-[var(--primary)]"
                      />
                      <input
                        type="email"
                        placeholder="Email address"
                        value={newClientEmail}
                        onChange={(e) => setNewClientEmail(e.target.value)}
                        className="w-full h-8 rounded-[6px] bg-white border border-[var(--outline)] px-2.5 text-[12px] text-black focus:outline-none focus:border-[var(--primary)]"
                      />
                    </div>
                  </div>
                )}

                {/* Saved Measurements & Blueprints block */}
                <div
                  ref={savedMeasurementsBlockRef}
                  className="bg-[var(--card)] rounded-[8px] px-4 py-3 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-medium text-[var(--muted)]">
                      Saved Measurements / Blueprints
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsExpanded((prev) => !prev);
                        setMeasurementValidationError('');
                      }}
                      className="text-[12px] font-semibold text-[var(--selected)] hover:underline cursor-pointer"
                    >
                      {isExpanded
                        ? 'Hide Diagram'
                        : fields.length > 0
                        ? `Edit Diagram (${fields.length})`
                        : 'Take New Diagram'}
                    </button>
                  </div>

                  <div className="relative">
                    <select
                      value={selectedSavedTemplateId}
                      onChange={(e) => handleSelectSavedTemplate(e.target.value)}
                      className="w-full h-8 px-3 pr-8 rounded-[24px] border border-[var(--track)] bg-white text-[13px] text-[var(--text-2)] focus:outline-none appearance-none cursor-pointer"
                    >
                      <option value="">Choose Saved Measurements or Blueprint</option>
                      {savedTemplates.map((t) => (
                        <option key={t.id} value={t.id} className="text-black">
                          {t.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-[var(--text-2)] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {measurementValidationError && (
                    <p className="text-[12px] text-[var(--paused)] font-medium pt-1">
                      {measurementValidationError}
                    </p>
                  )}
                </div>

                <div className="rounded-[8px] bg-white flex flex-col gap-2">
                  {/* Garment Type & Optional Order Status when editing */}
                  <div className="p-2 grid grid-cols-1 gap-2">
                    <div>
                      <label className="text-[12px] font-medium text-black mb-1 block">
                        Garment Type
                      </label>
                      <div className="w-full bg-[var(--field-on-card)] border border-[#EDEDED] rounded-[8px] p-2">
                        <input
                          type="text"
                          value={garmentType}
                          onChange={(e) => {
                            setGarmentType(e.target.value);
                            setGarmentTypeValidationError('');
                            setHasFormEdited(true);
                          }}
                          placeholder="Bespoke African Gown"
                          className="w-full bg-transparent text-[14px] text-black placeholder:text-[var(--muted)] focus:outline-none"
                        />
                      </div>
                      {garmentTypeValidationError && (
                        <p className="text-[12px] text-[var(--paused)] font-medium mt-1">
                          {garmentTypeValidationError}
                        </p>
                      )}
                    </div>

                    {existingOrder && (
                      <div>
                        <label className="text-[12px] font-medium text-black mb-1 block">
                          Order Status
                        </label>
                        <div className="relative">
                          <select
                            value={orderStatus}
                            onChange={(e) => {
                              setOrderStatus(e.target.value as OrderStatus);
                              setHasFormEdited(true);
                            }}
                            className="w-full bg-[var(--field-on-card)] border border-[#EDEDED] rounded-[8px] p-2 text-[13px] font-medium text-black focus:outline-none appearance-none cursor-pointer"
                          >
                            <option value="In Progress">In Progress</option>
                            <option value="Pending">Pending</option>
                            <option value="Ready">Ready</option>
                            <option value="Completed">Completed</option>
                            <option value="Paused">Paused</option>
                          </select>
                          <ChevronDown className="w-4 h-4 text-[var(--text-2)] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Style References */}
                  <div className="p-2">
                    <label className="text-[12px] font-medium text-black mb-1 block">
                      Style References
                    </label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-[100px] border border-dashed border-[var(--dashed)] rounded-[8px] flex flex-col items-center justify-center cursor-pointer hover:bg-[#FAFAFA] transition-colors p-2 text-center"
                    >
                      <div className="w-8 h-8 rounded-full bg-[var(--chip)] flex items-center justify-center">
                        <CloudUpload className="w-4 h-4 text-[var(--text-2)]" />
                      </div>
                      <span className="text-[12px] font-medium text-[var(--text-2)] mt-2">
                        Drop fabric style, sketches or style photos here
                      </span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </div>

                    {referenceImages.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {referenceImages.map((img) => (
                          <div
                            key={img.id}
                            className="relative w-12 h-12 rounded-[6px] overflow-hidden border border-[#EDEDED] group"
                          >
                            <img
                              src={img.url}
                              alt={img.title || 'Reference'}
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveRefImage(img.id);
                              }}
                              className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              title="Remove"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Price and Due Date */}
                  <div className="p-2 grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[12px] font-medium text-black mb-1 block">
                        Price ({currencySymbol})
                      </label>
                      <div className="w-full bg-[var(--field-on-card)] border border-[#EDEDED] rounded-[8px] p-2">
                        <input
                          type="text"
                          value={price}
                          onChange={(e) => {
                            setPrice(e.target.value);
                            setHasFormEdited(true);
                          }}
                          placeholder={`${currencySymbol}0.00`}
                          className="w-full bg-transparent text-[14px] text-black placeholder:text-[var(--muted)] focus:outline-none tabular-nums"
                        />
                      </div>
                    </div>

                    <div className="relative" ref={datePickerRef}>
                      <label className="text-[12px] font-medium text-black mb-1 block">
                        Due Date
                      </label>
                      <div className="w-full bg-[var(--field-on-card)] border border-[#EDEDED] rounded-[8px] p-2 flex items-center justify-between">
                        <input
                          type="text"
                          value={dueDate}
                          onChange={(e) => {
                            setDueDate(e.target.value);
                            setHasFormEdited(true);
                          }}
                          placeholder="09/10/2026"
                          className="w-full bg-transparent text-[14px] text-black placeholder:text-[var(--muted)] focus:outline-none tabular-nums"
                        />
                        <button
                          type="button"
                          onClick={() => setIsDatePickerOpen((prev) => !prev)}
                          aria-label="Pick due date"
                          className="text-[var(--text-2)] hover:text-black p-0.5 cursor-pointer shrink-0 transition-colors"
                          title="Pick due date"
                        >
                          <CalendarIcon className="w-4 h-4" />
                        </button>
                      </div>

                      <AnimatePresence>
                        {isDatePickerOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 4, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 4, scale: 0.96 }}
                            transition={springSmooth}
                            className="absolute top-full right-0 mt-1.5 w-60 bg-white border border-[var(--outline)] rounded-[8px] p-3 shadow-lg z-30"
                          >
                            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--outline)]">
                              <span className="text-[12px] font-bold text-[var(--text-strong)]">
                                October 2026
                              </span>
                              <button
                                type="button"
                                onClick={() => setIsDatePickerOpen(false)}
                                aria-label="Close date picker"
                                className="text-[var(--text-2)] hover:text-black p-0.5 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="grid grid-cols-3 gap-1.5 pt-1">
                              {[
                                '09/10/2026',
                                '16/10/2026',
                                '23/10/2026',
                                '30/10/2026',
                                '06/11/2026',
                                '13/11/2026',
                              ].map((d) => (
                                <button
                                  key={d}
                                  type="button"
                                  onClick={() => {
                                    setDueDate(d);
                                    setHasFormEdited(true);
                                    setIsDatePickerOpen(false);
                                  }}
                                  className={cn(
                                    'py-1 px-1.5 rounded-[6px] text-[11px] font-medium border text-center transition-colors cursor-pointer tabular-nums',
                                    dueDate === d
                                      ? 'bg-[var(--primary)] text-white border-transparent'
                                      : 'bg-[var(--card)] text-black border-[#EDEDED] hover:bg-[#EFEFEF]'
                                  )}
                                >
                                  {d.slice(0, 5)}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="p-2">
                    <label className="text-[12px] font-medium text-black mb-1 block">
                      Workroom notes and fabric details
                    </label>
                    <div className="w-full bg-[var(--field-on-card)] border border-[#EDEDED] rounded-[8px] p-2">
                      <textarea
                        rows={4}
                        value={notes}
                        onChange={(e) => {
                          setNotes(e.target.value);
                          setHasFormEdited(true);
                        }}
                        placeholder="e.g. hand-stitched, monogram design on wrist and gold buttons"
                        className="w-full h-[100px] bg-transparent text-[14px] text-black placeholder:text-[var(--muted)] focus:outline-none resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer strip */}
          <div className="w-full px-4 py-2 flex items-center justify-end bg-white rounded-b-[8px]">
            <motion.button
              type="button"
              whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
              onClick={handleCreateOrder}
              disabled={saveStatus !== 'idle'}
              className={cn(
                'h-9 px-4 py-1.5 rounded-[24px] bg-[var(--primary)] text-white text-[14px] font-medium flex items-center gap-1.5 cursor-pointer shadow-xs transition-all',
                saveStatus === 'success' && 'bg-[var(--completed)]'
              )}
            >
              {saveStatus === 'idle' && (
                <>
                  <Save className="w-4 h-4 stroke-[2]" />
                  <span>{existingOrder ? 'Save Changes' : 'Create Order'}</span>
                </>
              )}
              {saveStatus === 'loading' && (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{existingOrder ? 'Saving...' : 'Creating Order...'}</span>
                </>
              )}
              {saveStatus === 'success' && (
                <>
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>{existingOrder ? 'Saved' : 'Order Created'}</span>
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      ) : (
        /* PART 2: MOBILE / TABLET (< 1024px) BOTTOM SHEET */
        <motion.div
          ref={sheetRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-order-sheet-title-mobile"
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.5 }}
          onDragEnd={(_, info) => {
            if (scrollContainerRef.current && scrollContainerRef.current.scrollTop > 5)
              return;
            if (info.offset.y > 120 || info.velocity.y > 600) {
              handleRequestClose();
            }
          }}
          initial={shouldReduceMotion ? { opacity: 0 } : { y: '100%' }}
          animate={shouldReduceMotion ? { opacity: 1 } : { y: 0 }}
          exit={
            shouldReduceMotion
              ? { opacity: 0 }
              : { y: '100%', transition: { duration: 0.2 } }
          }
          transition={{ type: 'spring', stiffness: 320, damping: 34, mass: 0.9 }}
          style={{
            maxHeight: visualViewportHeight ? `${visualViewportHeight - 8}px` : '92dvh',
          }}
          className={cn(
            'fixed left-0 right-0 bottom-0 z-50 mx-auto w-full max-w-[640px] bg-white flex flex-col',
            'rounded-t-[16px] sm:rounded-[16px] sm:mb-2 md:mb-4 shadow-2xl overflow-hidden'
          )}
        >
          <div className="w-full h-6 flex items-center justify-center pt-2 cursor-grab active:cursor-grabbing shrink-0 select-none">
            <div className="w-10 h-1 rounded-full bg-[#D9D8D8]" />
          </div>

          <div className="px-4 pt-2 pb-3 border-b border-[#F8F8F8] shrink-0">
            {mobileSubScreen === 'form' ? (
              <div className="flex items-center justify-between">
                <h2
                  id="new-order-sheet-title-mobile"
                  className="text-[20px] font-bold text-black leading-tight"
                >
                  {existingOrder ? 'Edit Bespoke Order' : 'New Bespoke Order'}
                </h2>
                <button
                  type="button"
                  onClick={handleRequestClose}
                  aria-label="Close order sheet"
                  className="w-7 h-7 rounded-full bg-[#F2F2F2] flex items-center justify-center text-[var(--muted)] hover:text-black cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileSubScreen('form')}
                  className="w-11 h-11 rounded-full bg-[#F2F2F2] flex items-center justify-center text-black shrink-0 cursor-pointer"
                  aria-label="Back to form"
                >
                  <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
                </button>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[16px] font-bold text-black leading-tight truncate">
                    Mannequin
                  </h3>
                  <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#A2A2A2] mt-0.5 whitespace-nowrap">
                    <span>
                      {activePointKeys.length === 0
                        ? 'No points selected'
                        : `${activePointKeys.length} active points`}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-[#A2A2A2] shrink-0" />
                    <span>
                      {mannequinGender === 'female' ? 'Feminine Form' : 'Masculine Form'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div
            ref={scrollContainerRef}
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4"
          >
            {mobileSubScreen === 'form' ? (
              <div className="flex flex-col gap-4">
                {activeClient ? (
                  <div className="flex flex-col gap-2.5">
                    <div className="flex flex-col min-[480px]:flex-row min-[480px]:items-center min-[480px]:justify-between gap-0.5">
                      <span className="text-[14px] font-medium text-[var(--muted)]">
                        Client Name:
                      </span>
                      <span className="text-[16px] font-semibold text-black break-all">
                        {activeClient.name}
                      </span>
                    </div>
                    <div className="flex flex-col min-[480px]:flex-row min-[480px]:items-center min-[480px]:justify-between gap-0.5">
                      <span className="text-[14px] font-medium text-[var(--muted)]">
                        Phone Number
                      </span>
                      <span className="text-[16px] font-semibold text-black break-all">
                        {activeClient.phone}
                      </span>
                    </div>
                    <div className="flex flex-col min-[480px]:flex-row min-[480px]:items-center min-[480px]:justify-between gap-0.5">
                      <span className="text-[14px] font-medium text-[var(--muted)]">
                        Email Address
                      </span>
                      <span
                        className="text-[16px] font-semibold text-black break-all"
                        style={{ overflowWrap: 'anywhere' }}
                      >
                        {activeClient.email}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[var(--card)] rounded-[8px] p-3 flex flex-col gap-2.5 border border-[var(--outline)]">
                    <span className="text-[12px] font-semibold text-black">
                      Client Information
                    </span>
                    <input
                      type="text"
                      placeholder="Client full name *"
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      className="w-full h-8 rounded-[6px] bg-white border border-[var(--outline)] px-2.5 text-[12px] text-black focus:outline-none focus:border-[var(--primary)]"
                      required
                    />
                    <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-2">
                      <input
                        type="tel"
                        placeholder="Phone number"
                        value={newClientPhone}
                        onChange={(e) => setNewClientPhone(e.target.value)}
                        className="w-full h-8 rounded-[6px] bg-white border border-[var(--outline)] px-2.5 text-[12px] text-black focus:outline-none focus:border-[var(--primary)]"
                      />
                      <input
                        type="email"
                        placeholder="Email address"
                        value={newClientEmail}
                        onChange={(e) => setNewClientEmail(e.target.value)}
                        className="w-full h-8 rounded-[6px] bg-white border border-[var(--outline)] px-2.5 text-[12px] text-black focus:outline-none focus:border-[var(--primary)]"
                      />
                    </div>
                  </div>
                )}

                <div
                  ref={savedMeasurementsBlockRef}
                  className="bg-[var(--card)] rounded-[8px] px-4 py-3 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between min-h-[44px]">
                    <span className="text-[12px] font-medium text-[var(--muted)]">
                      Saved Measurements / Blueprints
                    </span>
                    <button
                      type="button"
                      onClick={() => setMobileSubScreen('mannequin')}
                      className="text-[14px] font-semibold text-[var(--selected)] hover:underline cursor-pointer min-h-[44px] flex items-center"
                    >
                      {fields.length > 0
                        ? `Edit Diagram (${fields.length})`
                        : 'Take New Diagram'}
                    </button>
                  </div>

                  <div className="relative">
                    <select
                      value={selectedSavedTemplateId}
                      onChange={(e) => handleSelectSavedTemplate(e.target.value)}
                      className="w-full h-12 px-3 pr-8 rounded-[24px] border border-[var(--track)] bg-white text-[16px] text-[var(--text-2)] focus:outline-none appearance-none cursor-pointer"
                    >
                      <option value="">Choose Saved Template</option>
                      {savedTemplates.map((t) => (
                        <option key={t.id} value={t.id} className="text-black">
                          {t.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-[var(--text-2)] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {measurementValidationError && (
                    <p className="text-[12px] text-[var(--paused)] font-medium pt-1">
                      {measurementValidationError}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-[12px] font-medium text-black mb-1 block">
                    Garment Type
                  </label>
                  <div className="w-full bg-[var(--field-on-card)] border border-[#EDEDED] rounded-[8px] px-3 h-12 flex items-center">
                    <input
                      type="text"
                      value={garmentType}
                      onChange={(e) => {
                        setGarmentType(e.target.value);
                        setGarmentTypeValidationError('');
                      }}
                      placeholder="Bespoke African Gown"
                      className="w-full bg-transparent text-[16px] text-black placeholder:text-[var(--muted)] focus:outline-none"
                    />
                  </div>
                  {garmentTypeValidationError && (
                    <p className="text-[12px] text-[var(--paused)] font-medium mt-1">
                      {garmentTypeValidationError}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-[12px] font-medium text-black mb-1 block">
                    Style References
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full min-h-[100px] border border-dashed border-[var(--dashed)] rounded-[8px] flex flex-col items-center justify-center cursor-pointer hover:bg-[#FAFAFA] transition-colors p-3 text-center"
                  >
                    <div className="w-9 h-9 rounded-full bg-[var(--chip)] flex items-center justify-center">
                      <CloudUpload className="w-5 h-5 text-[var(--text-2)]" />
                    </div>
                    <span className="text-[13px] font-medium text-[var(--text-2)] mt-2">
                      Tap to add style photos
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </div>

                  {referenceImages.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 pt-2">
                      {referenceImages.map((img) => (
                        <div
                          key={img.id}
                          className="relative aspect-square rounded-[8px] overflow-hidden border border-[#EDEDED]"
                        >
                          <img
                            src={img.url}
                            alt="Reference"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveRefImage(img.id);
                            }}
                            className="absolute top-1 right-1 w-8 h-8 flex items-center justify-center bg-black/60 text-white rounded-full cursor-pointer"
                            title="Remove"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[12px] font-medium text-black mb-1 block">
                      Price ({currencySymbol})
                    </label>
                    <div className="w-full bg-[var(--field-on-card)] border border-[#EDEDED] rounded-[8px] px-3 h-12 flex items-center">
                      <input
                        type="text"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder={`${currencySymbol}0.00`}
                        className="w-full bg-transparent text-[16px] text-black placeholder:text-[var(--muted)] focus:outline-none tabular-nums"
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <label className="text-[12px] font-medium text-black mb-1 block">
                      Due Date
                    </label>
                    <div className="w-full bg-[var(--field-on-card)] border border-[#EDEDED] rounded-[8px] px-3 h-12 flex items-center justify-between">
                      <input
                        type="text"
                        value={dueDate}
                        onChange={(e) => {
                          setDueDate(e.target.value);
                          setHasFormEdited(true);
                        }}
                        placeholder="09/10/2026"
                        className="w-full bg-transparent text-[16px] text-black placeholder:text-[var(--muted)] focus:outline-none tabular-nums"
                      />
                      <button
                        type="button"
                        onClick={() => setIsDatePickerOpen((prev) => !prev)}
                        aria-label="Pick due date"
                        className="text-[var(--text-2)] hover:text-black p-2 cursor-pointer shrink-0 transition-colors"
                      >
                        <CalendarIcon className="w-5 h-5" />
                      </button>
                    </div>

                    <AnimatePresence>
                      {isDatePickerOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 4, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 4, scale: 0.96 }}
                          transition={springSmooth}
                          className="absolute top-full right-0 mt-1.5 w-60 bg-white border border-[var(--outline)] rounded-[8px] p-3 shadow-lg z-30"
                        >
                          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--outline)]">
                            <span className="text-[12px] font-bold text-[var(--text-strong)]">
                              October 2026
                            </span>
                            <button
                              type="button"
                              onClick={() => setIsDatePickerOpen(false)}
                              aria-label="Close date picker"
                              className="text-[var(--text-2)] hover:text-black p-0.5 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="grid grid-cols-3 gap-1.5 pt-1">
                            {[
                              '09/10/2026',
                              '16/10/2026',
                              '23/10/2026',
                              '30/10/2026',
                              '06/11/2026',
                              '13/11/2026',
                            ].map((d) => (
                              <button
                                key={d}
                                type="button"
                                onClick={() => {
                                  setDueDate(d);
                                  setHasFormEdited(true);
                                  setIsDatePickerOpen(false);
                                }}
                                className={cn(
                                  'py-1.5 px-1.5 rounded-[6px] text-[12px] font-medium border text-center transition-colors cursor-pointer tabular-nums',
                                  dueDate === d
                                    ? 'bg-[var(--primary)] text-white border-transparent'
                                    : 'bg-[var(--card)] text-black border-[#EDEDED] hover:bg-[#EFEFEF]'
                                )}
                              >
                                {d.slice(0, 5)}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div>
                  <label className="text-[12px] font-medium text-black mb-1 block">
                    Workroom notes and fabric details
                  </label>
                  <div className="w-full bg-[var(--field-on-card)] border border-[#EDEDED] rounded-[8px] p-3">
                    <textarea
                      rows={4}
                      value={notes}
                      onChange={(e) => {
                        setNotes(e.target.value);
                        setHasFormEdited(true);
                      }}
                      placeholder="e.g. hand-stitched, monogram design on wrist and gold buttons"
                      className="w-full h-[120px] bg-transparent text-[16px] text-black placeholder:text-[var(--muted)] focus:outline-none resize-none"
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* Mannequin Screen on Mobile */
              <motion.div
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: 24 }}
                animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -24 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-4"
              >
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenAddPoint}
                    className="flex-1 h-11 px-4 rounded-[24px] border border-[var(--outline)] bg-white text-[14px] font-medium text-black hover:bg-[#F3F3F3] transition-colors cursor-pointer"
                  >
                    Add Point
                  </button>

                  <div className="flex items-center bg-[#D9D8D8] rounded-[24px] p-1 gap-1">
                    <button
                      type="button"
                      onClick={() => setPaneView('mannequin')}
                      aria-label="Diagram View"
                      aria-pressed={paneView === 'mannequin'}
                      className={cn(
                        'w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer',
                        paneView === 'mannequin'
                          ? 'bg-[var(--selected)] text-white shadow-xs'
                          : 'bg-white text-[var(--text-2)]'
                      )}
                    >
                      <User className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaneView('table')}
                      aria-label="Measurement List View"
                      aria-pressed={paneView === 'table'}
                      className={cn(
                        'w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer',
                        paneView === 'table'
                          ? 'bg-[var(--selected)] text-white shadow-xs'
                          : 'bg-white text-[var(--text-2)]'
                      )}
                    >
                      <ClipboardList className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {paneView === 'mannequin' ? (
                  <div className="w-full flex items-center justify-center py-2">
                    {renderMannequinSvg(true)}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 min-[340px]:grid-cols-2 gap-2">
                    {fields.map((f) => (
                      <div
                        key={f.id}
                        className="bg-white rounded-[16px] p-3 border border-[#EDEDED] flex flex-col justify-between gap-2 shadow-2xs"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[13px] font-semibold text-black truncate">
                            {f.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveField(f.id)}
                            className="w-7 h-7 flex items-center justify-center text-[var(--muted)] hover:text-black cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="w-full bg-[var(--card)] border border-[#EDEDED] rounded-[8px] px-2 h-12 flex items-center">
                          <input
                            type="text"
                            value={f.value}
                            onChange={(e) => handleFieldChange(f.id, e.target.value)}
                            placeholder="0.0"
                            className="w-full bg-transparent text-[16px] text-black focus:outline-none tabular-nums"
                          />
                          <span className="pr-1 text-[13px] font-medium text-black select-none">
                            {f.unit}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </div>

          <div className="border-t border-[#F8F8F8] bg-white px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] flex flex-col gap-2 shrink-0">
            {mobileSubScreen === 'form' ? (
              <>
                {measurementValidationError && (
                  <p className="text-[13px] text-[var(--paused)] font-medium text-center">
                    {measurementValidationError}
                  </p>
                )}
                <motion.button
                  type="button"
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
                  onClick={handleCreateOrder}
                  disabled={saveStatus !== 'idle'}
                  className={cn(
                    'w-full min-h-[48px] rounded-[24px] bg-[var(--primary)] text-white text-[16px] font-medium flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all',
                    saveStatus === 'success' && 'bg-[var(--completed)]'
                  )}
                >
                  {saveStatus === 'idle' && (
                    <>
                      <Save className="w-5 h-5 stroke-[2]" />
                      <span>{existingOrder ? 'Save Changes' : 'Create Order'}</span>
                    </>
                  )}
                  {saveStatus === 'loading' && (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{existingOrder ? 'Saving...' : 'Creating Order...'}</span>
                    </>
                  )}
                  {saveStatus === 'success' && (
                    <>
                      <Check className="w-5 h-5 stroke-[2.5]" />
                      <span>{existingOrder ? 'Saved' : 'Order Created'}</span>
                    </>
                  )}
                </motion.button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setMobileSubScreen('form')}
                className="w-full min-h-[48px] rounded-[24px] bg-[var(--primary)] text-white text-[16px] font-medium flex items-center justify-center cursor-pointer shadow-xs"
              >
                Done
              </button>
            )}
          </div>
        </motion.div>
      )}

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
              aria-labelledby="order-point-dialog-title"
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
              className="relative w-[430px] max-w-[calc(100vw-32px)] rounded-[16px] bg-white p-6 z-10 flex flex-col gap-5 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3
                  id="order-point-dialog-title"
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
                  <div className="flex flex-col gap-2">
                    <label className="block text-[11px] font-semibold text-black">
                      Select Sizing Measurement
                    </label>
                    <div className="flex flex-col gap-2.5 max-h-[200px] overflow-y-auto rounded-[10px] bg-[var(--card)] p-2.5 border border-[#EDEDED]">
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
                                    const existing = fields.find((f) => f.id === item.key);
                                    setPointModalData({
                                      ...pointModalData,
                                      key: item.key,
                                      name: item.label,
                                      zone: zone.label,
                                      value: existing ? existing.value : pointModalData.value,
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
                    <span className="pr-2 text-[12px] font-semibold text-[var(--text-2)] select-none shrink-0">
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

      {/* DISCARD CONFIRMATION DIALOG */}
      <AnimatePresence>
        {showDiscardConfirm && (
          <div className="fixed inset-0 z-70 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xs rounded-[16px] bg-white p-5 shadow-2xl flex flex-col gap-4 text-center"
            >
              <h4 className="text-[16px] font-bold text-black leading-tight">
                Discard changes?
              </h4>
              <p className="text-[12px] text-[var(--muted)] leading-normal">
                You have unsaved changes. Are you sure you want to discard them?
              </p>
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowDiscardConfirm(false)}
                  className="flex-1 h-9 px-3 rounded-[24px] bg-[var(--chip)] border border-[var(--outline)] text-[var(--text-2)] text-[14px] font-medium hover:bg-[#EAEAEA] cursor-pointer transition-colors"
                >
                  Keep editing
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDiscardConfirm(false);
                    onClose();
                  }}
                  className="flex-1 h-9 px-3 rounded-[24px] bg-[var(--paused)] text-white text-[14px] font-medium hover:opacity-90 cursor-pointer transition-opacity"
                >
                  Discard
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Created Order Toast */}
      <AnimatePresence>
        {createdToastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={springSmooth}
            className="fixed bottom-6 right-6 z-70 bg-white rounded-[16px] px-4 py-3 shadow-xl border border-[var(--outline)] flex items-center gap-3 select-none"
          >
            <div className="w-5 h-5 rounded-full bg-[var(--completed)] text-white flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
            <span className="text-[12px] font-semibold text-[var(--text-strong)]">
              {createdToastMessage}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
