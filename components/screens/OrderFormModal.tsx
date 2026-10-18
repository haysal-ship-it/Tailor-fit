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
  { id: 'thigh', name: 'Thigh', value: '54.0', unit: 'cm' },
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
    addOrder, 
    addSnapshot,
    getClientSnapshots 
  } = useStore();
  const shouldReduceMotion = useReducedMotion();

  const existingOrder = orderId ? orders.find((o) => o.id === orderId) : null;

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

  // Visual viewport resize listener for mobile virtual keyboard
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
    return [
      {
        id: 'tmpl-gown',
        label: '09-10-2025 · Gown/Dress',
        garmentType: 'Bespoke African Gown',
        measurements: {
          shoulder: 42,
          neck: 36,
          bust: 92,
          thigh: 54,
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
          thigh: 56,
          hip: 98,
          wrist: 17,
          sleeve: 62,
          waist: 76,
          back: 42,
          neckToWaist: 43,
          neckToAnkle: 138,
        },
      },
    ];
  }, [getClientSnapshots, activeClient.id]);

  // Desktop states
  const [isExpanded, setIsExpanded] = useState(false);
  const [paneView, setPaneView] = useState<'mannequin' | 'table'>('mannequin');

  // Mobile subscreen state: 'form' | 'mannequin'
  const [mobileSubScreen, setMobileSubScreen] = useState<'form' | 'mannequin'>('form');

  // FORM STARTS COMPLETELY EMPTY as specified
  const [selectedSavedTemplateId, setSelectedSavedTemplateId] = useState<string>('');
  const [garmentType, setGarmentType] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);

  // Diagram & Measurement list state
  const [fields, setFields] = useState<MeasurementFieldItem[]>(ORDER_MEASUREMENT_FIELDS);
  const [hasDiagramEdited, setHasDiagramEdited] = useState(false);
  const [measurementValidationError, setMeasurementValidationError] = useState('');
  const [garmentTypeValidationError, setGarmentTypeValidationError] = useState('');

  // Discard Confirmation Dialog state
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const savedMeasurementsBlockRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  // Compute dirty state
  const isDirty = () => {
    return (
      garmentType.trim() !== '' ||
      price.trim() !== '' ||
      dueDate.trim() !== '' ||
      notes.trim() !== '' ||
      referenceImages.length > 0 ||
      selectedSavedTemplateId !== '' ||
      hasDiagramEdited
    );
  };

  const handleRequestClose = () => {
    if (isDirty()) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  // Restore focus on close
  useEffect(() => {
    previouslyFocusedElementRef.current = document.activeElement as HTMLElement | null;
    return () => {
      if (previouslyFocusedElementRef.current) {
        previouslyFocusedElementRef.current.focus();
      }
    };
  }, []);

  // Lock background scroll on mobile while open
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
  }, [pointModalData, isDatePickerOpen, showDiscardConfirm, garmentType, price, dueDate, notes, referenceImages, selectedSavedTemplateId, hasDiagramEdited]);

  // Choose saved template
  const handleSelectSavedTemplate = (tmplId: string) => {
    setSelectedSavedTemplateId(tmplId);
    setMeasurementValidationError('');
    const tmpl = savedTemplates.find((t) => t.id === tmplId);
    if (tmpl) {
      setGarmentType(tmpl.garmentType);
      setGarmentTypeValidationError('');
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

    setHasDiagramEdited(true);
    setMeasurementValidationError('');
    setPointModalData(null);
    setPointModalError('');
  };

  // Submit order
  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();

    let hasError = false;

    // Garment Type validation
    if (!garmentType.trim()) {
      setGarmentTypeValidationError('Garment type is required');
      hasError = true;
    } else {
      setGarmentTypeValidationError('');
    }

    // Measurements validation
    if (!selectedSavedTemplateId && !hasDiagramEdited) {
      setMeasurementValidationError('Choose saved measurements or take a new diagram');
      if (savedMeasurementsBlockRef.current) {
        savedMeasurementsBlockRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
        if (!isNaN(val)) measurementObj[f.id] = val;
      });

      let snapshotIdToUse = selectedSavedTemplateId;
      if (hasDiagramEdited) {
        const createdSnapshot = addSnapshot({
          clientId: activeClient.id,
          date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-'),
          garmentType: garmentType.trim() || 'Bespoke Order',
          unit: 'cm',
          measurements: measurementObj,
          notes: 'Taken from New Order diagram',
        });
        snapshotIdToUse = createdSnapshot.id;
      }

      addOrder({
        clientId: activeClient.id,
        garmentType: garmentType.trim() || 'Bespoke Order',
        measurementSnapshotId: snapshotIdToUse || undefined,
        price: rawPrice,
        status: 'In Progress' as OrderStatus,
        pickupDateTime: dueDate || new Date().toISOString().slice(0, 10),
        notes,
        referenceImages,
      });

      setSaveStatus('success');
      setCreatedToastMessage('Order created');

      setTimeout(() => {
        onClose();
      }, 700);
    }, 600);
  };

  // Shared Mannequin SVG Diagram component
  const renderMannequinSvg = (isMobileView = false) => {
    return (
      <svg
        viewBox="0 0 304 467"
        className={cn(
          'w-full max-h-[467px] select-none',
          isMobileView ? 'max-w-full' : 'max-w-[304px]'
        )}
        style={{ overflow: 'visible' }}
        preserveAspectRatio="xMidYMid meet"
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

        {/* Leader lines */}
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

        {/* Six Point Markers (Neck, Shoulder, Bust, Waist, Sleeve, Thigh) with generous 44px hit circles */}
        {/* Neck */}
        <g className="cursor-pointer group" onClick={() => handleOpenPoint('neck', 'Neck')}>
          <circle cx="145.7" cy="80.9" r="22" fill="transparent" />
          <circle cx="145.7" cy="80.9" r="5" fill="rgba(7, 155, 248, 0.15)" stroke="#079BF8" strokeWidth="1" />
          <circle cx="145.7" cy="80.9" r="2" fill="#079BF8" />
        </g>
        {/* Shoulder */}
        <g className="cursor-pointer group" onClick={() => handleOpenPoint('shoulder', 'Shoulder')}>
          <circle cx="178.9" cy="93.1" r="22" fill="transparent" />
          <circle cx="178.9" cy="93.1" r="5" fill="rgba(7, 155, 248, 0.15)" stroke="#079BF8" strokeWidth="1" />
          <circle cx="178.9" cy="93.1" r="2" fill="#079BF8" />
        </g>
        {/* Bust */}
        <g className="cursor-pointer group" onClick={() => handleOpenPoint('bust', 'Bust')}>
          <circle cx="178.9" cy="124.0" r="22" fill="transparent" />
          <circle cx="178.9" cy="124.0" r="5" fill="rgba(7, 155, 248, 0.15)" stroke="#079BF8" strokeWidth="1" />
          <circle cx="178.9" cy="124.0" r="2" fill="#079BF8" />
        </g>
        {/* Sleeve */}
        <g className="cursor-pointer group" onClick={() => handleOpenPoint('sleeve', 'Sleeve')}>
          <circle cx="221.0" cy="185.7" r="22" fill="transparent" />
          <circle cx="221.0" cy="185.7" r="5" fill="rgba(7, 155, 248, 0.15)" stroke="#079BF8" strokeWidth="1" />
          <circle cx="221.0" cy="185.7" r="2" fill="#079BF8" />
        </g>
        {/* Waist */}
        <g className="cursor-pointer group" onClick={() => handleOpenPoint('waist', 'Waist')}>
          <circle cx="119.6" cy="208.5" r="22" fill="transparent" />
          <circle cx="119.6" cy="208.5" r="5" fill="rgba(7, 155, 248, 0.15)" stroke="#079BF8" strokeWidth="1" />
          <circle cx="119.6" cy="208.5" r="2" fill="#079BF8" />
        </g>
        {/* Thigh (replaces Ankle) */}
        <g className="cursor-pointer group" onClick={() => handleOpenPoint('thigh', 'Thigh')}>
          <circle cx="178.9" cy="363.9" r="22" fill="transparent" />
          <circle cx="178.9" cy="363.9" r="5" fill="rgba(7, 155, 248, 0.15)" stroke="#079BF8" strokeWidth="1" />
          <circle cx="178.9" cy="363.9" r="2" fill="#079BF8" />
        </g>

        {/* Labels show the point name only (Manrope 500, 13px, black) */}
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
    );
  };

  return (
    <>
      {/* =======================================================================
          OVERLAY:
          Desktop: rgba(0,0,0,0.5) with backdrop-filter: blur(8px)
          Mobile: rgba(0,0,0,0.5) with backdrop-filter: blur(4px)
          ======================================================================= */}
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

      {/* =======================================================================
          SHELL CONTAINER:
          PART 1: Desktop (>= 1024px) right-docked sheet (390px / 815px)
          PART 2: Mobile / Tablet (< 1024px) bottom sheet (up to 640px wide, max 92dvh)
          ======================================================================= */}
      {isDesktop ? (
        /* DESKTOP RIGHT-DOCKED SHEET */
        <motion.div
          ref={sheetRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-order-sheet-title"
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: 24 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: 24, transition: { duration: 0.15, ease: [0.2, 0, 0, 1] } }}
          transition={{ type: 'spring', stiffness: 300, damping: 26, mass: 0.9 }}
          style={{
            boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.12)',
            width: isExpanded ? 815 : 390,
          }}
          className="fixed z-50 bg-white rounded-[8px] p-2 flex flex-col top-2 right-2 max-h-[calc(100dvh-16px)] h-fit transition-[width] duration-300"
        >
          {/* Panes Row: flex: 1; min-height: 0; stretch heights */}
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
                    <div className="rounded-[6px] bg-[#F8F8F8] py-3 px-3 flex-1 flex flex-col gap-6">
                      
                      {/* Pane header: Title "Mannequin" (16px / 700) with subtitle on ONE line */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[16px] font-bold text-black leading-tight truncate">
                            Mannequin
                          </h3>
                          <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#A2A2A2] mt-1 whitespace-nowrap">
                            <span>All available points</span>
                            <span className="w-1 h-1 rounded-full bg-[#A2A2A2] shrink-0" />
                            <span>Feminine Form</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* Add Point outline button with NO plus icon */}
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
                            className="h-7 px-3 rounded-[24px] border border-[var(--outline)] bg-white text-[12px] font-medium text-black hover:bg-[#F3F3F3] transition-colors cursor-pointer"
                          >
                            Add Point
                          </button>

                          {/* View Toggle Group (#D9D8D8 track, blue circle for active item) */}
                          <div className="flex items-center bg-[#D9D8D8] rounded-[24px] p-0.5 gap-0.5">
                            <button
                              type="button"
                              onClick={() => setPaneView('mannequin')}
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
                      ) : (
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

            {/* Form Card (always visible; equal stretch height on desktop) */}
            <div className={cn(
              'rounded-[6px] bg-white p-3 flex flex-col gap-6 overflow-y-auto self-stretch',
              isExpanded ? 'w-[386px]' : 'w-full'
            )}>
              {/* Header: "New Bespoke Order" (20px / 700, black) with 1px --card line under */}
              <div className="pb-2 border-b border-[var(--card)]">
                <h2 id="new-order-sheet-title" className="text-[20px] font-bold text-black leading-tight">
                  New Bespoke Order
                </h2>
              </div>

              {/* Form Content */}
              <div className="flex flex-col gap-4">
                
                {/* Client summary */}
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

                {/* Saved Measurements block */}
                <div ref={savedMeasurementsBlockRef} className="bg-[var(--card)] rounded-[8px] px-4 py-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-medium text-[var(--muted)]">
                      Saved Measurements
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsExpanded((prev) => !prev);
                        if (!isExpanded) {
                          setHasDiagramEdited(true);
                          setMeasurementValidationError('');
                        }
                      }}
                      className="text-[12px] font-semibold text-[var(--selected)] hover:underline cursor-pointer"
                    >
                      {isExpanded ? 'Hide Diagram' : hasDiagramEdited ? 'Edit Diagram' : 'Take New Diagram'}
                    </button>
                  </div>

                  {/* Select */}
                  <div className="relative">
                    <select
                      value={selectedSavedTemplateId}
                      onChange={(e) => handleSelectSavedTemplate(e.target.value)}
                      className="w-full h-8 px-3 pr-8 rounded-[24px] border border-[var(--track)] bg-white text-[14px] text-[var(--text-2)] focus:outline-none appearance-none cursor-pointer"
                    >
                      <option value="">
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

                  {measurementValidationError && (
                    <p className="text-[12px] text-[var(--paused)] font-medium pt-1">
                      {measurementValidationError}
                    </p>
                  )}
                </div>

                {/* White section with sub-blocks */}
                <div className="rounded-[8px] bg-white flex flex-col gap-2">
                  
                  {/* Garment Type: NO asterisk */}
                  <div className="p-2">
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

                  {/* Style References with cloud-upload icon and EMPTY thumbnails initially */}
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

          {/* Footer strip: plain strip, padding 8px 16px, content right-aligned, NO horizontal line above it */}
          <div className="w-full px-4 py-2 flex items-center justify-end bg-white rounded-b-[8px]">
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
            if (scrollContainerRef.current && scrollContainerRef.current.scrollTop > 5) return;
            if (info.offset.y > 120 || info.velocity.y > 600) {
              handleRequestClose();
            }
          }}
          initial={shouldReduceMotion ? { opacity: 0 } : { y: '100%' }}
          animate={shouldReduceMotion ? { opacity: 1 } : { y: 0 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { y: '100%', transition: { duration: 0.2 } }}
          transition={{ type: 'spring', stiffness: 320, damping: 34, mass: 0.9 }}
          style={{
            maxHeight: visualViewportHeight ? `${visualViewportHeight - 8}px` : '92dvh',
          }}
          className={cn(
            'fixed left-0 right-0 bottom-0 z-50 mx-auto w-full max-w-[640px] bg-white flex flex-col',
            'rounded-t-[16px] sm:rounded-[16px] sm:mb-2 md:mb-4 shadow-2xl overflow-hidden'
          )}
        >
          {/* Part A: 40x4px #D9D8D8 pill inside 24px-tall drag area */}
          <div className="w-full h-6 flex items-center justify-center pt-2 cursor-grab active:cursor-grabbing shrink-0 select-none">
            <div className="w-10 h-1 rounded-full bg-[#D9D8D8]" />
          </div>

          {/* Part B: Header row (padding 8px 16px 12px) with 1px #F8F8F8 line under */}
          <div className="px-4 pt-2 pb-3 border-b border-[#F8F8F8] shrink-0">
            {mobileSubScreen === 'form' ? (
              <h2 id="new-order-sheet-title-mobile" className="text-[20px] font-bold text-black leading-tight">
                New Bespoke Order
              </h2>
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
                    <span>All available points</span>
                    <span className="w-1 h-1 rounded-full bg-[#A2A2A2] shrink-0" />
                    <span>Feminine Form</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Content Area with slide transition between Form & Mannequin */}
          <div
            ref={scrollContainerRef}
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4"
          >
            {mobileSubScreen === 'form' ? (
              <div className="flex flex-col gap-4">
                
                {/* Client summary: below 480px stack label above value */}
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
                    <span className="text-[16px] font-semibold text-black break-all" style={{ overflowWrap: 'anywhere' }}>
                      {activeClient.email}
                    </span>
                  </div>
                </div>

                {/* Saved Measurements block */}
                <div ref={savedMeasurementsBlockRef} className="bg-[var(--card)] rounded-[8px] px-4 py-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between min-h-[44px]">
                    <span className="text-[12px] font-medium text-[var(--muted)]">
                      Saved Measurements
                    </span>
                    <button
                      type="button"
                      onClick={() => setMobileSubScreen('mannequin')}
                      className="text-[14px] font-semibold text-[var(--selected)] hover:underline cursor-pointer min-h-[44px] flex items-center"
                    >
                      {hasDiagramEdited ? 'Edit Diagram' : 'Take New Diagram'}
                    </button>
                  </div>

                  {/* Native 48px <select> */}
                  <div className="relative">
                    <select
                      value={selectedSavedTemplateId}
                      onChange={(e) => handleSelectSavedTemplate(e.target.value)}
                      className="w-full h-12 px-3 pr-8 rounded-[24px] border border-[var(--track)] bg-white text-[16px] text-[var(--text-2)] focus:outline-none appearance-none cursor-pointer"
                    >
                      <option value="">
                        Choose Saved Template
                      </option>
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

                {/* Garment Type */}
                <div>
                  <label className="text-[12px] font-medium text-black mb-1 block">
                    Garment Type
                  </label>
                  <div className="w-full bg-[var(--field-on-card)] border border-[#EDEDED] rounded-[8px] px-3 h-12 flex items-center">
                    <input
                      type="text"
                      value={garmentType}
                      onFocus={(e) => e.target.scrollIntoView({ block: 'center', behavior: 'smooth' })}
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

                {/* Style References */}
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
                            className="absolute top-1 right-1 w-11 h-11 flex items-center justify-center bg-black/60 text-white rounded-full cursor-pointer"
                            title="Remove"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Price and Due Date: 2 columns when >= 400px, otherwise stacked */}
                <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[12px] font-medium text-black mb-1 block">
                      Price (₦)
                    </label>
                    <div className="w-full bg-[var(--field-on-card)] border border-[#EDEDED] rounded-[8px] px-3 h-12 flex items-center">
                      <input
                        type="text"
                        value={price}
                        onFocus={(e) => e.target.scrollIntoView({ block: 'center', behavior: 'smooth' })}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="₦0.00"
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
                        onFocus={(e) => e.target.scrollIntoView({ block: 'center', behavior: 'smooth' })}
                        onChange={(e) => setDueDate(e.target.value)}
                        placeholder="09/10/2026"
                        className="w-full bg-transparent text-[16px] text-black placeholder:text-[var(--muted)] focus:outline-none tabular-nums"
                      />
                      <button
                        type="button"
                        onClick={() => setIsDatePickerOpen((prev) => !prev)}
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
                          className="absolute bottom-full right-0 mb-2 w-64 bg-white border border-[var(--outline)] rounded-[12px] p-3 shadow-xl z-30"
                        >
                          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--outline)]">
                            <span className="text-[13px] font-bold text-[var(--text-strong)]">
                              October 2026
                            </span>
                            <button
                              type="button"
                              onClick={() => setIsDatePickerOpen(false)}
                              className="text-[var(--text-2)] hover:text-black p-1 cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            {['09/10/2026', '16/10/2026', '23/10/2026', '30/10/2026'].map((d) => (
                              <button
                                key={d}
                                type="button"
                                onClick={() => {
                                  setDueDate(d);
                                  setIsDatePickerOpen(false);
                                }}
                                className="py-2 px-2 rounded-[8px] text-[13px] font-medium border text-center transition-colors bg-[var(--card)] text-black border-[#EDEDED]"
                              >
                                {d}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-[12px] font-medium text-black mb-1 block">
                    Workroom notes and fabric details
                  </label>
                  <div className="w-full bg-[var(--field-on-card)] border border-[#EDEDED] rounded-[8px] p-3">
                    <textarea
                      rows={4}
                      value={notes}
                      onFocus={(e) => e.target.scrollIntoView({ block: 'center', behavior: 'smooth' })}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g hand stiched, monogram design on wrist and gold buttons"
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
                {/* Toolbar row */}
                <div className="flex items-center gap-2">
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
                    className="flex-1 h-11 px-4 rounded-[24px] border border-[var(--outline)] bg-white text-[14px] font-medium text-black hover:bg-[#F3F3F3] transition-colors cursor-pointer"
                  >
                    Add Point
                  </button>

                  <div className="flex items-center bg-[#D9D8D8] rounded-[24px] p-1 gap-1">
                    <button
                      type="button"
                      onClick={() => setPaneView('mannequin')}
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

          {/* Sticky footer */}
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
                      <span>Create Order</span>
                    </>
                  )}
                  {saveStatus === 'loading' && (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Creating Order...</span>
                    </>
                  )}
                  {saveStatus === 'success' && (
                    <>
                      <Check className="w-5 h-5 stroke-[2.5]" />
                      <span>Order Created</span>
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

      {/* =======================================================================
          DISCARD CONFIRMATION DIALOG (Close safety)
          ======================================================================= */}
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
                Discard this order?
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
