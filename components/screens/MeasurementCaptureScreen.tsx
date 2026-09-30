'use client';

import React, { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { BodyDiagram } from '@/components/BodyDiagram';
import { UnitType } from '@/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  ArrowLeft, 
  ArrowLeftRight, 
  Check, 
  ChevronDown, 
  Eye, 
  Layers, 
  ListFilter, 
  MoreHorizontal, 
  RotateCcw, 
  Save, 
  User, 
  X, 
  ArrowUpDown,
  Calendar
} from 'lucide-react';

export function MeasurementCaptureScreen() {
  const {
    clients,
    snapshots,
    settings,
    allHotspots,
    selectedClientId,
    selectedSnapshotId,
    setActiveScreen,
    addSnapshot,
    updateSnapshot,
    openClientProfile,
  } = useStore();

  const isMobile = useIsMobile();

  const existingSnapshot = selectedSnapshotId ? snapshots.find((s) => s.id === selectedSnapshotId) : null;
  const initialClient = selectedClientId ? clients.find((c) => c.id === selectedClientId) : clients[0];

  const [clientId, setClientId] = useState<string>(existingSnapshot?.clientId || initialClient?.id || '');
  const [date, setDate] = useState<string>(existingSnapshot?.date || new Date().toISOString().slice(0, 10));
  const [unit, setUnit] = useState<UnitType>(existingSnapshot?.unit || settings.defaultUnit || 'cm');
  const [garmentType, setGarmentType] = useState<string>(existingSnapshot?.garmentType || 'Full 2-Piece Suit');
  const [notes, setNotes] = useState<string>(existingSnapshot?.notes || '');
  
  // Measurements record { [key]: value }
  const [measurements, setMeasurements] = useState<Record<string, number | string>>(
    existingSnapshot?.measurements || {}
  );

  // View settings
  const [viewMode, setViewMode] = useState<'diagram' | 'list'>('diagram');
  const [gender, setGender] = useState<'male' | 'female'>('female');
  const [silhouetteView, setSilhouetteView] = useState<'front' | 'back'>('front');

  // Progressive Disclosure UI states
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Selected template
  const currentTemplate = settings.templates.find(
    (t) => t.name.toLowerCase() === garmentType.toLowerCase() || t.id.toLowerCase() === garmentType.toLowerCase()
  ) || settings.templates[0];

  const templateFieldKeys = currentTemplate?.fieldKeys || [];

  // Prior snapshots for comparison (must belong to this client and not be the current snapshot being edited)
  const priorSnapshots = useMemo(() => {
    return clientId
      ? snapshots
          .filter((s) => s.clientId === clientId && (!existingSnapshot || s.id !== existingSnapshot.id))
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      : [];
  }, [clientId, snapshots, existingSnapshot]);

  const hasPriorSnapshot = priorSnapshots.length > 0;
  const [selectedCompareId, setSelectedCompareId] = useState<string | null>(null);

  const activeCompareSnapshot = 
    (selectedCompareId && priorSnapshots.find((s) => s.id === selectedCompareId)) || priorSnapshots[0] || null;

  const handleUpdateMeasurement = (key: string, val: number | string) => {
    setMeasurements((prev) => {
      const next = { ...prev };
      if (val === '' || val === undefined) {
        delete next[key];
      } else {
        next[key] = val;
      }
      return next;
    });
  };

  const handleUnitToggle = (newUnit: UnitType) => {
    if (newUnit === unit) return;
    const shouldConvert = Object.keys(measurements).length > 0 && 
      confirm(`Convert existing values to ${newUnit === 'cm' ? 'centimeters (× 2.54)' : 'inches (÷ 2.54)'}?`);

    if (shouldConvert) {
      const converted: Record<string, number | string> = {};
      Object.entries(measurements).forEach(([k, v]) => {
        const num = parseFloat(String(v));
        if (!isNaN(num)) {
          if (newUnit === 'cm') {
            converted[k] = parseFloat((num * 2.54).toFixed(1));
          } else {
            converted[k] = parseFloat((num / 2.54).toFixed(1));
          }
        } else {
          converted[k] = v;
        }
      });
      setMeasurements(converted);
    }
    setUnit(newUnit);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      alert('Please select or specify a client');
      return;
    }

    if (existingSnapshot) {
      updateSnapshot(existingSnapshot.id, {
        clientId,
        date,
        unit,
        garmentType,
        measurements,
        notes,
      });
    } else {
      addSnapshot({
        clientId,
        date,
        unit,
        garmentType,
        measurements,
        notes,
      });
    }

    if (clientId) {
      openClientProfile(clientId);
    } else {
      setActiveScreen('clients');
    }
  };

  const handleClearMeasurements = () => {
    if (Object.keys(measurements).length === 0) return;
    if (confirm('Clear all entered measurements for this fitting session?')) {
      setMeasurements({});
      setShowMoreMenu(false);
    }
  };

  const handleImportPriorMeasurements = () => {
    if (!activeCompareSnapshot) return;
    if (confirm(`Import all measurements from ${activeCompareSnapshot.date} (${activeCompareSnapshot.garmentType})? Existing values will be overwritten.`)) {
      setMeasurements({ ...activeCompareSnapshot.measurements });
      setUnit(activeCompareSnapshot.unit);
      setShowCompareModal(false);
    }
  };

  const capturedCount = Object.keys(measurements).filter(
    (k) => measurements[k] !== '' && measurements[k] !== undefined
  ).length;

  const relevantHotspots = allHotspots.filter(
    (h) => templateFieldKeys.length === 0 || templateFieldKeys.includes(h.key)
  );

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 py-6 pb-32 sm:pb-16">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-[#ebe8e4]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => (clientId ? openClientProfile(clientId) : setActiveScreen('dashboard'))}
            className="w-9 h-9 rounded-full border border-[#ebe8e4] flex items-center justify-center text-[#44403b] hover:bg-[#f5f3f1] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-[#000000]">
              {existingSnapshot ? 'Edit Measurement Snapshot' : 'Take Body Measurements'}
            </h1>
            <p className="text-[13px] text-[#777169] mt-0.5">
              Interactive 2D diagram capture with garment template filtering
            </p>
          </div>
        </div>
      </div>

      {/* TIER 1 — PRIMARY TOOLBAR */}
      {/* Bottom-anchored on mobile widths, top-anchored on desktop widths */}
      <div className="fixed bottom-3 inset-x-3 sm:static sm:inset-auto z-40 sm:z-20 bg-[#f5f3f1]/95 sm:bg-[#f5f3f1] backdrop-blur-md sm:backdrop-blur-none border border-[#ebe8e4] rounded-[24px] sm:rounded-[20px] p-2 sm:p-2.5 shadow-lg sm:shadow-xs mb-0 sm:mb-6">
        <div className="relative flex items-center justify-between gap-1.5 sm:gap-3">
          {/* Button 1: Garment Template Selector */}
          <button
            type="button"
            onClick={() => setShowTemplatePicker(true)}
            title="Choose Garment Job Template"
            className="flex-1 sm:flex-initial min-w-0 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[#fdfcfc] border border-[#ebe8e4] hover:bg-[#ebe8e4] text-[#000000] text-[12px] sm:text-[13px] font-medium flex items-center justify-center sm:justify-start gap-1 sm:gap-1.5 transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-[#777169] shrink-0" />
            <span className="truncate max-w-[70px] sm:max-w-[140px]">{garmentType}</span>
            <ChevronDown className="w-3 h-3 text-[#777169] shrink-0" />
          </button>

          {/* Button 2: Front / Back View Toggle */}
          <button
            type="button"
            onClick={() => setSilhouetteView((prev) => (prev === 'front' ? 'back' : 'front'))}
            title="Toggle Silhouette View (Front / Back)"
            className="flex-1 sm:flex-initial px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[#fdfcfc] border border-[#ebe8e4] hover:bg-[#ebe8e4] text-[#000000] text-[12px] sm:text-[13px] font-medium flex items-center justify-center gap-1 sm:gap-1.5 transition-colors"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-[#777169] shrink-0" />
            <span className="capitalize">{silhouetteView}</span>
          </button>

          {/* Button 3: Diagram ↔ List View Toggle */}
          <button
            type="button"
            onClick={() => setViewMode((prev) => (prev === 'diagram' ? 'list' : 'diagram'))}
            title="Toggle View Mode (Diagram / List)"
            className="flex-1 sm:flex-initial px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[#fdfcfc] border border-[#ebe8e4] hover:bg-[#ebe8e4] text-[#000000] text-[12px] sm:text-[13px] font-medium flex items-center justify-center gap-1 sm:gap-1.5 transition-colors"
          >
            {viewMode === 'diagram' ? (
              <>
                <ListFilter className="w-3.5 h-3.5 text-[#777169] shrink-0" />
                <span>List</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-[#777169] shrink-0" />
                <span>Diagram</span>
              </>
            )}
          </button>

          {/* Button 4: Save */}
          <button
            type="button"
            onClick={handleSave}
            title="Save Measurement Snapshot"
            className="flex-1 sm:flex-initial px-3 sm:px-5 py-1.5 sm:py-2 rounded-full bg-[#000000] text-white hover:bg-[#222222] text-[12px] sm:text-[13px] font-medium flex items-center justify-center gap-1 sm:gap-1.5 transition-colors shadow-xs"
          >
            <Save className="w-3.5 h-3.5 shrink-0" />
            <span>Save</span>
          </button>

          {/* Small "⋯" Icon Button (Toggles Tier 2 "More" Menu) */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setShowMoreMenu((prev) => !prev)}
              title="More fitting options"
              aria-label="More options"
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-[#ebe8e4] flex items-center justify-center text-[#000000] transition-colors ${
                showMoreMenu ? 'bg-[#ebe8e4]' : 'bg-[#fdfcfc] hover:bg-[#ebe8e4]'
              }`}
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {/* Desktop Popover for Tier 2 (Anchored to the "⋯" button) */}
            {!isMobile && showMoreMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMoreMenu(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-80 bg-[#fdfcfc] rounded-[20px] border border-[#ebe8e4] p-5 space-y-4 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-[#ebe8e4]">
                    <span className="text-[12px] font-mono text-[#a59f97] uppercase tracking-wider">
                      Fitting Options
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowMoreMenu(false)}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[#777169] hover:bg-[#f5f3f1]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* 1. Unit Toggle */}
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium text-[#44403b]">Measurement Unit</span>
                    <div className="inline-flex rounded-full bg-[#ebe8e4]/60 p-0.5 border border-[#ebe8e4]">
                      <button
                        type="button"
                        onClick={() => handleUnitToggle('cm')}
                        className={`px-3 py-1 rounded-full text-[12px] font-medium transition-all ${
                          unit === 'cm'
                            ? 'bg-[#000000] text-white shadow-xs'
                            : 'text-[#777169] hover:text-[#000000]'
                        }`}
                      >
                        cm
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUnitToggle('in')}
                        className={`px-3 py-1 rounded-full text-[12px] font-medium transition-all ${
                          unit === 'in'
                            ? 'bg-[#000000] text-white shadow-xs'
                            : 'text-[#777169] hover:text-[#000000]'
                        }`}
                      >
                        in
                      </button>
                    </div>
                  </div>

                  {/* 2. Model Gender Toggle */}
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium text-[#44403b]">Model Silhouette</span>
                    <div className="inline-flex rounded-full bg-[#ebe8e4]/60 p-0.5 border border-[#ebe8e4]">
                      <button
                        type="button"
                        onClick={() => setGender('female')}
                        className={`px-3 py-1 rounded-full text-[12px] font-medium transition-all ${
                          gender === 'female'
                            ? 'bg-[#000000] text-white shadow-xs'
                            : 'text-[#777169] hover:text-[#000000]'
                        }`}
                      >
                        Female
                      </button>
                      <button
                        type="button"
                        onClick={() => setGender('male')}
                        className={`px-3 py-1 rounded-full text-[12px] font-medium transition-all ${
                          gender === 'male'
                            ? 'bg-[#000000] text-white shadow-xs'
                            : 'text-[#777169] hover:text-[#000000]'
                        }`}
                      >
                        Male
                      </button>
                    </div>
                  </div>

                  {/* 3. Reset / Clear Measurements */}
                  <div className="pt-1 border-t border-[#ebe8e4]">
                    <button
                      type="button"
                      onClick={handleClearMeasurements}
                      className="w-full flex items-center justify-between py-2 text-left text-[13px] font-medium text-[#ff4704] hover:opacity-80 transition-opacity"
                    >
                      <span className="flex items-center gap-2">
                        <RotateCcw className="w-4 h-4" />
                        <span>Clear All Measurements</span>
                      </span>
                      <span className="text-[11px] font-mono text-[#a59f97]">{capturedCount} points</span>
                    </button>
                  </div>

                  {/* 4. Compare to Previous Snapshot (Strictly rendered ONLY if prior snapshots exist) */}
                  {hasPriorSnapshot && (
                    <div className="pt-1 border-t border-[#ebe8e4]">
                      <button
                        type="button"
                        onClick={() => {
                          setShowMoreMenu(false);
                          setShowCompareModal(true);
                        }}
                        className="w-full flex items-center justify-between py-2 text-left text-[13px] font-medium text-[#000000] hover:text-[#0447ff] transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <ArrowUpDown className="w-4 h-4 text-[#777169]" />
                          <span>Compare to Previous Snapshot</span>
                        </span>
                        <span className="text-[11px] font-mono text-[#a59f97]">
                          {priorSnapshots[0]?.date}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* TIER 2 — MOBILE BOTTOM SHEET (Rendered when isMobile && showMoreMenu) */}
      {isMobile && showMoreMenu && (
        <div className="fixed inset-0 z-50 flex items-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setShowMoreMenu(false)}
          />

          {/* Sheet */}
          <div className="relative w-full bg-[#fdfcfc] rounded-t-[20px] border-t border-[#ebe8e4] p-5 pb-8 space-y-4 shadow-2xl z-10 animate-in slide-in-from-bottom duration-200">
            {/* Drag Handle */}
            <div className="w-10 h-1 rounded-full bg-[#ebe8e4] mx-auto mb-2" />

            <div className="flex items-center justify-between pb-2 border-b border-[#ebe8e4]">
              <h4 className="text-[15px] font-medium text-[#000000]">Fitting Options</h4>
              <button
                type="button"
                onClick={() => setShowMoreMenu(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-[#777169] hover:bg-[#f5f3f1]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 1. Unit Toggle */}
            <div className="flex items-center justify-between py-1">
              <span className="text-[14px] font-medium text-[#44403b]">Measurement Unit</span>
              <div className="inline-flex rounded-full bg-[#ebe8e4]/60 p-0.5 border border-[#ebe8e4]">
                <button
                  type="button"
                  onClick={() => handleUnitToggle('cm')}
                  className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all ${
                    unit === 'cm'
                      ? 'bg-[#000000] text-white shadow-xs'
                      : 'text-[#777169] hover:text-[#000000]'
                  }`}
                >
                  cm
                </button>
                <button
                  type="button"
                  onClick={() => handleUnitToggle('in')}
                  className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all ${
                    unit === 'in'
                      ? 'bg-[#000000] text-white shadow-xs'
                      : 'text-[#777169] hover:text-[#000000]'
                  }`}
                >
                  in
                </button>
              </div>
            </div>

            {/* 2. Model Gender Toggle */}
            <div className="flex items-center justify-between py-1">
              <span className="text-[14px] font-medium text-[#44403b]">Model Silhouette</span>
              <div className="inline-flex rounded-full bg-[#ebe8e4]/60 p-0.5 border border-[#ebe8e4]">
                <button
                  type="button"
                  onClick={() => setGender('female')}
                  className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all ${
                    gender === 'female'
                      ? 'bg-[#000000] text-white shadow-xs'
                      : 'text-[#777169] hover:text-[#000000]'
                  }`}
                >
                  Female
                </button>
                <button
                  type="button"
                  onClick={() => setGender('male')}
                  className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all ${
                    gender === 'male'
                      ? 'bg-[#000000] text-white shadow-xs'
                      : 'text-[#777169] hover:text-[#000000]'
                  }`}
                >
                  Male
                </button>
              </div>
            </div>

            {/* 3. Reset / Clear Measurements */}
            <div className="pt-2 border-t border-[#ebe8e4]">
              <button
                type="button"
                onClick={handleClearMeasurements}
                className="w-full flex items-center justify-between py-2 text-left text-[14px] font-medium text-[#ff4704]"
              >
                <span className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" />
                  <span>Clear All Measurements</span>
                </span>
                <span className="text-[12px] font-mono text-[#a59f97]">{capturedCount} points</span>
              </button>
            </div>

            {/* 4. Compare to Previous Snapshot (Strictly rendered ONLY if prior snapshots exist) */}
            {hasPriorSnapshot && (
              <div className="pt-2 border-t border-[#ebe8e4]">
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreMenu(false);
                    setShowCompareModal(true);
                  }}
                  className="w-full flex items-center justify-between py-2 text-left text-[14px] font-medium text-[#000000]"
                >
                  <span className="flex items-center gap-2">
                    <ArrowUpDown className="w-4 h-4 text-[#777169]" />
                    <span>Compare to Previous Snapshot</span>
                  </span>
                  <span className="text-[12px] font-mono text-[#a59f97]">
                    {priorSnapshots[0]?.date}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Studio Workbench Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Client & Fitting Notes (4 cols on lg) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Metadata Card */}
          <div className="bg-[#f5f3f1] rounded-[20px] p-5 space-y-4">
            <h3 className="text-[14px] font-medium text-[#000000] flex items-center gap-2">
              <User className="w-4 h-4 text-[#777169]" />
              <span>Fitting Details</span>
            </h3>

            {/* Client Picker */}
            <div>
              <label className="block text-[12px] font-medium text-[#777169] mb-1.5">
                Client
              </label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full h-10 px-3 rounded-[4px] border border-[#ebe8e4] bg-[#fdfcfc] text-[#000000] text-[14px] focus:outline-none focus:border-[#000000]"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone})
                  </option>
                ))}
              </select>
            </div>

            {/* Date Picker */}
            <div>
              <label className="block text-[12px] font-medium text-[#777169] mb-1.5">
                Fitting Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-10 px-3 rounded-[4px] border border-[#ebe8e4] bg-[#fdfcfc] text-[#000000] text-[14px] focus:outline-none focus:border-[#000000]"
              />
            </div>

            {/* Fitting Notes */}
            <div>
              <label className="block text-[12px] font-medium text-[#777169] mb-1.5">
                Fitting Notes & Posture Observations
              </label>
              <textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Left shoulder lower by 0.5cm, erect posture, 2-inch heel allowance..."
                className="w-full p-2.5 rounded-[4px] border border-[#ebe8e4] bg-[#fdfcfc] text-[#000000] text-[13px] focus:outline-none focus:border-[#000000] resize-none"
              />
            </div>
          </div>

          {/* Quick Metrics & Progress */}
          <div className="bg-[#f5f3f1] rounded-[20px] p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] text-[#44403b] font-medium">Capture Progress</span>
              <span className="font-mono text-[13px] font-semibold text-[#0447ff]">
                {capturedCount} of {relevantHotspots.length} points
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#ebe8e4] overflow-hidden">
              <div
                className="h-full bg-[#0447ff] transition-all duration-300 rounded-full"
                style={{
                  width: `${relevantHotspots.length > 0 ? (capturedCount / relevantHotspots.length) * 100 : 0}%`,
                }}
              />
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-[#777169]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#0447ff]" />
                <span>Captured ({unit})</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#a59f97]" />
                <span>Pending landmark</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Interactive Diagram OR Form List (8 cols on lg) */}
        <div className="lg:col-span-8 bg-[#f5f3f1] rounded-[24px] p-6 sm:p-8">
          {/* Header of Workbench View */}
          <div className="mb-6 pb-4 border-b border-[#ebe8e4]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-light text-[#000000]">
                  {viewMode === 'diagram' ? 'Interactive Body Mannequin' : 'Measurement Table View'}
                </h2>
                <p className="text-[12px] text-[#777169] mt-0.5">
                  {viewMode === 'diagram'
                    ? `Tap landmarks on the ${silhouetteView} silhouette to record measurements`
                    : 'Fast keyboard entry for all active garment fields'}
                </p>
              </div>
              <span className="text-[11px] font-mono text-[#777169] uppercase bg-[#fdfcfc] px-3 py-1 rounded-full border border-[#ebe8e4]">
                {garmentType} • {unit}
              </span>
            </div>
          </div>

          {/* Mode 1: 2D Interactive SVG Diagram */}
          {viewMode === 'diagram' ? (
            <div className="flex justify-center">
              <BodyDiagram
                gender={gender}
                setGender={setGender}
                view={silhouetteView}
                setView={setSilhouetteView}
                unit={unit}
                selectedTemplateId={currentTemplate?.id || 'all'}
                templateFieldKeys={templateFieldKeys}
                allHotspots={allHotspots}
                measurements={measurements}
                onUpdateMeasurement={handleUpdateMeasurement}
                hideHeaderControls={true}
              />
            </div>
          ) : (
            /* Mode 2: Plain List / Form View for Fast Typing */
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#ebe8e4]">
                <span className="text-[12px] font-mono text-[#a59f97] uppercase">Landmark Field</span>
                <span className="text-[12px] font-mono text-[#a59f97] uppercase">Value ({unit})</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[560px] overflow-y-auto pr-1">
                {relevantHotspots.map((hotspot) => {
                  const val = measurements[hotspot.key] !== undefined ? measurements[hotspot.key] : '';
                  const isMeasured = val !== '';

                  return (
                    <div
                      key={hotspot.key}
                      className={`p-3 rounded-[12px] border transition-all ${
                        isMeasured
                          ? 'bg-[#fdfcfc] border-[#ebe8e4]'
                          : 'bg-[#fdfcfc]/60 border-dashed border-[#ebe8e4]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isMeasured ? 'bg-[#0447ff]' : 'bg-[#a59f97]'
                            }`}
                          />
                          <span className="text-[13px] font-medium text-[#000000]">
                            {hotspot.label}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-[#a59f97] uppercase">
                          {hotspot.view}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#777169] mb-2 line-clamp-1">
                        {hotspot.hint}
                      </p>

                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          placeholder="—"
                          value={val}
                          onChange={(e) => handleUpdateMeasurement(hotspot.key, e.target.value)}
                          className="w-full h-9 px-3 font-mono text-[14px] rounded-[4px] border border-[#ebe8e4] bg-[#fdfcfc] text-[#000000] focus:outline-none focus:border-[#0447ff]"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[11px] text-[#a59f97]">
                          {unit}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* GARMENT TEMPLATE PICKER MODAL (Opened from Tier 1 Template button) */}
      {showTemplatePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#fdfcfc] rounded-[20px] border border-[#ebe8e4] p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#ebe8e4]">
              <div>
                <h3 className="text-lg font-light text-[#000000]">Garment Job Template</h3>
                <p className="text-[12px] text-[#777169]">
                  Filters landmarks to required tailoring points
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowTemplatePicker(false)}
                className="w-8 h-8 rounded-full border border-[#ebe8e4] flex items-center justify-center text-[#44403b] hover:bg-[#f5f3f1]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {settings.templates.map((t) => {
                const isSelected = garmentType.toLowerCase() === t.name.toLowerCase();
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setGarmentType(t.name);
                      setShowTemplatePicker(false);
                    }}
                    className={`w-full text-left p-3.5 rounded-[14px] border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#f5f3f1] border-[#000000]'
                        : 'bg-[#fdfcfc] border-[#ebe8e4] hover:bg-[#f5f3f1]/70'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-medium text-[#000000]">{t.name}</span>
                        <span className="text-[11px] font-mono text-[#777169] bg-[#ebe8e4] px-2 py-0.5 rounded-full">
                          {t.fieldKeys.length} points
                        </span>
                      </div>
                      <p className="text-[12px] text-[#777169]">{t.description}</p>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-[#000000] shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}

              {/* All Landmarks Option */}
              <button
                type="button"
                onClick={() => {
                  setGarmentType('Custom Garment');
                  setShowTemplatePicker(false);
                }}
                className={`w-full text-left p-3.5 rounded-[14px] border transition-all flex items-center justify-between ${
                  garmentType === 'Custom Garment'
                    ? 'bg-[#f5f3f1] border-[#000000]'
                    : 'bg-[#fdfcfc] border-[#ebe8e4] hover:bg-[#f5f3f1]/70'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-medium text-[#000000]">All Landmarks</span>
                    <span className="text-[11px] font-mono text-[#777169] bg-[#ebe8e4] px-2 py-0.5 rounded-full">
                      {allHotspots.length} points
                    </span>
                  </div>
                  <p className="text-[12px] text-[#777169]">Complete anatomical capture with all landmarks</p>
                </div>
                {garmentType === 'Custom Garment' && (
                  <Check className="w-4 h-4 text-[#000000] shrink-0 ml-2" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPARE TO PREVIOUS SNAPSHOT MODAL (Opened from Tier 2 Menu) */}
      {showCompareModal && activeCompareSnapshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-[#fdfcfc] rounded-[20px] border border-[#ebe8e4] p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#ebe8e4]">
              <div>
                <h3 className="text-lg font-light text-[#000000] flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-[#0447ff]" />
                  <span>Compare to Previous Snapshot</span>
                </h3>
                <p className="text-[12px] text-[#777169]">
                  Inspecting alterations against prior client visit
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCompareModal(false)}
                className="w-8 h-8 rounded-full border border-[#ebe8e4] flex items-center justify-center text-[#44403b] hover:bg-[#f5f3f1]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Prior Snapshot Selector if multiple exist */}
            {priorSnapshots.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <span className="text-[12px] font-medium text-[#777169] shrink-0">Compare with:</span>
                {priorSnapshots.map((snap) => (
                  <button
                    key={snap.id}
                    type="button"
                    onClick={() => setSelectedCompareId(snap.id)}
                    className={`px-3 py-1 rounded-full text-[12px] font-medium border transition-colors shrink-0 ${
                      snap.id === activeCompareSnapshot.id
                        ? 'bg-[#000000] text-white border-[#000000]'
                        : 'bg-[#f5f3f1] text-[#44403b] border-[#ebe8e4] hover:bg-[#ebe8e4]'
                    }`}
                  >
                    {snap.date} ({snap.garmentType})
                  </button>
                ))}
              </div>
            )}

            {/* Snapshot Metadata Box */}
            <div className="p-3.5 rounded-[14px] bg-[#f5f3f1] border border-[#ebe8e4] text-[12px] text-[#44403b] flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="font-medium text-[#000000]">Previous Fitting: </span>
                <span>{activeCompareSnapshot.date} • {activeCompareSnapshot.garmentType}</span>
              </div>
              <button
                type="button"
                onClick={handleImportPriorMeasurements}
                className="px-3 py-1 rounded-full bg-[#fdfcfc] border border-[#ebe8e4] hover:bg-[#ebe8e4] text-[12px] font-medium text-[#000000] transition-colors"
              >
                Import values to current session
              </button>
            </div>

            {/* Comparison Table */}
            <div className="max-h-[340px] overflow-y-auto border border-[#ebe8e4] rounded-[14px]">
              <table className="w-full text-left text-[12px]">
                <thead className="bg-[#f5f3f1] border-b border-[#ebe8e4] sticky top-0 font-mono text-[#777169]">
                  <tr>
                    <th className="p-3">Landmark</th>
                    <th className="p-3">Previous ({activeCompareSnapshot.unit})</th>
                    <th className="p-3">Current ({unit})</th>
                    <th className="p-3 text-right">Difference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ebe8e4]">
                  {relevantHotspots.map((h) => {
                    const prevVal = activeCompareSnapshot.measurements[h.key];
                    const currVal = measurements[h.key];

                    const hasPrev = prevVal !== undefined && prevVal !== '';
                    const hasCurr = currVal !== undefined && currVal !== '';

                    let diffText = '—';
                    let diffColor = 'text-[#777169]';

                    if (hasPrev && hasCurr) {
                      const numPrev = parseFloat(String(prevVal));
                      const numCurr = parseFloat(String(currVal));
                      if (!isNaN(numPrev) && !isNaN(numCurr)) {
                        // If units match or compare directly
                        const delta = parseFloat((numCurr - numPrev).toFixed(1));
                        if (delta > 0) {
                          diffText = `+${delta} ${unit}`;
                          diffColor = 'text-[#0447ff] font-medium';
                        } else if (delta < 0) {
                          diffText = `${delta} ${unit}`;
                          diffColor = 'text-[#ff4704] font-medium';
                        } else {
                          diffText = `0.0 ${unit}`;
                          diffColor = 'text-[#777169]';
                        }
                      }
                    } else if (!hasPrev && hasCurr) {
                      diffText = 'New point';
                      diffColor = 'text-[#0447ff] font-medium';
                    }

                    return (
                      <tr key={h.key} className="hover:bg-[#f5f3f1]/40">
                        <td className="p-3 font-medium text-[#000000]">
                          {h.label}
                        </td>
                        <td className="p-3 font-mono text-[#44403b]">
                          {hasPrev ? `${prevVal} ${activeCompareSnapshot.unit}` : '—'}
                        </td>
                        <td className="p-3 font-mono text-[#44403b]">
                          {hasCurr ? `${currVal} ${unit}` : '—'}
                        </td>
                        <td className={`p-3 font-mono text-right ${diffColor}`}>
                          {diffText}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowCompareModal(false)}
                className="px-5 py-2 rounded-full bg-[#000000] text-white text-[13px] font-medium hover:bg-[#222222]"
              >
                Close Comparison
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
