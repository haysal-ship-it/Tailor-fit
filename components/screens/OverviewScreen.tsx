'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { AtelierMannequin } from '@/components/AtelierMannequin';
import { 
  ChevronDown, 
  Upload, 
  Check, 
  ChevronRight, 
  Save, 
  Plus, 
  X,
  User,
  List,
  CheckCircle2
} from 'lucide-react';

export function OverviewScreen({
  onOpenClient,
  onOpenOrder,
}: {
  onOpenClient: (clientId: string) => void;
  onOpenOrder: (orderId: string) => void;
}) {
  const { clients, orders, addClient, addOrder, addSnapshot, setSelectedClientId } = useStore();

  // Center card view toggle: 'mannequin' | 'table'
  const [centerView, setCenterView] = useState<'mannequin' | 'table'>('mannequin');

  // Form states matching exact mockup
  const [selectedTemplate, setSelectedTemplate] = useState('Bespoke African Gown');
  const [gender, setGender] = useState<'M' | 'F'>('M');
  const [clientName, setClientName] = useState('');
  const [garmentType, setGarmentType] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [price, setPrice] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [isTemplateDropdownOpen, setIsTemplateDropdownOpen] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showAddPointModal, setShowAddPointModal] = useState(false);
  const [newPointLabel, setNewPointLabel] = useState('');

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
      garmentType: garmentType.trim() || selectedTemplate,
      measurements: measurements,
      notes: notes.trim(),
    });

    const numericPrice = parseFloat(price.replace(/[^0-9.]/g, '')) || 0;

    addOrder({
      clientId: createdClient.id,
      garmentType: garmentType.trim() || selectedTemplate,
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

  const templatesList = [
    'Bespoke African Gown',
    'Oxford Three Piece Suit',
    'Traditional Agbada',
    'Shirt / Blouse',
    'Tailored Trousers',
  ];

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 py-4 space-y-4">
      {/* Toast Alert */}
      {saveSuccess && (
        <div className="fixed top-6 right-6 z-50 bg-[#0a0a0a] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-gray-800 animate-in fade-in">
          <div className="w-6 h-6 rounded-full bg-[#10b981] text-white flex items-center justify-center">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
          <span className="text-sm font-medium">Order & Measurements saved successfully!</span>
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

      {/* 3-Column Atelier Cockpit Layout strictly matching Overview.png & table view.png */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* =========================================================================
            LEFT COLUMN: "New Client" Intake Card (4 Columns on Desktop)
            ========================================================================= */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-gray-100/90 space-y-5">
          {/* Card Title */}
          <h2 className="text-lg font-bold text-gray-950 font-sans tracking-tight">
            New Client
          </h2>

          {/* Top Pill Controls: Choose Template & Gender Segmented Toggle */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <button
                type="button"
                id="intake-choose-template-btn"
                onClick={() => setIsTemplateDropdownOpen(!isTemplateDropdownOpen)}
                className="w-full h-11 px-4 rounded-full bg-[#f4f5f7] text-xs font-semibold text-gray-700 flex items-center justify-between border border-transparent hover:border-gray-200 transition-colors"
              >
                <span className="truncate">{selectedTemplate || 'Choose Template'}</span>
                <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
              </button>

              {isTemplateDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-30">
                  {templatesList.map((tpl) => (
                    <button
                      key={tpl}
                      type="button"
                      onClick={() => {
                        setSelectedTemplate(tpl);
                        setGarmentType(tpl);
                        setIsTemplateDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 rounded-xl text-left text-xs font-semibold flex items-center justify-between ${
                        selectedTemplate === tpl
                          ? 'bg-blue-50 text-[#1d4ed8]'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span>{tpl}</span>
                      {selectedTemplate === tpl && <Check className="w-3.5 h-3.5 text-[#1d4ed8]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Gender Toggle: [ M | F ] */}
            <div className="flex items-center bg-[#f4f5f7] p-1 rounded-full border border-gray-200/50">
              <button
                type="button"
                onClick={() => setGender('M')}
                className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center transition-all ${
                  gender === 'M'
                    ? 'bg-[#1d4ed8] text-white shadow-xs'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                M
              </button>
              <button
                type="button"
                onClick={() => setGender('F')}
                className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center transition-all ${
                  gender === 'F'
                    ? 'bg-[#1d4ed8] text-white shadow-xs'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                F
              </button>
            </div>
          </div>

          {/* Basic Information */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-900">Basic Information</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-gray-500 mb-1">Client</label>
                <input
                  type="text"
                  placeholder="e.g Adriana Kunle"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-[#f4f5f7] text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#1d4ed8]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-gray-500 mb-1">Garment Type</label>
                <input
                  type="text"
                  placeholder="Bespoke African Gown"
                  value={garmentType}
                  onChange={(e) => setGarmentType(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-[#f4f5f7] text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#1d4ed8]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-gray-500 mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="+234 - "
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-[#f4f5f7] text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#1d4ed8]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-gray-500 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-[#f4f5f7] text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#1d4ed8]"
                />
              </div>
            </div>
          </div>

          {/* Style References */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-bold text-gray-900">Style References</h3>
            <label className="border-2 border-dashed border-gray-200/90 hover:border-[#1d4ed8] rounded-2xl p-5 flex flex-col items-center justify-center cursor-pointer transition-colors bg-white">
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
                    className="w-12 h-12 object-cover rounded-xl border border-gray-200"
                  />
                  <div className="text-left">
                    <p className="text-xs font-bold text-gray-900">Image Loaded</p>
                    <p className="text-[10px] text-gray-400">Click to change</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5 text-gray-500">
                  <div className="w-8 h-8 rounded-full bg-[#f4f5f7] flex items-center justify-center text-gray-700">
                    <Upload className="w-4 h-4" />
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-gray-500 mb-1">Price (₦)</label>
                <input
                  type="text"
                  placeholder="₦0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-[#f4f5f7] text-xs font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] text-gray-500 mb-1">Due Date</label>
                <input
                  type="text"
                  placeholder="09/10/2026"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-[#f4f5f7] text-xs font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white"
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
              className="w-full p-3.5 rounded-2xl bg-[#f4f5f7] text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white resize-none"
            />
          </div>
        </div>

        {/* =========================================================================
            CENTER COLUMN: "Mannequin" OR "Measurement List View" (5 Columns on Desktop)
            ========================================================================= */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-gray-100/90 flex flex-col justify-between min-h-[640px] relative overflow-hidden">
          {/* Card Header */}
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-base font-bold text-gray-950 font-sans tracking-tight">
                {centerView === 'mannequin' ? 'Mannequin' : 'Measurement List View'}
              </h2>
              <p className="text-xs text-gray-400">
                {centerView === 'mannequin'
                  ? 'All available points • Feminine Form'
                  : 'Fast keyboard entry for all garment fields'}
              </p>
            </div>

            {/* Right Controls: "+ Add Point" & Segmented View Toggle */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAddPointModal(true)}
                className="px-4 py-1.5 rounded-full bg-[#1d4ed8] text-white text-xs font-semibold hover:bg-[#1e40af] transition-colors cursor-pointer"
              >
                Add Point
              </button>

              {/* Segmented Icon Toggle matching mockups */}
              <div className="flex items-center bg-[#f4f5f7] p-1 rounded-full border border-gray-200/50">
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
                  <User className="w-3.5 h-3.5" />
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
                  <List className="w-3.5 h-3.5" />
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
                />
              </div>
            ) : (
              /* 3x4 Grid of Measurement Cards matching table view.png */
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 self-start">
                {measurementList.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-[#f4f5f7] border border-gray-100 flex flex-col justify-between h-24"
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
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded-xl border border-gray-200">
                      <input
                        type="text"
                        value={item.value}
                        onChange={(e) => handleListValueChange(item.id, e.target.value)}
                        className="w-16 text-xs font-semibold text-gray-900 focus:outline-none"
                      />
                      <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Floating Bottom Right Save Button */}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>
          </div>
        </div>

        {/* =========================================================================
            RIGHT COLUMN: "Garment's Calendar" & "Recent Orders" (3 Columns on Desktop)
            ========================================================================= */}
        <div className="lg:col-span-3 bg-white rounded-3xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-gray-100/90 space-y-6">
          {/* Garment's Calendar */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-gray-950 font-sans tracking-tight">
              Garment&apos;s Calendar
            </h2>

            {/* Weekday Columns */}
            <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-gray-400">
              <span>Mon</span>
              <span>Tue</span>
              <span className="text-gray-900 font-bold">Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>

            {/* Calendar Days 1 to 31 */}
            <div className="grid grid-cols-7 gap-y-2 text-center text-xs text-gray-800">
              {/* Offset for 1st of month: 2 blank days */}
              <div />
              <div />
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                const isDay7 = day === 7;
                const isDay17 = day === 17;
                const isDay23 = day === 23;

                return (
                  <div key={day} className="py-1 flex flex-col items-center justify-center">
                    <span className="font-medium text-gray-800">{day}</span>
                    {isDay7 && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-0.5" />}
                    {isDay17 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-0.5" />}
                    {isDay23 && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-0.5" />}
                  </div>
                );
              })}
            </div>

            {/* Status Legend */}
            <div className="pt-2 flex items-center justify-between text-[11px] text-gray-600 font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Pending</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Completed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Paused</span>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-5 space-y-3">
            <h3 className="text-sm font-bold text-gray-950">Recent Orders</h3>

            <div className="space-y-2">
              {/* Order 1: Chloe Dallas */}
              <div 
                onClick={() => onOpenOrder('ord-101')}
                className="p-3 rounded-2xl bg-[#f4f5f7] hover:bg-gray-100 transition-colors flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-white font-bold text-xs text-gray-900 flex items-center justify-center border border-gray-200">
                    CD
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-950">Chloe Dallas</h4>
                    <p className="text-[10px] text-gray-500">Bespoke African Gown</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>

              {/* Order 2: Taylor Razaq */}
              <div 
                onClick={() => onOpenOrder('ord-102')}
                className="p-3 rounded-2xl bg-[#f4f5f7] hover:bg-gray-100 transition-colors flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-white font-bold text-xs text-gray-900 flex items-center justify-center border border-gray-200">
                    TR
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-950">Taylor Razaq</h4>
                    <p className="text-[10px] text-gray-500">Bespoke African Gown</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>

              {/* Order 3: Bryan Muhammed */}
              <div 
                onClick={() => onOpenOrder('ord-103')}
                className="p-3 rounded-2xl bg-[#f4f5f7] hover:bg-gray-100 transition-colors flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-white font-bold text-xs text-gray-900 flex items-center justify-center border border-gray-200">
                    BM
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-950">Bryan Muhammed</h4>
                    <p className="text-[10px] text-gray-500">Bespoke African Gown</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Measurement Point Modal */}
      {showAddPointModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-950">Add Measurement Point</h3>
              <button
                type="button"
                onClick={() => setShowAddPointModal(false)}
                className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-900"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newPointLabel.trim()) {
                  setMeasurementList((prev) => [
                    ...prev,
                    {
                      id: newPointLabel.toLowerCase().replace(/\s+/g, '_'),
                      label: newPointLabel.trim(),
                      value: '0.0',
                    },
                  ]);
                  setNewPointLabel('');
                  setShowAddPointModal(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-gray-900 mb-1">
                  Landmark Point Label
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bicep, Wrist, Calf"
                  value={newPointLabel}
                  onChange={(e) => setNewPointLabel(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-[#f4f5f7] text-xs text-gray-900 focus:outline-none focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddPointModal(false)}
                  className="px-4 py-2 rounded-full text-xs text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#1d4ed8] text-white text-xs font-semibold"
                >
                  Add Point
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
