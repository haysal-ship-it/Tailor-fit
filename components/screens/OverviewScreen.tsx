'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { AtelierMannequin } from '@/components/AtelierMannequin';
import { 
  CaretDown, 
  UploadSimple, 
  Check, 
  CaretRight, 
  FloppyDisk, 
  X,
  User,
  List,
  Plus
} from '@phosphor-icons/react';

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
    title: 'Shirt/Blouse',
    description: 'Essential measurements for bespoke dress shirts/blouses',
    presets: { neck: 38, shoulder: 44, bust: 96, waist: 76, sleeve: 62, thigh: 52 },
    tableItems: [
      { id: 'neck', label: 'Neck', value: '38.0' },
      { id: 'shoulder_width', label: 'Shoulder width', value: '44.0' },
      { id: 'bust_chest', label: 'Bust/Chest', value: '96.0' },
      { id: 'sleeve', label: 'Sleeve', value: '62.0' },
      { id: 'waist', label: 'Waist', value: '76.0' },
      { id: 'wrist', label: 'Wrist', value: '18.0' },
      { id: 'back', label: 'Back', value: '40.0' },
      { id: 'neck_to_waist', label: 'Neck to Waist', value: '42.0' },
    ],
  },
  {
    id: 'trousers_shorts',
    title: 'Trousers/shorts',
    description: 'Fittings for tailored pants, trousers, pleated pants and shorts.',
    presets: { waist: 82, thigh: 58, neck: 36, shoulder: 42, bust: 90, sleeve: 60 },
    tableItems: [
      { id: 'waist', label: 'Waist', value: '82.0' },
      { id: 'hip', label: 'Hip', value: '100.0' },
      { id: 'thigh', label: 'Thigh', value: '58.0' },
      { id: 'ankle', label: 'Ankle', value: '26.0' },
      { id: 'neck_to_ankle', label: 'Waist to Ankle', value: '102.0' },
      { id: 'knee', label: 'Knee', value: '42.0' },
    ],
  },
  {
    id: 'gown_dress',
    title: 'Gown/Dress',
    description: 'Evening wears, party gowns, wedding dress etc',
    presets: { bust: 92, waist: 70, thigh: 54, neck: 36, shoulder: 40, sleeve: 58 },
    tableItems: [
      { id: 'bust_chest', label: 'Bust/Chest', value: '92.0' },
      { id: 'waist', label: 'Waist', value: '70.0' },
      { id: 'hip', label: 'Hip', value: '98.0' },
      { id: 'neck_to_waist', label: 'Neck to Waist', value: '38.0' },
      { id: 'neck_to_ankle', label: 'Neck to Ankle', value: '140.0' },
      { id: 'shoulder_width', label: 'Shoulder width', value: '40.0' },
      { id: 'sleeve', label: 'Sleeve', value: '58.0' },
      { id: 'neck', label: 'Neck', value: '36.0' },
    ],
  },
  {
    id: 'suits_blazers',
    title: 'Suits/Blazers',
    description: 'Full bespoke fitting of two piece suits or blazers and trousers',
    presets: { shoulder: 46, bust: 102, waist: 84, sleeve: 64, neck: 40, thigh: 56 },
    tableItems: [
      { id: 'shoulder_width', label: 'Shoulder width', value: '46.0' },
      { id: 'bust_chest', label: 'Bust/Chest', value: '102.0' },
      { id: 'waist', label: 'Waist', value: '84.0' },
      { id: 'sleeve', label: 'Sleeve', value: '64.0' },
      { id: 'neck', label: 'Neck', value: '40.0' },
      { id: 'hip', label: 'Hip', value: '102.0' },
      { id: 'thigh', label: 'Thigh', value: '56.0' },
      { id: 'neck_to_waist', label: 'Neck to Waist', value: '44.0' },
      { id: 'ankle', label: 'Ankle', value: '25.0' },
    ],
  },
];

export function OverviewScreen({
  onOpenClient,
  onOpenOrder,
}: {
  onOpenClient: (clientId: string) => void;
  onOpenOrder: (orderId: string) => void;
}) {
  const { addClient, addOrder, addSnapshot } = useStore();

  // Center card view toggle: 'mannequin' | 'table'
  const [centerView, setCenterView] = useState<'mannequin' | 'table'>('mannequin');

  // Form states - template starts as empty string so button displays "Choose Template"
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [gender, setGender] = useState<'M' | 'F'>('F');
  const [clientName, setClientName] = useState('');
  const [garmentType, setGarmentType] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [price, setPrice] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  
  // Modals & Bottom Sheets
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [pendingTemplate, setPendingTemplate] = useState('Shirt/Blouse');
  const [pointModalData, setPointModalData] = useState<{
    key: string;
    name: string;
    value: string;
    isCustom?: boolean;
  } | null>(null);

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Measurement points for the 3x4 list view
  const [measurementList, setMeasurementList] = useState<Array<{ id: string; label: string; value: string }>>([
    { id: 'shoulder_width', label: 'Shoulder width', value: '0.0' },
    { id: 'neck', label: 'Neck', value: '0.0' },
    { id: 'bust_chest', label: 'Bust/Chest', value: '0.0' },
    { id: 'ankle', label: 'Ankle', value: '0.0' },
    { id: 'hip', label: 'Hip', value: '0.0' },
    { id: 'wrist', label: 'Wrist', value: '0.0' },
    { id: 'sleeve', label: 'Sleeve', value: '0.0' },
    { id: 'waist', label: 'Waist', value: '0.0' },
    { id: 'back', label: 'Back', value: '0.0' },
    { id: 'neck_to_waist', label: 'Neck to Waist', value: '0.0' },
    { id: 'neck_to_ankle', label: 'Neck to Ankle', value: '0.0' },
  ]);

  const [measurements, setMeasurements] = useState<Record<string, number | string>>({
    shoulder: 42,
    neck: 36,
    bust: 92,
    waist: 72,
    sleeve: 60,
    thigh: 54,
  });

  const handleMeasurementChange = (key: string, value: number) => {
    setMeasurements((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleListValueChange = (id: string, val: string) => {
    setMeasurementList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, value: val } : item))
    );
  };

  const handleDeleteListItem = (id: string) => {
    setMeasurementList((prev) => prev.filter((item) => item.id !== id));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setReferenceImage(url);
    }
  };

  const handleSave = () => {
    if (!clientName.trim()) {
      setErrorMessage('Please enter a Client Name.');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    const createdClient = addClient({
      name: clientName.trim(),
      phone: phone.trim() || '+234 - ',
      email: email.trim() || 'name@example.com',
      notes: notes.trim(),
    });

    const snap = addSnapshot({
      clientId: createdClient.id,
      date: new Date().toISOString().slice(0, 10),
      unit: 'cm',
      garmentType: garmentType.trim() || selectedTemplate || 'Bespoke African Gown',
      measurements: measurements,
      notes: notes.trim(),
    });

    const numericPrice = parseFloat(price.replace(/[^0-9.]/g, '')) || 0;

    addOrder({
      clientId: createdClient.id,
      garmentType: garmentType.trim() || selectedTemplate || 'Bespoke African Gown',
      measurementSnapshotId: snap.id,
      referenceImages: referenceImage ? [{ id: `img-${Date.now()}`, url: referenceImage }] : [],
      price: numericPrice,
      notes: notes.trim(),
      status: 'Pending',
      pickupDateTime: dueDate ? `${dueDate}T17:00:00.000Z` : new Date(Date.now() + 14 * 86400000).toISOString(),
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleConfirmTemplate = (templateTitle: string) => {
    const chosen = GARMENT_TEMPLATES.find((t) => t.title === templateTitle);
    if (chosen) {
      setSelectedTemplate(chosen.title);
      setGarmentType(chosen.title);
      setMeasurements((prev) => ({ ...prev, ...chosen.presets }));
      if (chosen.tableItems && chosen.tableItems.length > 0) {
        setMeasurementList(chosen.tableItems);
      }
    } else {
      setSelectedTemplate(templateTitle);
      setGarmentType(templateTitle);
    }
    setIsTemplateModalOpen(false);
  };

  const handleSavePoint = (key: string, name: string, valStr: string) => {
    const numVal = parseFloat(valStr);
    if (!isNaN(numVal) && numVal > 0) {
      if (key in measurements || ['neck', 'waist', 'shoulder', 'bust', 'sleeve', 'thigh'].includes(key)) {
        setMeasurements((prev) => ({
          ...prev,
          [key]: numVal,
        }));
      }

      const existingIdx = measurementList.findIndex(
        (item) => item.label.toLowerCase() === name.toLowerCase() || item.id === key
      );
      if (existingIdx >= 0) {
        setMeasurementList((prev) =>
          prev.map((item, idx) =>
            idx === existingIdx ? { ...item, value: numVal.toFixed(1) } : item
          )
        );
      } else {
        setMeasurementList((prev) => [
          ...prev,
          {
            id: key || name.toLowerCase().replace(/\s+/g, '_'),
            label: name,
            value: numVal.toFixed(1),
          },
        ]);
      }
    }
    setPointModalData(null);
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 py-4 space-y-4">
      {/* Toast Alert */}
      {saveSuccess && (
        <div className="fixed top-6 right-6 z-50 bg-[#0a0a0a] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-gray-800 animate-in fade-in">
          <div className="w-6 h-6 rounded-full bg-[#10b981] text-white flex items-center justify-center">
            <Check className="w-3.5 h-3.5" weight="bold" />
          </div>
          <span className="text-sm font-medium">Order &amp; Measurements saved successfully!</span>
        </div>
      )}

      {errorMessage && (
        <div className="fixed top-6 right-6 z-50 bg-[#0a0a0a] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-rose-500/50 animate-in fade-in">
          <div className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs font-bold">
            !
          </div>
          <span className="text-sm font-medium">{errorMessage}</span>
        </div>
      )}

      {/* Overview Layout: Left Parent White Card (New Client + Mannequin + Save Button) & Right Parent White Card (Calendar) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* =========================================================================
            SHARED PARENT CONTAINER (Fill: #FFFFFF): Houses New Client + Mannequin + Save Container
            ========================================================================= */}
        <div className="lg:col-span-8 xl:col-span-9 bg-white rounded-[8px] p-[2px] shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col gap-[2px]">
          
          {/* Sub-containers Row with original 2px gap */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-[2px] items-stretch">
            
            {/* -----------------------------------------------------------------------
                CHILD 1: "New Client" Container (Fill: #F8F8F8, stroke removed)
                ----------------------------------------------------------------------- */}
            <div className="lg:col-span-5 bg-[#F8F8F8] rounded-[8px] p-4 space-y-4 shadow-xs">
              {/* Card Title */}
              <h2 className="text-lg font-bold text-gray-950 font-sans tracking-tight">
                New Client
              </h2>

              {/* Combined Top Pill Container: "Choose Template" Button & Gender Toggle with #f2f2f2 fill */}
              <div className="relative bg-white rounded-full p-1 flex items-center gap-1.5 shadow-xs">
                <div className="relative flex-1">
                  <button
                    type="button"
                    id="intake-choose-template-btn"
                    onClick={() => {
                      setPendingTemplate(selectedTemplate || 'Shirt/Blouse');
                      setIsTemplateModalOpen(true);
                    }}
                    className="w-full h-9 px-4 rounded-full bg-[#F0F2F5] hover:bg-[#E5E7EB] text-xs font-semibold text-gray-700 flex items-center justify-center text-center transition-colors cursor-pointer"
                  >
                    <span className="truncate">{selectedTemplate || 'Choose Template'}</span>
                  </button>
                </div>

                {/* Gender Toggle beside Choose Template: active button matches Add Point button (#1d4ed8) with white text */}
                <div className="flex items-center gap-0.5 bg-[#f2f2f2] p-1 rounded-full shrink-0">
                  <button
                    type="button"
                    onClick={() => setGender('M')}
                    className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                      gender === 'M'
                        ? 'bg-[#1d4ed8] text-white shadow-xs'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    M
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('F')}
                    className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                      gender === 'F'
                        ? 'bg-[#1d4ed8] text-white shadow-xs'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    F
                  </button>
                </div>
              </div>

              {/* Basic Information */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-900">Basic Information</h3>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] text-gray-500 mb-1">Client</label>
                    <input
                      type="text"
                      placeholder="e.g Adriana Kunle"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-[8px] bg-white border border-gray-200/60 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#1d4ed8]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-gray-500 mb-1">Garment Type</label>
                    <input
                      type="text"
                      placeholder="Bespoke African Gown"
                      value={garmentType}
                      onChange={(e) => setGarmentType(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-[8px] bg-white border border-gray-200/60 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#1d4ed8]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] text-gray-500 mb-1">Phone Number</label>
                    <input
                      type="text"
                      placeholder="+234 - "
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-[8px] bg-white border border-gray-200/60 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#1d4ed8]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-gray-500 mb-1">Email Address</label>
                    <input
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-[8px] bg-white border border-gray-200/60 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#1d4ed8]"
                    />
                  </div>
                </div>
              </div>

              {/* Style References */}
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold text-gray-900">Style References</h3>
                <label className="border-2 border-dashed border-gray-200/90 hover:border-[#1d4ed8] rounded-[8px] p-4 flex flex-col items-center justify-center cursor-pointer transition-colors bg-white">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  {referenceImage ? (
                    <div className="flex items-center gap-3">
                      <img
                        src={referenceImage}
                        alt="Upload"
                        className="w-12 h-12 object-cover rounded-[8px] border border-gray-200"
                      />
                      <div className="text-left">
                        <p className="text-xs font-bold text-gray-900">Image Loaded</p>
                        <p className="text-[10px] text-gray-400">Click to change</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 text-gray-500">
                      <div className="w-8 h-8 rounded-full bg-[#f4f5f7] flex items-center justify-center text-gray-700">
                        <UploadSimple className="w-4 h-4" weight="bold" />
                      </div>
                      <span className="text-xs font-semibold text-gray-700">
                        Tap to upload image
                      </span>
                    </div>
                  )}
                </label>
              </div>

              {/* Price /Due date */}
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold text-gray-900">Price /Due date</h3>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] text-gray-500 mb-1">Price (₦)</label>
                    <input
                      type="text"
                      placeholder="₦0.00"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-[8px] bg-white border border-gray-200/60 text-xs font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#1d4ed8]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-gray-500 mb-1">Due Date</label>
                    <input
                      type="text"
                      placeholder="09/10/2026"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-[8px] bg-white border border-gray-200/60 text-xs font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#1d4ed8]"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <div>
                  <h3 className="text-xs font-bold text-gray-900">Notes</h3>
                  <p className="text-[10px] text-gray-400">Workroom notes and fabric details</p>
                </div>
                <textarea
                  rows={3}
                  placeholder="e.g hand stiched, monogram design on wrist and gold buttons"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-3 rounded-[8px] bg-white border border-gray-200/60 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#1d4ed8] resize-none"
                />
              </div>
            </div>

            {/* -----------------------------------------------------------------------
                CHILD 2: "Mannequin" OR "Measurement List View" (Fill: #F8F8F8, stroke removed)
                ----------------------------------------------------------------------- */}
            <div className="lg:col-span-7 bg-[#F8F8F8] rounded-[8px] p-4 flex flex-col justify-between min-h-[640px] relative overflow-hidden shadow-xs">
              {/* Card Header */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-200/60">
                <div>
                  <h2 className="text-base font-bold text-gray-950 font-sans tracking-tight">
                    {centerView === 'mannequin' ? 'Mannequin' : 'Measurement List View'}
                  </h2>
                  <p className="text-xs text-gray-400">
                    {centerView === 'mannequin'
                      ? 'All available points'
                      : 'Fast keyboard entry for all garment fields'}
                  </p>
                </div>

                {/* Right Controls: "+ Add Point" & Segmented View Toggle */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setPointModalData({
                        key: 'sleeve',
                        name: 'Sleeve',
                        value: measurements.sleeve ? String(measurements.sleeve) : '60.0',
                        isCustom: true,
                      })
                    }
                    className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-[#1d4ed8] text-white text-xs font-semibold hover:bg-[#1e40af] transition-colors cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" weight="bold" />
                    <span>Add Point</span>
                  </button>

                  {/* Segmented Icon Toggle matching mockups */}
                  <div className="flex items-center bg-[#E5E7EB] p-0.5 rounded-full border border-gray-200/50 shadow-xs">
                    <button
                      type="button"
                      onClick={() => setCenterView('mannequin')}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                        centerView === 'mannequin'
                          ? 'bg-[#1d4ed8] text-white shadow-xs'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                      title="Mannequin Body Diagram"
                    >
                      <User className="w-3.5 h-3.5" weight="fill" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setCenterView('table')}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                        centerView === 'table'
                          ? 'bg-[#1d4ed8] text-white shadow-xs'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                      title="Measurement List View"
                    >
                      <List className="w-3.5 h-3.5" weight="fill" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Card Body: Mannequin Canvas OR 3x4 Measurement List Cards */}
              <div className="flex-1 py-4 flex items-center justify-center">
                {centerView === 'mannequin' ? (
                  <div className="w-full flex items-center justify-center">
                    <AtelierMannequin
                      gender={gender}
                      unit="cm"
                      measurements={measurements}
                      onMeasurementChange={handleMeasurementChange}
                      onSelectLandmark={(key, name, currentVal) => {
                        setPointModalData({
                          key,
                          name,
                          value: String(currentVal),
                          isCustom: false,
                        });
                      }}
                    />
                  </div>
                ) : (
                  /* 3x4 Grid of Measurement Cards matching table view.png */
                  <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 self-start">
                    {measurementList.map((item) => (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-[8px] bg-white border border-gray-200/70 flex flex-col justify-between h-24 shadow-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-900 truncate">
                            {item.label}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteListItem(item.id)}
                            className="text-gray-400 hover:text-gray-700"
                          >
                            <X className="w-3.5 h-3.5" weight="bold" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between bg-[#F8F8F8] px-3 py-1.5 rounded-[6px] border border-gray-200/80">
                          <input
                            type="text"
                            value={item.value}
                            onChange={(e) => handleListValueChange(item.id, e.target.value)}
                            className="w-16 text-xs font-semibold text-gray-900 focus:outline-none bg-transparent"
                          />
                          <Check className="w-3.5 h-3.5 text-emerald-600" weight="bold" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* -----------------------------------------------------------------------
              CONTAINER HOUSING THE SAVE BUTTON BELOW THE TWO CONTAINERS
              (Fill: #F8F8F8, stroke removed)
              ----------------------------------------------------------------------- */}
          <div className="bg-[#F8F8F8] rounded-[8px] p-2 flex justify-end items-center shadow-xs">
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
            >
              <FloppyDisk className="w-3.5 h-3.5" weight="fill" />
              <span>Save</span>
            </button>
          </div>
        </div>

        {/* =========================================================================
            RIGHT PARENT CONTAINER (Fill: #FFFFFF): Garment's Calendar & Recent Orders
            ========================================================================= */}
        <div className="lg:col-span-4 xl:col-span-3 bg-white rounded-[8px] p-[2px] shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col gap-[2px]">
          {/* Garment's Calendar Inner Card */}
          <div className="bg-[#F8F8F8] rounded-[8px] p-4 space-y-3.5 shadow-xs">
            <h2 className="text-base font-bold text-gray-950 font-sans tracking-tight">
              Garment&apos;s Calendar
            </h2>

            {/* Weekday Columns */}
            <div className="grid grid-cols-7 gap-[2px] text-center text-xs font-medium">
              <div className="bg-white rounded-[4px] py-1.5 text-gray-400">Mon</div>
              <div className="bg-white rounded-[4px] py-1.5 text-gray-400">Tue</div>
              <div className="bg-white rounded-[4px] py-1.5 text-gray-900 font-bold">Wed</div>
              <div className="bg-white rounded-[4px] py-1.5 text-gray-400">Thu</div>
              <div className="bg-white rounded-[4px] py-1.5 text-gray-400">Fri</div>
              <div className="bg-white rounded-[4px] py-1.5 text-gray-400">Sat</div>
              <div className="bg-white rounded-[4px] py-1.5 text-gray-400">Sun</div>
            </div>

            {/* Calendar Days 1 to 31 */}
            <div className="grid grid-cols-7 gap-[2px] text-center text-xs">
              {/* Offset for 1st of month: 2 blank days */}
              <div className="aspect-square" />
              <div className="aspect-square" />
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                const isDay7 = day === 7;
                const isDay17 = day === 17;
                const isDay23 = day === 23;

                return (
                  <div
                    key={day}
                    className="bg-white rounded-[4px] aspect-square flex items-center justify-center relative text-xs font-medium text-gray-900 shadow-2xs"
                  >
                    <span>{day}</span>
                    {isDay7 && <span className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-[#ef4444]" />}
                    {isDay17 && <span className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-[#10b981]" />}
                    {isDay23 && <span className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-[#eab308]" />}
                  </div>
                );
              })}
            </div>

            {/* Status Legend matching CALENDAR.png */}
            <div className="pt-2 flex items-center gap-4 text-xs text-gray-900 font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#eab308]" />
                <span>Pending</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
                <span>Completed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
                <span>Paused</span>
              </div>
            </div>
          </div>

          {/* Recent Orders Container (Fill: #F8F8F8, stroke removed) */}
          <div className="bg-[#F8F8F8] rounded-[8px] p-4 space-y-3 shadow-xs">
            <h3 className="text-sm font-bold text-gray-950 font-sans tracking-tight">Recent Orders</h3>

            <div className="space-y-2">
              {/* Order 1: Chloe Dallas -> directly routes to Client Profile c-1 */}
              <div 
                onClick={() => onOpenClient('c-1')}
                className="p-3 rounded-[8px] bg-white border border-gray-100 hover:bg-gray-50 transition-colors flex items-center justify-between cursor-pointer shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#f4f5f7] font-bold text-xs text-gray-900 flex items-center justify-center border border-gray-100">
                    CD
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-950">Chloe Dallas</h4>
                    <p className="text-[10px] text-gray-500">Bespoke African Gown</p>
                  </div>
                </div>
                <CaretRight className="w-4 h-4 text-gray-400" weight="fill" />
              </div>

              {/* Order 2: Taylor Razaq -> directly routes to Client Profile c-2 */}
              <div 
                onClick={() => onOpenClient('c-2')}
                className="p-3 rounded-[8px] bg-white border border-gray-100 hover:bg-gray-50 transition-colors flex items-center justify-between cursor-pointer shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#f4f5f7] font-bold text-xs text-gray-900 flex items-center justify-center border border-gray-100">
                    TR
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-950">Taylor Razaq</h4>
                    <p className="text-[10px] text-gray-500">Bespoke African Gown</p>
                  </div>
                </div>
                <CaretRight className="w-4 h-4 text-gray-400" weight="fill" />
              </div>

              {/* Order 3: Bryan Muhammed -> directly routes to Client Profile c-3 */}
              <div 
                onClick={() => onOpenClient('c-3')}
                className="p-3 rounded-[8px] bg-white border border-gray-100 hover:bg-gray-50 transition-colors flex items-center justify-between cursor-pointer shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#f4f5f7] font-bold text-xs text-gray-900 flex items-center justify-center border border-gray-100">
                    BM
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-950">Bryan Muhammed</h4>
                    <p className="text-[10px] text-gray-500">Bespoke African Gown</p>
                  </div>
                </div>
                <CaretRight className="w-4 h-4 text-gray-400" weight="fill" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          GARMENT TEMPLATES: Responsive Modal (Web Backdrop Blur) & Bottom Sheet Drawer (Mobile)
          ========================================================================= */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-md transition-all animate-in fade-in duration-200">
          {/* Backdrop dismiss */}
          <div
            className="absolute inset-0"
            onClick={() => setIsTemplateModalOpen(false)}
          />

          {/* Modal / Bottom Sheet Card */}
          <div className="relative w-full sm:max-w-xl bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-7 shadow-2xl z-10 max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            {/* Mobile Top Drag Handle */}
            <div className="sm:hidden pt-1 pb-3 flex justify-center">
              <div className="w-12 h-1 bg-black rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-start justify-between pb-3 sm:pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-950 font-sans tracking-tight">
                  Garment Templates
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Browse through available templates that suit all your bespoke needs.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsTemplateModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4" weight="bold" />
              </button>
            </div>

            {/* Templates Grid: 2x2 on Web, 1-col on Mobile */}
            <div className="flex-1 overflow-y-auto py-4 sm:py-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
                {GARMENT_TEMPLATES.map((tpl) => {
                  const isSelected = pendingTemplate === tpl.title;
                  return (
                    <div
                      key={tpl.id}
                      onClick={() => setPendingTemplate(tpl.title)}
                      className={`p-4 rounded-2xl cursor-pointer transition-all border text-left flex flex-col justify-between ${
                        isSelected
                          ? 'border-2 border-[#1d4ed8] bg-blue-50/20 shadow-xs'
                          : 'border-gray-200/80 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div>
                        <h3
                          className={`text-sm sm:text-base font-bold ${
                            isSelected ? 'text-[#1d4ed8]' : 'text-gray-900'
                          }`}
                        >
                          {tpl.title}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                          {tpl.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsTemplateModalOpen(false)}
                className="flex-1 sm:flex-none px-7 py-2.5 sm:py-3 rounded-full bg-[#f3f4f6] hover:bg-[#e5e7eb] text-gray-700 text-xs sm:text-sm font-semibold transition-colors text-center cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConfirmTemplate(pendingTemplate)}
                className="flex-1 sm:flex-none px-7 py-2.5 sm:py-3 rounded-full bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-xs sm:text-sm font-semibold transition-colors shadow-xs text-center cursor-pointer"
              >
                Choose Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SET POINT SIZE: Responsive Modal (Web Backdrop Blur) & Bottom Sheet Drawer (Mobile)
          ========================================================================= */}
      {pointModalData && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-md transition-all animate-in fade-in duration-200">
          {/* Backdrop dismiss */}
          <div
            className="absolute inset-0"
            onClick={() => setPointModalData(null)}
          />

          {/* Modal / Bottom Sheet Card */}
          <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-7 shadow-2xl z-10 flex flex-col max-h-[85vh] overflow-y-auto pb-8 sm:pb-7 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            {/* Mobile Top Drag Handle */}
            <div className="sm:hidden pt-1 pb-3 flex justify-center">
              <div className="w-12 h-1 bg-black rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-gray-100">
              <h2 className="text-lg sm:text-xl font-bold text-gray-950 font-sans tracking-tight">
                {pointModalData.isCustom ? 'Add point size' : 'Set point size'}
              </h2>
              <button
                type="button"
                onClick={() => setPointModalData(null)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" weight="bold" />
              </button>
            </div>

            {/* Body: Landmark Label + Input Capsule matching Overview modal point.png */}
            <div className="py-5 sm:py-6">
              <div className="flex items-center justify-between gap-4">
                {pointModalData.isCustom ? (
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                      Landmark Point
                    </label>
                    <input
                      type="text"
                      value={pointModalData.name}
                      onChange={(e) =>
                        setPointModalData({
                          ...pointModalData,
                          name: e.target.value,
                          key: e.target.value.toLowerCase().replace(/\s+/g, '_'),
                        })
                      }
                      placeholder="e.g. Sleeve, Neck, Bicep"
                      className="w-full text-base font-semibold text-gray-900 bg-[#F8F8F8] border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#1d4ed8]"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0084FF] shadow-[0_0_8px_#0084FF]" />
                    <span className="text-base sm:text-lg font-semibold text-gray-900">
                      {pointModalData.name}
                    </span>
                  </div>
                )}

                {/* Numerical Input Capsule */}
                <div className="flex items-center bg-[#F8F8F8] border border-gray-200/90 rounded-xl px-3 sm:px-4 py-2 w-32 sm:w-40 justify-between focus-within:border-[#0084FF] focus-within:bg-white transition-colors">
                  <input
                    type="number"
                    step="0.1"
                    value={pointModalData.value}
                    onChange={(e) =>
                      setPointModalData({ ...pointModalData, value: e.target.value })
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSavePoint(
                          pointModalData.key,
                          pointModalData.name,
                          pointModalData.value
                        );
                      }
                    }}
                    className="w-full bg-transparent text-right font-bold text-base sm:text-lg text-gray-950 focus:outline-none pr-1.5"
                    placeholder="0.0"
                  />
                  <span className="text-xs font-bold text-gray-400 select-none uppercase tracking-wide">
                    CM
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Actions matching design */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={() => setPointModalData(null)}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-full bg-[#f3f4f6] hover:bg-[#e5e7eb] text-gray-700 text-xs sm:text-sm font-semibold transition-colors text-center cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() =>
                  handleSavePoint(
                    pointModalData.key,
                    pointModalData.name,
                    pointModalData.value
                  )
                }
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-full bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-xs sm:text-sm font-semibold transition-colors shadow-xs text-center cursor-pointer"
              >
                {pointModalData.isCustom ? 'Add Point' : 'Update Point'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
