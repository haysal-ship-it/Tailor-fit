'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useStore } from '@/lib/store';
import { AtelierMannequin } from '@/components/AtelierMannequin';
import { 
  User, 
  Ruler, 
  Calendar as CalendarIcon, 
  Plus, 
  X, 
  ChevronDown, 
  ChevronUp, 
  CalendarDays,
  ListFilter
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MorphingSaveButton } from '@/components/ui/MorphingSaveButton';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { SpringSelect } from '@/components/ui/SpringSelect';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { AnimatedFileUpload } from '@/components/ui/AnimatedFileUpload';
import { DrawCheckbox } from '@/components/ui/DrawCheckbox';
import { ToastContainer, ToastMessage } from '@/components/ui/Toasts';
import { ExpandableDataRow, OrderRowData } from '@/components/ui/ExpandableDataRow';
import { SmallFloatingDock } from '@/components/ui/SmallFloatingDock';
import { springSmooth, springGentle } from '@/lib/motion-tokens';
import { cn } from '@/lib/utils';

export interface GarmentTemplate {
  id: string;
  title: string;
  description: string;
  presets: Record<string, number>;
  tableItems: Array<{ id: string; label: string; value: string }>;
}

export const GARMENT_TEMPLATES: GarmentTemplate[] = [
  {
    id: 'shirt_blouse',
    title: 'Shirt / Blouse',
    description: 'Essential measurements for bespoke dress shirts and tailored blouses',
    presets: { neck: 36, shoulder: 42, bust: 92, waist: 72, sleeve: 60, back: 40 },
    tableItems: [
      { id: 'shoulder', label: 'Shoulder width', value: '42.0' },
      { id: 'neck', label: 'Neck Circumference', value: '36.0' },
      { id: 'bust', label: 'Bust / Chest', value: '92.0' },
      { id: 'waist', label: 'Waist', value: '72.0' },
      { id: 'sleeve', label: 'Sleeve Length', value: '60.0' },
      { id: 'back', label: 'Back Width', value: '40.0' },
    ],
  },
  {
    id: 'bespoke_gown',
    title: 'Bespoke African Gown',
    description: 'Traditional couture gown, corset-backed silhouettes and flared hems',
    presets: { neck: 36, shoulder: 42, bust: 94, waist: 70, hip: 102, thigh: 56, ankle: 24, back: 41 },
    tableItems: [
      { id: 'shoulder', label: 'Shoulder width', value: '42.0' },
      { id: 'bust', label: 'Full Bust', value: '94.0' },
      { id: 'waist', label: 'Natural Waist', value: '70.0' },
      { id: 'hip', label: 'High / Full Hip', value: '102.0' },
      { id: 'back', label: 'Cross Back', value: '41.0' },
      { id: 'sleeve', label: 'Full Arm Length', value: '59.0' },
      { id: 'thigh', label: 'Upper Thigh', value: '56.0' },
      { id: 'ankle', label: 'Ankle Opening', value: '24.0' },
    ],
  },
  {
    id: 'trousers',
    title: 'Trousers',
    description: 'Custom fitted trousers, pleated slacks and waist-to-ankle specifications',
    presets: { waist: 78, hip: 98, thigh: 56, ankle: 24 },
    tableItems: [
      { id: 'waist', label: 'Waist Circumference', value: '78.0' },
      { id: 'hip', label: 'Seat / Hip', value: '98.0' },
      { id: 'thigh', label: 'Thigh Width', value: '56.0' },
      { id: 'ankle', label: 'Ankle Opening', value: '24.0' },
    ],
  },
  {
    id: 'two_piece_suit',
    title: '2-Piece Suit',
    description: 'Jacket and matching trousers tailored specifications',
    presets: { neck: 38, shoulder: 45, bust: 100, waist: 82, hip: 100, sleeve: 63, thigh: 58, ankle: 25, back: 44 },
    tableItems: [
      { id: 'shoulder', label: 'Shoulder width', value: '45.0' },
      { id: 'bust', label: 'Chest Circumference', value: '100.0' },
      { id: 'waist', label: 'Jacket Waist', value: '82.0' },
      { id: 'sleeve', label: 'Sleeve Length', value: '63.0' },
      { id: 'hip', label: 'Hip Circumference', value: '100.0' },
      { id: 'back', label: 'Back Width', value: '44.0' },
    ],
  },
];

export const STANDARD_POINT_OPTIONS = [
  { key: 'neck', name: 'Neck' },
  { key: 'shoulder', name: 'Shoulder width' },
  { key: 'bust', name: 'Full Bust' },
  { key: 'waist', name: 'Natural Waist' },
  { key: 'hip', name: 'High / Full Hip' },
  { key: 'sleeve', name: 'Full Arm Length' },
  { key: 'thigh', name: 'Upper Thigh' },
  { key: 'ankle', name: 'Ankle Opening' },
  { key: 'back', name: 'Cross Back' },
  { key: 'cross_chest', name: 'Cross Chest' },
  { key: 'armhole', name: 'Armhole Depth' },
  { key: 'nape_to_waist', name: 'Nape to Waist' },
  { key: 'inseam', name: 'Inseam Length' },
  { key: 'outseam', name: 'Outseam Length' },
  { key: 'bicep', name: 'Bicep Width' },
  { key: 'wrist', name: 'Wrist Opening' },
  { key: 'custom', name: 'Custom Point...' },
];

interface OverviewScreenProps {
  onOpenClient: (clientId: string) => void;
  onOpenOrder?: (orderId: string, clientId: string) => void;
}

let overviewToastSeq = 0;
let overviewClientSeq = 0;
let overviewOrderSeq = 0;

export function OverviewScreen({ onOpenClient, onOpenOrder }: OverviewScreenProps) {
  const { clients, addOrder, addClient } = useStore();
  const shouldReduceMotion = useReducedMotion();

  // Mobile active panel
  const [mobileTab, setMobileTab] = useState<'client' | 'measure' | 'schedule'>('client');

  // Tablet collapsible calendar
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(true);

  // Form state
  const [clientName, setClientName] = useState('');
  const [garmentType, setGarmentType] = useState('Bespoke African Gown');
  const [phone, setPhone] = useState('+234 - ');
  const [email, setEmail] = useState('');
  const [price, setPrice] = useState('130,000');
  const [dueDate, setDueDate] = useState('09/10/2026');
  const [notes, setNotes] = useState('Embellished neckline, corset silhouette');
  const [referenceImages, setReferenceImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=300&q=80',
  ]);

  // Controls
  const [selectedTemplate, setSelectedTemplate] = useState('bespoke_gown');
  const [gender, setGender] = useState<'M' | 'F'>('F');
  const [centerView, setCenterView] = useState<'mannequin' | 'table'>('mannequin');

  // Measurements state
  const [measurements, setMeasurements] = useState<Record<string, number>>({
    shoulder: 42,
    neck: 36,
    bust: 94,
    waist: 70,
    hip: 102,
    sleeve: 59,
    thigh: 56,
    ankle: 24,
    back: 41,
  });

  // Table items state
  const [measurementList, setMeasurementList] = useState([
    { id: 'shoulder', label: 'Shoulder width', value: '42.0', confirmed: true },
    { id: 'bust', label: 'Full Bust', value: '94.0', confirmed: true },
    { id: 'waist', label: 'Natural Waist', value: '70.0', confirmed: true },
    { id: 'hip', label: 'High / Full Hip', value: '102.0', confirmed: true },
    { id: 'sleeve', label: 'Full Arm Length', value: '59.0', confirmed: true },
    { id: 'back', label: 'Cross Back', value: '41.0', confirmed: true },
    { id: 'thigh', label: 'Upper Thigh', value: '56.0', confirmed: true },
    { id: 'ankle', label: 'Ankle Opening', value: '24.0', confirmed: true },
  ]);

  // Origin-anchored popover modal for landmark editing on Mannequin
  const [pointModalData, setPointModalData] = useState<{
    key?: string;
    selectedOptionKey?: string;
    name: string;
    value: string;
    isCustom: boolean;
  } | null>(null);
  const [pointModalError, setPointModalError] = useState<string>('');

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

  // Calendar state
  const [selectedDay, setSelectedDay] = useState<number>(17);
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const [calendarViewMode, setCalendarViewMode] = useState<'grid' | 'agenda'>('grid');

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${++overviewToastSeq}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Recent orders list
  const recentOrdersData: OrderRowData[] = [
    {
      id: 'ord-1',
      clientId: 'c-1',
      clientName: 'Chloe Dallas',
      initials: 'CD',
      garment: 'Bespoke African Gown',
      price: 130000,
      dueDate: '09/10/2026',
      status: 'Ready',
    },
    {
      id: 'ord-2',
      clientId: 'c-2',
      clientName: 'Taylor Razaq',
      initials: 'TR',
      garment: 'Oxford Three Piece Suit',
      price: 230000,
      dueDate: '14/10/2026',
      status: 'In Progress',
    },
    {
      id: 'ord-3',
      clientId: 'c-3',
      clientName: 'Bryan Muhammed',
      initials: 'BM',
      garment: 'Silk Evening Gown',
      price: 95000,
      dueDate: '09/10/2026',
      status: 'Urgent',
      isUrgent: true,
    },
  ];

  // Calendar day pickups mapping
  const dayOrders: Record<number, Array<{ client: string; garment: string; time: string; status: string }>> = {
    7: [{ client: 'Bryan Muhammed', garment: 'Silk Evening Gown', time: '11:00 AM', status: 'Urgent' }],
    17: [
      { client: 'Chloe Dallas', garment: 'Bespoke African Gown', time: '10:00 AM', status: 'Ready' },
      { client: 'Amanda Billings', garment: 'Bridal Corset Train', time: '02:30 PM', status: 'In Progress' },
    ],
    23: [{ client: 'Taylor Razaq', garment: 'Oxford Three Piece Suit', time: '04:15 PM', status: 'In Progress' }],
  };

  const handleTemplateChange = (val: string) => {
    setSelectedTemplate(val);
    const found = GARMENT_TEMPLATES.find((t) => t.id === val);
    if (found) {
      setMeasurements({ ...found.presets });
      setMeasurementList(
        found.tableItems.map((item) => ({ ...item, confirmed: true }))
      );
    }
  };

  const handleMeasurementChange = (key: string, val: number, label?: string) => {
    setMeasurements((prev) => ({ ...prev, [key]: val }));
    setMeasurementList((prev) => {
      const exists = prev.some((item) => item.id === key);
      if (exists) {
        return prev.map((item) =>
          item.id === key
            ? { ...item, value: val.toFixed(1), ...(label ? { label } : {}), confirmed: true }
            : item
        );
      }
      return [
        ...prev,
        {
          id: key,
          label: label || key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
          value: val.toFixed(1),
          confirmed: true,
        },
      ];
    });
  };

  const handleListValueChange = (id: string, value: string) => {
    setMeasurementList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, value } : item))
    );
    const num = parseFloat(value);
    if (!isNaN(num)) {
      setMeasurements((prev) => ({ ...prev, [id]: num }));
    }
  };

  const handleDeleteListItem = (id: string) => {
    const itemToDelete = measurementList.find((item) => item.id === id);
    if (!itemToDelete) return;

    setMeasurementList((prev) => prev.filter((item) => item.id !== id));

    addToast({
      type: 'undo',
      message: `Removed "${itemToDelete.label}"`,
      onUndo: () => {
        setMeasurementList((prev) => [...prev, itemToDelete]);
      },
    });
  };

  const handleSaveOrder = async () => {
    if (!clientName.trim()) {
      addToast({
        type: 'velocity',
        message: 'Please provide a client name first.',
      });
      throw new Error('Client name required');
    }

    let existingClient = clients.find(
      (c) => c.name.toLowerCase() === clientName.trim().toLowerCase()
    );

    let targetClientId: string;

    if (!existingClient) {
      const newClient = addClient({
        name: clientName.trim(),
        email: email.trim() || `${clientName.trim().toLowerCase().replace(/\s+/g, '.')}@example.com`,
        phone: phone.trim() || '+234 - ',
        notes: notes.trim(),
      });
      targetClientId = newClient.id;
    } else {
      targetClientId = existingClient.id;
    }

    const numericPrice = parseFloat(price.replace(/[^0-9.]/g, '')) || 0;
    addOrder({
      clientId: targetClientId,
      garmentType: garmentType.trim() || 'Bespoke Garment',
      price: numericPrice,
      status: 'In Progress',
      pickupDateTime: new Date().toISOString(),
      notes: notes.trim(),
      referenceImages: referenceImages.map((url, i) => ({
        id: `ref-${i + 1}`,
        url,
        title: 'Reference Image',
      })),
    });

    addToast({
      type: 'velocity',
      message: 'Client profile & order saved successfully.',
    });
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 py-3 space-y-4 pb-28 md:pb-6">
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* =======================================================================
          3-COLUMN DESKTOP (≥1280px)
          2-COLUMN TABLET (768–1279px) + COLLAPSIBLE BOTTOM SECTION
          1-COLUMN MOBILE (<768px) WITH FLOATING DOCK
          ======================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-12 xl:grid-cols-12 gap-4 items-start">
        
        {/* =====================================================================
            COLUMN 1: New Client & Order Intake Form
            Desktop: col-span-4 | Tablet: col-span-6 | Mobile: visible when tab === 'client'
            ===================================================================== */}
        <div
          className={cn(
            'md:col-span-6 xl:col-span-4 rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] p-4 sm:p-6 space-y-4 transition-colors hover:border-[var(--border-strong)]',
            mobileTab !== 'client' ? 'hidden md:block' : 'block'
          )}
        >
          {/* Card Title: 16px, weight 600, tracking -0.01em */}
          <div className="flex items-center justify-between pb-1 border-b border-[var(--border)]">
            <h2 className="text-base font-semibold tracking-[-0.01em] text-[var(--text)]">
              New Client
            </h2>
            <span className="text-xs font-normal text-[var(--text-muted)] font-mono">
              Intake 01
            </span>
          </div>

          {/* Template Select & Gender SegmentedControl */}
          <div className="space-y-3">
            <SpringSelect
              label="Garment Blueprint"
              options={GARMENT_TEMPLATES.map((t) => ({
                value: t.id,
                label: t.title,
                description: t.description,
              }))}
              value={selectedTemplate}
              onChange={handleTemplateChange}
            />

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-normal text-[var(--text-muted)]">Mannequin Form</span>
              <SegmentedControl
                name="gender-toggle"
                size="sm"
                value={gender}
                onChange={(g) => setGender(g as 'M' | 'F')}
                options={[
                  { value: 'F', label: 'Female' },
                  { value: 'M', label: 'Male' },
                ]}
              />
            </div>
          </div>

          {/* Basic Information */}
          <div className="space-y-3 pt-2">
            <div className="border-b border-[var(--border)] pb-1">
              <h3 className="text-sm font-medium text-[var(--text)]">Basic Information</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <Input
                label="Client Name"
                placeholder="e.g. Adriana Kunle"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
              <Input
                label="Garment Type"
                placeholder="Bespoke African Gown"
                value={garmentType}
                onChange={(e) => setGarmentType(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <Input
                label="Phone Number"
                placeholder="+234 - "
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <Input
                label="Email Address"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Style References */}
          <div className="space-y-2 pt-2">
            <div className="border-b border-[var(--border)] pb-1">
              <h3 className="text-sm font-medium text-[var(--text)]">Style References</h3>
            </div>
            <AnimatedFileUpload
              images={referenceImages}
              onChange={setReferenceImages}
            />
          </div>

          {/* Price / Due date */}
          <div className="space-y-2.5 pt-2">
            <div className="border-b border-[var(--border)] pb-1">
              <h3 className="text-sm font-medium text-[var(--text)]">Price / Due date</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <Input
                label="Price"
                leftAddon={<span className="font-mono text-xs">₦</span>}
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
              <Input
                label="Due Date"
                placeholder="09/10/2026"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2 pt-2">
            <div className="border-b border-[var(--border)] pb-1">
              <h3 className="text-sm font-medium text-[var(--text)]">Notes</h3>
            </div>
            <Textarea
              rows={3}
              placeholder="e.g. hand stitched, monogram design on wrist and gold buttons"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        {/* =====================================================================
            COLUMN 2: Mannequin Canvas OR Measurement List View
            Desktop: col-span-5 | Tablet: col-span-6 | Mobile: visible when tab === 'measure'
            ===================================================================== */}
        <div
          className={cn(
            'md:col-span-6 xl:col-span-5 rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] p-4 sm:p-6 flex flex-col justify-between min-h-[640px] space-y-4 transition-colors hover:border-[var(--border-strong)]',
            mobileTab !== 'measure' ? 'hidden md:flex' : 'flex'
          )}
        >
          {/* Card Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
            <div>
              <h2 className="text-base font-semibold tracking-[-0.01em] text-[var(--text)]">
                {centerView === 'mannequin' ? 'Mannequin' : 'Measurement List View'}
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                {centerView === 'mannequin'
                  ? 'Interactive landmarks on anatomical mannequin'
                  : 'Fast keyboard entry for all garment fields'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => {
                  setPointModalError('');
                  setPointModalData({
                    selectedOptionKey: 'custom',
                    name: 'Custom Point',
                    value: '50.0',
                    isCustom: true,
                  });
                }}
              >
                Add Point
              </Button>

              <SegmentedControl
                name="mannequin-view-toggle"
                size="sm"
                value={centerView}
                onChange={(v) => setCenterView(v as 'mannequin' | 'table')}
                options={[
                  { value: 'mannequin', label: '', icon: <User className="w-3.5 h-3.5" /> },
                  { value: 'table', label: '', icon: <Ruler className="w-3.5 h-3.5" /> },
                ]}
              />
            </div>
          </div>

          {/* Mannequin Interactive Graphic OR List View */}
          <div className="flex-1 py-2 flex items-center justify-center">
            {centerView === 'mannequin' ? (
              <div className="w-full flex items-center justify-center relative">
                <AtelierMannequin
                  gender={gender}
                  unit="cm"
                  measurements={measurements}
                  onMeasurementChange={handleMeasurementChange}
                  onSelectLandmark={(key, name, currentVal) => {
                    setPointModalError('');
                    setPointModalData({
                      key,
                      selectedOptionKey: key,
                      name,
                      value: String(currentVal),
                      isCustom: false,
                    });
                  }}
                />
              </div>
            ) : (
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5 self-start">
                {measurementList.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] flex flex-col justify-between h-24 transition-colors hover:border-[var(--border-strong)]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-[var(--text)] truncate pr-1">
                        {item.label}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteListItem(item.id)}
                        className="text-[var(--text-faint)] hover:text-[var(--text)] p-1 transition-colors cursor-pointer"
                        title="Remove point"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between bg-[var(--surface-2)] px-3 py-1.5 rounded-xl border border-[var(--border)]">
                      <input
                        type="text"
                        value={item.value}
                        onChange={(e) => handleListValueChange(item.id, e.target.value)}
                        className="w-16 font-mono text-xs font-semibold text-[var(--text)] focus:outline-none bg-transparent tabular-nums"
                      />
                      <DrawCheckbox
                        checked={item.confirmed}
                        onChange={(chk) => {
                          setMeasurementList((prev) =>
                            prev.map((i) => (i.id === item.id ? { ...i, confirmed: chk } : i))
                          );
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* EXACTLY ONE PRIMARY COMMIT BUTTON PER SCREEN: Morphing Save Button */}
          <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between">
            <span className="text-xs text-[var(--text-muted)] font-mono">
              {Object.keys(measurements).length} points measured
            </span>
            <MorphingSaveButton
              idleText="Save Order"
              onClick={handleSaveOrder}
            />
          </div>
        </div>

        {/* =====================================================================
            COLUMN 3: Desktop Sidebar (≥1280px)
            "Garment's Calendar" & "Recent Orders" Card
            ===================================================================== */}
        <div className="hidden xl:block xl:col-span-3 space-y-4">
          
          {/* Garment's Calendar Card */}
          <div className="rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] p-5 space-y-3.5 transition-colors hover:border-[var(--border-strong)] relative">
            <div className="flex items-center justify-between pb-1">
              <h2 className="text-base font-semibold tracking-[-0.01em] text-[var(--text)]">
                Garment&apos;s Calendar
              </h2>
              <span className="text-xs font-mono text-[var(--text-muted)]">Oct 2026</span>
            </div>

            {/* Weekdays */}
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-[var(--text-faint)]">
              <div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div><div>Su</div>
            </div>

            {/* Calendar Day Grid */}
            <div className="grid grid-cols-7 gap-1 text-center">
              <div className="aspect-square" />
              <div className="aspect-square" />
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                const isSelected = selectedDay === day;
                const isToday = day === 8;
                const hasOrders = dayOrders[day];

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setSelectedDay(day)}
                    onMouseEnter={() => setHoveredDay(day)}
                    onMouseLeave={() => setHoveredDay(null)}
                    className={cn(
                      'aspect-square rounded-xl flex flex-col items-center justify-center relative font-mono text-xs transition-colors cursor-pointer select-none',
                      isSelected
                        ? 'bg-[var(--accent)] text-white font-semibold'
                        : 'bg-[var(--surface-2)] text-[var(--text)] hover:bg-[var(--border)]',
                      isToday && !isSelected && 'ring-1 ring-[var(--border-strong)] font-bold'
                    )}
                  >
                    <span>{day}</span>
                    {hasOrders && (
                      <span
                        className={cn(
                          'w-1 h-1 rounded-full mt-0.5',
                          day === 7
                            ? 'bg-[var(--status-danger)]'
                            : day === 17
                            ? 'bg-[var(--status-success)]'
                            : 'bg-[var(--status-warning)]',
                          isSelected && 'bg-white'
                        )}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Peek Card Popover for selected day */}
            <AnimatePresence>
              {dayOrders[selectedDay] && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={springSmooth}
                  className="rounded-xl p-3 bg-[var(--surface-2)] border border-[var(--border)] space-y-2 mt-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[var(--text)]">
                      Pickups for Oct {selectedDay}
                    </span>
                    <span className="text-[10px] font-mono text-[var(--text-muted)]">
                      {dayOrders[selectedDay].length} order(s)
                    </span>
                  </div>
                  {dayOrders[selectedDay].map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-[var(--surface-1)] border border-[var(--border)] text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium text-[var(--text)]">{item.client}</div>
                        <div className="text-[11px] text-[var(--text-muted)]">{item.garment}</div>
                      </div>
                      <span className="font-mono text-[10px] text-[var(--text-muted)]">
                        {item.time}
                      </span>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Calendar Legend */}
            <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[var(--status-success)]" /> Ready
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[var(--status-warning)]" /> In Progress
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[var(--status-danger)]" /> Urgent
              </span>
            </div>
          </div>

          {/* Recent Orders List Card */}
          <div className="rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] p-5 space-y-3 transition-colors hover:border-[var(--border-strong)]">
            <div className="flex items-center justify-between pb-1 border-b border-[var(--border)]">
              <h3 className="text-sm font-medium text-[var(--text)]">Recent Orders</h3>
              <span className="text-xs font-mono text-[var(--text-muted)]">Active</span>
            </div>

            <div className="space-y-2">
              {recentOrdersData.map((order) => (
                <ExpandableDataRow
                  key={order.id}
                  order={order}
                  onOpenOrder={(ordId, clId) => {
                    if (onOpenOrder) onOpenOrder(ordId, clId);
                    else onOpenClient(clId);
                  }}
                />
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* =======================================================================
          TABLET ONLY (768px – 1279px): Collapsible Section below Form + Mannequin
          ======================================================================= */}
      <div className="hidden md:block xl:hidden rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] p-5 space-y-4">
        <button
          type="button"
          onClick={() => setIsCalendarExpanded(!isCalendarExpanded)}
          className="w-full flex items-center justify-between text-left cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-[var(--text)]" />
            <h2 className="text-base font-semibold tracking-[-0.01em] text-[var(--text)]">
              Garment&apos;s Schedule &amp; Recent Orders
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <span>{isCalendarExpanded ? 'Collapse' : 'Expand'}</span>
            {isCalendarExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        <AnimatePresence>
          {isCalendarExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={springGentle}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-[var(--border)] overflow-hidden"
            >
              {/* Tablet Day Pickups */}
              <div className="space-y-2">
                <span className="text-xs font-medium text-[var(--text-muted)] block">
                  Today&apos;s Scheduled Pickups
                </span>
                {dayOrders[17]?.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-medium text-[var(--text)]">{item.client}</div>
                      <div className="text-[11px] text-[var(--text-muted)]">{item.garment}</div>
                    </div>
                    <span className="font-mono text-xs text-[var(--text)]">{item.time}</span>
                  </div>
                ))}
              </div>

              {/* Tablet Orders List */}
              <div className="space-y-2">
                <span className="text-xs font-medium text-[var(--text-muted)] block">
                  Recent Orders
                </span>
                {recentOrdersData.map((order) => (
                  <ExpandableDataRow
                    key={order.id}
                    order={order}
                    onOpenOrder={(ordId, clId) => {
                      if (onOpenOrder) onOpenOrder(ordId, clId);
                      else onOpenClient(clId);
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* =======================================================================
          MOBILE ONLY (<768px): Schedule Panel (when tab === 'schedule')
          ======================================================================= */}
      <div
        className={cn(
          'md:hidden rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] p-4 space-y-4',
          mobileTab === 'schedule' ? 'block' : 'hidden'
        )}
      >
        <div className="flex items-center justify-between pb-1 border-b border-[var(--border)]">
          <h2 className="text-base font-semibold tracking-[-0.01em] text-[var(--text)]">
            Garment&apos;s Calendar &amp; Pickups
          </h2>
          <span className="text-xs font-mono text-[var(--text-muted)]">Oct 2026</span>
        </div>

        {/* Mobile Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 text-center font-mono text-xs">
          {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => setSelectedDay(day)}
              className={cn(
                'aspect-square rounded-xl flex items-center justify-center',
                selectedDay === day
                  ? 'bg-[var(--accent)] text-white font-semibold'
                  : 'bg-[var(--surface-2)] text-[var(--text)]'
              )}
            >
              {day}
            </button>
          ))}
        </div>

        {/* Mobile Day Pickups */}
        <div className="space-y-2 pt-2">
          <span className="text-xs font-medium text-[var(--text-muted)] block">
            Pickups for Oct {selectedDay}
          </span>
          {(dayOrders[selectedDay] || []).length > 0 ? (
            dayOrders[selectedDay].map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-medium text-[var(--text)]">{item.client}</div>
                  <div className="text-[11px] text-[var(--text-muted)]">{item.garment}</div>
                </div>
                <span className="font-mono text-xs text-[var(--text)]">{item.time}</span>
              </div>
            ))
          ) : (
            <div className="p-3 text-center text-xs text-[var(--text-muted)] rounded-xl bg-[var(--surface-2)]">
              No scheduled pickups for this date.
            </div>
          )}
        </div>

        {/* Mobile Recent Orders */}
        <div className="space-y-2 pt-2">
          <span className="text-xs font-medium text-[var(--text-muted)] block">Recent Orders</span>
          {recentOrdersData.map((order) => (
            <ExpandableDataRow
              key={order.id}
              order={order}
              onOpenOrder={(ordId, clId) => {
                if (onOpenOrder) onOpenOrder(ordId, clId);
                else onOpenClient(clId);
              }}
            />
          ))}
        </div>
      </div>

      {/* =======================================================================
          MOBILE FLOATING DOCK (<768px): Fixed bottom pill with 3 tabs
          ======================================================================= */}
      <SmallFloatingDock
        activeTab={mobileTab}
        onChange={setMobileTab}
        tabs={[
          { id: 'client', label: 'Client', icon: <User className="w-4 h-4" /> },
          { id: 'measure', label: 'Measure', icon: <Ruler className="w-4 h-4" /> },
          { id: 'schedule', label: 'Schedule', icon: <CalendarIcon className="w-4 h-4" /> },
        ]}
      />

      {/* Origin-anchored popover modal for Landmark Editing on Mannequin */}
      <AnimatePresence>
        {pointModalData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div
              className="absolute inset-0"
              onClick={() => {
                setPointModalData(null);
                setPointModalError('');
              }}
            />
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: [0.94, 1.02, 1], opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              transition={springSmooth}
              className="relative w-full max-w-sm rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] p-5 shadow-2xl z-10 space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                <h3 className="text-sm font-semibold tracking-[-0.01em] text-[var(--text)]">
                  {pointModalData.key
                    ? `Edit ${pointModalData.name}`
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
                  className="w-7 h-7 rounded-full bg-[var(--surface-2)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!pointModalData) return;
                  const nameTrimmed = pointModalData.name.trim();
                  if (!nameTrimmed) {
                    setPointModalError('Point name is required');
                    return;
                  }
                  const num = parseFloat(pointModalData.value);
                  if (isNaN(num) || num <= 0) {
                    setPointModalError('Please enter a valid positive measurement value');
                    return;
                  }

                  const targetKey =
                    pointModalData.key ||
                    (pointModalData.selectedOptionKey && pointModalData.selectedOptionKey !== 'custom'
                      ? pointModalData.selectedOptionKey
                      : nameTrimmed.toLowerCase().replace(/[^a-z0-9]+/g, '_'));

                  handleMeasurementChange(targetKey, num, nameTrimmed);
                  setPointModalData(null);
                  setPointModalError('');
                }}
                className="space-y-3.5"
              >
                {/* Point Selector when adding a point (not editing an existing landmark) */}
                {!pointModalData.key && (
                  <div>
                    <label className="block text-xs font-normal text-[var(--text-muted)] mb-1.5">
                      Point Type
                    </label>
                    <select
                      value={pointModalData.selectedOptionKey || (pointModalData.isCustom ? 'custom' : '')}
                      onChange={(e) => {
                        const optKey = e.target.value;
                        setPointModalError('');
                        if (optKey === 'custom') {
                          setPointModalData({
                            ...pointModalData,
                            key: undefined,
                            selectedOptionKey: 'custom',
                            name: pointModalData.name === 'Neck' ? 'Custom Point' : pointModalData.name || 'Custom Point',
                            isCustom: true,
                          });
                        } else {
                          const found = STANDARD_POINT_OPTIONS.find((o) => o.key === optKey);
                          const existingVal = measurements[optKey];
                          setPointModalData({
                            ...pointModalData,
                            key: optKey,
                            selectedOptionKey: optKey,
                            name: found ? found.name : optKey,
                            value: existingVal ? String(existingVal) : pointModalData.value || '50.0',
                            isCustom: false,
                          });
                        }
                      }}
                      className="w-full h-10 px-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] text-xs focus:outline-none focus:border-[var(--accent)]"
                    >
                      <optgroup label="Standard Landmarks">
                        {STANDARD_POINT_OPTIONS.filter((o) => o.key !== 'custom').map((opt) => (
                          <option key={opt.key} value={opt.key}>
                            {opt.name}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Custom">
                        <option value="custom">Custom Point...</option>
                      </optgroup>
                    </select>
                  </div>
                )}

                {/* Point Name Input (shown if custom) */}
                {pointModalData.isCustom && (
                  <Input
                    label="Custom Point Name"
                    value={pointModalData.name}
                    placeholder="e.g. Jacket Length"
                    onChange={(e) => {
                      setPointModalError('');
                      setPointModalData({ ...pointModalData, name: e.target.value });
                    }}
                    autoFocus
                  />
                )}

                {/* Measurement Value Input */}
                <Input
                  label="Measurement (CM)"
                  type="number"
                  step="0.5"
                  value={pointModalData.value}
                  placeholder="e.g. 50.0"
                  onChange={(e) => {
                    setPointModalError('');
                    setPointModalData({ ...pointModalData, value: e.target.value });
                  }}
                  autoFocus={!pointModalData.isCustom}
                />

                {pointModalError && (
                  <p className="text-xs text-[var(--color-danger,#dc2626)] pt-0.5">
                    {pointModalError}
                  </p>
                )}

                <div className="pt-2 flex justify-end gap-2 border-t border-[var(--border)]">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPointModalData(null);
                      setPointModalError('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                  >
                    Confirm Point
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
