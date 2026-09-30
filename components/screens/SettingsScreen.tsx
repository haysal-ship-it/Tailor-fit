'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { Plus, Check, X } from 'lucide-react';

export function SettingsScreen() {
  const { settings, updateSettings, addTemplate, allHotspots } = useStore();

  const [activeTab, setActiveTab] = useState<'billing' | 'blueprints' | 'sizing'>('billing');
  const [selectedCurrency, setSelectedCurrency] = useState('NGN (₦)');
  const [unit, setUnit] = useState<'cm' | 'in'>('cm');

  // Blueprints list matching Settings.png
  const [blueprints, setBlueprints] = useState([
    {
      id: 'bp-1',
      title: 'Bespoke African Gown',
      description:
        'Traditional african couture gown, bridal styles corset-backed silhouettes and embellished trains',
      tags: ['neck', 'sleeves', 'bust', 'waist'],
      moreCount: '+3 more',
    },
    {
      id: 'bp-2',
      title: 'Shirt/Blouse',
      description:
        'Essential measurements for bespoke dress shirts, casual button downs and tailored blouses',
      tags: ['neck', 'sleeves', 'bust', 'waist'],
      moreCount: '+4 more',
    },
    {
      id: 'bp-3',
      title: 'Trousers',
      description:
        'Fittings for tailored pants, pleated trouses and custom chinos/pants',
      tags: ['neck', 'sleeves', 'bust', 'waist'],
      moreCount: '+3 more',
    },
    {
      id: 'bp-4',
      title: 'Bespoke African Gown',
      description:
        'Traditional african couture gown, bridal styles corset-backed silhouettes and embellished trains',
      tags: ['neck', 'sleeves', 'bust', 'waist'],
      moreCount: '+3 more',
    },
  ]);

  // Sizing measurements list matching Settings.png
  const [sizingItems, setSizingItems] = useState([
    { id: 'sz-1', title: 'Shoulder width', category: 'Upper Body' },
    { id: 'sz-2', title: 'Neck Circumference', category: 'Head/Neck' },
    { id: 'sz-3', title: 'Bust/Chest', category: 'Upper Body' },
    { id: 'sz-4', title: 'Waist Circumference', category: 'Upper Body' },
    { id: 'sz-5', title: 'Hip Circumference', category: 'Lower Body' },
    { id: 'sz-6', title: 'Inseam Length', category: 'Lower Body' },
    { id: 'sz-7', title: 'Nape to Waist', category: 'Upper Body' },
    { id: 'sz-8', title: 'Back Width', category: 'Upper Body' },
  ]);

  const [showAddTemplateModal, setShowAddTemplateModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');

  const [showAddMeasurementModal, setShowAddMeasurementModal] = useState(false);
  const [newMeasurementName, setNewMeasurementName] = useState('');
  const [newMeasurementCategory, setNewMeasurementCategory] = useState('Upper Body');

  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim()) return;

    setBlueprints((prev) => [
      ...prev,
      {
        id: `bp-${Date.now()}`,
        title: newTemplateName.trim(),
        description: newTemplateDesc.trim() || 'Custom bespoke garment blueprint',
        tags: ['neck', 'bust', 'waist'],
        moreCount: '+2 more',
      },
    ]);
    setNewTemplateName('');
    setNewTemplateDesc('');
    setShowAddTemplateModal(false);
  };

  const handleCreateMeasurement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMeasurementName.trim()) return;

    setSizingItems((prev) => [
      ...prev,
      {
        id: `sz-${Date.now()}`,
        title: newMeasurementName.trim(),
        category: newMeasurementCategory,
      },
    ]);
    setNewMeasurementName('');
    setShowAddMeasurementModal(false);
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 py-4">
      {/* 2-Column Layout matching Settings.png */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* =========================================================================
            LEFT COLUMN: "Settings" Navigation Container (Fill: #FFFFFF, 2px padding/gap, 8px radius)
            ========================================================================= */}
        <div className="lg:col-span-3 bg-white rounded-[8px] p-[2px] shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-white flex flex-col gap-[2px]">
          <div className="bg-[#F8F8F8] border border-white rounded-[8px] p-4 space-y-4 shadow-xs">
            <h2 className="text-sm font-bold text-gray-950 font-sans tracking-tight">
              Settings
            </h2>

            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setActiveTab('billing')}
                className={`w-full text-left px-3.5 py-2.5 rounded-[8px] text-xs font-semibold transition-colors border ${
                  activeTab === 'billing'
                    ? 'bg-blue-50/70 text-[#1d4ed8] border-blue-100'
                    : 'text-gray-500 hover:text-gray-800 border-transparent'
                }`}
              >
                Measurement &amp; Billing Standards
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('blueprints')}
                className={`w-full text-left px-3.5 py-2.5 rounded-[8px] text-xs font-semibold transition-colors border ${
                  activeTab === 'blueprints'
                    ? 'bg-blue-50/70 text-[#1d4ed8] border-blue-100'
                    : 'text-gray-500 hover:text-gray-800 border-transparent'
                }`}
              >
                Garment Blueprints
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('sizing')}
                className={`w-full text-left px-3.5 py-2.5 rounded-[8px] text-xs font-semibold transition-colors border ${
                  activeTab === 'sizing'
                    ? 'bg-blue-50/70 text-[#1d4ed8] border-blue-100'
                    : 'text-gray-500 hover:text-gray-800 border-transparent'
                }`}
              >
                Sizing/measurements
              </button>
            </div>
          </div>
        </div>

        {/* =========================================================================
            RIGHT COLUMN: Settings Sections (Fill: #FFFFFF, 2px padding/gap, 8px radius)
            ========================================================================= */}
        <div className="lg:col-span-9 bg-white rounded-[8px] p-[2px] shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-white flex flex-col gap-[2px]">
          {/* SECTION 1: Measurement & Billing Standards */}
          <div className="bg-[#F8F8F8] border border-white rounded-[8px] p-5 sm:p-6 space-y-5 shadow-xs">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                DEFAULT UNITS AND CURRENCY SYMBOLS
              </span>
              <h1 className="text-base font-bold text-gray-950 font-sans tracking-tight">
                Measurement &amp; Billing Standards
              </h1>
            </div>

            {/* Default Mesurement Unit */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-900 block">
                Default Mesurement Unit
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setUnit('cm')}
                  className={`px-6 py-2 rounded-full text-xs font-semibold transition-all ${
                    unit === 'cm'
                      ? 'bg-[#1d4ed8] text-white shadow-xs'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  Centimeteres (cm)
                </button>
                <button
                  type="button"
                  onClick={() => setUnit('in')}
                  className={`px-6 py-2 rounded-full text-xs font-semibold transition-all ${
                    unit === 'in'
                      ? 'bg-[#1d4ed8] text-white shadow-xs'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  Inches (“)
                </button>
              </div>
            </div>

            {/* Preferred Currency */}
            <div className="space-y-2 pt-1">
              <label className="text-xs font-bold text-gray-900 block">
                Preferred Currency
              </label>

              {/* 4 Cards in a single row matching Settings.png */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* 1. NGN (₦) */}
                <div
                  onClick={() => setSelectedCurrency('NGN (₦)')}
                  className={`py-3 px-4 rounded-[8px] border text-center cursor-pointer transition-all ${
                    selectedCurrency === 'NGN (₦)'
                      ? 'border-[#1d4ed8] bg-blue-50/50 shadow-xs'
                      : 'border-white bg-white hover:border-gray-200 shadow-xs'
                  }`}
                >
                  <span className="text-xs font-bold text-[#1d4ed8]">NGN (₦)</span>
                </div>

                {/* 2. US Dollar ($) */}
                <div
                  onClick={() => setSelectedCurrency('US Dollar ($)')}
                  className={`py-3 px-4 rounded-[8px] border text-center cursor-pointer transition-all ${
                    selectedCurrency === 'US Dollar ($)'
                      ? 'border-[#1d4ed8] bg-blue-50/50 shadow-xs'
                      : 'border-white bg-white hover:border-gray-200 shadow-xs'
                  }`}
                >
                  <span className="text-xs font-bold text-gray-800">US Dollar ($)</span>
                </div>

                {/* 3. Euro () */}
                <div
                  onClick={() => setSelectedCurrency('Euro ()')}
                  className={`py-3 px-4 rounded-[8px] border text-center cursor-pointer transition-all ${
                    selectedCurrency === 'Euro ()'
                      ? 'border-[#1d4ed8] bg-blue-50/50 shadow-xs'
                      : 'border-white bg-white hover:border-gray-200 shadow-xs'
                  }`}
                >
                  <span className="text-xs font-bold text-gray-800">Euro ()</span>
                </div>

                {/* 4. Pounds ( */}
                <div
                  onClick={() => setSelectedCurrency('Pounds (')}
                  className={`py-3 px-4 rounded-[8px] border text-center cursor-pointer transition-all ${
                    selectedCurrency === 'Pounds ('
                      ? 'border-[#1d4ed8] bg-blue-50/50 shadow-xs'
                      : 'border-white bg-white hover:border-gray-200 shadow-xs'
                  }`}
                >
                  <span className="text-xs font-bold text-gray-800">Pounds (</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: Garments Blueprints */}
          <div className="bg-[#F8F8F8] border border-white rounded-[8px] p-5 sm:p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  TAILORING TEMPLATES
                </span>
                <h2 className="text-base font-bold text-gray-950 font-sans tracking-tight">
                  Garments Blueprints
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setShowAddTemplateModal(true)}
                className="px-5 py-2 rounded-full bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Add Template
              </button>
            </div>

            {/* 2x2 Grid of Blueprint Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {blueprints.map((bp) => (
                <div
                  key={bp.id}
                  className="p-4 rounded-[8px] bg-white border border-white shadow-xs flex flex-col justify-between space-y-3"
                >
                  <div>
                    <h3 className="text-xs font-bold text-gray-950 mb-1">{bp.title}</h3>
                    <p className="text-[11px] text-gray-500 leading-snug">{bp.description}</p>
                  </div>

                  {/* Badges row */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {bp.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-0.5 rounded-full bg-[#F8F8F8] text-[10px] font-semibold text-gray-600 border border-gray-200/60"
                      >
                        {tag}
                      </span>
                    ))}
                    <span className="px-2 py-0.5 text-[10px] font-bold text-gray-500">
                      {bp.moreCount}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 3: Sizing/Measurements */}
          <div className="bg-[#F8F8F8] border border-white rounded-[8px] p-5 sm:p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Standard Tape Measurements
                </span>
                <h2 className="text-base font-bold text-gray-950 font-sans tracking-tight">
                  Sizing/Measurements
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setShowAddMeasurementModal(true)}
                className="px-5 py-2 rounded-full bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Add Measurement
              </button>
            </div>

            {/* 4x2 Grid of Sizing Cards matching Settings.png */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {sizingItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-[8px] bg-white border border-white shadow-xs text-center space-y-1"
                >
                  <h4 className="text-xs font-bold text-gray-950">{item.title}</h4>
                  <p className="text-[10px] text-gray-500">{item.category}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Template Modal */}
      {showAddTemplateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-950">Add Garment Blueprint</h3>
              <button
                type="button"
                onClick={() => setShowAddTemplateModal(false)}
                className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-900"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleCreateTemplate} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-bold text-gray-900 mb-1">
                  Template Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bespoke Safari Jacket"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-[#f4f5f7] text-xs text-gray-900 focus:outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-900 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Tailored outerwear with pleated bellow pockets..."
                  value={newTemplateDesc}
                  onChange={(e) => setNewTemplateDesc(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[#f4f5f7] text-xs text-gray-900 focus:outline-none focus:bg-white resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddTemplateModal(false)}
                  className="px-4 py-2 rounded-full text-xs text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#1d4ed8] text-white text-xs font-semibold"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Measurement Modal */}
      {showAddMeasurementModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-950">Add Measurement</h3>
              <button
                type="button"
                onClick={() => setShowAddMeasurementModal(false)}
                className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-900"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleCreateMeasurement} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-bold text-gray-900 mb-1">
                  Measurement Label
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bicep Circumference"
                  value={newMeasurementName}
                  onChange={(e) => setNewMeasurementName(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-[#f4f5f7] text-xs text-gray-900 focus:outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-900 mb-1">
                  Body Region
                </label>
                <select
                  value={newMeasurementCategory}
                  onChange={(e) => setNewMeasurementCategory(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-[#f4f5f7] text-xs text-gray-900 focus:outline-none focus:bg-white"
                >
                  <option value="Upper Body">Upper Body</option>
                  <option value="Lower Body">Lower Body</option>
                  <option value="Head/Neck">Head/Neck</option>
                  <option value="Arms">Arms</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddMeasurementModal(false)}
                  className="px-4 py-2 rounded-full text-xs text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#1d4ed8] text-white text-xs font-semibold"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
