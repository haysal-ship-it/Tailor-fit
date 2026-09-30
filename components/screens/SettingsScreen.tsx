'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { HotspotDefinition, GarmentTemplate } from '@/types';
import { 
  Ruler, 
  Scissors, 
  Layers, 
  Plus, 
  Trash2, 
  Download, 
  RotateCcw, 
  Check, 
  Coins,
  Sparkles,
  X
} from 'lucide-react';

export function SettingsScreen() {
  const {
    settings,
    allHotspots,
    updateSettings,
    addCustomField,
    deleteCustomField,
    addTemplate,
    resetToDemoData,
    exportDataJson,
  } = useStore();

  // Custom Field form
  const [showAddFieldModal, setShowAddFieldModal] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldRegion, setNewFieldRegion] = useState<'upper_body' | 'lower_body' | 'arms' | 'head_neck'>('upper_body');
  const [newFieldSide, setNewFieldSide] = useState<'front' | 'back' | 'both'>('front');
  const [newFieldHint, setNewFieldHint] = useState('');

  // New Template form
  const [showAddTemplateModal, setShowAddTemplateModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');
  const [selectedFieldKeys, setSelectedFieldKeys] = useState<string[]>(['waist', 'bust', 'shoulder']);

  const currencies = [
    { code: '₦', label: 'Nigerian Naira (₦)' },
    { code: '$', label: 'US Dollar ($)' },
    { code: '£', label: 'British Pound (£)' },
    { code: '€', label: 'Euro (€)' },
    { code: '₵', label: 'Ghanaian Cedi (₵)' },
  ];

  const handleCreateField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFieldLabel.trim()) return;

    const key = newFieldLabel.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const field: HotspotDefinition = {
      key,
      label: newFieldLabel.trim(),
      category: newFieldRegion,
      view: newFieldSide,
      frontX: 150,
      frontY: 200,
      backX: 150,
      backY: 200,
      hint: newFieldHint.trim() || `Measure ${newFieldLabel.toLowerCase()} with tape flat.`,
      isCustom: true,
    };

    addCustomField(field);
    setNewFieldLabel('');
    setNewFieldHint('');
    setShowAddFieldModal(false);
  };

  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim()) return;

    const newTemplate: GarmentTemplate = {
      id: newTemplateName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      name: newTemplateName.trim(),
      description: newTemplateDesc.trim() || 'Custom bespoke garment template',
      fieldKeys: selectedFieldKeys,
    };

    addTemplate(newTemplate);
    setNewTemplateName('');
    setNewTemplateDesc('');
    setSelectedFieldKeys(['waist', 'bust', 'shoulder']);
    setShowAddTemplateModal(false);
  };

  const toggleFieldSelection = (key: string) => {
    setSelectedFieldKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 py-4 space-y-6">
      {/* Settings Header */}
      <div className="bg-white rounded-3xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-gray-100/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-950 tracking-tight font-sans">
            Atelier Settings
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Units, currency standards, garment blueprint catalog & studio backups
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exportDataJson}
            className="px-4 py-2 rounded-full border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Atelier JSON</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (confirm('Reset atelier to factory sample data? Custom inputs will be cleared.')) {
                resetToDemoData();
              }
            }}
            className="px-4 py-2 rounded-full border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo</span>
          </button>
        </div>
      </div>

      {/* Bento-Grid Layout for Settings Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* =========================================================================
            BENTO ITEM 1: Measurement Unit & Currency Standards
            ========================================================================= */}
        <div className="bg-white rounded-3xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-gray-100/90 space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
            <div className="w-9 h-9 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-800">
              <Ruler className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-950 font-sans">
                Measurement & Billing Standards
              </h3>
              <p className="text-xs text-gray-400">Atelier units and currency symbol</p>
            </div>
          </div>

          {/* Unit Toggle */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              Default Measurement Unit
            </label>
            <div className="inline-flex bg-gray-100 p-1 rounded-full border border-gray-200/60">
              <button
                type="button"
                onClick={() => updateSettings({ defaultUnit: 'cm' })}
                className={`px-5 py-2 rounded-full text-xs font-semibold transition-all ${
                  settings.defaultUnit === 'cm'
                    ? 'bg-[#1d4ed8] text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-950'
                }`}
              >
                Centimeters (cm)
              </button>
              <button
                type="button"
                onClick={() => updateSettings({ defaultUnit: 'in' })}
                className={`px-5 py-2 rounded-full text-xs font-semibold transition-all ${
                  settings.defaultUnit === 'in'
                    ? 'bg-[#1d4ed8] text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-950'
                }`}
              >
                Inches (&quot;)
              </button>
            </div>
          </div>

          {/* Currency Selection */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              Studio Currency
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {currencies.map((curr) => {
                const isSelected = settings.currency === curr.code;
                return (
                  <button
                    key={curr.code}
                    type="button"
                    onClick={() => updateSettings({ currency: curr.code })}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-[#1d4ed8] bg-[#1d4ed8]/5 text-[#1d4ed8] font-bold shadow-2xs'
                        : 'border-gray-100 bg-[#f7f8fa] text-gray-700 hover:border-gray-200'
                    }`}
                  >
                    <span className="text-xs">{curr.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#1d4ed8]" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* =========================================================================
            BENTO ITEM 2: Garment Blueprint Templates
            ========================================================================= */}
        <div className="bg-white rounded-3xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-gray-100/90 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-800">
                  <Scissors className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-950 font-sans">
                    Garment Blueprints
                  </h3>
                  <p className="text-xs text-gray-400">
                    {settings.templates.length} tailoring templates active
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAddTemplateModal(true)}
                className="px-3.5 py-1.5 rounded-full bg-[#1d4ed8] text-white text-xs font-semibold hover:bg-[#1e40af] shadow-xs flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Template</span>
              </button>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {settings.templates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="p-3.5 rounded-2xl bg-[#f7f8fa] border border-gray-100 flex items-center justify-between"
                >
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">{tpl.name}</h4>
                    <p className="text-[11px] text-gray-400">{tpl.description}</p>
                    <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                      {tpl.fieldKeys.slice(0, 4).map((k) => (
                        <span
                          key={k}
                          className="px-2 py-0.5 rounded-md bg-white text-gray-600 text-[10px] font-medium border border-gray-200/60"
                        >
                          {k}
                        </span>
                      ))}
                      {tpl.fieldKeys.length > 4 && (
                        <span className="text-[10px] text-gray-400">
                          +{tpl.fieldKeys.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* =========================================================================
            BENTO ITEM 3: Custom Anatomical Landmarks & Hotspots
            ========================================================================= */}
        <div className="md:col-span-2 bg-white rounded-3xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-gray-100/90 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-800">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-950 font-sans">
                  Anatomical Landmarks Catalog
                </h3>
                <p className="text-xs text-gray-400">
                  {allHotspots.length} standard & bespoke tape measurements
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAddFieldModal(true)}
              className="px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Landmark</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {allHotspots.map((h) => (
              <div
                key={h.key}
                className="p-3 rounded-2xl bg-[#f7f8fa] border border-gray-100 text-center relative group"
              >
                <p className="text-xs font-bold text-gray-900">{h.label}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">
                  {h.category.replace(/_/g, ' ')}
                </p>
                {h.isCustom && (
                  <button
                    type="button"
                    onClick={() => deleteCustomField(h.key)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove custom landmark"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Custom Landmark Modal */}
      {showAddFieldModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-950 font-sans">
                Add Anatomical Landmark
              </h3>
              <button
                type="button"
                onClick={() => setShowAddFieldModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:text-gray-900 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateField} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Landmark Label *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wrist Circumference"
                  value={newFieldLabel}
                  onChange={(e) => setNewFieldLabel(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-[#f7f8fa] border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#1d4ed8] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Anatomical Zone
                </label>
                <select
                  value={newFieldRegion}
                  onChange={(e) => setNewFieldRegion(e.target.value as any)}
                  className="w-full h-11 px-4 rounded-xl bg-[#f7f8fa] border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-[#1d4ed8]"
                >
                  <option value="upper_body">Upper Body (Torso / Chest)</option>
                  <option value="arms">Arms / Sleeves</option>
                  <option value="lower_body">Lower Body (Hips / Legs)</option>
                  <option value="head_neck">Head & Neck</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Measurement Instructions / Hint
                </label>
                <textarea
                  rows={2}
                  placeholder="Tape wrapped comfortably over wrist bone..."
                  value={newFieldHint}
                  onChange={(e) => setNewFieldHint(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[#f7f8fa] border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-[#1d4ed8] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddFieldModal(false)}
                  className="px-4 py-2 rounded-full border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-[#1d4ed8] text-white text-xs font-semibold hover:bg-[#1e40af] shadow-xs"
                >
                  Save Landmark
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Custom Garment Template Modal */}
      {showAddTemplateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-950 font-sans">
                Create Garment Blueprint
              </h3>
              <button
                type="button"
                onClick={() => setShowAddTemplateModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:text-gray-900 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTemplate} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kaftan & Trouser Set"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-[#f7f8fa] border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#1d4ed8] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="Traditional Nigerian embroidered attire"
                  value={newTemplateDesc}
                  onChange={(e) => setNewTemplateDesc(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-[#f7f8fa] border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-[#1d4ed8]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">
                  Select Required Measurements for this Blueprint
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-[#f7f8fa] rounded-2xl border border-gray-100">
                  {allHotspots.map((h) => {
                    const isSelected = selectedFieldKeys.includes(h.key);
                    return (
                      <button
                        key={h.key}
                        type="button"
                        onClick={() => toggleFieldSelection(h.key)}
                        className={`p-2 rounded-xl text-left text-xs font-medium flex items-center justify-between border transition-all ${
                          isSelected
                            ? 'bg-white border-[#1d4ed8] text-[#1d4ed8] shadow-2xs font-semibold'
                            : 'bg-transparent border-transparent text-gray-600 hover:bg-white/60'
                        }`}
                      >
                        <span className="truncate">{h.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#1d4ed8]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddTemplateModal(false)}
                  className="px-4 py-2 rounded-full border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-[#1d4ed8] text-white text-xs font-semibold hover:bg-[#1e40af] shadow-xs"
                >
                  Save Blueprint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
