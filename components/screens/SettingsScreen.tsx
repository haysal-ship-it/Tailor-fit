'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/lib/store';
import {
  Save,
  X,
  Trash2,
  Check,
  Info,
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { ToastContainer, ToastMessage } from '@/components/ui/Toasts';
import { cn } from '@/lib/utils';
import { springSnappy, springMorph, springSmooth } from '@/lib/motion-tokens';
import {
  ANATOMICAL_ZONES,
  normalizeZoneId,
  resolveCanonicalKey,
} from '@/lib/initial-data';
import { GarmentTemplate } from '@/types';
import { useTour } from '@/components/onboarding/TourProvider';
import { ContextualTip } from '@/components/onboarding/ContextualTip';
import { Play, HelpCircle } from 'lucide-react';

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
    if (c === '$' || c.includes('USD') || c.includes('$')) return 'US Dollar ($)';
    if (c === '€' || c.includes('EUR') || c.includes('€')) return 'Euro ()';
    if (c === '£' || c.includes('GBP') || c.includes('£')) return 'Pounds ()';
    return 'NGN (₦)';
  }, [settings?.currency]);

  // Form State for Unit & Currency
  const [unit, setUnit] = useState<'cm' | 'in'>(initialUnit);
  const [selectedCurrency, setSelectedCurrency] = useState<string>(initialCurrency);

  const {
    status: tourStatus,
    contextualTipsEnabled,
    setTipsEnabled,
  } = useTour();
  const [settingsTourNotice, setSettingsTourNotice] = useState(false);

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

  // Priority sorting for Sizing/Measurements to match Figma reference (top 8 landmarks)
  const PRIORITY_KEYS = [
    'shoulder_width',
    'neck_circumference',
    'bust_chest',
    'waist_circumference',
    'hip_circumference',
    'hip_height',
    'inseam_length',
    'inseam',
    'nape_to_waist',
    'back_width',
  ];

  const sortedHotspots = useMemo(() => {
    const items = [...allHotspots];
    items.sort((a, b) => {
      const idxA = PRIORITY_KEYS.indexOf(a.key);
      const idxB = PRIORITY_KEYS.indexOf(b.key);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.label.localeCompare(b.label);
    });
    return items;
  }, [allHotspots]);

  // Map anatomical zone to the 3 visual categories shown in the Figma screenshot: Upper Body, Head/Neck, Lower Body
  const getZoneDisplay = (category: string, label: string): string => {
    const lower = label.toLowerCase();
    if (lower.includes('neck') || category === 'head_neck') return 'Head/Neck';
    if (
      category === 'lower_limb' ||
      lower.includes('hip') ||
      lower.includes('inseam') ||
      lower.includes('outseam') ||
      lower.includes('thigh') ||
      lower.includes('knee') ||
      lower.includes('rise') ||
      lower.includes('ankle')
    ) {
      return 'Lower Body';
    }
    return 'Upper Body';
  };

  // Convert measurement key to concise tag chip label (e.g. neck, sleeves, bust, waist)
  const getShortTagLabel = (key: string): string => {
    const canonical = resolveCanonicalKey(key);
    if (canonical === 'neck_circumference' || canonical === 'neckline') return 'neck';
    if (canonical === 'sleeve_length') return 'sleeves';
    if (canonical === 'bust_chest') return 'bust';
    if (canonical === 'waist_circumference') return 'waist';
    if (canonical === 'shoulder_width' || canonical === 'shoulder_to_neck') return 'shoulders';
    if (canonical === 'hip_height' || canonical === 'hip_circumference') return 'hips';
    if (canonical === 'inseam') return 'inseam';
    return hotspotLabelByKey[canonical]?.toLowerCase() || key;
  };

  // Group all Sizing/Measurements by the 4 canonical anatomical zones for the template creator modal
  const hotspotsByZone = useMemo(() => {
    return ANATOMICAL_ZONES.map((zone) => ({
      ...zone,
      items: allHotspots.filter((h) => normalizeZoneId(h.category) === zone.id),
    }));
  }, [allHotspots]);

  // Expanded tag chips state per blueprint card
  const [expandedBlueprintTags, setExpandedBlueprintTags] = useState<Record<string, boolean>>({});

  // Compute whether unit or currency has changed
  const isDirty = unit !== initialUnit || selectedCurrency !== initialCurrency;

  // Save button morphing status
  const [saveStatus, setSaveStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  // Modals & Confirmation Dialogs
  const [showAddTemplateModal, setShowAddTemplateModal] = useState(false);
  const [showAddMeasurementModal, setShowAddMeasurementModal] = useState(false);

  // Add Template Modal Form State
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

  // Keyboard Escape listener to dismiss any open modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowAddTemplateModal(false);
        setShowAddMeasurementModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);


  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    };
  }, []);

  // Toggle "+N more" / "Show less"
  const toggleBlueprintTags = (id: string) => {
    setExpandedBlueprintTags((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Currency Options matching the Figma screenshot: NGN (₦), US Dollar ($), Euro (€), Pounds (£)
  const currencyOptions = [
    { label: 'NGN (₦)', symbol: '₦' },
    { label: 'US Dollar ($)', symbol: '$' },
    { label: 'Euro (€)', symbol: '€' },
    { label: 'Pounds (£)', symbol: '£' },
  ];

  // Save changes handler
  const handleSaveSettings = async () => {
    if (saveStatus === 'loading') return;

    setSaveStatus('loading');
    await new Promise((resolve) => setTimeout(resolve, 400));

    let sym = '₦';
    if (selectedCurrency.includes('$')) sym = '$';
    else if (selectedCurrency.includes('Euro') || selectedCurrency.includes('€')) sym = '€';
    else if (selectedCurrency.includes('Pound') || selectedCurrency.includes('£')) sym = '£';

    const saved=await updateSettings({
      defaultUnit: unit,
      currency: sym,
    });

    if(!saved){setSaveStatus('idle');return;}
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

  // Add Template submission
  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim()) {
      setTemplateFormError('Please enter a template name.');
      return;
    }
    if (selectedFieldKeys.length === 0) {
      setTemplateFormError('Select at least one sizing measurement from the catalog.');
      return;
    }

    const created: GarmentTemplate = {
      id: `bp-${Date.now()}`,
      name: newTemplateName.trim(),
      description: newTemplateDesc.trim() || 'Custom bespoke tailored garment template',
      fieldKeys: selectedFieldKeys,
    };

    if(!await addTemplate(created))return;

    setNewTemplateName('');
    setNewTemplateDesc('');
    setSelectedFieldKeys([]);
    setTemplateFormError('');
    setShowAddTemplateModal(false);
    addToast({
      type: 'velocity',
      message: `Template "${created.name}" saved.`,
    });
  };

  // Delete Template handler with Undo support
  const handleDeleteTemplate = async (tmpl: GarmentTemplate) => {
    if(!await deleteTemplate(tmpl.id))return;
    setDeletedTemplateUndo(tmpl);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(() => {
      setDeletedTemplateUndo(null);
    }, 5000);
  };

  const handleUndoDeleteTemplate = async () => {
    if (!deletedTemplateUndo) return;
    if(!await addTemplate(deletedTemplateUndo))return;
    setDeletedTemplateUndo(null);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
  };

  const blueprints = settings?.templates || [];

  return (
    <div className="w-full min-h-screen bg-[var(--page)] select-none text-[var(--text)] pb-[88px] lg:pb-12">
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Main Responsive Container: Flush with Navbar (1216px max-width, matching navbar padding) */}
      <div className="w-full max-w-[1216px] mx-auto pt-4 px-3 sm:px-4 xl:px-0">
        <div className="w-full bg-white p-[2px] rounded-[8px] flex flex-col gap-[2px] shadow-2xs overflow-hidden">
          {/* Top Settings Header */}
          <div className="w-full bg-white rounded-t-[6px] px-5 sm:px-6 py-5 border-b border-[#F0F0F0]">
            <h1 className="text-[20px] sm:text-[22px] font-bold text-black tracking-tight leading-tight">
              Settings
            </h1>
            <p className="text-[13px] sm:text-[14px] text-[var(--muted)] mt-1">
              Manage measurement defaults, currency standards, and garment templates.
            </p>
          </div>

          <div className="px-5 sm:px-6 pt-3 pb-1 bg-white">
            <ContextualTip id="settings-defaults" variant="inline" />
          </div>

          {/* ===============================================================
              SECTION 1: Measurement & Billing Standards
              =============================================================== */}
          <section
            id="settings-standards"
            className="w-full bg-[#F8F8F8] p-5 sm:p-6 flex flex-col border-b border-[#F0F0F0]"
          >
            <div className="mb-5">
              <h2 className="text-[16px] font-semibold text-black leading-tight">
                Measurement &amp; Billing Standards
              </h2>
            </div>

            {/* Control 1: Default Measurement Unit */}
            <div className="mb-6">
              <h3 className="text-[14px] font-medium text-black leading-none mb-3">
                Default Measurement Unit
              </h3>

              <div className="bg-[#F2F2F2] rounded-[24px] p-[4px_6px] inline-flex items-center gap-1 max-lg:w-full">
                <button
                  type="button"
                  onClick={() => setUnit('cm')}
                  className={cn(
                    'relative h-[40px] lg:w-[150px] max-lg:flex-1 rounded-[24px] text-[14px] font-medium transition-colors cursor-pointer flex items-center justify-center',
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
                    'relative h-[40px] lg:w-[130px] max-lg:flex-1 rounded-[24px] text-[14px] font-medium transition-colors cursor-pointer flex items-center justify-center',
                    unit === 'in'
                      ? 'bg-[var(--primary)] text-white shadow-xs'
                      : 'text-[var(--text-2)] hover:text-black'
                  )}
                >
                  Inches (&quot;)
                </button>
              </div>
            </div>

            {/* Control 2: Preferred Currency */}
            <div>
              <h3 className="text-[14px] font-medium text-black leading-none mb-3">
                Preferred Currency
              </h3>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {currencyOptions.map((curr) => {
                  const isSelected = selectedCurrency === curr.label;
                  return (
                    <button
                      key={curr.label}
                      type="button"
                      onClick={() => setSelectedCurrency(curr.label)}
                      className={cn(
                        'h-[50px] rounded-[8px] flex items-center justify-center text-[14px] font-medium transition-all cursor-pointer select-none',
                        isSelected
                          ? 'bg-[#F8F9FF] border border-[var(--primary)] text-[var(--primary)] shadow-2xs'
                          : 'bg-white text-[var(--text-2)] hover:text-black border border-transparent shadow-2xs'
                      )}
                    >
                      {curr.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ===============================================================
              SECTION 2: Garment Templates
              - 2-Column Responsive Grid
              - Add Template Action Pill Button
              =============================================================== */}
          <section
            id="settings-blueprints"
            className="w-full bg-[#F8F8F8] p-5 sm:p-6 flex flex-col border-b border-[#F0F0F0]"
          >
            <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 mb-5 min-w-0">
              <h2 className="text-[16px] font-semibold text-black leading-tight truncate">
                Garment templates
              </h2>

              <button
                type="button"
                onClick={() => {
                  setNewTemplateName('');
                  setNewTemplateDesc('');
                  setSelectedFieldKeys([]);
                  setTemplateFormError('');
                  setShowAddTemplateModal(true);
                }}
                className="h-9 px-4 rounded-[24px] bg-[#F2F2F2] border border-[#DDDBDB] text-black text-[13px] font-medium hover:bg-[#EAEAEA] transition-colors cursor-pointer shrink-0 flex items-center justify-center"
              >
                Add Template
              </button>
            </div>

            {blueprints.length === 0 ? (
              <div className="w-full bg-white rounded-[8px] p-8 text-center flex flex-col items-center justify-center gap-2">
                <p className="text-[14px] font-medium text-black">
                  No saved garment templates
                </p>
                <p className="text-[12px] text-[var(--muted)] max-w-md">
                  Create a garment template by choosing from your measurement library to quickly populate points on the mannequin.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 auto-rows-fr">
                {blueprints.map((blueprint) => {
                  const isExpanded = !!expandedBlueprintTags[blueprint.id];
                  const fields = blueprint.fieldKeys || [];
                  const visibleChips = isExpanded ? fields : fields.slice(0, 4);
                  const remainingCount = fields.length - 4;

                  return (
                    <div
                      key={blueprint.id}
                      className="bg-white rounded-[8px] p-4 sm:p-5 flex flex-col justify-between gap-3 shadow-2xs border border-transparent hover:border-[#EDEDED] transition-colors group relative"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 min-w-0 flex-1">
                          <h4 className="text-[15px] font-semibold text-black leading-tight truncate">
                            {blueprint.name}
                          </h4>
                          <p className="text-[12px] sm:text-[13px] text-[#737373] leading-snug line-clamp-2">
                            {blueprint.description}
                          </p>
                        </div>

                        {/* Delete Blueprint Button (subtle hover state) */}
                        <button
                          type="button"
                          onClick={() => handleDeleteTemplate(blueprint)}
                          title={`Delete ${blueprint.name} template`}
                          aria-label={`Delete ${blueprint.name} template`}
                          className="w-7 h-7 rounded-full bg-[#F8F8F8] hover:bg-[#FFF1F2] text-[var(--muted)] hover:text-[#E53E3E] flex items-center justify-center transition-all cursor-pointer shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Tag chips row formatted concisely matching the screenshot (e.g. neck, sleeves, bust, waist) */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {visibleChips.map((fieldKey, idx) => {
                          const tagLabel = getShortTagLabel(fieldKey);
                          return (
                            <span
                              key={`${fieldKey}-${idx}`}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-[24px] bg-[#F2F2F2] text-[12px] text-[#555] font-normal"
                            >
                              {tagLabel}
                            </span>
                          );
                        })}

                        {remainingCount > 0 && (
                          <button
                            type="button"
                            onClick={() => toggleBlueprintTags(blueprint.id)}
                            className="text-[12px] text-[#737373] hover:text-black font-medium cursor-pointer transition-colors ml-0.5"
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
              SECTION 3: Measurement Library
              - 4-Column Clean Uniform Grid directly matching Figma screenshot
              - Measurement Library Info Action
              =============================================================== */}
          <section
            id="section-sizing"
            className="w-full bg-[#F8F8F8] p-5 sm:p-6 flex flex-col border-b border-[#F0F0F0]"
          >
            <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 mb-5 min-w-0">
              <h2 className="text-[16px] font-semibold text-black leading-tight truncate">
                Measurement library
              </h2>

              <button
                type="button"
                onClick={() => setShowAddMeasurementModal(true)}
                className="h-9 px-4 rounded-[24px] bg-[#F2F2F2] border border-[#DDDBDB] text-black text-[13px] font-medium hover:bg-[#EAEAEA] transition-colors cursor-pointer shrink-0 flex items-center justify-center gap-1.5"
              >
                <Info className="w-3.5 h-3.5 text-[var(--text-2)]" />
                <span>21 standard measurements available</span>
              </button>
            </div>

            {/* 4-Column Responsive Grid matching the screenshot layout */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {sortedHotspots.map((item) => (
                <div
                  key={item.key}
                  className="bg-white rounded-[8px] min-h-[64px] p-3.5 flex flex-col items-center justify-center text-center gap-0.5 shadow-2xs border border-transparent hover:border-[#EDEDED] transition-colors"
                >
                  <span className="text-[13px] sm:text-[14px] font-semibold text-black leading-tight">
                    {item.label}
                  </span>
                  <span className="text-[11px] sm:text-[12px] text-[var(--muted)] leading-tight">
                    {getZoneDisplay(item.category, item.label)}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* ===============================================================
              SECTION 3: Studio Help & Product Tour
              =============================================================== */}
          <section
            id="settings-help"
            className="w-full bg-[#F8F8F8] p-5 sm:p-6 flex flex-col border-b border-[#F0F0F0]"
          >
            <div className="mb-4">
              <h2 className="text-[16px] font-semibold text-black leading-tight">
                Studio Help &amp; Product Tour
              </h2>
              <p className="text-[12px] text-[var(--text-2)] mt-0.5">
                Replay the orientation tour or adjust contextual assistance.
              </p>
            </div>

            {settingsTourNotice && (
              <div
                role="status"
                className="mb-4 p-3 rounded-[8px] bg-amber-50 border border-amber-200 text-amber-900 text-[12px] leading-snug flex items-center justify-between gap-2"
              >
                <span>
                  Return to Overview to take the tour. Your current work will stay where it is.
                </span>
                <button
                  type="button"
                  onClick={() => setSettingsTourNotice(false)}
                  className="text-[11px] font-semibold underline text-amber-950 cursor-pointer shrink-0"
                >
                  Dismiss
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card 1: Replay Tour */}
              <div className="bg-white rounded-[8px] p-4 flex flex-col justify-between border border-[#EDEDED] shadow-2xs">
                <div>
                  <div className="w-8 h-8 rounded-full bg-[var(--chip)] text-[var(--primary)] flex items-center justify-center mb-2.5">
                    <Play className="w-4 h-4 ml-0.5" />
                  </div>
                  <h3 className="text-[14px] font-semibold text-black leading-tight mb-1">
                    {tourStatus === 'interrupted' ? 'Resume Product Tour' : 'Take Product Tour'}
                  </h3>
                  <p className="text-[12px] text-[var(--text-2)] leading-relaxed">
                    Walk through the 5-step guide showing how client details, mannequin measurements, and orders stay connected.
                  </p>
                </div>
                <div className="pt-3 mt-2 border-t border-[#EDEDED]">
                  <button
                    type="button"
                    onClick={() => setSettingsTourNotice(true)}
                    className="h-8 px-4 rounded-full bg-[var(--primary)] text-white text-[12px] font-medium hover:opacity-95 transition-opacity cursor-pointer"
                  >
                    {tourStatus === 'interrupted' ? 'Resume Tour' : 'Replay Tour'}
                  </button>
                </div>
              </div>

              {/* Card 2: Contextual Tips Preference */}
              <div className="bg-white rounded-[8px] p-4 flex flex-col justify-between border border-[#EDEDED] shadow-2xs">
                <div>
                  <div className="w-8 h-8 rounded-full bg-[var(--chip)] text-[var(--primary)] flex items-center justify-center mb-2.5">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <h3 className="text-[14px] font-semibold text-black leading-tight mb-1">
                    Contextual Tips
                  </h3>
                  <p className="text-[12px] text-[var(--text-2)] leading-relaxed">
                    Show subtle hints when you encounter garment templates, mannequin rotation, units, or fitting reuse.
                  </p>
                </div>
                <div className="pt-3 mt-2 border-t border-[#EDEDED] flex items-center justify-between">
                  <span className="text-[12px] font-medium text-black">
                    Enable tips
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={contextualTipsEnabled}
                      onChange={(e) => setTipsEnabled(e.target.checked)}
                      className="sr-only peer"
                      aria-label="Enable contextual tips"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--primary)]" />
                  </label>
                </div>
              </div>
            </div>
          </section>

          {/* ===============================================================
              BOTTOM SAVE STRIP
              - Rectangular 8px Rounded Button matching Figma Screenshot
              - Floppy Disk Icon + "Save Changes"
              =============================================================== */}
          <div className="w-full bg-white rounded-b-[8px] min-h-[56px] px-5 sm:px-6 py-4 flex items-center justify-end border-t border-[#F0F0F0]">
            <motion.button
              type="button"
              onClick={handleSaveSettings}
              whileTap={{ scale: 0.98 }}
              transition={springSnappy}
              className={cn(
                'inline-flex items-center justify-center gap-2 h-10 px-5 rounded-[8px] font-medium text-[14px] text-white transition-all shadow-xs cursor-pointer select-none',
                saveStatus === 'success'
                  ? 'bg-[var(--completed)]'
                  : 'bg-[var(--primary)] hover:bg-[var(--primary)]/90',
                saveStatus === 'loading' && 'opacity-80 cursor-wait'
              )}
            >
              {saveStatus === 'loading' ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : saveStatus === 'success' ? (
                <>
                  <Check className="w-4 h-4 shrink-0" />
                  <span>Saved</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 shrink-0" />
                  <span>Save Changes</span>
                </>
              )}
            </motion.button>
          </div>
        </div>
      </div>

      {/* =====================================================================
          ADD TEMPLATE MODAL (Accessible Dialog with Escape & Focus)
          ===================================================================== */}
      <AnimatePresence>
        {showAddTemplateModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-template-title"
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[4px] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={springSnappy}
              className="w-full max-w-[540px] max-h-[90dvh] rounded-[16px] bg-white border border-[var(--border)] p-6 shadow-2xl flex flex-col gap-4 overflow-hidden"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[var(--hairline)] shrink-0">
                <div>
                  <h3 id="add-template-title" className="text-[16px] font-bold text-black">
                    Add Garment Template
                  </h3>
                  <p className="text-[12px] text-[var(--text-2)] mt-0.5">
                    Select the sizing measurements required for this garment template
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddTemplateModal(false)}
                  aria-label="Close dialog"
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
                  label="Template name *"
                  required
                  placeholder="e.g. Traditional Agbada"
                  value={newTemplateName}
                  onChange={(e) => {
                    setTemplateFormError('');
                    setNewTemplateName(e.target.value);
                  }}
                  autoFocus
                />
                <Textarea
                  label="Description"
                  rows={2}
                  placeholder="Description of garment specifications..."
                  value={newTemplateDesc}
                  onChange={(e) => setNewTemplateDesc(e.target.value)}
                />

                {/* Sizing Measurement Selector Grouped by the 4 Anatomical Zones */}
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

                  <div className="flex flex-col gap-3 max-h-[260px] overflow-y-auto rounded-[12px] bg-[#F8F8F8] p-3 border border-[#EDEDED]">
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
                  <p className="text-[12px] text-[#E53E3E] font-medium">
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
                    Create template
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =====================================================================
          ADD MEASUREMENT INFO MODAL (A15 Clarification)
          ===================================================================== */}
      <AnimatePresence>
        {showAddMeasurementModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-measurement-title"
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[4px] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={springSnappy}
              className="w-full max-w-[460px] rounded-[16px] bg-white border border-[var(--border)] p-6 shadow-2xl flex flex-col gap-4 select-none"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#F0F5FF] flex items-center justify-center text-[var(--primary)] shrink-0">
                    <Info className="w-5 h-5 stroke-[2]" />
                  </div>
                  <div>
                    <h3 id="add-measurement-title" className="text-[16px] font-bold text-black">
                      Anatomical Sizing Catalog
                    </h3>
                    <p className="text-[12px] text-[var(--muted)]">
                      Standard tailoring measurement system
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddMeasurementModal(false)}
                  aria-label="Close dialog"
                  className="w-8 h-8 rounded-full bg-[#F2F2F2] flex items-center justify-center text-[var(--muted)] hover:text-black cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-[13px] text-[var(--text-2)] leading-relaxed space-y-2">
                <p>
                  All <strong>21 standard anatomical landmarks</strong> across Head/Neck, Upper Body, and Lower Body are currently active in your atelier.
                </p>
                <p>
                  To group specific measurements for bespoke outfits (e.g. Traditional Agbada or Corset Gowns), use the <strong>Add Template</strong> button under <em>Garment templates</em>.
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddMeasurementModal(false)}
                  className="h-9 px-5 rounded-[24px] bg-[var(--primary)] text-white text-[13px] font-medium hover:bg-[var(--primary)]/90 cursor-pointer shadow-xs"
                >
                  Got it
                </button>
              </div>
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
