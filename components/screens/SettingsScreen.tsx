'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/lib/store';
import { Save, X, Trash2, Check } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { ToastContainer, ToastMessage } from '@/components/ui/Toasts';
import { cn } from '@/lib/utils';
import { springSnappy, springMorph, springSmooth } from '@/lib/motion-tokens';
import {
  ANATOMICAL_ZONES,
  getZoneLabel,
  normalizeZoneId,
  resolveCanonicalKey,
} from '@/lib/initial-data';
import { GarmentTemplate } from '@/types';

export function SettingsScreen() {
  const {
    settings,
    allHotspots,
    updateSettings,
    addTemplate,
    deleteTemplate,
  } = useStore();

  // Initial values from store
  const initialUnit = settings?.defaultUnit || 'cm';
  const initialCurrency = useMemo(() => {
    const c = settings?.currency || '₦';
    if (c === '₦' || c.includes('NGN') || c.includes('₦')) return 'NGN (₦)';
    if (c === '$' || c.includes('USD') || c.includes('$')) return 'US Dollar ($)';
    if (c === '€' || c.includes('EUR') || c.includes('€')) return 'Euro (€)';
    if (c === '£' || c.includes('GBP') || c.includes('£')) return 'Pound (£)';
    return 'NGN (₦)';
  }, [settings?.currency]);

  // Form State for Unit & Currency
  const [unit, setUnit] = useState<'cm' | 'in'>(initialUnit);
  const [selectedCurrency, setSelectedCurrency] = useState<string>(initialCurrency);

  useEffect(() => {
    setUnit(initialUnit);
  }, [initialUnit]);

  useEffect(() => {
    setSelectedCurrency(initialCurrency);
  }, [initialCurrency]);

  // Map canonical key -> human-readable label
  const hotspotLabelByKey = useMemo(() => {
    const map: Record<string, string> = {};
    allHotspots.forEach((h) => {
      map[h.key] = h.label;
    });
    return map;
  }, [allHotspots]);

  // Group all Sizing/Measurements by the 4 canonical anatomical zones
  const hotspotsByZone = useMemo(() => {
    return ANATOMICAL_ZONES.map((zone) => ({
      ...zone,
      items: allHotspots.filter((h) => normalizeZoneId(h.category) === zone.id),
    }));
  }, [allHotspots]);

  // Zone filter in Sizing/Measurements section
  const [activeZoneFilter, setActiveZoneFilter] = useState<
    'all' | 'head_neck' | 'torso' | 'upper_limb' | 'lower_limb'
  >('all');

  const filteredSizingItems = useMemo(() => {
    if (activeZoneFilter === 'all') return allHotspots;
    return allHotspots.filter((h) => normalizeZoneId(h.category) === activeZoneFilter);
  }, [allHotspots, activeZoneFilter]);

  // Expanded tag chips state per blueprint card
  const [expandedBlueprintTags, setExpandedBlueprintTags] = useState<Record<string, boolean>>({});

  // Active section tracking for left navigation
  const [activeNav, setActiveNav] = useState<'standards' | 'blueprints' | 'sizing'>('standards');

  // Compute whether unit or currency has changed
  const isDirty = unit !== initialUnit || selectedCurrency !== initialCurrency;

  // Save button morphing status
  const [saveStatus, setSaveStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  // Add Template Modal State (Requirement B: select from Sizing/Measurements catalog, never free-text)
  const [showAddTemplateModal, setShowAddTemplateModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');
  const [selectedFieldKeys, setSelectedFieldKeys] = useState<string[]>([]);
  const [templateFormError, setTemplateFormError] = useState('');

  // Undo Toast for Deleted Blueprint Template
  const [deletedTemplateUndo, setDeletedTemplateUndo] = useState<GarmentTemplate | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
  };
  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    };
  }, []);

  // Scroll observer to update activeNav on scroll
  useEffect(() => {
    const handleScroll = () => {
      const standardsEl = document.getElementById('section-standards');
      const blueprintsEl = document.getElementById('section-blueprints');
      const sizingEl = document.getElementById('section-sizing');

      const scrollPos = window.scrollY + 180;

      if (sizingEl && scrollPos >= sizingEl.offsetTop) {
        setActiveNav('sizing');
      } else if (blueprintsEl && scrollPos >= blueprintsEl.offsetTop) {
        setActiveNav('blueprints');
      } else if (standardsEl) {
        setActiveNav('standards');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: 'standards' | 'blueprints' | 'sizing') => {
    setActiveNav(sectionId);
    const el = document.getElementById(`section-${sectionId}`);
    if (el) {
      const offset = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: offset, behavior: 'smooth' });
    }
  };

  // Toggle "+N more" / "Show less"
  const toggleBlueprintTags = (id: string) => {
    setExpandedBlueprintTags((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Currency Options
  const currencyOptions = ['NGN (₦)', 'US Dollar ($)', 'Euro (€)', 'Pound (£)'];

  // Save changes handler
  const handleSaveSettings = async () => {
    if (!isDirty || saveStatus === 'loading') return;

    setSaveStatus('loading');

    await new Promise((resolve) => setTimeout(resolve, 450));

    let sym = '₦';
    if (selectedCurrency.includes('$')) sym = '$';
    else if (selectedCurrency.includes('€')) sym = '€';
    else if (selectedCurrency.includes('£')) sym = '£';

    updateSettings({
      defaultUnit: unit,
      currency: sym,
    });

    setSaveStatus('success');
    addToast({
      type: 'velocity',
      message: 'Settings saved',
    });

    setTimeout(() => {
      setSaveStatus('idle');
    }, 1500);
  };

  // Toggle a single measurement field key in the New Template modal
  const toggleTemplateFieldKey = (key: string) => {
    setTemplateFormError('');
    setSelectedFieldKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // Toggle all measurement keys in a zone
  const toggleZoneKeys = (zoneKeys: string[]) => {
    setTemplateFormError('');
    const allSelected = zoneKeys.every((k) => selectedFieldKeys.includes(k));
    if (allSelected) {
      setSelectedFieldKeys((prev) => prev.filter((k) => !zoneKeys.includes(k)));
    } else {
      setSelectedFieldKeys((prev) => Array.from(new Set([...prev, ...zoneKeys])));
    }
  };

  // Add Template submission (Requirement B)
  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim()) {
      setTemplateFormError('Please enter a blueprint title.');
      return;
    }
    if (selectedFieldKeys.length === 0) {
      setTemplateFormError('Select at least one sizing measurement from the catalog.');
      return;
    }

    const created: GarmentTemplate = {
      id: `bp-${Date.now()}`,
      name: newTemplateName.trim(),
      description: newTemplateDesc.trim() || 'Custom bespoke tailored garment blueprint',
      fieldKeys: selectedFieldKeys,
    };

    addTemplate(created);

    setNewTemplateName('');
    setNewTemplateDesc('');
    setSelectedFieldKeys([]);
    setTemplateFormError('');
    setShowAddTemplateModal(false);
    addToast({
      type: 'velocity',
      message: `Blueprint "${created.name}" saved.`,
    });
  };

  // Delete Template handler with Undo support (Requirement B)
  const handleDeleteTemplate = (tmpl: GarmentTemplate) => {
    deleteTemplate(tmpl.id);
    setDeletedTemplateUndo(tmpl);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(() => {
      setDeletedTemplateUndo(null);
    }, 5000);
  };

  const handleUndoDeleteTemplate = () => {
    if (!deletedTemplateUndo) return;
    addTemplate(deletedTemplateUndo);
    setDeletedTemplateUndo(null);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
  };

  const blueprints = settings?.templates || [];

  const navItems = [
    { id: 'standards' as const, label: 'Measurement & Billing Standards' },
    { id: 'blueprints' as const, label: 'Garment Blueprints' },
    { id: 'sizing' as const, label: 'Sizing/Measurements' },
  ];

  return (
    <div className="w-full min-h-screen bg-[var(--page)] select-none text-[var(--text)] pb-[88px] lg:pb-12">
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Main Responsive Container: 1280px design width, fluid */}
      <div className="w-full max-w-[1216px] mx-auto px-2 sm:px-4 lg:px-0 pt-4">
        {/* ===================================================================
            MOBILE NAVIGATION ROW (below 1024px)
            Horizontally scrollable row of pill buttons, 44px tall, scroll-snap
            =================================================================== */}
        <div className="lg:hidden w-full overflow-x-auto pb-3 mb-2 flex items-center gap-2 snap-x scrollbar-none">
          {navItems.map((item) => {
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollToSection(item.id)}
                className={cn(
                  'snap-start shrink-0 h-[44px] px-4 rounded-full text-[14px] font-medium transition-colors cursor-pointer flex items-center justify-center whitespace-nowrap',
                  isActive
                    ? 'bg-[#F8F9FF] text-[var(--primary)] border border-[var(--primary)] font-semibold'
                    : 'bg-[#F2F2F2] text-[var(--muted)] hover:text-black'
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* ===================================================================
            DESKTOP & RESPONSIVE LAYOUT
            =================================================================== */}
        <div className="w-full flex flex-col lg:flex-row items-start gap-[25px]">
          {/* =================================================================
              1. LEFT NAVIGATION COLUMN (295px wide, Desktop)
              ================================================================= */}
          <aside className="hidden lg:block w-[295px] shrink-0 bg-white p-[2px] rounded-[8px] sticky top-20">
            <div className="w-full bg-[#F8F8F8] rounded-[6px] p-3 flex flex-col gap-3">
              <h2 className="text-[16px] font-bold text-black leading-none">
                Settings
              </h2>

              <nav className="flex flex-col gap-0" aria-label="Settings Sections">
                {navItems.map((item) => {
                  const isActive = activeNav === item.id;
                  return (
                    <div
                      key={item.id}
                      className="bg-white p-[3px] rounded-[8px]"
                    >
                      <button
                        type="button"
                        onClick={() => scrollToSection(item.id)}
                        className={cn(
                          'w-full h-[43px] rounded-[6px] px-3 text-[14px] font-medium text-left transition-colors cursor-pointer flex items-center justify-between',
                          isActive
                            ? 'bg-[#F8F9FF] text-[var(--primary)]'
                            : 'bg-[#F2F2F2] text-[var(--muted)] hover:text-black'
                        )}
                      >
                        <span className="truncate">{item.label}</span>
                      </button>
                    </div>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* =================================================================
              2. MAIN PANEL (Remaining width, ~892px)
              ================================================================= */}
          <main className="w-full lg:w-[892px] lg:flex-1 bg-white p-[2px] rounded-[8px] flex flex-col gap-[2px] min-w-0">
            {/* ===============================================================
                SECTION 1: Measurement & Billing Standards
                =============================================================== */}
            <section
              id="section-standards"
              className="w-full bg-[#F8F8F8] rounded-[6px] p-4 lg:p-6 flex flex-col"
            >
              <div className="mb-6">
                <span className="text-[11px] font-normal tracking-[0.3px] uppercase text-[var(--muted)] block mb-1">
                  DEFAULT UNITS AND CURRENCY SYMBOLS
                </span>
                <h2 className="text-[16px] font-medium text-black leading-tight">
                  Measurement &amp; Billing Standards
                </h2>
                <div className="w-full h-px bg-[var(--hairline)] mt-3" />
              </div>

              {/* Control 1: Default Measurement Unit */}
              <div className="mb-6">
                <h3 className="text-[14px] font-semibold text-black leading-none mb-3">
                  Default Measurement Unit
                </h3>

                <div className="bg-[#F2F2F2] rounded-[24px] p-[4px_6px] inline-flex items-center gap-1 max-lg:w-full">
                  <button
                    type="button"
                    onClick={() => setUnit('cm')}
                    className={cn(
                      'relative h-[43px] lg:w-[139px] max-lg:flex-1 rounded-[24px] text-[14px] font-medium transition-colors cursor-pointer flex items-center justify-center',
                      unit === 'cm'
                        ? 'bg-[var(--primary)] text-white shadow-xs'
                        : 'text-[var(--text-2)] hover:text-black'
                    )}
                  >
                    Centimeters (cm)
                  </button>

                  <button
                    type="button"
                    onClick={() => setUnit('in')}
                    className={cn(
                      'relative h-[43px] lg:w-[139px] max-lg:flex-1 rounded-[24px] text-[14px] font-medium transition-colors cursor-pointer flex items-center justify-center',
                      unit === 'in'
                        ? 'bg-[var(--primary)] text-white shadow-xs'
                        : 'text-[var(--text-2)] hover:text-black'
                    )}
                  >
                    Inches (in)
                  </button>
                </div>
              </div>

              {/* Control 2: Preferred Currency */}
              <div>
                <h3 className="text-[14px] font-semibold text-black leading-none mb-3">
                  Preferred Currency
                </h3>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {currencyOptions.map((curr) => {
                    const isSelected = selectedCurrency === curr;
                    return (
                      <button
                        key={curr}
                        type="button"
                        onClick={() => setSelectedCurrency(curr)}
                        className={cn(
                          'h-[51px] rounded-[8px] flex items-center justify-center text-[14px] font-medium transition-colors cursor-pointer select-none',
                          isSelected
                            ? 'bg-[#F8F9FF] border border-[var(--primary)] text-[var(--primary)]'
                            : 'bg-white text-[var(--text-2)] hover:text-black'
                        )}
                      >
                        {curr}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* ===============================================================
                SECTION 2: Garment Blueprints (Requirement B)
                - Selectable from Sizing/Measurements catalog
                - Delete saved templates with Undo toast
                =============================================================== */}
            <section
              id="section-blueprints"
              className="w-full bg-[#F8F8F8] rounded-[6px] p-4 lg:p-6 flex flex-col"
            >
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3 mb-6">
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-normal tracking-[0.3px] uppercase text-[var(--muted)] block mb-1">
                    TAILORING TEMPLATES
                  </span>
                  <h2 className="text-[16px] font-medium text-black leading-tight">
                    Garment Blueprints
                  </h2>
                  <div className="w-full h-px bg-[var(--hairline)] mt-3" />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setNewTemplateName('');
                    setNewTemplateDesc('');
                    setSelectedFieldKeys([]);
                    setTemplateFormError('');
                    setShowAddTemplateModal(true);
                  }}
                  className="h-9 max-lg:h-[44px] max-lg:w-full px-4 rounded-[24px] bg-[#F2F2F2] border border-[#DDDBDB] text-[var(--text-2)] text-[14px] font-medium hover:bg-[#EAEAEA] transition-colors cursor-pointer shrink-0 flex items-center justify-center"
                >
                  Add Template
                </button>
              </div>

              {blueprints.length === 0 ? (
                <div className="w-full bg-white rounded-[8px] p-8 text-center flex flex-col items-center justify-center gap-2">
                  <p className="text-[14px] font-medium text-black">
                    No saved garment blueprints
                  </p>
                  <p className="text-[12px] text-[var(--muted)] max-w-md">
                    Create a blueprint template by choosing from your standard sizing measurements to quickly populate points on the mannequin.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 auto-rows-fr">
                  {blueprints.map((blueprint) => {
                    const isExpanded = !!expandedBlueprintTags[blueprint.id];
                    const fields = blueprint.fieldKeys || [];
                    const visibleChips = isExpanded ? fields : fields.slice(0, 4);
                    const remainingCount = fields.length - 4;

                    return (
                      <div
                        key={blueprint.id}
                        className="bg-white rounded-[8px] p-4 flex flex-col justify-between gap-3 border border-transparent hover:border-[#EDEDED] transition-colors group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="text-[14px] font-semibold text-black leading-tight truncate">
                                {blueprint.name}
                              </h4>
                              <span className="px-2 py-0.5 rounded-full bg-[#F2F2F2] text-[10px] font-medium text-[var(--text-2)] shrink-0">
                                {fields.length} {fields.length === 1 ? 'point' : 'points'}
                              </span>
                            </div>
                            <p className="text-[12px] text-[var(--text-2)] leading-snug line-clamp-2">
                              {blueprint.description}
                            </p>
                          </div>

                          {/* Delete Saved Template Button (Requirement B) */}
                          <button
                            type="button"
                            onClick={() => handleDeleteTemplate(blueprint)}
                            title={`Delete ${blueprint.name} template`}
                            aria-label={`Delete ${blueprint.name} template`}
                            className="w-7 h-7 rounded-full bg-[#F8F8F8] hover:bg-[#FFF1F2] text-[var(--muted)] hover:text-[var(--paused)] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Tag chips row resolved to canonical measurement names */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {visibleChips.map((fieldKey, idx) => {
                            const canonical = resolveCanonicalKey(fieldKey);
                            const label = hotspotLabelByKey[canonical] || fieldKey;
                            return (
                              <span
                                key={`${canonical}-${idx}`}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-[24px] bg-[#F2F2F2] text-[12px] text-[var(--text-2)] font-normal"
                              >
                                {label}
                              </span>
                            );
                          })}

                          {remainingCount > 0 && (
                            <button
                              type="button"
                              onClick={() => toggleBlueprintTags(blueprint.id)}
                              className="text-[12px] text-[var(--primary)] hover:underline font-medium cursor-pointer transition-colors ml-0.5"
                            >
                              {isExpanded ? 'Show less' : `+${remainingCount} more`}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* ===============================================================
                SECTION 3: Sizing/Measurements (Requirement A)
                4 Anatomical Zones & 21 Canonical Sizing Items:
                1. Head/Neck (4)
                2. Torso (6)
                3. Upper Limb (5)
                4. Lower limb (6)
                =============================================================== */}
            <section
              id="section-sizing"
              className="w-full bg-[#F8F8F8] rounded-[6px] p-4 lg:p-6 flex flex-col"
            >
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3 mb-4">
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-normal tracking-[0.3px] uppercase text-[var(--muted)] block mb-1">
                    ANATOMICAL ZONE CATALOG ({allHotspots.length} STANDARD LANDMARKS)
                  </span>
                  <h2 className="text-[16px] font-medium text-black leading-tight">
                    Sizing/Measurements
                  </h2>
                  <div className="w-full h-px bg-[var(--hairline)] mt-3" />
                </div>
              </div>

              {/* Anatomical Zone Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5 mb-5">
                <button
                  type="button"
                  onClick={() => setActiveZoneFilter('all')}
                  className={cn(
                    'h-8 px-3.5 rounded-full text-[12px] font-medium transition-colors cursor-pointer',
                    activeZoneFilter === 'all'
                      ? 'bg-[var(--primary)] text-white shadow-2xs'
                      : 'bg-white text-[var(--text-2)] hover:text-black border border-[#EDEDED]'
                  )}
                >
                  All Zones ({allHotspots.length})
                </button>
                {hotspotsByZone.map((z) => {
                  const isActive = activeZoneFilter === z.id;
                  return (
                    <button
                      key={z.id}
                      type="button"
                      onClick={() => setActiveZoneFilter(z.id)}
                      className={cn(
                        'h-8 px-3.5 rounded-full text-[12px] font-medium transition-colors cursor-pointer',
                        isActive
                          ? 'bg-[var(--primary)] text-white shadow-2xs'
                          : 'bg-white text-[var(--text-2)] hover:text-black border border-[#EDEDED]'
                      )}
                    >
                      {z.label} ({z.items.length})
                    </button>
                  );
                })}
              </div>

              {/* Grouped by Anatomical Zone when 'all' is selected, or filtered grid */}
              {activeZoneFilter === 'all' ? (
                <div className="flex flex-col gap-5">
                  {hotspotsByZone.map((zone, zIdx) => (
                    <div key={zone.id} className="flex flex-col gap-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-semibold text-black">
                          {zIdx + 1}. {zone.label}
                        </span>
                        <span className="text-[11px] font-medium text-[var(--muted)]">
                          {zone.items.length} measurements
                        </span>
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                        {zone.items.map((item) => (
                          <div
                            key={item.key}
                            className="bg-white rounded-[8px] min-h-[63px] p-3 flex flex-col items-center justify-center text-center gap-0.5 border border-transparent hover:border-[#EDEDED] transition-colors"
                          >
                            <span className="text-[14px] font-medium text-black leading-tight">
                              {item.label}
                            </span>
                            <span className="text-[12px] text-[var(--text-2)] leading-tight">
                              {zone.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-2 gap-y-3">
                  {filteredSizingItems.map((item) => (
                    <div
                      key={item.key}
                      className="bg-white rounded-[8px] min-h-[63px] p-3 flex flex-col items-center justify-center text-center gap-0.5"
                    >
                      <span className="text-[14px] font-medium text-black leading-tight">
                        {item.label}
                      </span>
                      <span className="text-[12px] text-[var(--text-2)] leading-tight">
                        {getZoneLabel(item.category)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ===============================================================
                BOTTOM SAVE STRIP
                =============================================================== */}
            <div className="w-full bg-white rounded-[6px] min-h-[51px] px-4 py-2 flex items-center justify-end max-lg:py-3">
              <motion.button
                type="button"
                disabled={!isDirty || saveStatus === 'loading'}
                onClick={handleSaveSettings}
                whileTap={!isDirty || saveStatus === 'loading' ? undefined : { scale: 0.97 }}
                transition={springSnappy}
                className={cn(
                  'relative inline-flex items-center justify-center rounded-[24px] font-medium text-[14px] select-none overflow-hidden transition-all',
                  'h-9 px-6 max-lg:h-[48px] max-lg:w-full',
                  saveStatus === 'success'
                    ? 'bg-[var(--completed)] text-white'
                    : 'bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90',
                  (!isDirty || saveStatus === 'loading') &&
                    'opacity-30 cursor-not-allowed pointer-events-none'
                )}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {saveStatus === 'idle' && (
                    <motion.span
                      key="idle"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={springMorph}
                      className="inline-flex items-center gap-2 text-[14px] font-medium"
                    >
                      <Save className="w-4 h-4 shrink-0" />
                      <span>Save Changes</span>
                    </motion.span>
                  )}

                  {saveStatus === 'loading' && (
                    <motion.span
                      key="loading"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={springMorph}
                      className="inline-flex items-center gap-2 text-[14px] font-medium"
                    >
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </motion.span>
                  )}

                  {saveStatus === 'success' && (
                    <motion.span
                      key="success"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={springMorph}
                      className="inline-flex items-center gap-1.5 text-[14px] font-medium text-white"
                    >
                      <span>Saved</span>
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </main>
        </div>
      </div>

      {/* =====================================================================
          ADD TEMPLATE MODAL (Requirement B: Choose from Sizing/Measurements list)
          ===================================================================== */}
      <AnimatePresence>
        {showAddTemplateModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[4px] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={springSnappy}
              className="w-full max-w-[540px] max-h-[90dvh] rounded-[16px] bg-white border border-[var(--border)] p-6 shadow-2xl flex flex-col gap-4 overflow-hidden"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[var(--hairline)] shrink-0">
                <div>
                  <h3 className="text-[16px] font-bold text-black">
                    Add Blueprint Template
                  </h3>
                  <p className="text-[12px] text-[var(--text-2)] mt-0.5">
                    Select the sizing measurements required for this garment template
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddTemplateModal(false)}
                  className="w-8 h-8 rounded-full bg-[#F2F2F2] flex items-center justify-center text-[var(--muted)] hover:text-black cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form
                onSubmit={handleCreateTemplate}
                className="flex flex-col gap-4 overflow-y-auto pr-1"
              >
                <Input
                  label="Blueprint Title *"
                  required
                  placeholder="e.g. Traditional Agbada"
                  value={newTemplateName}
                  onChange={(e) => {
                    setTemplateFormError('');
                    setNewTemplateName(e.target.value);
                  }}
                />
                <Textarea
                  label="Description"
                  rows={2}
                  placeholder="Description of garment specifications..."
                  value={newTemplateDesc}
                  onChange={(e) => setNewTemplateDesc(e.target.value)}
                />

                {/* Interactive Sizing Measurement Selector Grouped by the 4 Anatomical Zones */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[12px] font-semibold text-black">
                      Choose Sizing Measurements ({selectedFieldKeys.length} selected)
                    </label>
                    {selectedFieldKeys.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedFieldKeys([])}
                        className="text-[11px] font-medium text-[var(--muted)] hover:text-black cursor-pointer"
                      >
                        Clear all
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 max-h-[280px] overflow-y-auto rounded-[12px] bg-[#F8F8F8] p-3 border border-[#EDEDED]">
                    {hotspotsByZone.map((zone) => {
                      const zoneKeys = zone.items.map((i) => i.key);
                      const allZoneSelected =
                        zoneKeys.length > 0 &&
                        zoneKeys.every((k) => selectedFieldKeys.includes(k));

                      return (
                        <div key={zone.id} className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-[0.3px] text-[var(--text-2)]">
                              {zone.label}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleZoneKeys(zoneKeys)}
                              className="text-[11px] font-medium text-[var(--primary)] hover:underline cursor-pointer"
                            >
                              {allZoneSelected ? 'Deselect zone' : 'Select all'}
                            </button>
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {zone.items.map((item) => {
                              const isSelected = selectedFieldKeys.includes(item.key);
                              return (
                                <button
                                  key={item.key}
                                  type="button"
                                  onClick={() => toggleTemplateFieldKey(item.key)}
                                  className={cn(
                                    'px-2.5 py-1.5 rounded-[20px] text-[12px] font-medium transition-all flex items-center gap-1.5 cursor-pointer border',
                                    isSelected
                                      ? 'bg-[var(--selected-bg)] border-[var(--selected)] text-[var(--primary)]'
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
                      );
                    })}
                  </div>
                </div>

                {templateFormError && (
                  <p className="text-[12px] text-[var(--paused)] font-medium">
                    {templateFormError}
                  </p>
                )}

                <div className="pt-3 flex justify-end gap-2 border-t border-[var(--hairline)] shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowAddTemplateModal(false)}
                    className="h-9 px-4 rounded-[24px] bg-[#F2F2F2] border border-[#DDDBDB] text-[var(--text-2)] text-[14px] font-medium hover:bg-[#EAEAEA] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="h-9 px-5 rounded-[24px] bg-[var(--primary)] text-white text-[14px] font-medium hover:bg-[var(--primary)]/90 cursor-pointer shadow-xs"
                  >
                    Create Blueprint
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Undo Toast when a Blueprint Template is deleted */}
      <AnimatePresence>
        {deletedTemplateUndo && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={springSmooth}
            className="fixed bottom-6 right-6 z-50 bg-white rounded-[16px] px-4 py-3 shadow-xl border border-[var(--outline)] flex items-center gap-3 select-none"
          >
            <span className="text-[12px] font-medium text-[var(--text-strong)]">
              Deleted template &ldquo;{deletedTemplateUndo.name}&rdquo;
            </span>
            <button
              type="button"
              onClick={handleUndoDeleteTemplate}
              className="text-[12px] font-bold text-[var(--primary)] hover:underline cursor-pointer"
            >
              Undo
            </button>
            <button
              type="button"
              onClick={() => setDeletedTemplateUndo(null)}
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
