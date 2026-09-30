'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { AtelierMannequin } from '@/components/AtelierMannequin';
import { 
  ChevronDown, 
  Upload, 
  Image as ImageIcon, 
  Check, 
  Calendar as CalendarIcon, 
  Sparkles,
  ArrowRight,
  User,
  X
} from 'lucide-react';
import { UnitType, OrderStatus } from '@/types';

export function OverviewScreen({
  onOpenClient,
  onOpenOrder,
}: {
  onOpenClient: (clientId: string) => void;
  onOpenOrder: (orderId: string) => void;
}) {
  const {
    clients,
    orders,
    snapshots,
    settings,
    addClient,
    addOrder,
    addSnapshot,
    setActiveScreen,
    setSelectedClientId,
  } = useStore();

  // Selected gender for mannequin
  const [gender, setGender] = useState<'M' | 'F'>('M');
  const [unit, setUnit] = useState<UnitType>(settings.defaultUnit || 'cm');
  const currency = settings.currency || '₦';

  // Garment template selection
  const templates = settings.templates || [];
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    templates[0]?.id || 'bespoke_african_gown'
  );
  const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false);

  // Form states for Client Intake Card
  const [selectedExistingClientId, setSelectedExistingClientId] = useState<string>('');
  const [clientName, setClientName] = useState('Adriana Kunle');
  const [phone, setPhone] = useState('+234 - 803 456 7890');
  const [email, setEmail] = useState('adriana.kunle@vogue.ng');
  const [price, setPrice] = useState('185000');
  const [dueDate, setDueDate] = useState('2026-09-10');
  const [notes, setNotes] = useState('e.g hand stiched, monogram design on wrist and gold buttons');
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  // Measurements state for Mannequin
  const [measurements, setMeasurements] = useState<Record<string, number | string>>({
    neck: 36,
    shoulder: 42,
    bust: 92,
    arm: 60,
    waist: 72,
    thigh: 54,
  });

  // Calendar selected day filter
  const [calendarSelectedDay, setCalendarSelectedDay] = useState<number | null>(null);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Handle client selection from quick autofill
  const handleSelectClient = (clientId: string) => {
    const found = clients.find((c) => c.id === clientId);
    if (found) {
      setSelectedExistingClientId(found.id);
      setClientName(found.name);
      setPhone(found.phone);
      setEmail(found.email);
      setNotes(found.notes);

      // Check if client has latest snapshot
      const clientSnaps = snapshots.filter((s) => s.clientId === found.id);
      if (clientSnaps.length > 0) {
        const latest = clientSnaps[0];
        setMeasurements((prev) => ({
          ...prev,
          ...latest.measurements,
        }));
      }
    }
  };

  const handleMeasurementChange = (key: string, value: number) => {
    setMeasurements((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Handle image upload mock/local file
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUploadedImageUrl(url);
    }
  };

  // Submit / Save Commission
  const handleSaveCommission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) return;

    let activeClient = clients.find((c) => c.id === selectedExistingClientId);
    if (!activeClient) {
      activeClient = addClient({
        name: clientName.trim(),
        phone: phone.trim() || '+234 000 000 0000',
        email: email.trim() || 'client@tailorfit.ng',
        notes: notes.trim(),
      });
    }

    // Save measurement snapshot
    const currentTemplate = templates.find((t) => t.id === selectedTemplateId);
    const snap = addSnapshot({
      clientId: activeClient.id,
      date: new Date().toISOString().slice(0, 10),
      unit: unit,
      garmentType: currentTemplate?.name || 'Bespoke African Gown',
      measurements: measurements,
      notes: notes.trim(),
    });

    // Save order
    const numericPrice = parseFloat(price.replace(/[^0-9.]/g, '')) || 0;
    addOrder({
      clientId: activeClient.id,
      garmentType: currentTemplate?.name || 'Bespoke African Gown',
      measurementSnapshotId: snap.id,
      referenceImages: uploadedImageUrl
        ? [
            {
              id: `img-${Date.now()}`,
              url: uploadedImageUrl,
              title: 'Couture Sketch / Swatch',
            },
          ]
        : [],
      price: numericPrice,
      notes: notes.trim(),
      status: 'Pending',
      pickupDateTime: `${dueDate}T17:00:00.000Z`,
    });

    setSaveSuccessMessage(`Commission saved for ${clientName}!`);
    setTimeout(() => setSaveSuccessMessage(null), 3500);
  };

  // Calendar dates with orders for September 2026
  // Days 1 to 30.
  const calendarOrderMap: Record<number, { status: OrderStatus; orderId: string; clientName: string }[]> = {
    7: [{ status: 'Paused', orderId: 'ord-103', clientName: 'Bryan Muhammed' }],
    17: [{ status: 'Completed', orderId: 'ord-102', clientName: 'Taylor Razaq' }],
    23: [{ status: 'Pending', orderId: 'ord-101', clientName: 'Chloe Dallas' }],
  };

  // Also include dynamic orders if their pickup date falls in Sept 2026
  orders.forEach((ord) => {
    if (ord.pickupDateTime && ord.pickupDateTime.startsWith('2026-09')) {
      const dayNum = parseInt(ord.pickupDateTime.slice(8, 10), 10);
      if (dayNum && !isNaN(dayNum)) {
        const client = clients.find((c) => c.id === ord.clientId);
        if (!calendarOrderMap[dayNum]) {
          calendarOrderMap[dayNum] = [];
        }
        // Avoid duplicate entry if already present
        if (!calendarOrderMap[dayNum].some((o) => o.orderId === ord.id)) {
          calendarOrderMap[dayNum].push({
            status: ord.status,
            orderId: ord.id,
            clientName: client?.name || 'Client',
          });
        }
      }
    }
  });

  const getStatusDotColor = (status: OrderStatus) => {
    switch (status) {
      case 'Completed':
      case 'Ready':
        return 'bg-[#10b981]'; // Green
      case 'Paused':
        return 'bg-[#ef4444]'; // Red
      case 'Pending':
      case 'In Progress':
      default:
        return 'bg-[#f59e0b]'; // Amber/Yellow
    }
  };

  const currentTemplateName =
    templates.find((t) => t.id === selectedTemplateId)?.name || 'Bespoke African Gown';

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 py-4">
      {/* Toast Notification */}
      {saveSuccessMessage && (
        <div className="fixed top-6 right-6 z-50 bg-[#0a0a0a] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-gray-800 animate-in fade-in slide-in-from-top-3">
          <div className="w-6 h-6 rounded-full bg-[#10b981] text-white flex items-center justify-center">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
          <span className="text-sm font-medium">{saveSuccessMessage}</span>
          <button
            type="button"
            onClick={() => setSaveSuccessMessage(null)}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main 3-Column Atelier Cockpit Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* =========================================================================
            LEFT COLUMN: Client & Garment Intake Card (4 Columns on Desktop)
            ========================================================================= */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-gray-100/90">
          {/* Card Header: Title + M/F Gender Toggle */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
            <div>
              <h2 className="text-xl font-bold text-gray-950 font-sans tracking-tight">
                Client
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">Atelier intake & commission</p>
            </div>

            {/* Gender Switcher Capsule */}
            <div className="flex items-center bg-gray-100/80 p-1 rounded-full gap-1 border border-gray-200/50">
              <button
                type="button"
                id="btn-gender-male"
                onClick={() => setGender('M')}
                className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center transition-all ${
                  gender === 'M'
                    ? 'bg-[#1d4ed8] text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Male Mannequin Silhouette"
              >
                M
              </button>
              <button
                type="button"
                id="btn-gender-female"
                onClick={() => setGender('F')}
                className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center transition-all ${
                  gender === 'F'
                    ? 'bg-[#1d4ed8] text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Female Mannequin Silhouette"
              >
                F
              </button>
            </div>
          </div>

          <form onSubmit={handleSaveCommission} className="space-y-4">
            {/* Garment Type Selector */}
            <div className="relative">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Garment Type
              </label>
              <button
                type="button"
                id="intake-garment-select-btn"
                onClick={() => setIsTemplateMenuOpen(!isTemplateMenuOpen)}
                className="w-full h-11 px-4 rounded-xl bg-[#f7f8fa] border border-gray-200/80 text-left text-sm font-medium text-gray-900 flex items-center justify-between hover:border-gray-300 transition-colors"
              >
                <span className="truncate">{currentTemplateName}</span>
                <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
              </button>

              {isTemplateMenuOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-30 animate-in fade-in">
                  {templates.map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => {
                        setSelectedTemplateId(tpl.id);
                        setIsTemplateMenuOpen(false);
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-left text-xs font-medium flex items-center justify-between transition-colors ${
                        selectedTemplateId === tpl.id
                          ? 'bg-[#1d4ed8]/10 text-[#1d4ed8] font-semibold'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span>{tpl.name}</span>
                      {selectedTemplateId === tpl.id && (
                        <Check className="w-4 h-4 text-[#1d4ed8]" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Existing Client Autofill Selector */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-gray-500">
                  Client Name
                </label>
                {clients.length > 0 && (
                  <span className="text-[11px] text-gray-400">
                    or select existing below
                  </span>
                )}
              </div>
              <input
                type="text"
                required
                id="intake-client-name"
                placeholder="e.g Adriana Kunle"
                value={clientName}
                onChange={(e) => {
                  setClientName(e.target.value);
                  setSelectedExistingClientId('');
                }}
                className="w-full h-11 px-4 rounded-xl bg-[#f7f8fa] border border-gray-200/80 text-sm text-gray-900 focus:outline-none focus:border-[#1d4ed8] focus:bg-white transition-all placeholder:text-gray-400"
              />

              {/* Client Quick Chips */}
              <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1 no-scrollbar">
                {clients.slice(0, 4).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectClient(c.id)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors border ${
                      selectedExistingClientId === c.id
                        ? 'bg-[#1d4ed8] text-white border-[#1d4ed8]'
                        : 'bg-gray-100 text-gray-600 border-gray-200/60 hover:bg-gray-200'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Contact Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  Phone
                </label>
                <input
                  type="text"
                  placeholder="+234 - "
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-[#f7f8fa] border border-gray-200/80 text-sm text-gray-900 focus:outline-none focus:border-[#1d4ed8] focus:bg-white transition-all placeholder:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-[#f7f8fa] border border-gray-200/80 text-sm text-gray-900 focus:outline-none focus:border-[#1d4ed8] focus:bg-white transition-all placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Price & Due Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  Commission Price ({currency})
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-sm font-semibold text-gray-500">
                    {currency}
                  </span>
                  <input
                    type="text"
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full h-11 pl-8 pr-4 rounded-xl bg-[#f7f8fa] border border-gray-200/80 text-sm font-medium text-gray-900 focus:outline-none focus:border-[#1d4ed8] focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-[#f7f8fa] border border-gray-200/80 text-xs font-medium text-gray-900 focus:outline-none focus:border-[#1d4ed8] focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Bespoke Notes */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Bespoke Specifications
              </label>
              <textarea
                rows={2}
                placeholder="e.g hand stiched, monogram design on wrist and gold buttons"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-3.5 rounded-xl bg-[#f7f8fa] border border-gray-200/80 text-xs text-gray-900 focus:outline-none focus:border-[#1d4ed8] focus:bg-white transition-all resize-none placeholder:text-gray-400"
              />
            </div>

            {/* Style Reference Photo Upload Zone */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Style Reference Photo
              </label>
              <label className="border-2 border-dashed border-gray-200 hover:border-[#1d4ed8] bg-[#f7f8fa] rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                {uploadedImageUrl ? (
                  <div className="flex items-center gap-3">
                    <img
                      src={uploadedImageUrl}
                      alt="Reference"
                      className="w-12 h-12 object-cover rounded-xl border border-gray-200 shadow-xs"
                    />
                    <div className="text-left">
                      <p className="text-xs font-semibold text-gray-900">Reference Loaded</p>
                      <p className="text-[11px] text-gray-400">Tap to replace image</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 text-gray-500 group-hover:text-[#1d4ed8] transition-colors">
                    <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-xs">
                      <Upload className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-medium">
                      Tap to upload reference photo
                    </span>
                  </div>
                )}
              </label>
            </div>

            {/* Submit Action Button */}
            <div className="pt-2">
              <button
                type="submit"
                id="intake-btn-save"
                className="w-full h-12 rounded-full bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-semibold text-sm shadow-[0_4px_14px_rgba(29,78,216,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                <span>Save</span>
              </button>
            </div>
          </form>
        </div>

        {/* =========================================================================
            CENTER COLUMN: 3D Color-Blocked Mannequin Workstation (5 Columns on Desktop)
            ========================================================================= */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-gray-100/90 flex flex-col items-center relative overflow-hidden min-h-[620px]">
          {/* Header Bar: Body Diagram Title + Unit Toggle */}
          <div className="w-full flex items-center justify-between pb-3 border-b border-gray-100 mb-2">
            <div>
              <h3 className="text-lg font-bold text-gray-950 font-sans tracking-tight">
                Body Diagram
              </h3>
              <p className="text-xs text-gray-400">
                {currentTemplateName} • {gender === 'M' ? 'Masculine' : 'Feminine'} Form
              </p>
            </div>

            {/* Measurement Unit Segmented Toggle */}
            <div className="flex items-center bg-gray-100 rounded-full p-1 border border-gray-200/50">
              <button
                type="button"
                onClick={() => setUnit('cm')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  unit === 'cm'
                    ? 'bg-white text-gray-950 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                cm
              </button>
              <button
                type="button"
                onClick={() => setUnit('in')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  unit === 'in'
                    ? 'bg-white text-gray-950 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                in
              </button>
            </div>
          </div>

          {/* Mannequin Interactive Graphic */}
          <div className="w-full flex-1 flex items-center justify-center py-2">
            <AtelierMannequin
              gender={gender}
              unit={unit}
              measurements={measurements}
              onMeasurementChange={handleMeasurementChange}
            />
          </div>

          {/* Bottom Quick Snapshot Summary */}
          <div className="w-full bg-[#f7f8fa] rounded-2xl p-3 flex items-center justify-between text-xs text-gray-600 border border-gray-100">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#10b981]" />
              <span className="font-medium text-gray-900">Active Blueprint:</span>
              <span className="text-gray-500">
                {Object.keys(measurements).length} landmarks captured
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveScreen('new-measurement');
              }}
              className="text-[#1d4ed8] font-semibold hover:underline flex items-center gap-1"
            >
              <span>Full Screen Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* =========================================================================
            RIGHT COLUMN: Garment's Calendar + Recent Orders (3 Columns on Desktop)
            ========================================================================= */}
        <div className="lg:col-span-3 space-y-6 flex flex-col">
          {/* TOP RIGHT: Garment's Calendar Card */}
          <div className="bg-white rounded-3xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-gray-100/90">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-950 tracking-tight font-sans">
                Garment&apos;s Calendar
              </h3>
              <span className="text-xs font-semibold text-gray-400">
                Sep 2026
              </span>
            </div>

            {/* Calendar Grid */}
            <div className="w-full">
              {/* Day of Week Headers */}
              <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-gray-400 mb-2">
                <span>S</span>
                <span>M</span>
                <span>T</span>
                <span>W</span>
                <span>T</span>
                <span>F</span>
                <span>S</span>
              </div>

              {/* Days 1 to 30 */}
              <div className="grid grid-cols-7 gap-y-2 text-center text-xs">
                {/* Pad leading days: September 1, 2026 is Tuesday (2 blank days) */}
                <div className="py-1"></div>
                <div className="py-1"></div>

                {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => {
                  const dayOrders = calendarOrderMap[day];
                  const hasOrders = dayOrders && dayOrders.length > 0;
                  const isSelected = calendarSelectedDay === day;

                  return (
                    <div
                      key={`cal-day-${day}`}
                      onClick={() => setCalendarSelectedDay(isSelected ? null : day)}
                      className={`relative py-1 cursor-pointer rounded-lg transition-colors flex flex-col items-center justify-center ${
                        isSelected
                          ? 'bg-[#1d4ed8]/10 text-[#1d4ed8] font-bold'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <span className="text-xs">{day}</span>
                      {hasOrders && (
                        <div className="flex items-center gap-0.5 mt-0.5">
                          {dayOrders.map((o, idx) => (
                            <span
                              key={idx}
                              className={`w-1.5 h-1.5 rounded-full ${getStatusDotColor(
                                o.status
                              )}`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Calendar Status Legend */}
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500 font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
                <span>Pending</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#10b981]" />
                <span>Completed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#ef4444]" />
                <span>Paused</span>
              </div>
            </div>

            {/* Day Specific Detail Callout */}
            {calendarSelectedDay && calendarOrderMap[calendarSelectedDay] && (
              <div className="mt-3 p-2.5 bg-gray-50 rounded-xl border border-gray-100 text-xs animate-in fade-in">
                <p className="font-semibold text-gray-900 mb-1">
                  Due on Sep {calendarSelectedDay}:
                </p>
                {calendarOrderMap[calendarSelectedDay].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-gray-600">
                    <span>{item.clientName}</span>
                    <span className="font-medium text-gray-900">{item.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* BOTTOM RIGHT: Recent Orders Card */}
          <div className="bg-white rounded-3xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-gray-100/90 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-950 tracking-tight font-sans">
                Recent Orders
              </h3>
              <button
                type="button"
                onClick={() => setActiveScreen('clients')}
                className="text-xs font-semibold text-[#1d4ed8] hover:underline"
              >
                View all
              </button>
            </div>

            {/* Recent Orders List matching Mockup */}
            <div className="space-y-3 flex-1">
              {/* Order 1: Chloe Dallas */}
              <div
                onClick={() => {
                  handleSelectClient('c-1');
                  onOpenOrder('ord-101');
                }}
                className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-colors cursor-pointer group"
              >
                {/* Initials Avatar */}
                <div className="w-10 h-10 rounded-full bg-[#e5e7eb] text-gray-800 font-bold text-xs flex items-center justify-center shrink-0 border border-gray-200/60 group-hover:bg-[#1d4ed8] group-hover:text-white transition-colors">
                  CD
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-gray-900 truncate">
                    Chloe Dallas
                  </h4>
                  <p className="text-[11px] text-gray-400 truncate">
                    Bespoke African Gown
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1 justify-end">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
                    <span className="text-[10px] font-semibold text-gray-600">Pending</span>
                  </div>
                  <p className="text-xs font-bold text-gray-900 mt-0.5">
                    {currency}185,000
                  </p>
                </div>
              </div>

              {/* Order 2: Taylor Razaq */}
              <div
                onClick={() => {
                  handleSelectClient('c-2');
                  onOpenOrder('ord-102');
                }}
                className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-colors cursor-pointer group"
              >
                {/* Initials Avatar */}
                <div className="w-10 h-10 rounded-full bg-[#e5e7eb] text-gray-800 font-bold text-xs flex items-center justify-center shrink-0 border border-gray-200/60 group-hover:bg-[#1d4ed8] group-hover:text-white transition-colors">
                  TR
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-gray-900 truncate">
                    Taylor Razaq
                  </h4>
                  <p className="text-[11px] text-gray-400 truncate">
                    Bespoke African Gown
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1 justify-end">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                    <span className="text-[10px] font-semibold text-gray-600">Completed</span>
                  </div>
                  <p className="text-xs font-bold text-gray-900 mt-0.5">
                    {currency}240,000
                  </p>
                </div>
              </div>

              {/* Order 3: Bryan Muhammed */}
              <div
                onClick={() => {
                  handleSelectClient('c-3');
                  onOpenOrder('ord-103');
                }}
                className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-colors cursor-pointer group"
              >
                {/* Initials Avatar */}
                <div className="w-10 h-10 rounded-full bg-[#e5e7eb] text-gray-800 font-bold text-xs flex items-center justify-center shrink-0 border border-gray-200/60 group-hover:bg-[#1d4ed8] group-hover:text-white transition-colors">
                  BM
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-gray-900 truncate">
                    Bryan Muhammed
                  </h4>
                  <p className="text-[11px] text-gray-400 truncate">
                    Bespoke African Gown
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1 justify-end">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]" />
                    <span className="text-[10px] font-semibold text-gray-600">Paused</span>
                  </div>
                  <p className="text-xs font-bold text-gray-900 mt-0.5">
                    {currency}120,000
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
