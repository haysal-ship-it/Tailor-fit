'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useStore } from '@/lib/store';
import { Order, ReferenceImage, OrderStatus } from '@/types';
import { 
  Save, 
  Upload, 
  Calendar as CalendarIcon, 
  ChevronDown, 
  User, 
  ClipboardList, 
  Plus, 
  X, 
  Check, 
  Loader2 
} from 'lucide-react';
import { springSmooth } from '@/lib/motion-tokens';
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
  value: string;
  unit: string;
}

const ORDER_MEASUREMENT_FIELDS: MeasurementFieldItem[] = [
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

export function OrderFormModal({ orderId, initialClientId, onClose }: OrderFormModalProps) {
  const { 
    clients, 
    orders, 
    snapshots, 
    addOrder, 
    updateOrder, 
    addSnapshot,
    getClientSnapshots 
  } = useStore();
  const shouldReduceMotion = useReducedMotion();

  const existingOrder = orderId ? orders.find((o) => o.id === orderId) : null;

  // Active client determination
  const clientId = initialClientId || existingOrder?.clientId || clients[0]?.id || 'c-1';
  const activeClient = useMemo(() => {
    const found = clients.find((c) => c.id === clientId);
    if (found) {
      return {
        id: found.id,
        name: found.name,
        phone: found.phone || '+234 809 489 2011',
        email: found.email || 'client@couture.com',
      };
    }
    // Fallback default clients
    if (clientId === 'c-2') {
      return {
        id: 'c-2',
        name: 'Taylor Razaq',
        phone: '+234 803 929 1100',
        email: 't.razaq@tailorfit.design',
      };
    }
    if (clientId === 'c-6') {
      return {
        id: 'c-6',
        name: 'Amanda Billings',
        phone: '+237 409 302 990',
        email: 'a.billings@couture.com',
      };
    }
    return {
      id: 'c-1',
      name: 'Chloe Dallas',
      phone: '+234 809 489 2011',
      email: 'chloedallas@couture.com',
    };
  }, [clients, clientId]);

  // Saved measurement sets for this client
  const savedTemplates = useMemo(() => {
    const fromStore = getClientSnapshots(activeClient.id);
    if (fromStore && fromStore.length > 0) {
      return fromStore.map((s) => ({
        id: s.id,
        label: `${s.date || '09-10-2025'} · ${s.garmentType || 'Gown/Dress'}`,
        garmentType: s.garmentType || 'Bespoke African Gown',
        measurements: s.measurements as Record<string, number>,
      }));
    }
    // Default sets
    return [
      {
        id: 'tmpl-gown',
        label: '09-10-2025 · Gown/Dress',
        garmentType: 'Bespoke African Gown',
        measurements: {
          shoulder: 42,
          neck: 36,
          bust: 92,
          ankle: 24,
          hip: 96,
          wrist: 16.5,
          sleeve: 60,
          waist: 72,
          back: 40,
          neckToWaist: 41.5,
          neckToAnkle: 135,
        },
      },
      {
        id: 'tmpl-suit',
        label: '14-06-2025 · 2-Piece Suit',
        garmentType: 'Oxford Three Piece Suit',
        measurements: {
          shoulder: 44,
          neck: 38,
          bust: 96,
          ankle: 25,
          hip: 98,
          wrist: 17,
          sleeve: 62,
          waist: 76,
          back: 42,
          neckToWaist: 43,
          neckToAnkle: 138,
        },
      },
      {
        id: 'tmpl-corset',
        label: '02-02-2025 · Corset & Skirt',
        garmentType: 'Silk Evening Corset',
        measurements: {
          shoulder: 41,
          neck: 35,
          bust: 90,
          ankle: 23,
          hip: 94,
          wrist: 16,
          sleeve: 58,
          waist: 68,
          back: 39,
          neckToWaist: 40,
          neckToAnkle: 132,
        },
      },
    ];
  }, [getClientSnapshots, activeClient.id]);

  // State: expanded sheet (Take New Diagram)
  const [isExpanded, setIsExpanded] = useState(false);
  const [paneView, setPaneView] = useState<'mannequin' | 'table'>('mannequin');

  // Form Fields
  const [selectedSavedTemplateId, setSelectedSavedTemplateId] = useState<string>('');
  const [garmentType, setGarmentType] = useState<string>(
    existingOrder?.garmentType || 'Bespoke African Gown'
  );
  const [price, setPrice] = useState<string>(
    existingOrder ? String(existingOrder.price) : '₦130,000'
  );
  const [dueDate, setDueDate] = useState<string>('09/10/2026');
  const [notes, setNotes] = useState<string>(
    existingOrder?.notes || 'Hand stitched, monogram design on wrist and gold buttons'
  );
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>(
    existingOrder?.referenceImages || [
      {
        id: 'ref-default-1',
        url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        title: 'Bespoke Gown Concept',
      },
      {
        id: 'ref-default-2',
        url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=300&q=80',
        title: 'Fabric Swatch',
      },
    ]
  );

  // Diagram & Measurement list state
  const [fields, setFields] = useState<MeasurementFieldItem[]>(ORDER_MEASUREMENT_FIELDS);
  const [hasNewDiagramTaken, setHasNewDiagramTaken] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Save button morphing state: idle | loading | success
  const [saveStatus, setSaveStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [createdToastMessage, setCreatedToastMessage] = useState<string | null>(null);

  // Date picker popover
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);

  // Set Point Size Modal
  const [pointModalData, setPointModalData] = useState<{
    key?: string;
    name: string;
    value: string;
    isCustom?: boolean;
  } | null>(null);
  const [pointModalError, setPointModalError] = useState('');

  // File upload input ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  // Store previously focused element and restore on unmount
  useEffect(() => {
    previouslyFocusedElementRef.current = document.activeElement as HTMLElement | null;
    return () => {
      if (previouslyFocusedElementRef.current) {
        previouslyFocusedElementRef.current.focus();
      }
    };
  }, []);

  // Trap focus and handle Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (pointModalData) {
          setPointModalData(null);
          setPointModalError('');
          return;
        }
        if (isDatePickerOpen) {
          setIsDatePickerOpen(false);
          return;
        }
        onClose();
        return;
      }

      // Simple focus trap inside sheet
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
  }, [pointModalData, isDatePickerOpen, onClose]);

  // When a saved template is selected
  const handleSelectSavedTemplate = (tmplId: string) => {
    setSelectedSavedTemplateId(tmplId);
    setValidationError('');
    const tmpl = savedTemplates.find((t) => t.id === tmplId);
    if (tmpl) {
      setGarmentType(tmpl.garmentType);
      // Update measurement fields
      setFields((prev) =>
        prev.map((f) => {
          const val = tmpl.measurements[f.id];
          return val !== undefined ? { ...f, value: Number(val).toFixed(1) } : f;
        })
      );
    }
  };

  const handleFieldChange = (id: string, value: string) => {
    setFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, value } : f))
    );
    setHasNewDiagramTaken(true);
    setValidationError('');
  };

  const handleRemoveField = (id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
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
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveRefImage = (id: string) => {
    setReferenceImages((prev) => prev.filter((img) => img.id !== id));
  };

  // Open point size modal
  const handleOpenPoint = (key: string, name: string) => {
    const currentField = fields.find((f) => f.id === key);
    setPointModalData({
      key,
      name,
      value: currentField ? currentField.value : '0.0',
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
      setFields((prev) =>
        prev.map((f) =>
          f.id === pointModalData.key
            ? { ...f, value: num.toFixed(1) }
            : f
        )
      );
    } else if (pointModalData.isCustom && pointModalData.name.trim()) {
      const newId = pointModalData.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      setFields((prev) => [
        ...prev,
        {
          id: newId,
          name: pointModalData.name.trim(),
          value: num.toFixed(1),
          unit: 'cm',
        },
      ]);
    }

    setHasNewDiagramTaken(true);
    setValidationError('');
    setPointModalData(null);
    setPointModalError('');
  };

  // Submit order
  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation: order needs measurements, either a chosen saved set or a new diagram
    if (!selectedSavedTemplateId && !hasNewDiagramTaken && !isExpanded) {
      setValidationError('Choose saved measurements or take a new diagram');
      return;
    }

    setValidationError('');
    setSaveStatus('loading');

    setTimeout(() => {
      // Numerical price clean
      const rawPrice = parseFloat(price.replace(/[^0-9.]/g, '')) || 130000;

      // Measurement snapshot object
      const measurementObj: Record<string, number> = {};
      fields.forEach((f) => {
        const val = parseFloat(f.value);
        if (!isNaN(val)) measurementObj[f.id] = val;
      });

      // If user took a new diagram, add snapshot to client record
      let snapshotIdToUse = selectedSavedTemplateId;
      if (hasNewDiagramTaken || isExpanded) {
        const createdSnapshot = addSnapshot({
          clientId: activeClient.id,
          date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-'),
          garmentType: garmentType || 'Bespoke Order',
          unit: 'cm',
          measurements: measurementObj,
          notes: 'Taken from New Order diagram',
        });
        snapshotIdToUse = createdSnapshot.id;
      }

      // Add Order to store
      addOrder({
        clientId: activeClient.id,
        garmentType: garmentType || 'Bespoke African Gown',
        measurementSnapshotId: snapshotIdToUse || undefined,
        price: rawPrice,
        status: 'In Progress' as OrderStatus,
        pickupDateTime: dueDate || '09/10/2026',
        notes,
        referenceImages,
      });

      setSaveStatus('success');
      setCreatedToastMessage('Order created');

      // Close sheet after small success display
      setTimeout(() => {
        onClose();
      }, 700);
    }, 600);
  };

  const getFieldValue = (id: string, fallback: string) => {
    const f = fields.find((item) => item.id === id);
    return f ? `${f.value} cm` : `${fallback} cm`;
  };

  return (
    <>
      {/* =======================================================================
          1. OVERLAY: full-screen rgba(0,0,0,0.5) with backdrop-filter: blur(8px)
          ======================================================================= */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[8px]"
      />

      {/* =======================================================================
          1. SHEET SHELL:
          position: fixed, top: 8px, right: 8px. White fill, radius 8, 8px padding,
          2px gap between its rows, height set by its content with max-height: calc(100vh - 16px).
          Collapsed width: 390px. Expanded width: 815px.
          Grows from right edge towards left.
          ======================================================================= */}
      <motion.div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="New Bespoke Order"
        initial={{ opacity: 0, x: 24 }}
        animate={{ 
          opacity: 1, 
          x: 0,
        }}
        exit={{ 
          opacity: 0, 
          x: 24,
          transition: { duration: 0.15, ease: [0.2, 0, 0, 1] }
        }}
        transition={
          shouldReduceMotion 
            ? { duration: 0.15 } 
            : { type: 'spring', stiffness: 300, damping: 26, mass: 0.9 }
        }
        style={{
          boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.12)',
        }}
        className={cn(
          'fixed z-50 bg-white rounded-[8px] p-2 flex flex-col gap-[2px]',
          'top-2 right-2 max-h-[calc(100vh-16px)] max-w-[calc(100vw-16px)] overflow-hidden transition-[width] duration-300',
          // Desktop widths: 390px collapsed, 815px expanded
          isExpanded ? 'w-[815px]' : 'w-[390px]',
          // Mobile responsive: under 768px bottom sheet up to 92vh tall
          'max-md:top-auto max-md:bottom-0 max-md:left-0 max-md:right-0 max-md:w-full max-md:max-w-none max-md:max-h-[92vh] max-md:rounded-t-[16px] max-md:rounded-b-none'
        )}
      >
        {/* Scrollable Upper Body: holds Mannequin Pane (when expanded) & Form Card */}
        <div className="flex-1 overflow-y-auto pr-0.5">
          <div className={cn(
            'flex gap-[2px] items-start',
            isExpanded ? 'flex-col md:flex-row' : 'flex-col'
          )}>
            
            {/* ===================================================================
                4. EXPANDED MANNEQUIN PANE (410px wide on left when expanded)
                --card fill, radius 6, 12px padding, 612px tall at 1280.
                =================================================================== */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={
                    shouldReduceMotion
                      ? { duration: 0.15 }
                      : { type: 'spring', stiffness: 300, damping: 26, mass: 0.9 }
                  }
                  className="w-full md:w-[410px] md:h-[612px] shrink-0 rounded-[6px] bg-[var(--card)] p-3 flex flex-col gap-3"
                >
                  {/* Inside: white container (radius 8) holding --card area */}
                  <div className="rounded-[8px] bg-white p-[2px] flex-1 flex flex-col h-full overflow-hidden">
                    <div className="rounded-[6px] bg-[var(--card)] p-3 flex-1 flex flex-col gap-4 overflow-hidden">
                      
                      {/* Header row: Mannequin + "All available points • Feminine Form" + Add Point + View Toggle */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-[16px] font-bold text-black leading-tight">
                            Mannequin
                          </h3>
                          <div className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--muted)] mt-1">
                            <span>All available points</span>
                            <span className="w-1 h-1 rounded-full bg-[var(--muted)]" />
                            <span>Feminine Form</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Add Point Outline button */}
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
                            className="h-7 px-2.5 rounded-[24px] border border-[var(--outline)] bg-white text-[12px] font-medium text-black hover:bg-[#F3F3F3] transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3 stroke-[2]" />
                            <span>Add Point</span>
                          </button>

                          {/* View Toggle Group: background --track (#D9D8D8), person active blue circle, clipboard white */}
                          <div className="flex items-center bg-[var(--track)] rounded-[24px] p-0.5 gap-0.5">
                            <button
                              type="button"
                              onClick={() => setPaneView('mannequin')}
                              className={cn(
                                'w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer',
                                paneView === 'mannequin'
                                  ? 'bg-[var(--selected)] text-white shadow-xs'
                                  : 'bg-white text-black hover:text-black/80'
                              )}
                              title="Diagram View"
                            >
                              <User className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setPaneView('table')}
                              className={cn(
                                'w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer',
                                paneView === 'table'
                                  ? 'bg-[var(--selected)] text-white shadow-xs'
                                  : 'bg-white text-black hover:text-black/80'
                              )}
                              title="Measurement List View"
                            >
                              <ClipboardList className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Content: Mannequin SVG or 2-column list */}
                      {paneView === 'mannequin' ? (
                        <div className="flex-1 flex items-center justify-center relative overflow-hidden select-none py-1">
                          <svg
                            viewBox="0 0 304 467"
                            className="w-full max-w-[270px] h-auto max-h-[460px]"
                            style={{ overflow: 'visible' }}
                          >
                            {/* Plain white transparent PNG, zero code alterations */}
                            <image
                              href="/assets/mannequin-female-front.png"
                              x="20.7"
                              y="0"
                              width="262.8"
                              height="467.2"
                              preserveAspectRatio="xMidYMid meet"
                            />

                            {/* Leader lines */}
                            <polyline
                              points="77.5,80.9 145.7,80.9"
                              fill="none"
                              stroke="#079BF8"
                              strokeWidth="1"
                              strokeDasharray="3 3"
                            />
                            <polyline
                              points="178.9,124.0 252.9,124.0"
                              fill="none"
                              stroke="#079BF8"
                              strokeWidth="1"
                              strokeDasharray="3 3"
                            />
                            <polyline
                              points="221.0,185.5 257.3,185.5"
                              fill="none"
                              stroke="#079BF8"
                              strokeWidth="1"
                              strokeDasharray="3 3"
                            />
                            <polyline
                              points="178.9,93.1 210.5,61.5 244.3,61.5"
                              fill="none"
                              stroke="#079BF8"
                              strokeWidth="1"
                              strokeDasharray="3 3"
                            />
                            <polyline
                              points="28.6,177.1 60.2,208.7 119.6,208.7"
                              fill="none"
                              stroke="#079BF8"
                              strokeWidth="1"
                              strokeDasharray="3 3"
                            />
                            <polyline
                              points="178.9,363.9 210.6,393.0 267.8,393.0"
                              fill="none"
                              stroke="#079BF8"
                              strokeWidth="1"
                              strokeDasharray="3 3"
                            />

                            {/* Point markers */}
                            <g className="cursor-pointer" onClick={() => handleOpenPoint('neck', 'Neck')}>
                              <circle cx="145.7" cy="80.9" r="5" fill="rgba(7, 155, 248, 0.15)" stroke="#079BF8" strokeWidth="1" />
                              <circle cx="145.7" cy="80.9" r="2" fill="#079BF8" />
                            </g>
                            <g className="cursor-pointer" onClick={() => handleOpenPoint('shoulder', 'Shoulder')}>
                              <circle cx="178.9" cy="93.1" r="5" fill="rgba(7, 155, 248, 0.15)" stroke="#079BF8" strokeWidth="1" />
                              <circle cx="178.9" cy="93.1" r="2" fill="#079BF8" />
                            </g>
                            <g className="cursor-pointer" onClick={() => handleOpenPoint('bust', 'Bust')}>
                              <circle cx="178.9" cy="124.0" r="5" fill="rgba(7, 155, 248, 0.15)" stroke="#079BF8" strokeWidth="1" />
                              <circle cx="178.9" cy="124.0" r="2" fill="#079BF8" />
                            </g>
                            <g className="cursor-pointer" onClick={() => handleOpenPoint('sleeve', 'Sleeve')}>
                              <circle cx="221.0" cy="185.7" r="5" fill="rgba(7, 155, 248, 0.15)" stroke="#079BF8" strokeWidth="1" />
                              <circle cx="221.0" cy="185.7" r="2" fill="#079BF8" />
                            </g>
                            <g className="cursor-pointer" onClick={() => handleOpenPoint('waist', 'Waist')}>
                              <circle cx="119.6" cy="208.5" r="5" fill="rgba(7, 155, 248, 0.15)" stroke="#079BF8" strokeWidth="1" />
                              <circle cx="119.6" cy="208.5" r="2" fill="#079BF8" />
                            </g>
                            <g className="cursor-pointer" onClick={() => handleOpenPoint('ankle', 'Ankle')}>
                              <circle cx="178.9" cy="363.9" r="5" fill="rgba(7, 155, 248, 0.15)" stroke="#079BF8" strokeWidth="1" />
                              <circle cx="178.9" cy="363.9" r="2" fill="#079BF8" />
                            </g>

                            {/* Labels */}
                            <text
                              x="48.5"
                              y="69.7"
                              fontFamily="var(--font-manrope), sans-serif"
                              fontSize="13"
                              fontWeight="500"
                              fill="#000000"
                              dominantBaseline="hanging"
                              className="cursor-pointer hover:fill-[#079BF8]"
                              onClick={() => handleOpenPoint('neck', 'Neck')}
                            >
                              Neck: {getFieldValue('neck', '36.0')}
                            </text>
                            <text
                              x="0"
                              y="165.5"
                              fontFamily="var(--font-manrope), sans-serif"
                              fontSize="13"
                              fontWeight="500"
                              fill="#000000"
                              dominantBaseline="hanging"
                              className="cursor-pointer hover:fill-[#079BF8]"
                              onClick={() => handleOpenPoint('waist', 'Waist')}
                            >
                              Waist: {getFieldValue('waist', '72.0')}
                            </text>
                            <text
                              x="244.3"
                              y="50.5"
                              fontFamily="var(--font-manrope), sans-serif"
                              fontSize="13"
                              fontWeight="500"
                              fill="#000000"
                              dominantBaseline="hanging"
                              className="cursor-pointer hover:fill-[#079BF8]"
                              onClick={() => handleOpenPoint('shoulder', 'Shoulder')}
                            >
                              Shoulder: {getFieldValue('shoulder', '42.0')}
                            </text>
                            <text
                              x="252.9"
                              y="114.4"
                              fontFamily="var(--font-manrope), sans-serif"
                              fontSize="13"
                              fontWeight="500"
                              fill="#000000"
                              dominantBaseline="hanging"
                              className="cursor-pointer hover:fill-[#079BF8]"
                              onClick={() => handleOpenPoint('bust', 'Bust')}
                            >
                              Bust: {getFieldValue('bust', '92.0')}
                            </text>
                            <text
                              x="259.9"
                              y="175.5"
                              fontFamily="var(--font-manrope), sans-serif"
                              fontSize="13"
                              fontWeight="500"
                              fill="#000000"
                              dominantBaseline="hanging"
                              className="cursor-pointer hover:fill-[#079BF8]"
                              onClick={() => handleOpenPoint('sleeve', 'Sleeve')}
                            >
                              Sleeve: {getFieldValue('sleeve', '60.0')}
                            </text>
                            <text
                              x="271.3"
                              y="383.3"
                              fontFamily="var(--font-manrope), sans-serif"
                              fontSize="13"
                              fontWeight="500"
                              fill="#000000"
                              dominantBaseline="hanging"
                              className="cursor-pointer hover:fill-[#079BF8]"
                              onClick={() => handleOpenPoint('ankle', 'Ankle')}
                            >
                              Ankle: {getFieldValue('ankle', '24.0')}
                            </text>
                          </svg>
                        </div>
                      ) : (
                        /* Measurement List View in 2 Columns here instead of 3 */
                        <div className="flex-1 grid grid-cols-2 gap-2 overflow-y-auto max-h-[460px] pr-1">
                          {fields.map((f) => (
                            <div
                              key={f.id}
                              className="bg-white rounded-[16px] p-2.5 border border-[#EDEDED] flex flex-col justify-between gap-2 shadow-2xs"
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-[13px] font-semibold text-black truncate">
                                  {f.name}
                                </span>
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

            {/* ===================================================================
                2. FORM CARD (always visible; right half when expanded)
                White fill, radius 6, 12px padding, 24px gap between three parts
                =================================================================== */}
            <div className={cn(
              'rounded-[6px] bg-white p-3 flex flex-col gap-6',
              isExpanded ? 'flex-1 md:w-[386px]' : 'w-full'
            )}>
              {/* Part 1: Header - "New Bespoke Order" (20px / 700, black) with 1px --card line under */}
              <div className="pb-2 border-b border-[var(--card)]">
                <h2 className="text-[20px] font-bold text-black leading-tight">
                  New Bespoke Order
                </h2>
              </div>

              {/* Part 2: Content (16px gap) */}
              <div className="flex flex-col gap-4">
                
                {/* 2a. Client summary (8px gap), 3 rows, label left, value right-aligned */}
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

                {/* 2b. Saved Measurements block: --card fill, radius 8, 16px horiz, 12px vert padding, 8px gap */}
                <div className="bg-[var(--card)] rounded-[8px] px-4 py-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-medium text-[var(--muted)]">
                      Saved Measurements
                    </span>
                    {/* Blue text button: "Take New Diagram" or "Hide Diagram" */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsExpanded((prev) => !prev);
                        if (!isExpanded) {
                          setHasNewDiagramTaken(true);
                          setValidationError('');
                        }
                      }}
                      className="text-[12px] font-semibold text-[var(--selected)] hover:underline cursor-pointer"
                    >
                      {isExpanded ? 'Hide Diagram' : 'Take New Diagram'}
                    </button>
                  </div>

                  {/* Full-width select: 1px --track border, radius 24, padding 6px 8px, text 14px --text-2 */}
                  <div className="relative">
                    <select
                      value={selectedSavedTemplateId}
                      onChange={(e) => handleSelectSavedTemplate(e.target.value)}
                      className="w-full h-8 px-3 pr-8 rounded-[24px] border border-[var(--track)] bg-white text-[14px] text-[var(--text-2)] focus:outline-none appearance-none cursor-pointer"
                    >
                      <option value="" disabled>
                        Choose Saved Template
                      </option>
                      {savedTemplates.map((t) => (
                        <option key={t.id} value={t.id} className="text-black">
                          {t.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-[var(--text-2)] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {/* Validation message if needed */}
                  {validationError && (
                    <p className="text-[12px] text-[var(--paused)] font-medium pt-1">
                      {validationError}
                    </p>
                  )}
                </div>

                {/* 2c. White section (radius 8) with white sub-blocks (8px padding each) */}
                <div className="rounded-[8px] bg-white flex flex-col gap-2">
                  
                  {/* Garment Type sits at top of white section, above Style References */}
                  <div className="p-2">
                    <label className="text-[12px] font-medium text-black mb-1 block">
                      Garment Type *
                    </label>
                    <div className="w-full bg-[var(--field-on-card)] border border-[#EDEDED] rounded-[8px] p-2">
                      <input
                        type="text"
                        required
                        value={garmentType}
                        onChange={(e) => setGarmentType(e.target.value)}
                        placeholder="Bespoke African Gown"
                        className="w-full bg-transparent text-[14px] text-black placeholder:text-[var(--muted)] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Style References */}
                  <div className="p-2">
                    <label className="text-[12px] font-medium text-black mb-1 block">
                      Style References
                    </label>
                    {/* Drop zone: 100px tall, 1px dashed --dashed, radius 8 */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-[100px] border border-dashed border-[var(--dashed)] rounded-[8px] flex flex-col items-center justify-center cursor-pointer hover:bg-[#FAFAFA] transition-colors p-2 text-center"
                    >
                      <div className="w-8 h-8 rounded-full bg-[var(--chip)] flex items-center justify-center">
                        <Upload className="w-4 h-4 text-[var(--text-2)]" />
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

                    {/* Uploaded thumbnails */}
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

                  {/* Price and Due Date: 2 equal columns, 8px gap */}
                  <div className="p-2 grid grid-cols-2 gap-2">
                    {/* Price */}
                    <div>
                      <label className="text-[12px] font-medium text-black mb-1 block">
                        Price (₦)
                      </label>
                      <div className="w-full bg-[var(--field-on-card)] border border-[#EDEDED] rounded-[8px] p-2">
                        <input
                          type="text"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          placeholder="₦0.00"
                          className="w-full bg-transparent text-[14px] text-black placeholder:text-[var(--muted)] focus:outline-none tabular-nums"
                        />
                      </div>
                    </div>

                    {/* Due Date with calendar icon opening picker */}
                    <div className="relative" ref={datePickerRef}>
                      <label className="text-[12px] font-medium text-black mb-1 block">
                        Due Date
                      </label>
                      <div className="w-full bg-[var(--field-on-card)] border border-[#EDEDED] rounded-[8px] p-2 flex items-center justify-between">
                        <input
                          type="text"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          placeholder="09/10/2026"
                          className="w-full bg-transparent text-[14px] text-black placeholder:text-[var(--muted)] focus:outline-none tabular-nums"
                        />
                        <button
                          type="button"
                          onClick={() => setIsDatePickerOpen((prev) => !prev)}
                          className="text-[var(--text-2)] hover:text-black p-0.5 cursor-pointer shrink-0 transition-colors"
                          title="Pick due date"
                        >
                          <CalendarIcon className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Date Picker Popover */}
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
                                className="text-[var(--text-2)] hover:text-black p-0.5 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="grid grid-cols-3 gap-1.5 pt-1">
                              {['09/10/2026', '16/10/2026', '23/10/2026', '30/10/2026', '06/11/2026', '13/11/2026'].map((d) => (
                                <button
                                  key={d}
                                  type="button"
                                  onClick={() => {
                                    setDueDate(d);
                                    setIsDatePickerOpen(false);
                                  }}
                                  className={cn(
                                    'py-1 px-1.5 rounded-[6px] text-[11px] font-medium border text-center transition-colors cursor-pointer',
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

                  {/* Notes: textarea 120px tall */}
                  <div className="p-2">
                    <label className="text-[12px] font-medium text-black mb-1 block">
                      Workroom notes and fabric details
                    </label>
                    <div className="w-full bg-[var(--field-on-card)] border border-[#EDEDED] rounded-[8px] p-2">
                      <textarea
                        rows={4}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="e.g hand stiched, monogram design on wrist and gold buttons"
                        className="w-full h-[100px] bg-transparent text-[14px] text-black placeholder:text-[var(--muted)] focus:outline-none resize-none"
                      />
                    </div>
                  </div>

                </div>

              </div>

            </div>

          </div>
        </div>

        {/* =======================================================================
            3. FOOTER STRIP
            Full width, padding 8px 16px, content right-aligned, containing
            the primary button "Create Order" (floppy-disk icon 16px, 4px gap,
            padding 6px 8px, radius 24, --primary fill, white 14px / 500 text).
            Uses morphing behavior: idle, loading, success.
            ======================================================================= */}
        <div className="w-full px-4 py-2 flex items-center justify-end border-t border-[#EDEDED] bg-white rounded-b-[8px]">
          <motion.button
            type="button"
            whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
            onClick={handleCreateOrder}
            disabled={saveStatus !== 'idle'}
            className={cn(
              'h-9 px-3.5 py-1.5 rounded-[24px] bg-[var(--primary)] text-white text-[14px] font-medium flex items-center gap-1 cursor-pointer shadow-xs transition-all',
              saveStatus === 'success' && 'bg-[var(--completed)]'
            )}
          >
            {saveStatus === 'idle' && (
              <>
                <Save className="w-4 h-4 stroke-[2]" />
                <span>Create Order</span>
              </>
            )}
            {saveStatus === 'loading' && (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating Order...</span>
              </>
            )}
            {saveStatus === 'success' && (
              <>
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Order Created</span>
              </>
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* =======================================================================
          SET POINT SIZE DIALOG (Appears above the sheet, z-60)
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
              style={{
                boxShadow: '-1px 3px 4.2px rgba(182, 182, 182, 0.15)',
              }}
              className="relative w-[400px] max-w-[calc(100vw-32px)] rounded-[16px] bg-white p-6 z-10 flex flex-col gap-6"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 id="order-point-dialog-title" className="text-[16px] font-bold text-black">
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
