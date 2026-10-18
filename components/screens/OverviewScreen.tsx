'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useStore } from '@/lib/store';
import { 
  CloudUpload,
  Save, 
  PersonStanding, 
  ClipboardList, 
  ChevronRight, 
  ChevronLeft,
  X, 
  Check, 
  User, 
  Ruler, 
  Calendar as CalendarIcon,
  ChevronDown,
  House,
  UsersRound,
  Settings
} from 'lucide-react';
import { springSmooth, springSnappy, springGentle } from '@/lib/motion-tokens';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { MorphingSaveButton } from '@/components/ui/MorphingSaveButton';
import { AnimatedFileUpload } from '@/components/ui/AnimatedFileUpload';
import { DrawCheckbox } from '@/components/ui/DrawCheckbox';
import { OrigamiTailorFitLogo } from '@/components/Navbar';
import { NotificationDropdown } from '@/components/ui/NotificationDropdown';
import { cn } from '@/lib/utils';

export interface OverviewTemplateOption {
  id: string;
  name: string;
  description: string;
  points: Record<string, number>;
}

export const OVERVIEW_TEMPLATES: OverviewTemplateOption[] = [
  {
    id: 'shirt_blouse',
    name: 'Shirt/Blouse',
    description: 'Essential measurements for bespoke dress shirts/blouses',
    points: {
      neck: 38.0,
      shoulder: 44.0,
      shoulder_width: 44.0,
      bust: 96.0,
      bust_chest: 96.0,
      sleeve: 62.0,
      waist: 80.0,
      wrist: 17.0,
      back: 42.0,
      neck_to_waist: 44.0,
    },
  },
  {
    id: 'trousers_shorts',
    name: 'Trousers/shorts',
    description: 'Fittings for tailored/pleated pants, trousers, pants and shorts.',
    points: {
      waist: 82.0,
      hip: 100.0,
      thigh: 58.0,
      ankle: 24.0,
      neck_to_ankle: 104.0,
    },
  },
  {
    id: 'gown_dress',
    name: 'Gown/Dress',
    description: 'All basic measurements required for creating a custom gown',
    points: {
      shoulder_width: 42.0,
      shoulder: 42.0,
      neck: 36.0,
      bust_chest: 92.0,
      bust: 92.0,
      ankle: 22.0,
      hip: 96.0,
      wrist: 16.0,
      sleeve: 60.0,
      waist: 72.0,
      back: 40.0,
      neck_to_waist: 40.0,
      neck_to_ankle: 135.0,
      thigh: 56.0,
    },
  },
  {
    id: 'two_piece',
    name: 'Two Piece',
    description: 'Comprehensive set for bespoke matching 2-piece suits',
    points: {
      shoulder_width: 45.0,
      shoulder: 45.0,
      neck: 39.0,
      bust_chest: 98.0,
      bust: 98.0,
      waist: 84.0,
      hip: 102.0,
      sleeve: 63.0,
      thigh: 59.0,
      wrist: 17.5,
      back: 43.0,
      neck_to_waist: 45.0,
      neck_to_ankle: 106.0,
    },
  },
  {
    id: 'suit_jacket',
    name: 'Suit Jacket',
    description: 'Tailored fit for single and double breasted blazers and jackets',
    points: {
      shoulder_width: 46.0,
      shoulder: 46.0,
      neck: 40.0,
      bust_chest: 102.0,
      bust: 102.0,
      waist: 86.0,
      sleeve: 64.0,
      wrist: 18.0,
      back: 44.0,
      neck_to_waist: 46.0,
    },
  },
];

interface CalendarOrderItem {
  client: string;
  garment: string;
  time: string;
  status: 'pending' | 'completed' | 'paused';
}

interface OverviewScreenProps {
  onOpenClient: (clientId: string) => void;
  onOpenOrder?: (orderId: string, clientId: string) => void;
}

export function OverviewScreen({ onOpenClient, onOpenOrder }: OverviewScreenProps) {
  const { addClient, addOrder, addSnapshot, orders, clients, settings, setActiveScreen } = useStore();
  const shouldReduceMotion = useReducedMotion();
  const unitLabel = settings?.defaultUnit || 'cm';

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

  // Mannequin state: F is selected by default
  const [gender, setGender] = useState<'male' | 'female'>('female');
  const [centerView, setCenterView] = useState<'mannequin' | 'table'>('mannequin');

  // Garment Template state: initial default preselected
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('gown_dress');
  const [selectedTemplateName, setSelectedTemplateName] = useState<string>('Gown/Dress');
  const [dialogSelectedTemplateId, setDialogSelectedTemplateId] = useState<string>('gown_dress');
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  // Measurements state: single source of truth for both diagram points and list view
  const [measurements, setMeasurements] = useState<Record<string, number>>({
    shoulder_width: 42.0,
    shoulder: 42.0,
    neck: 36.0,
    bust_chest: 92.0,
    bust: 92.0,
    ankle: 22.0,
    hip: 96.0,
    wrist: 16.0,
    sleeve: 60.0,
    waist: 72.0,
    back: 40.0,
    neck_to_waist: 40.0,
    neck_to_ankle: 135.0,
    thigh: 56.0,
  });

  // Hidden/removed fields for list view session
  const [hiddenFieldIds, setHiddenFieldIds] = useState<string[]>([]);
  const [undoToast, setUndoToast] = useState<{ id: string; label: string } | null>(null);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Input refs for Enter key navigation in list view
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Focus trap refs
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const templateDialogRef = useRef<HTMLDivElement | null>(null);
  const pointDialogRef = useRef<HTMLDivElement | null>(null);

  // Set point size / Add point modal state
  const [pointModalData, setPointModalData] = useState<{
    key?: string;
    name: string;
    value: string;
    isCustom: boolean;
  } | null>(null);
  const [pointModalError, setPointModalError] = useState<string>('');

  // Calendar state: viewDate is the first day of the displayed month, initialised from new Date()
  const [viewDate, setViewDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [activeDatePopover, setActiveDatePopover] = useState<number | null>(null);

  // Derived calendar values using local date parts only
  const calendarYear = viewDate.getFullYear();
  const calendarMonth = viewDate.getMonth();
  const calendarOffset = (new Date(calendarYear, calendarMonth, 1).getDay() + 6) % 7;
  const calendarDaysCount = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const todayWeekdayIndex = (new Date().getDay() + 6) % 7;
  const calendarMonthLabel = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(viewDate);

  // Status dots: show a dot on a date only when an order's due date matches that exact year, month and day
  const getOrdersForDay = (day: number) => {
    const dayOrders: CalendarOrderItem[] = [];

    // Specific October 2026 pickups
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

    // Match orders from store whose due date matches this exact year, month, and day
    if (orders && orders.length > 0) {
      for (const ord of orders) {
        if (!ord.pickupDateTime) continue;
        const d = new Date(ord.pickupDateTime);
        if (d.getFullYear() === calendarYear && d.getMonth() === calendarMonth && d.getDate() === day) {
          const clientObj = clients?.find((c) => c.id === ord.clientId);
          const clientName = clientObj?.name || 'Client';
          const rawStatus = (ord.status || '').toLowerCase();
          let normalizedStatus: 'pending' | 'completed' | 'paused' = 'pending';
          if (rawStatus.includes('complete') || rawStatus === 'ready') normalizedStatus = 'completed';
          else if (rawStatus.includes('pause')) normalizedStatus = 'paused';

          const hours = d.getHours();
          const minutes = d.getMinutes();
          const ampm = hours >= 12 ? 'PM' : 'AM';
          const displayHours = hours % 12 || 12;
          const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
          const timeStr = `${String(displayHours).padStart(2, '0')}:${displayMinutes} ${ampm}`;

          dayOrders.push({
            client: clientName,
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

  const handleOpenPoint = (key: string, name: string) => {
    triggerRef.current = document.activeElement as HTMLButtonElement;
    const currentVal = measurements[key] !== undefined ? String(measurements[key]) : '0.0';
    setPointModalError('');
    setPointModalData({
      key,
      name,
      value: currentVal,
      isCustom: false,
    });
  };

  const handleOpenAddPoint = () => {
    triggerRef.current = document.activeElement as HTMLButtonElement;
    setPointModalError('');
    setPointModalData({
      name: '',
      value: '',
      isCustom: true,
    });
  };

  const handlePointModalSubmit = () => {
    if (!pointModalData) return;
    const nameTrimmed = pointModalData.name.trim();
    if (!nameTrimmed) {
      setPointModalError('Point name is required');
      return;
    }
    const num = parseFloat(pointModalData.value);
    if (isNaN(num) || num <= 0 || num > 300) {
      setPointModalError('Value must be a positive number up to 300');
      return;
    }

    const targetKey =
      pointModalData.key ||
      nameTrimmed.toLowerCase().replace(/[^a-z0-9]+/g, '_');

    handleMeasurementChange(targetKey, num, nameTrimmed);
    setPointModalData(null);
    setPointModalError('');
    if (triggerRef.current) triggerRef.current.focus();
  };

  const handleMeasurementChange = (key: string, val: number, label?: string) => {
    setMeasurements((prev) => {
      const updated = { ...prev, [key]: val };
      if (key === 'shoulder') updated.shoulder_width = val;
      if (key === 'shoulder_width') updated.shoulder = val;
      if (key === 'bust') updated.bust_chest = val;
      if (key === 'bust_chest') updated.bust = val;
      return updated;
    });
  };

  const handleFieldChange = (fieldId: string, strVal: string, aliasKey?: string) => {
    const num = parseFloat(strVal);
    setMeasurements((prev) => {
      const updated = { ...prev };
      if (!isNaN(num)) {
        updated[fieldId] = num;
        if (aliasKey) updated[aliasKey] = num;
      } else if (strVal === '') {
        delete updated[fieldId];
        if (aliasKey) delete updated[aliasKey];
      }
      return updated;
    });
  };

  const handleRemoveField = (fieldId: string, label: string) => {
    setHiddenFieldIds((prev) => [...prev, fieldId]);
    setUndoToast({ id: fieldId, label });
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    undoTimeoutRef.current = setTimeout(() => {
      setUndoToast(null);
    }, 5000);
  };

  const handleUndoRemove = () => {
    if (!undoToast) return;
    setHiddenFieldIds((prev) => prev.filter((id) => id !== undoToast.id));
    setUndoToast(null);
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
  };

  // Keyboard navigation across input fields
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, currentIndex: number, totalCount: number) => {
    if (e.key === 'Enter') {
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
    const name = clientName.trim() || 'New Bespoke Client';
    const garment = clientGarment.trim() || 'Bespoke African Gown';
    const priceNum = parseFloat(clientPrice.replace(/[^0-9.]/g, '')) || 0;

    const newCl = addClient({
      name,
      phone: clientPhone || '+234 -',
      email: clientEmail || '',
      notes: clientNotes,
    });

    const snapshot = addSnapshot({
      clientId: newCl.id,
      date: new Date().toISOString().split('T')[0],
      unit: 'cm',
      garmentType: garment,
      measurements,
      notes: clientNotes,
    });

    addOrder({
      clientId: newCl.id,
      garmentType: garment,
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
  };

  // Recent orders list
  const recentOrdersList = [
    { id: 'ord-1', client: 'Chloe Dallas', initials: 'CD', garment: 'Bespoke African Gown', clientId: 'client-chloe' },
    { id: 'ord-2', client: 'Taylor Razaq', initials: 'TR', garment: 'Bespoke African Gown', clientId: 'client-taylor' },
    { id: 'ord-3', client: 'Bryan Muhammed', initials: 'BM', garment: 'Bespoke African Gown', clientId: 'client-bryan' },
  ];

  // List View Fields
  const allListFields = [
    { id: 'shoulder_width', alias: 'shoulder', label: 'Shoulder width' },
    { id: 'neck', label: 'Neck' },
    { id: 'bust_chest', alias: 'bust', label: 'Bust/Chest' },
    { id: 'ankle', label: 'Ankle' },
    { id: 'hip', label: 'Hip' },
    { id: 'wrist', label: 'Wrist' },
    { id: 'sleeve', label: 'Sleeve' },
    { id: 'waist', label: 'Waist' },
    { id: 'back', label: 'Back' },
    { id: 'neck_to_waist', label: 'Neck to Waist' },
    { id: 'neck_to_ankle', label: 'Neck to Ankle' },
    { id: 'thigh', label: 'Thigh' },
  ];

  const visibleListFields = allListFields.filter((f) => !hiddenFieldIds.includes(f.id));

  // Shared Subcomponents for Desktop & Mobile
  const renderNewClientCard = (isMobile = false) => (
    <div className="w-full bg-[var(--card)] rounded-[6px] p-3 flex flex-col gap-2">
      {/* Title */}
      <div>
        <h2 className="text-[16px] font-bold text-[var(--text)] leading-tight">
          New Client
        </h2>
        <p className="text-[12px] font-normal text-[var(--text-2)] mt-0.5 leading-snug">
          Enter client contact info, select garment template, and style notes.
        </p>
      </div>

      {/* White panel containing four sections */}
      <div className="bg-[var(--surface)] rounded-[8px] flex flex-col gap-[2px] p-[2px]">
        {/* Section 1: Basic Information */}
        <div className="bg-[var(--surface)] p-2.5 flex flex-col gap-1 rounded-[6px]">
          <h3 className="text-[14px] font-semibold text-[var(--text)]">
            Basic Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
            <Input
              label="Client"
              placeholder="e.g Adriana Kunle"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
            />
            <Input
              label="Garment Type"
              placeholder="Bespoke African Gown"
              value={clientGarment}
              onChange={(e) => setClientGarment(e.target.value)}
            />
            <Input
              label="Phone Number"
              placeholder="+234 -"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
            />
            <Input
              label="Email Address"
              placeholder="name@example.com"
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
            />
          </div>
        </div>

        {/* Section 2: Style References */}
        <div className="bg-[var(--surface)] p-2.5 flex flex-col gap-1 rounded-[6px]">
          <h3 className="text-[14px] font-semibold text-[var(--text)]">
            Style References
          </h3>
          <div className="pt-0.5">
            <AnimatedFileUpload
              images={styleImages}
              onChange={setStyleImages}
            />
          </div>
        </div>

        {/* Section 3: Price/Due date */}
        <div className="bg-[var(--surface)] p-2.5 flex flex-col gap-1 rounded-[6px]">
          <h3 className="text-[14px] font-semibold text-[var(--text)]">
            Price/Due date
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
            <Input
              label="Price (₦)"
              placeholder="₦0.00"
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
                  clientDueDate ? 'text-[var(--text-strong)] font-semibold tabular-nums' : ''
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
                      <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
                    </div>

                    {/* Days grid for October 2026 */}
                    <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium">
                      <span /><span /><span /><span />
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
          <h3 className="text-[14px] font-semibold text-[var(--text)]">
            Notes
          </h3>
          <div className="pt-0.5">
            <label className="block text-[11px] font-normal text-[var(--text)] mb-[2px]">
              Workroom notes and fabric details
            </label>
            <Textarea
              placeholder="e.g hand stiched, monogram design on wrist and gold buttons"
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
    <div className="w-full bg-[var(--card)] rounded-[6px] p-3 flex flex-col gap-2">
      {/* Title & Subtitle */}
      <div>
        <h2 className="text-[16px] font-bold text-[var(--text)] leading-tight">
          {centerView === 'mannequin' ? selectedTemplateName || 'Mannequin' : 'Measurement List View'}
        </h2>
        <div className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--muted)] mt-0.5">
          {centerView === 'mannequin' ? (
            <>
              <span>All available points</span>
              <span className="w-1 h-1 rounded-full bg-[var(--muted)]" />
              <span>{gender === 'female' ? 'Feminine Form' : 'Masculine Form'}</span>
            </>
          ) : (
            <span>Fast keyboard entry for all garment fields</span>
          )}
        </div>
      </div>

      {/* Toolbar: white pill container */}
      <div className="w-full rounded-[32px] bg-white p-2 flex flex-wrap items-center gap-2">
        {/* 1. Choose Template */}
        <button
          ref={triggerRef}
          type="button"
          onClick={() => {
            setDialogSelectedTemplateId(selectedTemplateId);
            setIsTemplateModalOpen(true);
          }}
          className="flex-1 min-w-[120px] h-9 rounded-[24px] bg-[var(--chip)] text-[var(--text-2)] text-[14px] font-medium flex items-center justify-center hover:bg-[#eaeaea] transition-colors cursor-pointer px-3"
        >
          Choose Template
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
        <div className="w-full flex items-center justify-center py-2 select-none">
          <svg
            viewBox="0 0 304 467"
            className="w-full max-w-[304px] max-h-[467px]"
            style={{ overflow: 'visible' }}
            preserveAspectRatio="xMidYMid meet"
          >
            <image
              href={gender === 'female' ? '/assets/mannequin-female-front.png' : '/assets/mannequin-male-front.png'}
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

            {/* Markers with generous 44px hit circles */}
            <g className="cursor-pointer group" onClick={() => handleOpenPoint('neck', 'Neck')}>
              <circle cx="145.7" cy="80.9" r="22" fill="transparent" />
              <circle cx="145.7" cy="80.9" r="5" fill="rgba(7, 155, 248, 0.15)" stroke="#079BF8" strokeWidth="1" />
              <circle cx="145.7" cy="80.9" r="2" fill="#079BF8" />
            </g>
            <g className="cursor-pointer group" onClick={() => handleOpenPoint('shoulder', 'Shoulder')}>
              <circle cx="178.9" cy="93.1" r="22" fill="transparent" />
              <circle cx="178.9" cy="93.1" r="5" fill="rgba(7, 155, 248, 0.15)" stroke="#079BF8" strokeWidth="1" />
              <circle cx="178.9" cy="93.1" r="2" fill="#079BF8" />
            </g>
            <g className="cursor-pointer group" onClick={() => handleOpenPoint('bust', 'Bust')}>
              <circle cx="178.9" cy="124.0" r="22" fill="transparent" />
              <circle cx="178.9" cy="124.0" r="5" fill="rgba(7, 155, 248, 0.15)" stroke="#079BF8" strokeWidth="1" />
              <circle cx="178.9" cy="124.0" r="2" fill="#079BF8" />
            </g>
            <g className="cursor-pointer group" onClick={() => handleOpenPoint('waist', 'Waist')}>
              <circle cx="119.6" cy="208.7" r="22" fill="transparent" />
              <circle cx="119.6" cy="208.7" r="5" fill="rgba(7, 155, 248, 0.15)" stroke="#079BF8" strokeWidth="1" />
              <circle cx="119.6" cy="208.7" r="2" fill="#079BF8" />
            </g>
            <g className="cursor-pointer group" onClick={() => handleOpenPoint('sleeve', 'Sleeve')}>
              <circle cx="221.0" cy="185.5" r="22" fill="transparent" />
              <circle cx="221.0" cy="185.5" r="5" fill="rgba(7, 155, 248, 0.15)" stroke="#079BF8" strokeWidth="1" />
              <circle cx="221.0" cy="185.5" r="2" fill="#079BF8" />
            </g>
            <g className="cursor-pointer group" onClick={() => handleOpenPoint('thigh', 'Thigh')}>
              <circle cx="178.9" cy="363.9" r="22" fill="transparent" />
              <circle cx="178.9" cy="363.9" r="5" fill="rgba(7, 155, 248, 0.15)" stroke="#079BF8" strokeWidth="1" />
              <circle cx="178.9" cy="363.9" r="2" fill="#079BF8" />
            </g>

            {/* Labels */}
            <text
              x="50.5"
              y="74.9"
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
              x="25.6"
              y="167.1"
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
        </div>
      ) : (
        /* Measurement List View */
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 py-1">
          {visibleListFields.map((field, idx) => {
            const rawVal = measurements[field.id] ?? (field.alias ? measurements[field.alias] : undefined);
            const strVal = rawVal !== undefined ? String(rawVal) : '';

            return (
              <div
                key={field.id}
                className="bg-white rounded-[16px] p-4 flex flex-col justify-between gap-4 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-semibold text-[var(--text)] truncate">
                    {field.label}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveField(field.id, field.label)}
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[var(--muted)] hover:text-black hover:bg-neutral-100 transition-colors cursor-pointer"
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
                    onChange={(e) => handleFieldChange(field.id, e.target.value, field.alias)}
                    onKeyDown={(e) => handleInputKeyDown(e, idx, visibleListFields.length)}
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
          <MorphingSaveButton
            idleText="Save"
            onClick={handleSaveOrder}
          />
        </div>
      )}
    </div>
  );

  const renderCalendarCard = (isMobile = false) => (
    <div className="w-full bg-[var(--card)] rounded-[6px] p-3 flex flex-col gap-3 relative">
      {/* Header with Title and Month navigation */}
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
                setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
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
                setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
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
            <span className={idx === todayWeekdayIndex ? 'text-[var(--text-strong)]' : 'text-[var(--weekday)]'}>
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

              {/* Status dot */}
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
        {activeDatePopover !== null && getOrdersForDay(activeDatePopover).length > 0 && (
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
                <div key={idx} className="flex items-center justify-between text-[11px] bg-[var(--chip)] p-2 rounded-[6px]">
                  <div>
                    <div className="font-medium text-[var(--text-strong)]">{item.client}</div>
                    <div className="text-[10px] text-[var(--muted)]">{item.garment}</div>
                  </div>
                  <span className="font-semibold text-[var(--text-date)] tabular-nums">{item.time}</span>
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

  const renderRecentOrdersCard = (isMobile = false) => (
    <div className="w-full bg-[var(--card)] rounded-[6px] p-3 flex flex-col gap-2">
      <h3 className="text-[14px] font-semibold text-[var(--text-strong)]">
        Recent Orders
      </h3>

      {/* White container holding rows with 2px gaps */}
      <div className="bg-[var(--surface)] p-[2px] rounded-[8px] flex flex-col gap-[2px]">
        {recentOrdersList.map((order) => (
          <div
            key={order.id}
            className="bg-[var(--chip)] rounded-[8px] p-2 flex items-center gap-2 justify-between"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[12px] font-bold text-[var(--text-strong)] shrink-0">
                {order.initials}
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] font-medium text-[var(--text-strong)] leading-tight">
                  {order.client}
                </span>
                <span className="text-[11px] font-normal text-[var(--muted)] leading-tight">
                  {order.garment}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (onOpenOrder) onOpenOrder(order.id, order.clientId);
                else onOpenClient(order.clientId);
              }}
              className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-[var(--text-strong)] hover:bg-neutral-100 transition-colors cursor-pointer shrink-0"
              title={`Open order for ${order.client}`}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="w-full min-h-screen bg-[var(--page)] select-none text-[var(--text)]">
      {/* =======================================================================
          PART A: MOBILE OVERVIEW (< 1024px)
          One scrolling page with everything stacked, no tabs.
          - From 640px up: capped at max-width: 720px and centered.
          - Below 640px: full width minus 8px margins (px-2).
          - One white outer container, 8px from top/left/right, 2px padding, radius 8,
            children stacked with 2px gap.
          - 88px space at bottom for floating navigation.
          ======================================================================= */}
      <div className="w-full px-2 sm:px-4 max-w-[720px] mx-auto pt-2 pb-[88px] lg:hidden flex flex-col gap-2">
        {/* Outer White Container */}
        <div className="w-full bg-[var(--surface)] p-[2px] rounded-[8px] flex flex-col gap-[2px]">
          {/* A.1 Header block: white wrapper (2px padding, radius 8) holding #F8F8F8 bar */}
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

          {/* A.2 New Client Card */}
          {renderNewClientCard(true)}

          {/* A.3 Mannequin Card */}
          {renderMannequinCard(true)}

          {/* A.4 Calendar & Pickups */}
          {renderCalendarCard(true)}

          {/* A.5 Recent Orders */}
          {renderRecentOrdersCard(true)}
        </div>
      </div>

      {/* A.9 Floating Navigation on Mobile (< 1024px) */}
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

      {/* =======================================================================
          PART B: DESKTOP OVERVIEW (>= 1024px / lg)
          Side-by-side blocks: Left Container (70.5%) + Right Column (28.2%)
          ======================================================================= */}
      <div className="hidden lg:block w-full max-w-[1216px] mx-auto px-4 sm:px-0 pt-4 pb-12">
        <div className="w-full flex flex-col xl:flex-row gap-4 items-start">
          {/* LEFT CONTAINER (70.5% width at 1280px) */}
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
              <MorphingSaveButton
                idleText="Save"
                onClick={handleSaveOrder}
              />
            </div>
          </div>

          {/* RIGHT COLUMN (28.2% width at 1280px) */}
          <div className="w-full xl:w-[28.2%] bg-[var(--surface)] p-[2px] rounded-[8px] flex flex-col gap-[2px]">
            {renderCalendarCard(false)}
            {renderRecentOrdersCard(false)}
          </div>
        </div>
      </div>

      {/* =======================================================================
          GARMENT TEMPLATES DIALOG / BOTTOM SHEET:
          - Desktop (>= 1024px): Centered modal dialog (435px wide)
          - Mobile (< 1024px): Bottom sheet anchored to bottom with drag handle
          - Enter transition: spring (stiffness 300, damping 22, mass 0.9) - 2 keyframes only!
          - Exit transition: duration 0.15, ease [0.2, 0, 0, 1]
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
              /* Desktop Centered Modal */
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
                  className="pointer-events-auto relative w-[435px] max-w-[calc(100vw-32px)] rounded-[16px] bg-white p-6 flex flex-col gap-6"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <h3 id="template-dialog-title" className="text-[16px] font-bold text-[var(--text)]">
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

                  {/* Templates list */}
                  <div className="flex flex-col gap-2.5 max-h-[380px] overflow-y-auto">
                    {OVERVIEW_TEMPLATES.map((tmpl) => {
                      const isSelected = dialogSelectedTemplateId === tmpl.id;
                      return (
                        <button
                          key={tmpl.id}
                          type="button"
                          onClick={() => setDialogSelectedTemplateId(tmpl.id)}
                          className={cn(
                            'w-full p-3.5 rounded-[12px] text-left transition-all flex items-center justify-between cursor-pointer border',
                            isSelected
                              ? 'border-[var(--selected)] bg-[var(--selected-bg)]'
                              : 'border-[var(--outline)] bg-[var(--card)] hover:bg-[#F3F3F3]'
                          )}
                        >
                          <div className="flex-1 pr-3">
                            <div className="text-[14px] font-semibold text-black">
                              {tmpl.name}
                            </div>
                            <div className="text-[12px] font-normal text-[var(--text-2)] mt-0.5 leading-snug">
                              {tmpl.description}
                            </div>
                          </div>
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
                        </button>
                      );
                    })}
                  </div>

                  {/* Footer actions */}
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
                      onClick={() => {
                        const tmpl = OVERVIEW_TEMPLATES.find((t) => t.id === dialogSelectedTemplateId);
                        if (tmpl) {
                          setSelectedTemplateId(tmpl.id);
                          setSelectedTemplateName(tmpl.name);
                          setClientGarment(tmpl.name);
                          setMeasurements((prev) => ({
                            ...prev,
                            ...tmpl.points,
                          }));
                        }
                        setIsTemplateModalOpen(false);
                        if (triggerRef.current) triggerRef.current.focus();
                      }}
                      className="h-9 px-6 rounded-[24px] bg-[var(--primary)] text-white text-[14px] font-medium hover:opacity-95 transition-opacity cursor-pointer shadow-xs"
                    >
                      Select Template
                    </button>
                  </div>
                </motion.div>
              </div>
            ) : (
              /* Mobile Bottom Sheet */
              <motion.div
                ref={templateDialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="template-dialog-title-mobile"
                initial={shouldReduceMotion ? { opacity: 0 } : { y: '100%' }}
                animate={shouldReduceMotion ? { opacity: 1 } : { y: 0 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { y: '100%', transition: { duration: 0.2 } }}
                transition={{ type: 'spring', stiffness: 320, damping: 32, mass: 0.9 }}
                className="fixed left-0 right-0 bottom-0 z-50 mx-auto w-full max-w-[640px] bg-white rounded-t-[16px] p-5 shadow-2xl flex flex-col gap-4 max-h-[85dvh] overflow-y-auto"
              >
                {/* Drag handle */}
                <div className="w-10 h-1 rounded-full bg-[#D9D8D8] mx-auto -mt-1 mb-1 shrink-0" />
                <div className="flex items-center justify-between shrink-0">
                  <h3 id="template-dialog-title-mobile" className="text-[16px] font-bold text-[var(--text)]">
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

                {/* Templates list */}
                <div className="flex flex-col gap-2.5 overflow-y-auto">
                  {OVERVIEW_TEMPLATES.map((tmpl) => {
                    const isSelected = dialogSelectedTemplateId === tmpl.id;
                    return (
                      <button
                        key={tmpl.id}
                        type="button"
                        onClick={() => setDialogSelectedTemplateId(tmpl.id)}
                        className={cn(
                          'w-full p-3.5 rounded-[12px] text-left transition-all flex items-center justify-between cursor-pointer border',
                          isSelected
                            ? 'border-[var(--selected)] bg-[var(--selected-bg)]'
                            : 'border-[var(--outline)] bg-[var(--card)] hover:bg-[#F3F3F3]'
                        )}
                      >
                        <div className="flex-1 pr-3">
                          <div className="text-[14px] font-semibold text-black">
                            {tmpl.name}
                          </div>
                          <div className="text-[12px] font-normal text-[var(--text-2)] mt-0.5 leading-snug">
                            {tmpl.description}
                          </div>
                        </div>
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
                      </button>
                    );
                  })}
                </div>

                {/* Footer actions */}
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
                    onClick={() => {
                      const tmpl = OVERVIEW_TEMPLATES.find((t) => t.id === dialogSelectedTemplateId);
                      if (tmpl) {
                        setSelectedTemplateId(tmpl.id);
                        setSelectedTemplateName(tmpl.name);
                        setClientGarment(tmpl.name);
                        setMeasurements((prev) => ({
                          ...prev,
                          ...tmpl.points,
                        }));
                      }
                      setIsTemplateModalOpen(false);
                      if (triggerRef.current) triggerRef.current.focus();
                    }}
                    className="h-9 px-6 rounded-[24px] bg-[var(--primary)] text-white text-[14px] font-medium hover:opacity-95 transition-opacity cursor-pointer shadow-xs"
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
          SET POINT SIZE / ADD POINT DIALOG / BOTTOM SHEET:
          - Desktop (>= 1024px): Centered modal dialog (400px wide)
          - Mobile (< 1024px): Bottom sheet anchored to bottom with drag handle
          - Enter transition: spring (stiffness 300, damping 22, mass 0.9) - 2 keyframes only!
          - Exit transition: duration 0.15, ease [0.2, 0, 0, 1]
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
              /* Desktop Centered Modal */
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
                  className="pointer-events-auto relative w-[400px] max-w-[calc(100vw-32px)] rounded-[16px] bg-white p-6 flex flex-col gap-6"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <h3 id="point-dialog-title" className="text-[16px] font-bold text-[var(--text)]">
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
                        if (triggerRef.current) triggerRef.current.focus();
                      }}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[var(--muted)] hover:text-black transition-colors cursor-pointer"
                      aria-label="Close dialog"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Form Content */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handlePointModalSubmit();
                    }}
                    className="flex flex-col gap-4"
                  >
                    {pointModalData.isCustom && (
                      <div>
                        <label className="block text-[11px] font-normal text-[var(--text)] mb-[2px]">
                          Point Name
                        </label>
                        <div className="w-full bg-[var(--card)] border border-[var(--card)] hover:bg-[#F1F1F1] hover:border-[#EDEDED] focus-within:!border-[var(--primary)] focus-within:ring-2 focus-within:ring-[rgba(29,73,232,0.15)] rounded-[8px] p-[2px] transition-all">
                          <input
                            type="text"
                            value={pointModalData.name}
                            placeholder="e.g. Jacket Length"
                            onChange={(e) => {
                              setPointModalError('');
                              setPointModalData({ ...pointModalData, name: e.target.value });
                            }}
                            autoFocus
                            className="w-full bg-transparent px-2 py-2 text-[12px] font-normal text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-normal text-[var(--text)] mb-[2px]">
                        Measurement ({unitLabel.toUpperCase()})
                      </label>
                      <div className="w-full bg-[var(--card)] border border-[var(--card)] hover:bg-[#F1F1F1] hover:border-[#EDEDED] focus-within:!border-[var(--primary)] focus-within:ring-2 focus-within:ring-[rgba(29,73,232,0.15)] rounded-[8px] p-[2px] transition-all flex items-center">
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
                          className="w-full bg-transparent px-2 py-2 text-[12px] font-normal text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none tabular-nums"
                        />
                        <span className="pr-2 text-[12px] font-medium text-black select-none shrink-0">
                          {unitLabel}
                        </span>
                      </div>
                    </div>

                    {pointModalError && (
                      <p className="text-[12px] text-[var(--paused)] font-normal">
                        {pointModalError}
                      </p>
                    )}

                    {/* Footer buttons */}
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
                        Save
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            ) : (
              /* Mobile Bottom Sheet */
              <motion.div
                ref={pointDialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="point-dialog-title-mobile"
                initial={shouldReduceMotion ? { opacity: 0 } : { y: '100%' }}
                animate={shouldReduceMotion ? { opacity: 1 } : { y: 0 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { y: '100%', transition: { duration: 0.2 } }}
                transition={{ type: 'spring', stiffness: 320, damping: 32, mass: 0.9 }}
                className="fixed left-0 right-0 bottom-0 z-50 mx-auto w-full max-w-[640px] bg-white rounded-t-[16px] p-5 shadow-2xl flex flex-col gap-4 max-h-[85dvh] overflow-y-auto"
              >
                {/* Drag handle */}
                <div className="w-10 h-1 rounded-full bg-[#D9D8D8] mx-auto -mt-1 mb-1 shrink-0" />
                <div className="flex items-center justify-between shrink-0">
                  <h3 id="point-dialog-title-mobile" className="text-[16px] font-bold text-[var(--text)]">
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
                      if (triggerRef.current) triggerRef.current.focus();
                    }}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--muted)] hover:text-black transition-colors cursor-pointer"
                    aria-label="Close dialog"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Form Content */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handlePointModalSubmit();
                  }}
                  className="flex flex-col gap-4"
                >
                  {pointModalData.isCustom && (
                    <div>
                      <label className="block text-[11px] font-normal text-[var(--text)] mb-[2px]">
                        Point Name
                      </label>
                      <div className="w-full bg-[var(--card)] border border-[var(--card)] hover:bg-[#F1F1F1] hover:border-[#EDEDED] focus-within:!border-[var(--primary)] focus-within:ring-2 focus-within:ring-[rgba(29,73,232,0.15)] rounded-[8px] p-[2px] transition-all">
                        <input
                          type="text"
                          value={pointModalData.name}
                          placeholder="e.g. Jacket Length"
                          onChange={(e) => {
                            setPointModalError('');
                            setPointModalData({ ...pointModalData, name: e.target.value });
                          }}
                          autoFocus
                          className="w-full bg-transparent px-2 py-2 text-[12px] font-normal text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-normal text-[var(--text)] mb-[2px]">
                      Measurement ({unitLabel.toUpperCase()})
                    </label>
                    <div className="w-full bg-[var(--card)] border border-[var(--card)] hover:bg-[#F1F1F1] hover:border-[#EDEDED] focus-within:!border-[var(--primary)] focus-within:ring-2 focus-within:ring-[rgba(29,73,232,0.15)] rounded-[8px] p-[2px] transition-all flex items-center">
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
                        className="w-full bg-transparent px-2 py-2 text-[12px] font-normal text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none tabular-nums"
                      />
                      <span className="pr-2 text-[12px] font-medium text-black select-none shrink-0">
                        {unitLabel}
                      </span>
                    </div>
                  </div>

                  {pointModalError && (
                    <p className="text-[12px] text-[var(--paused)] font-normal">
                      {pointModalError}
                    </p>
                  )}

                  {/* Footer buttons */}
                  <div className="flex items-center justify-end gap-2.5 pt-2 shrink-0">
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
                      Save
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>

      {/* Floating Undo Toast (5 seconds) when a field is removed */}
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
              Removed &quot;{undoToast.label}&quot;
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
    </div>
  );
}
