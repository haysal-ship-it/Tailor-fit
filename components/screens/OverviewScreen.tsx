'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useStore } from '@/lib/store';
import {
  PersonStanding,
  ClipboardList,
  ChevronRight,
  ChevronLeft,
  X,
  Check,
  Calendar as CalendarIcon,
  House,
  UsersRound,
  Settings,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { ToastContainer, type ToastMessage } from '@/components/ui/Toasts';
import { springSmooth, springSnappy } from '@/lib/motion-tokens';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { MorphingSaveButton } from '@/components/ui/MorphingSaveButton';
import { AnimatedFileUpload } from '@/components/ui/AnimatedFileUpload';
import { OrigamiTailorFitLogo } from '@/components/Navbar';
import { NotificationDropdown } from '@/components/ui/NotificationDropdown';
import { RotatableMannequin } from '@/components/mannequin/RotatableMannequin';
import {
  ANATOMICAL_ZONES,
  getZoneLabel,
  normalizeZoneId,
  resolveCanonicalKey,
} from '@/lib/initial-data';
import { cn } from '@/lib/utils';

interface CalendarOrderItem {
  client: string;
  garment: string;
  time: string;
  status: 'pending' | 'completed' | 'paused';
}

interface OverviewScreenProps {
  onOpenClient: (clientId: string) => void;
  onOpenOrder?: (orderId: string, clientId?: string) => void;
}

export function OverviewScreen({ onOpenClient, onOpenOrder }: OverviewScreenProps) {
  const {
    addClient,
    addOrder,
    addSnapshot,
    orders,
    clients,
    settings,
    allHotspots,
    deleteTemplate,
    setActiveScreen,
  } = useStore();
  const shouldReduceMotion = useReducedMotion();
  const unitLabel = settings?.defaultUnit || 'cm';
  const currencySymbol = settings?.currency || '₦';

  // Responsive check for 1024px breakpoint via useSyncExternalStore
  const isDesktop = React.useSyncExternalStore(
    (callback) => {
      if (typeof window === 'undefined') return () => {};
      const mq = window.matchMedia('(min-width: 1024px)');
      mq.addEventListener('change', callback);
      return () => mq.removeEventListener('change', callback);
    },
    () => (typeof window !== 'undefined' ? window.matchMedia('(min-width: 1024px)').matches : true),
    () => true
  );

  // New Client Intake form state
  const [clientName, setClientName] = useState('');
  const [clientGarment, setClientGarment] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPrice, setClientPrice] = useState('');
  const [clientDueDate, setClientDueDate] = useState('');
  const [clientNotes, setClientNotes] = useState('');
  const [styleImages, setStyleImages] = useState<string[]>([]);
  const [clientFormErrors, setClientFormErrors] = useState<{
    name?: string;
    phone?: string;
    email?: string;
    garment?: string;
  }>({});

  const clientNameInputRef = useRef<HTMLInputElement>(null);
  const clientPhoneInputRef = useRef<HTMLInputElement>(null);
  const clientEmailInputRef = useRef<HTMLInputElement>(null);
  const clientGarmentInputRef = useRef<HTMLInputElement>(null);

  // System toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const showToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
  };
  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Mannequin state: F is selected by default
  const [gender, setGender] = useState<'male' | 'female'>('female');
  const [centerView, setCenterView] = useState<'mannequin' | 'table'>('mannequin');

  /**
   * Requirement D: Touchpoints ONLY show when user adds a point OR chooses a saved template.
   * Otherwise, the empty state of only the mannequin is visible.
   */
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedTemplateName, setSelectedTemplateName] = useState<string>('');
  const [dialogSelectedTemplateId, setDialogSelectedTemplateId] = useState<string>('');
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  // Active point keys currently placed on the mannequin & list view (starts EMPTY per Requirement D)
  const [activePointKeys, setActivePointKeys] = useState<string[]>([]);

  // Measurements state: single source of truth for both diagram points and list view
  const [measurements, setMeasurements] = useState<Record<string, number>>({});

  // Undo toast when a field is removed
  const [undoToast, setUndoToast] = useState<{
    key: string;
    label: string;
    value?: number;
  } | null>(null);
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Input refs for Enter key navigation in list view
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Focus trap refs
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const templateDialogRef = useRef<HTMLDivElement | null>(null);
  const pointDialogRef = useRef<HTMLDivElement | null>(null);

  /**
   * Requirement C & D:
   * - Mode 'edit': Tapping an existing touchpoint opens a modal to update ONLY the size value (read-only name).
   * - Mode 'add': Clicking "Add Point" opens a modal to choose a measurement from the 21 standard sizing items + set its size.
   */
  const [pointModalData, setPointModalData] = useState<{
    mode: 'edit' | 'add';
    key: string;
    name: string;
    zone: string;
    value: string;
  } | null>(null);
  const [pointModalError, setPointModalError] = useState<string>('');

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

  // Grouped hotspots for the "Add Point" modal selector
  const hotspotsByZone = useMemo(() => {
    return ANATOMICAL_ZONES.map((zone) => ({
      ...zone,
      items: allHotspots.filter((h) => normalizeZoneId(h.category) === zone.id),
    }));
  }, [allHotspots]);

  // Templates from global store (Requirement B)
  const storeTemplates = useMemo(() => {
    return settings?.templates || [];
  }, [settings?.templates]);

  // Calendar state
  const [viewDate, setViewDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [activeDatePopover, setActiveDatePopover] = useState<number | null>(null);

  const calendarYear = viewDate.getFullYear();
  const calendarMonth = viewDate.getMonth();
  const calendarOffset = (new Date(calendarYear, calendarMonth, 1).getDay() + 6) % 7;
  const calendarDaysCount = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const todayWeekdayIndex = (new Date().getDay() + 6) % 7;
  const calendarMonthLabel = new Intl.DateTimeFormat('en-GB', {
    month: 'long',
    year: 'numeric',
  }).format(viewDate);

  // Status dots on calendar
  const getOrdersForDay = (day: number) => {
    const dayOrders: CalendarOrderItem[] = [];

    if (calendarYear === 2026 && calendarMonth === 9) {
      if (day === 10) {
        dayOrders.push({
          client: 'Chloe Dallas',
          garment: 'Bespoke African Gown',
          time: '10:00 AM',
          status: 'pending',
        });
      } else if (day === 17) {
        dayOrders.push({
          client: 'Taylor Razaq',
          garment: 'Bespoke African Gown',
          time: '02:30 PM',
          status: 'completed',
        });
      } else if (day === 22) {
        dayOrders.push({
          client: 'Bryan Muhammed',
          garment: 'Bespoke African Gown',
          time: '04:15 PM',
          status: 'paused',
        });
      }
    }

    if (orders && orders.length > 0) {
      for (const ord of orders) {
        if (!ord.pickupDateTime) continue;
        const d = new Date(ord.pickupDateTime);
        if (
          d.getFullYear() === calendarYear &&
          d.getMonth() === calendarMonth &&
          d.getDate() === day
        ) {
          const clientObj = clients?.find((c) => c.id === ord.clientId);
          const cName = clientObj?.name || 'Client';
          const rawStatus = (ord.status || '').toLowerCase();
          let normalizedStatus: 'pending' | 'completed' | 'paused' = 'pending';
          if (rawStatus.includes('complete') || rawStatus === 'ready')
            normalizedStatus = 'completed';
          else if (rawStatus.includes('pause')) normalizedStatus = 'paused';

          const hours = d.getHours();
          const minutes = d.getMinutes();
          const ampm = hours >= 12 ? 'PM' : 'AM';
          const displayHours = hours % 12 || 12;
          const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
          const timeStr = `${String(displayHours).padStart(2, '0')}:${displayMinutes} ${ampm}`;

          dayOrders.push({
            client: cName,
            garment: ord.garmentType || 'Garment',
            time: timeStr,
            status: normalizedStatus,
          });
        }
      }
    }

    return dayOrders;
  };

  // Due Date popover state
  const [isDueDatePickerOpen, setIsDueDatePickerOpen] = useState(false);
  const dueDatePickerRef = useRef<HTMLDivElement>(null);

  // Handle Escape key to close modals and popovers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (pointModalData) {
          setPointModalData(null);
          setPointModalError('');
          if (triggerRef.current) triggerRef.current.focus();
        }
        if (isTemplateModalOpen) {
          setIsTemplateModalOpen(false);
          if (triggerRef.current) triggerRef.current.focus();
        }
        setActiveDatePopover(null);
        setIsDueDatePickerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pointModalData, isTemplateModalOpen]);

  const isPointModalOpen = Boolean(pointModalData);

  // Focus trap inside active modal
  useEffect(() => {
    if (isTemplateModalOpen || isPointModalOpen) {
      const activeRef = isTemplateModalOpen ? templateDialogRef : pointDialogRef;
      const handleTab = (e: KeyboardEvent) => {
        if (e.key !== 'Tab' || !activeRef.current) return;
        const focusables = activeRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      };
      window.addEventListener('keydown', handleTab);
      return () => window.removeEventListener('keydown', handleTab);
    }
  }, [isTemplateModalOpen, isPointModalOpen]);

  // Click outside to close Due Date popover
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dueDatePickerRef.current && !dueDatePickerRef.current.contains(e.target as Node)) {
        setIsDueDatePickerOpen(false);
      }
    };
    if (isDueDatePickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDueDatePickerOpen]);

  // Apply a selected Garment Blueprint template (Requirement D)
  const applyTemplateById = (tmplId: string) => {
    const tmpl = storeTemplates.find((t) => t.id === tmplId);
    if (!tmpl) return;

    const canonicalKeys = Array.from(
      new Set((tmpl.fieldKeys || []).map((k) => resolveCanonicalKey(k)))
    );

    setSelectedTemplateId(tmpl.id);
    setSelectedTemplateName(tmpl.name);
    if (!clientGarment.trim()) {
      setClientGarment(tmpl.name);
    }
    setActivePointKeys(canonicalKeys);

    // Populate default or existing values for each template field
    setMeasurements((prev) => {
      const next = { ...prev };
      canonicalKeys.forEach((k) => {
        if (next[k] === undefined) {
          const defaultCm = hotspotMap[k]?.defaultValCm ?? 40;
          next[k] =
            unitLabel === 'in'
              ? parseFloat((defaultCm / 2.54).toFixed(1))
              : defaultCm;
        }
      });
      return next;
    });
  };

  // Requirement C: Tap on an active mannequin touchpoint opens modal to edit ONLY its size
  const handleOpenPoint = (key: string, name: string) => {
    const canonical = resolveCanonicalKey(key);
    const meta = hotspotMap[canonical];
    triggerRef.current = document.activeElement as HTMLButtonElement;
    const currentVal =
      measurements[canonical] !== undefined ? String(measurements[canonical]) : '';
    setPointModalError('');
    setPointModalData({
      mode: 'edit',
      key: canonical,
      name: meta?.label || name,
      zone: meta?.zone || 'Torso',
      value: currentVal,
    });
  };

  // Requirement D: Clicking "Add Point" opens modal to select from the 21 standard measurements
  const handleOpenAddPoint = () => {
    triggerRef.current = document.activeElement as HTMLButtonElement;
    // Default to first unadded measurement, or first overall
    const firstUnadded =
      allHotspots.find((h) => !activePointKeys.includes(h.key)) || allHotspots[0];
    const key = firstUnadded?.key || 'neck_circumference';
    const existingVal =
      measurements[key] !== undefined ? String(measurements[key]) : '';
    setPointModalError('');
    setPointModalData({
      mode: 'add',
      key,
      name: firstUnadded?.label || 'Neck circumference',
      zone: firstUnadded ? getZoneLabel(firstUnadded.category) : 'Head/Neck',
      value: existingVal,
    });
  };

  const handlePointModalSubmit = () => {
    if (!pointModalData) return;
    if (!pointModalData.key) {
      setPointModalError('Please choose a measurement point');
      return;
    }
    const num = parseFloat(pointModalData.value);
    if (isNaN(num) || num <= 0 || num > 300) {
      setPointModalError('Enter a valid positive size (0.1 – 300)');
      return;
    }

    const canonical = resolveCanonicalKey(pointModalData.key);
    setActivePointKeys((prev) =>
      prev.includes(canonical) ? prev : [...prev, canonical]
    );
    setMeasurements((prev) => ({
      ...prev,
      [canonical]: num,
    }));

    setPointModalData(null);
    setPointModalError('');
    if (triggerRef.current) triggerRef.current.focus();
  };

  const handleFieldChange = (fieldKey: string, strVal: string) => {
    const num = parseFloat(strVal);
    setMeasurements((prev) => {
      const updated = { ...prev };
      if (!isNaN(num)) {
        updated[fieldKey] = num;
      } else if (strVal === '') {
        delete updated[fieldKey];
      }
      return updated;
    });
  };

  const handleRemoveField = (fieldKey: string, label: string) => {
    const prevValue = measurements[fieldKey];
    setActivePointKeys((prev) => prev.filter((k) => k !== fieldKey));
    setUndoToast({ key: fieldKey, label, value: prevValue });
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    undoTimeoutRef.current = setTimeout(() => {
      setUndoToast(null);
    }, 5000);
  };

  const handleUndoRemove = () => {
    if (!undoToast) return;
    setActivePointKeys((prev) =>
      prev.includes(undoToast.key) ? prev : [...prev, undoToast.key]
    );
    if (undoToast.value !== undefined) {
      setMeasurements((prev) => ({ ...prev, [undoToast.key]: undoToast.value! }));
    }
    setUndoToast(null);
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
  };

  // Active list fields resolved from activePointKeys
  const visibleListFields = useMemo(() => {
    return activePointKeys.map((key) => {
      const meta = hotspotMap[key];
      return {
        id: key,
        label: meta?.label || key,
        zone: meta?.zone || 'Torso',
      };
    });
  }, [activePointKeys, hotspotMap]);

  // Keyboard navigation across input fields
  const handleInputKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    currentIndex: number,
    totalCount: number
  ) => {
    if (e.key === 'Enter' && totalCount > 0) {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % totalCount;
      const nextField = visibleListFields[nextIndex];
      if (nextField && inputRefs.current[nextField.id]) {
        inputRefs.current[nextField.id]?.focus();
        inputRefs.current[nextField.id]?.select();
      }
    }
  };

  const handleSaveOrder = async () => {
    const trimmedName = clientName.trim();
    const trimmedPhone = clientPhone.trim();
    const trimmedEmail = clientEmail.trim();
    const trimmedGarment = clientGarment.trim() || selectedTemplateName;
    const priceNum = parseFloat(clientPrice.replace(/[^0-9.]/g, '')) || 0;

    const errors: { name?: string; phone?: string; email?: string; garment?: string } = {};
    const missing: string[] = [];

    if (!trimmedName) {
      errors.name = 'Client Name is required';
      missing.push('Client Name');
    }
    if (!trimmedPhone) {
      errors.phone = 'Phone Number is required';
      missing.push('Phone Number');
    }
    if (!trimmedEmail) {
      errors.email = 'Email Address is required';
      missing.push('Email Address');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = 'Enter a valid email address';
      missing.push('Valid Email Address');
    }
    if (!trimmedGarment) {
      errors.garment = 'Garment Type is required';
      missing.push('Garment Type');
    }

    if (missing.length > 0) {
      setClientFormErrors(errors);
      showToast({
        type: 'warning',
        title: 'Incomplete Client Details',
        message: `Please complete all required fields (${missing.join(', ')}) before saving.`,
        duration: 5000,
      });

      if (errors.name) {
        clientNameInputRef.current?.focus();
      } else if (errors.garment) {
        clientGarmentInputRef.current?.focus();
      } else if (errors.phone) {
        clientPhoneInputRef.current?.focus();
      } else if (errors.email) {
        clientEmailInputRef.current?.focus();
      }
      throw new Error(`Incomplete client fields: ${missing.join(', ')}`);
    }

    setClientFormErrors({});

    const newCl = addClient({
      name: trimmedName,
      phone: trimmedPhone,
      email: trimmedEmail,
      notes: clientNotes.trim(),
    });

    const activeMeasurementsOnly: Record<string, number> = {};
    activePointKeys.forEach((k) => {
      if (measurements[k] !== undefined) {
        activeMeasurementsOnly[k] = measurements[k];
      }
    });

    const snapshot = addSnapshot({
      clientId: newCl.id,
      date: new Date()
        .toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
        .replace(/\//g, '-'),
      unit: unitLabel,
      garmentType: trimmedGarment,
      measurements: activeMeasurementsOnly,
      notes: clientNotes,
    });

    addOrder({
      clientId: newCl.id,
      garmentType: trimmedGarment,
      measurementSnapshotId: snapshot.id,
      status: 'In Progress',
      pickupDateTime: clientDueDate ? `${clientDueDate}T12:00:00` : '2026-10-31T12:00:00',
      price: priceNum,
      referenceImages: styleImages.map((url, i) => ({
        id: `ref-${Date.now()}-${i}`,
        url,
        title: `Style Ref ${i + 1}`,
      })),
      notes: clientNotes,
    });

    showToast({
      type: 'success',
      title: 'Client & Order Saved',
      message: `Created profile for "${trimmedName}" and booked order for "${trimmedGarment}".`,
      duration: 4000,
    });
  };

  // Live Recent Orders list connected to global store
  const recentOrdersList = useMemo(() => {
    if (orders && orders.length > 0) {
      return orders.slice(0, 4).map((ord) => {
        const cl = clients.find((c) => c.id === ord.clientId);
        const clientFullName = cl?.name || 'Chloe Dallas';
        const initials =
          clientFullName
            .split(' ')
            .map((p) => p[0])
            .join('')
            .slice(0, 2)
            .toUpperCase() || 'CL';
        return {
          id: ord.id,
          client: clientFullName,
          initials,
          garment: ord.garmentType || 'Bespoke Order',
          clientId: cl?.id || ord.clientId || 'c-1',
        };
      });
    }
    return [
      {
        id: 'ord-9021',
        client: 'Chloe Dallas',
        initials: 'CD',
        garment: 'Bespoke African Gown',
        clientId: 'c-1',
      },
      {
        id: 'ord-102',
        client: 'Taylor Razaq',
        initials: 'TR',
        garment: 'Bespoke African Gown',
        clientId: 'c-2',
      },
      {
        id: 'ord-103',
        client: 'Bryan Muhammed',
        initials: 'BM',
        garment: 'Bespoke African Gown',
        clientId: 'c-3',
      },
    ];
  }, [orders, clients]);

  // Shared Subcomponents for Desktop & Mobile
  const renderNewClientCard = (isMobile = false) => (
    <div className="w-full bg-[var(--card)] rounded-[6px] p-3 flex flex-col gap-2">
      <div>
        <h2 className="text-[16px] font-bold text-[var(--text)] leading-tight">
          New Client
        </h2>
        <p className="text-[12px] font-normal text-[var(--text-2)] mt-0.5 leading-snug">
          Enter client contact info, select garment template, and style notes.
        </p>
      </div>

      <div className="bg-[var(--surface)] rounded-[8px] flex flex-col gap-[2px] p-[2px]">
        {/* Section 1: Basic Information */}
        <div className="bg-[var(--surface)] p-2.5 flex flex-col gap-1 rounded-[6px]">
          <h3 className="text-[14px] font-semibold text-[var(--text)]">
            Basic Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
            <Input
              ref={clientNameInputRef}
              label="Client *"
              placeholder="e.g Adriana Kunle"
              value={clientName}
              error={clientFormErrors.name}
              onChange={(e) => {
                setClientName(e.target.value);
                if (clientFormErrors.name) {
                  setClientFormErrors((prev) => {
                    const next = { ...prev };
                    delete next.name;
                    return next;
                  });
                }
              }}
            />
            <Input
              ref={clientGarmentInputRef}
              label="Garment Type *"
              placeholder="Bespoke African Gown"
              value={clientGarment}
              error={clientFormErrors.garment}
              onChange={(e) => {
                setClientGarment(e.target.value);
                if (clientFormErrors.garment) {
                  setClientFormErrors((prev) => {
                    const next = { ...prev };
                    delete next.garment;
                    return next;
                  });
                }
              }}
            />
            <Input
              ref={clientPhoneInputRef}
              label="Phone Number *"
              placeholder="+234 -"
              value={clientPhone}
              error={clientFormErrors.phone}
              onChange={(e) => {
                setClientPhone(e.target.value);
                if (clientFormErrors.phone) {
                  setClientFormErrors((prev) => {
                    const next = { ...prev };
                    delete next.phone;
                    return next;
                  });
                }
              }}
            />
            <Input
              ref={clientEmailInputRef}
              label="Email Address *"
              placeholder="name@example.com"
              type="email"
              value={clientEmail}
              error={clientFormErrors.email}
              onChange={(e) => {
                setClientEmail(e.target.value);
                if (clientFormErrors.email) {
                  setClientFormErrors((prev) => {
                    const next = { ...prev };
                    delete next.email;
                    return next;
                  });
                }
              }}
            />
          </div>
        </div>

        {/* Section 2: Style References */}
        <div className="bg-[var(--surface)] p-2.5 flex flex-col gap-1 rounded-[6px]">
          <h3 className="text-[14px] font-semibold text-[var(--text)]">
            Style References
          </h3>
          <div className="pt-0.5">
            <AnimatedFileUpload images={styleImages} onChange={setStyleImages} />
          </div>
        </div>

        {/* Section 3: Price/Due date */}
        <div className="bg-[var(--surface)] p-2.5 flex flex-col gap-1 rounded-[6px]">
          <h3 className="text-[14px] font-semibold text-[var(--text)]">
            Price/Due date
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
            <Input
              label={`Price (${currencySymbol})`}
              placeholder={`${currencySymbol}0.00`}
              value={clientPrice}
              onChange={(e) => setClientPrice(e.target.value)}
            />
            <div className="relative" ref={dueDatePickerRef}>
              <Input
                label="Due Date"
                type="text"
                placeholder="09/10/2026"
                value={clientDueDate}
                onChange={(e) => setClientDueDate(e.target.value)}
                className={cn(
                  clientDueDate
                    ? 'text-[var(--text-strong)] font-semibold tabular-nums'
                    : ''
                )}
                rightAddon={
                  <button
                    type="button"
                    onClick={() => setIsDueDatePickerOpen((prev) => !prev)}
                    className="p-1 text-[var(--text-2)] hover:text-black cursor-pointer transition-colors"
                    title="Open calendar to pick due date"
                  >
                    <CalendarIcon className="w-3.5 h-3.5" />
                  </button>
                }
              />

              {/* Date Picker Popover */}
              <AnimatePresence>
                {isDueDatePickerOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.96 }}
                    transition={springSmooth}
                    className="absolute top-full right-0 mt-1.5 w-64 bg-white border border-[var(--outline)] rounded-[8px] p-3 shadow-lg z-30"
                  >
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--outline)]">
                      <span className="text-[12px] font-bold text-[var(--text-strong)]">
                        October 2026
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setClientDueDate('09/10/2026');
                            setIsDueDatePickerOpen(false);
                          }}
                          className="text-[10px] font-medium text-[var(--primary)] hover:underline cursor-pointer"
                        >
                          09/10/2026
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsDueDatePickerOpen(false)}
                          className="text-[var(--text-2)] hover:text-black p-0.5 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-[var(--weekday)] mb-1">
                      <span>Su</span>
                      <span>Mo</span>
                      <span>Tu</span>
                      <span>We</span>
                      <span>Th</span>
                      <span>Fr</span>
                      <span>Sa</span>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium">
                      <span />
                      <span />
                      <span />
                      <span />
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                        const formatted = `${String(day).padStart(2, '0')}/10/2026`;
                        const isSelected = clientDueDate === formatted;
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => {
                              setClientDueDate(formatted);
                              setIsDueDatePickerOpen(false);
                            }}
                            className={cn(
                              'w-7 h-7 rounded-[4px] flex items-center justify-center transition-colors cursor-pointer tabular-nums text-[11px]',
                              isSelected
                                ? 'bg-[var(--primary)] text-white font-bold'
                                : 'text-[var(--text-strong)] hover:bg-[var(--chip)]'
                            )}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Section 4: Notes */}
        <div className="bg-[var(--surface)] p-2.5 flex flex-col gap-1 rounded-[6px]">
          <h3 className="text-[14px] font-semibold text-[var(--text)]">Notes</h3>
          <div className="pt-0.5">
            <label className="block text-[11px] font-normal text-[var(--text)] mb-[2px]">
              Workroom notes and fabric details
            </label>
            <Textarea
              placeholder="e.g hand stitched, monogram design on wrist and gold buttons"
              value={clientNotes}
              onChange={(e) => setClientNotes(e.target.value)}
              className={isMobile ? 'h-[90px]' : 'h-[133px]'}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderMannequinCard = (isMobile = false) => (
    <div className="w-full bg-[var(--card)] rounded-[6px] p-3 flex flex-col gap-2 flex-1">
      {/* Title & Subtitle */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-[16px] font-bold text-[var(--text)] leading-tight">
            {centerView === 'mannequin'
              ? selectedTemplateName || 'Mannequin'
              : 'Measurement List View'}
          </h2>
          <div className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--muted)] mt-0.5">
            {centerView === 'mannequin' ? (
              <>
                <span>
                  {activePointKeys.length === 0
                    ? 'Empty state · Choose a template or add a point'
                    : `${activePointKeys.length} active ${
                        activePointKeys.length === 1 ? 'point' : 'points'
                      }`}
                </span>
                <span className="w-1 h-1 rounded-full bg-[var(--muted)]" />
                <span>{gender === 'female' ? 'Feminine Form' : 'Masculine Form'}</span>
              </>
            ) : (
              <span>Fast keyboard entry for active garment fields</span>
            )}
          </div>
        </div>

        {activePointKeys.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setSelectedTemplateId('');
              setSelectedTemplateName('');
              setActivePointKeys([]);
            }}
            className="text-[11px] font-medium text-[var(--muted)] hover:text-black cursor-pointer shrink-0 pt-0.5"
          >
            Clear points
          </button>
        )}
      </div>

      {/* Toolbar: white pill container */}
      <div className="w-full rounded-[32px] bg-white p-2 flex flex-wrap items-center gap-2">
        {/* 1. Choose Template */}
        <button
          ref={triggerRef}
          type="button"
          onClick={() => {
            setDialogSelectedTemplateId(
              selectedTemplateId || storeTemplates[0]?.id || ''
            );
            setIsTemplateModalOpen(true);
          }}
          className={cn(
            'flex-1 min-w-[120px] h-9 rounded-[24px] text-[14px] font-medium flex items-center justify-center transition-colors cursor-pointer px-3 truncate',
            selectedTemplateName
              ? 'bg-[var(--selected-bg)] border border-[var(--selected)] text-[var(--primary)] font-semibold'
              : 'bg-[var(--chip)] text-[var(--text-2)] hover:bg-[#eaeaea]'
          )}
        >
          {selectedTemplateName || 'Choose Template'}
        </button>

        {/* 2. M / F toggle group */}
        <div className="h-9 bg-[var(--chip)] rounded-[24px] px-2 py-1.5 flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setGender('male')}
            className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-bold transition-all cursor-pointer',
              gender === 'male'
                ? 'bg-[var(--primary)] text-white shadow-xs'
                : 'bg-white text-[var(--text-2)] hover:text-black'
            )}
          >
            M
          </button>
          <button
            type="button"
            onClick={() => setGender('female')}
            className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-bold transition-all cursor-pointer',
              gender === 'female'
                ? 'bg-[var(--primary)] text-white shadow-xs'
                : 'bg-white text-[var(--text-2)] hover:text-black'
            )}
          >
            F
          </button>
        </div>

        {/* 3. View toggle group */}
        <div className="h-9 bg-[var(--chip)] rounded-[24px] px-2 py-1.5 flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setCenterView('mannequin')}
            className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer',
              centerView === 'mannequin'
                ? 'bg-[var(--primary)] text-white shadow-xs'
                : 'bg-white text-[var(--text-2)] hover:text-black'
            )}
            title="Diagram View"
          >
            <PersonStanding className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setCenterView('table')}
            className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer',
              centerView === 'table'
                ? 'bg-[var(--primary)] text-white shadow-xs'
                : 'bg-white text-[var(--text-2)] hover:text-black'
            )}
            title="List View"
          >
            <ClipboardList className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 4. Add Point */}
        <button
          type="button"
          onClick={handleOpenAddPoint}
          className="h-9 px-3.5 bg-[var(--chip)] border border-[var(--outline)] text-[var(--text-2)] text-[14px] font-medium rounded-[24px] hover:bg-[#eaeaea] transition-colors cursor-pointer shrink-0"
        >
          Add Point
        </button>
      </div>

      {/* Main Content: Mannequin Diagram OR List View */}
      {centerView === 'mannequin' ? (
        <div className="w-full flex flex-col items-center justify-center py-2 select-none flex-1">
          <RotatableMannequin
            gender={gender}
            onGenderChange={setGender}
            showGenderToggle={false}
            measurements={measurements}
            activePointKeys={activePointKeys}
            selectedPointKey={pointModalData?.key || null}
            unit={unitLabel}
            onSelectPoint={handleOpenPoint}
          />
        </div>
      ) : activePointKeys.length === 0 ? (
        <div className="w-full flex-1 min-h-[320px] bg-white rounded-[12px] p-6 flex flex-col items-center justify-center text-center gap-3">
          <p className="text-[14px] font-semibold text-black">
            No measurement points selected yet
          </p>
          <p className="text-[12px] text-[var(--text-2)] max-w-xs">
            Choose a saved Garment Template or click &ldquo;Add Point&rdquo; to select measurements from the catalog.
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
              className="h-9 px-4 rounded-[24px] bg-[var(--chip)] border border-[var(--outline)] text-[var(--text-2)] text-[13px] font-medium hover:bg-[#eaeaea] transition-colors cursor-pointer"
            >
              Add Point
            </button>
          </div>
        </div>
      ) : (
        /* Measurement List View */
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 py-1">
          {visibleListFields.map((field, idx) => {
            const rawVal = measurements[field.id];
            const strVal = rawVal !== undefined ? String(rawVal) : '';

            return (
              <div
                key={field.id}
                className="bg-white rounded-[16px] p-4 flex flex-col justify-between gap-3 shadow-2xs"
              >
                <div className="flex items-start justify-between gap-1">
                  <div className="min-w-0">
                    <span className="text-[13px] font-semibold text-[var(--text)] block truncate">
                      {field.label}
                    </span>
                    <span className="text-[10px] font-medium text-[var(--muted)] block">
                      {field.zone}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveField(field.id, field.label)}
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[var(--muted)] hover:text-black hover:bg-neutral-100 transition-colors cursor-pointer shrink-0"
                    title={`Remove ${field.label}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="w-full bg-[var(--card)] border border-[var(--card)] hover:bg-[#F1F1F1] hover:border-[#EDEDED] focus-within:!border-[var(--primary)] focus-within:ring-2 focus-within:ring-[rgba(29,73,232,0.15)] rounded-[8px] p-[2px] transition-all flex items-center">
                  <input
                    ref={(el) => {
                      inputRefs.current[field.id] = el;
                    }}
                    type="text"
                    inputMode="decimal"
                    placeholder="0.0"
                    value={strVal}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    onKeyDown={(e) =>
                      handleInputKeyDown(e, idx, visibleListFields.length)
                    }
                    className="w-full bg-transparent px-2 py-1 text-[12px] font-normal text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none tabular-nums"
                  />
                  <span className="pr-2 text-[12px] font-medium text-black select-none shrink-0">
                    {unitLabel}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mobile Inline Save Button */}
      {isMobile && (
        <div className="w-full pt-2 flex justify-end">
          <MorphingSaveButton idleText="Save" onClick={handleSaveOrder} />
        </div>
      )}
    </div>
  );

  const renderCalendarCard = () => (
    <div className="w-full bg-[var(--card)] rounded-[6px] p-3 flex flex-col gap-3 relative">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-[var(--text-strong)] leading-none">
          Garment&apos;s Calendar
        </h3>
        <div className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--text-strong)]">
          <span>{calendarMonthLabel}</span>
          <div className="flex items-center gap-0.5 text-[var(--text-2)]">
            <button
              type="button"
              className="p-1 rounded hover:bg-neutral-200 transition-colors cursor-pointer"
              title="Previous Month"
              onClick={() => {
                setActiveDatePopover(null);
                setViewDate(
                  (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
                );
              }}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              className="p-1 rounded hover:bg-neutral-200 transition-colors cursor-pointer"
              title="Next Month"
              onClick={() => {
                setActiveDatePopover(null);
                setViewDate(
                  (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
                );
              }}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Weekday row */}
      <div className="grid grid-cols-7 gap-[2px]">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, idx) => (
          <div
            key={d}
            className="h-8 bg-white rounded-[4px] flex items-center justify-center text-[11px] font-semibold"
          >
            <span
              className={
                idx === todayWeekdayIndex
                  ? 'text-[var(--text-strong)]'
                  : 'text-[var(--weekday)]'
              }
            >
              {d}
            </span>
          </div>
        ))}
      </div>

      {/* Date grid */}
      <div className="grid grid-cols-7 gap-[2px]">
        {Array.from({ length: calendarOffset }, (_, idx) => (
          <div key={`offset-${idx}`} className="h-10 opacity-0 pointer-events-none" />
        ))}

        {Array.from({ length: calendarDaysCount }, (_, i) => i + 1).map((day) => {
          const dayOrders = getOrdersForDay(day);
          const hasOrders = dayOrders.length > 0;
          const status = dayOrders[0]?.status;

          return (
            <button
              key={day}
              type="button"
              onClick={() => {
                if (hasOrders) {
                  setActiveDatePopover(activeDatePopover === day ? null : day);
                } else {
                  setActiveDatePopover(null);
                }
              }}
              className={cn(
                'h-10 bg-white rounded-[4px] relative flex items-center justify-center text-[12px] font-medium text-[var(--text-date)] tabular-nums transition-colors',
                hasOrders ? 'cursor-pointer hover:bg-neutral-50' : 'cursor-default'
              )}
            >
              <span>{day}</span>

              {hasOrders && (
                <span
                  className={cn(
                    'absolute bottom-1 right-1 w-2 h-2 rounded-full',
                    status === 'completed'
                      ? 'bg-[var(--completed)]'
                      : status === 'paused'
                      ? 'bg-[var(--paused)]'
                      : 'bg-[var(--pending)]'
                  )}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Peek Card Popover */}
      <AnimatePresence>
        {activeDatePopover !== null &&
          getOrdersForDay(activeDatePopover).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={springSnappy}
              className="absolute left-3 right-3 top-[170px] z-30 bg-white border border-[var(--outline)] rounded-[8px] p-3 shadow-xl"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[var(--outline)] mb-2">
                <span className="text-[12px] font-bold text-[var(--text-strong)]">
                  {activeDatePopover} {calendarMonthLabel} — Pickups
                </span>
                <button
                  type="button"
                  onClick={() => setActiveDatePopover(null)}
                  className="text-[var(--text-2)] hover:text-black p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex flex-col gap-1.5">
                {getOrdersForDay(activeDatePopover).map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-[11px] bg-[var(--chip)] p-2 rounded-[6px]"
                  >
                    <div>
                      <div className="font-medium text-[var(--text-strong)]">
                        {item.client}
                      </div>
                      <div className="text-[10px] text-[var(--muted)]">
                        {item.garment}
                      </div>
                    </div>
                    <span className="font-semibold text-[var(--text-date)] tabular-nums">
                      {item.time}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
      </AnimatePresence>

      {/* Legend row */}
      <div className="pt-2 flex items-center justify-start gap-[24px] text-[11px] font-normal text-[var(--text-strong)]">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--pending)] shrink-0" />
          <span>Pending</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--completed)] shrink-0" />
          <span>Completed</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--paused)] shrink-0" />
          <span>Paused</span>
        </span>
      </div>
    </div>
  );

  const renderRecentOrdersCard = () => (
    <div className="w-full bg-[var(--card)] rounded-[6px] p-3 flex flex-col gap-2">
      <h3 className="text-[14px] font-semibold text-[var(--text-strong)]">
        Recent Orders
      </h3>

      <div className="bg-[var(--surface)] p-[2px] rounded-[8px] flex flex-col gap-[2px]">
        {recentOrdersList.map((order) => (
          <div
            key={order.id}
            onClick={() => onOpenClient(order.clientId)}
            className="bg-[var(--chip)] hover:bg-[#EAEAEA] rounded-[8px] p-2 flex items-center gap-2 justify-between cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[12px] font-bold text-[var(--text-strong)] shrink-0">
                {order.initials}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[12px] font-medium text-[var(--text-strong)] leading-tight truncate">
                  {order.client}
                </span>
                <span className="text-[11px] font-normal text-[var(--muted)] leading-tight truncate">
                  {order.garment}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenClient(order.clientId);
              }}
              className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-[var(--text-strong)] hover:bg-neutral-100 transition-colors cursor-pointer shrink-0"
              title={`Open client profile for ${order.client}`}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  // Render shared Garment Templates list inside desktop/mobile modal
  const renderTemplatesModalList = () => (
    <div className="flex flex-col gap-2.5 max-h-[380px] overflow-y-auto">
      {storeTemplates.length === 0 ? (
        <div className="p-6 text-center text-[12px] text-[var(--muted)]">
          No saved templates yet. You can create new templates in Settings.
        </div>
      ) : (
        storeTemplates.map((tmpl) => {
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
                <div className="text-[12px] font-normal text-[var(--text-2)] mt-0.5 leading-snug line-clamp-2">
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
                      const remaining = storeTemplates.filter((t) => t.id !== tmpl.id);
                      setDialogSelectedTemplateId(remaining[0]?.id || '');
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
        })
      )}
    </div>
  );

  // Render Point Modal form content (Requirement C: edit mode only edits size value; Requirement D: add mode picks from catalog)
  const renderPointModalForm = () => {
    if (!pointModalData) return null;

    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handlePointModalSubmit();
        }}
        className="flex flex-col gap-4"
      >
        {pointModalData.mode === 'edit' ? (
          /* Requirement C: Read-Only Measurement Info Banner — user can update ONLY the size */
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
            <label className="block text-[11px] font-semibold text-[var(--text)]">
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
          <label className="block text-[11px] font-semibold text-[var(--text)] mb-1">
            Measurement Size ({unitLabel.toUpperCase()})
          </label>
          <div className="w-full bg-[var(--card)] border border-[#EDEDED] focus-within:!border-[var(--primary)] focus-within:ring-2 focus-within:ring-[rgba(29,73,232,0.15)] rounded-[8px] p-[2px] transition-all flex items-center">
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
              className="w-full bg-transparent px-2.5 py-2 text-[14px] font-semibold text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none tabular-nums"
            />
            <span className="pr-3 text-[12px] font-semibold text-[var(--text-2)] select-none shrink-0">
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
              if (triggerRef.current) triggerRef.current.focus();
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
    );
  };

  return (
    <div className="w-full min-h-screen bg-[var(--page)] select-none text-[var(--text)]">
      {/* =======================================================================
          PART A: MOBILE OVERVIEW (< 1024px)
          ======================================================================= */}
      {!isDesktop && (
        <>
          <div className="w-full px-2 sm:px-4 max-w-[720px] mx-auto pt-2 pb-[88px] lg:hidden flex flex-col gap-2">
            <div className="w-full bg-[var(--surface)] p-[2px] rounded-[8px] flex flex-col gap-[2px]">
              <div className="w-full bg-[var(--surface)] p-[2px] rounded-[8px]">
                <div className="w-full rounded-[6px] bg-[var(--card)] px-6 py-1 flex items-center justify-between min-h-[45px]">
                  <div
                    onClick={() => setActiveScreen('overview')}
                    className="flex items-center gap-2 cursor-pointer text-black"
                  >
                    <OrigamiTailorFitLogo className="w-[44px] h-[31px] text-black" />
                    <span className="text-[24px] font-bold text-black tracking-[-0.02em]">
                      TailorFit
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <NotificationDropdown />
                  </div>
                </div>
              </div>

              {renderNewClientCard(true)}
              {renderMannequinCard(true)}
              {renderCalendarCard()}
              {renderRecentOrdersCard()}
            </div>
          </div>

          {/* Floating Navigation on Mobile (< 1024px) */}
          <div className="lg:hidden fixed bottom-4 inset-x-0 z-40 flex justify-center px-4 pointer-events-none">
            <nav
              className="pointer-events-auto bg-black rounded-[32px] p-1 flex items-center gap-1 shadow-2xl select-none"
              aria-label="Mobile Navigation"
            >
              <button
                type="button"
                onClick={() => setActiveScreen('overview')}
                className="flex items-center gap-1 bg-white text-black rounded-[28px] px-3.5 py-2 text-[12px] font-semibold cursor-pointer"
              >
                <House className="w-4 h-4 shrink-0" />
                <span>Overview</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveScreen('clients')}
                className="flex items-center gap-1 text-white hover:text-white/80 rounded-[28px] px-3 py-2 text-[12px] font-medium transition-colors cursor-pointer"
              >
                <UsersRound className="w-4 h-4 shrink-0" />
                <span>Clients</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveScreen('settings')}
                className="flex items-center gap-1 text-white hover:text-white/80 rounded-[28px] px-3 py-2 text-[12px] font-medium transition-colors cursor-pointer"
              >
                <Settings className="w-4 h-4 shrink-0" />
                <span>Settings</span>
              </button>
            </nav>
          </div>
        </>
      )}

      {/* =======================================================================
          PART B: DESKTOP OVERVIEW (>= 1024px / lg)
          ======================================================================= */}
      {isDesktop && (
        <div className="hidden lg:block w-full max-w-[1216px] mx-auto px-4 sm:px-0 pt-4 pb-12">
          <div className="w-full flex flex-col xl:flex-row gap-4 items-start">
            {/* LEFT CONTAINER (70.5% width) */}
            <div className="w-full xl:w-[70.5%] bg-[var(--surface)] p-[2px] rounded-[8px] flex flex-col gap-[2px]">
              <div className="w-full flex flex-col lg:flex-row gap-[2px] items-stretch flex-1">
                <div className="w-full lg:w-[43.7%] flex flex-col">
                  {renderNewClientCard(false)}
                </div>
                <div className="w-full lg:flex-1 flex flex-col">
                  {renderMannequinCard(false)}
                </div>
              </div>

              {/* Desktop Save Bar */}
              <div className="w-full px-4 py-2 flex justify-end items-center bg-[var(--surface)] rounded-[6px]">
                <MorphingSaveButton idleText="Save" onClick={handleSaveOrder} />
              </div>
            </div>

            {/* RIGHT COLUMN (28.2% width) */}
            <div className="w-full xl:w-[28.2%] bg-[var(--surface)] p-[2px] rounded-[8px] flex flex-col gap-[2px]">
              {renderCalendarCard()}
              {renderRecentOrdersCard()}
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          GARMENT TEMPLATES DIALOG / BOTTOM SHEET
          ======================================================================= */}
      <AnimatePresence>
        {isTemplateModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => {
                setIsTemplateModalOpen(false);
                if (triggerRef.current) triggerRef.current.focus();
              }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[4px] lg:backdrop-blur-[8px]"
            />

            {isDesktop ? (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                <motion.div
                  ref={templateDialogRef}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="template-dialog-title"
                  variants={{
                    initial: { opacity: 0, scale: 0.94 },
                    animate: {
                      opacity: 1,
                      scale: 1,
                      transition: {
                        type: 'spring',
                        stiffness: 300,
                        damping: 22,
                        mass: 0.9,
                      },
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
                  className="pointer-events-auto relative w-[435px] max-w-[calc(100vw-32px)] rounded-[16px] bg-white p-6 flex flex-col gap-5 shadow-2xl"
                >
                  <div className="flex items-center justify-between">
                    <h3
                      id="template-dialog-title"
                      className="text-[16px] font-bold text-[var(--text)]"
                    >
                      Garment Templates
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setIsTemplateModalOpen(false);
                        if (triggerRef.current) triggerRef.current.focus();
                      }}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[var(--muted)] hover:text-black transition-colors cursor-pointer"
                      aria-label="Close dialog"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {renderTemplatesModalList()}

                  <div className="flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setIsTemplateModalOpen(false);
                        if (triggerRef.current) triggerRef.current.focus();
                      }}
                      className="h-9 px-4 rounded-[24px] bg-[var(--chip)] border border-[var(--outline)] text-[var(--text-2)] text-[14px] font-medium hover:bg-[#eaeaea] transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={!dialogSelectedTemplateId}
                      onClick={() => {
                        applyTemplateById(dialogSelectedTemplateId);
                        setIsTemplateModalOpen(false);
                        if (triggerRef.current) triggerRef.current.focus();
                      }}
                      className="h-9 px-6 rounded-[24px] bg-[var(--primary)] text-white text-[14px] font-medium hover:opacity-95 transition-opacity cursor-pointer shadow-xs disabled:opacity-40"
                    >
                      Select Template
                    </button>
                  </div>
                </motion.div>
              </div>
            ) : (
              <motion.div
                ref={templateDialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="template-dialog-title-mobile"
                initial={shouldReduceMotion ? { opacity: 0 } : { y: '100%' }}
                animate={shouldReduceMotion ? { opacity: 1 } : { y: 0 }}
                exit={
                  shouldReduceMotion
                    ? { opacity: 0 }
                    : { y: '100%', transition: { duration: 0.2 } }
                }
                transition={{ type: 'spring', stiffness: 320, damping: 32, mass: 0.9 }}
                className="fixed left-0 right-0 bottom-0 z-50 mx-auto w-full max-w-[640px] bg-white rounded-t-[16px] p-5 shadow-2xl flex flex-col gap-4 max-h-[85dvh] overflow-y-auto"
              >
                <div className="w-10 h-1 rounded-full bg-[#D9D8D8] mx-auto -mt-1 mb-1 shrink-0" />
                <div className="flex items-center justify-between shrink-0">
                  <h3
                    id="template-dialog-title-mobile"
                    className="text-[16px] font-bold text-[var(--text)]"
                  >
                    Garment Templates
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setIsTemplateModalOpen(false);
                      if (triggerRef.current) triggerRef.current.focus();
                    }}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--muted)] hover:text-black transition-colors cursor-pointer"
                    aria-label="Close dialog"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {renderTemplatesModalList()}

                <div className="flex items-center justify-end gap-2.5 pt-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setIsTemplateModalOpen(false);
                      if (triggerRef.current) triggerRef.current.focus();
                    }}
                    className="h-9 px-4 rounded-[24px] bg-[var(--chip)] border border-[var(--outline)] text-[var(--text-2)] text-[14px] font-medium hover:bg-[#eaeaea] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!dialogSelectedTemplateId}
                    onClick={() => {
                      applyTemplateById(dialogSelectedTemplateId);
                      setIsTemplateModalOpen(false);
                      if (triggerRef.current) triggerRef.current.focus();
                    }}
                    className="h-9 px-6 rounded-[24px] bg-[var(--primary)] text-white text-[14px] font-medium hover:opacity-95 transition-opacity cursor-pointer shadow-xs disabled:opacity-40"
                  >
                    Select Template
                  </button>
                </div>
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>

      {/* =======================================================================
          SET POINT SIZE / ADD POINT DIALOG / BOTTOM SHEET (Requirement C & D)
          ======================================================================= */}
      <AnimatePresence>
        {pointModalData && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => {
                setPointModalData(null);
                setPointModalError('');
                if (triggerRef.current) triggerRef.current.focus();
              }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[4px] lg:backdrop-blur-[8px]"
            />

            {isDesktop ? (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                <motion.div
                  ref={pointDialogRef}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="point-dialog-title"
                  variants={{
                    initial: { opacity: 0, scale: 0.94 },
                    animate: {
                      opacity: 1,
                      scale: 1,
                      transition: {
                        type: 'spring',
                        stiffness: 300,
                        damping: 22,
                        mass: 0.9,
                      },
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
                  className="pointer-events-auto relative w-[440px] max-w-[calc(100vw-32px)] rounded-[16px] bg-white p-6 flex flex-col gap-5 shadow-2xl"
                >
                  <div className="flex items-center justify-between">
                    <h3
                      id="point-dialog-title"
                      className="text-[16px] font-bold text-[var(--text)]"
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
                        if (triggerRef.current) triggerRef.current.focus();
                      }}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[var(--muted)] hover:text-black transition-colors cursor-pointer"
                      aria-label="Close dialog"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {renderPointModalForm()}
                </motion.div>
              </div>
            ) : (
              <motion.div
                ref={pointDialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="point-dialog-title-mobile"
                initial={shouldReduceMotion ? { opacity: 0 } : { y: '100%' }}
                animate={shouldReduceMotion ? { opacity: 1 } : { y: 0 }}
                exit={
                  shouldReduceMotion
                    ? { opacity: 0 }
                    : { y: '100%', transition: { duration: 0.2 } }
                }
                transition={{ type: 'spring', stiffness: 320, damping: 32, mass: 0.9 }}
                className="fixed left-0 right-0 bottom-0 z-50 mx-auto w-full max-w-[640px] bg-white rounded-t-[16px] p-5 shadow-2xl flex flex-col gap-4 max-h-[85dvh] overflow-y-auto"
              >
                <div className="w-10 h-1 rounded-full bg-[#D9D8D8] mx-auto -mt-1 mb-1 shrink-0" />
                <div className="flex items-center justify-between shrink-0">
                  <h3
                    id="point-dialog-title-mobile"
                    className="text-[16px] font-bold text-[var(--text)]"
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
                      if (triggerRef.current) triggerRef.current.focus();
                    }}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--muted)] hover:text-black transition-colors cursor-pointer"
                    aria-label="Close dialog"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {renderPointModalForm()}
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>

      {/* Floating Undo Toast when a field is removed */}
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
              Removed &ldquo;{undoToast.label}&rdquo;
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

      {/* Floating System Toasts */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
