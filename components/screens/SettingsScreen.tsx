'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useStore } from '@/lib/store';
import { 
  Building2, 
  Ruler, 
  Sliders, 
  Plus, 
  Check, 
  X, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MorphingSaveButton } from '@/components/ui/MorphingSaveButton';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { ToastContainer, ToastMessage } from '@/components/ui/Toasts';
import { SmallFloatingDock } from '@/components/ui/SmallFloatingDock';
import { springGentle } from '@/lib/motion-tokens';
import { cn } from '@/lib/utils';

export function SettingsScreen() {
  const { settings, updateSettings } = useStore();
  const shouldReduceMotion = useReducedMotion();

  const [mobileTab, setMobileTab] = useState<'studio' | 'blueprints' | 'sizing'>('studio');
  const [selectedCurrency, setSelectedCurrency] = useState('NGN (₦)');
  const [unit, setUnit] = useState<'cm' | 'in'>('cm');

  // Studio form fields
  const [studioName, setStudioName] = useState('Atelier Kunle Bespoke');
  const [leadTailor, setLeadTailor] = useState('Adriana Kunle');
  const [studioPhone, setStudioPhone] = useState('+234 803 929 1100');
  const [studioEmail, setStudioEmail] = useState('concierge@kunleatelier.com');

  // Blueprints with accordion tags
  const [expandedBlueprintTags, setExpandedBlueprintTags] = useState<Record<string, boolean>>({});

  const [blueprints, setBlueprints] = useState([
    {
      id: 'bp-1',
      title: 'Bespoke African Gown',
      description: 'Traditional couture gown, bridal styles corset-backed silhouettes and flared hems',
      tags: ['neck', 'sleeves', 'bust', 'waist'],
      extraTags: ['hip', 'thigh', 'ankle'],
    },
    {
      id: 'bp-2',
      title: 'Shirt / Blouse',
      description: 'Essential measurements for bespoke dress shirts, casual button downs and tailored blouses',
      tags: ['neck', 'sleeves', 'bust', 'waist'],
      extraTags: ['cuff', 'collar', 'shoulder', 'back'],
    },
    {
      id: 'bp-3',
      title: 'Trousers',
      description: 'Fittings for tailored pants, pleated trousers and custom chinos/pants',
      tags: ['waist', 'hip', 'thigh', 'ankle'],
      extraTags: ['inseam', 'outseam', 'rise'],
    },
    {
      id: 'bp-4',
      title: '2-Piece Suit',
      description: 'Jacket and matching trousers tailored specifications for formal couture',
      tags: ['neck', 'chest', 'waist', 'sleeve'],
      extraTags: ['lapel', 'jacket_length', 'pant_waist'],
    },
  ]);

  // Sizing items
  const [sizingItems, setSizingItems] = useState([
    { id: 'sz-1', title: 'Shoulder width', category: 'Upper Body' },
    { id: 'sz-2', title: 'Neck Circumference', category: 'Head / Neck' },
    { id: 'sz-3', title: 'Bust / Chest', category: 'Upper Body' },
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

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
  };
  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const toggleBlueprintTags = (id: string) => {
    setExpandedBlueprintTags((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSaveSettings = async () => {
    addToast({
      type: 'velocity',
      message: 'Studio settings and blueprints saved.',
    });
  };

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
        extraTags: ['sleeves', 'shoulder'],
      },
    ]);
    setNewTemplateName('');
    setNewTemplateDesc('');
    setShowAddTemplateModal(false);
    addToast({
      type: 'velocity',
      message: `Blueprint "${newTemplateName}" created.`,
    });
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
    addToast({
      type: 'velocity',
      message: `Standard landmark "${newMeasurementName}" added.`,
    });
  };

  const currencyOptions = [
    { id: 'NGN', label: 'NGN (₦)', code: 'Nigerian Naira' },
    { id: 'USD', label: 'USD ($)', code: 'US Dollar' },
    { id: 'EUR', label: 'EUR (€)', code: 'Euro' },
    { id: 'GBP', label: 'GBP (£)', code: 'British Pound' },
  ];

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 py-3 space-y-4 pb-28 md:pb-6">
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
        
        {/* =====================================================================
            LEFT COLUMN: Settings Nav (Desktop & Tablet)
            ===================================================================== */}
        <div className="hidden md:block md:col-span-4 xl:col-span-3 rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] p-4 sm:p-5 space-y-3 transition-colors hover:border-[var(--border-strong)]">
          <h2 className="text-base font-semibold tracking-[-0.01em] text-[var(--text)] pb-2 border-b border-[var(--border)]">
            Settings
          </h2>

          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setMobileTab('studio')}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left cursor-pointer',
                mobileTab === 'studio'
                  ? 'bg-[var(--surface-2)] text-[var(--text)] font-semibold border border-[var(--border)]'
                  : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
              )}
            >
              <Building2 className="w-4 h-4 shrink-0" />
              <span>Studio &amp; Currency</span>
            </button>

            <button
              type="button"
              onClick={() => setMobileTab('blueprints')}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left cursor-pointer',
                mobileTab === 'blueprints'
                  ? 'bg-[var(--surface-2)] text-[var(--text)] font-semibold border border-[var(--border)]'
                  : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
              )}
            >
              <Sliders className="w-4 h-4 shrink-0" />
              <span>Garments Blueprints</span>
            </button>

            <button
              type="button"
              onClick={() => setMobileTab('sizing')}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left cursor-pointer',
                mobileTab === 'sizing'
                  ? 'bg-[var(--surface-2)] text-[var(--text)] font-semibold border border-[var(--border)]'
                  : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
              )}
            >
              <Ruler className="w-4 h-4 shrink-0" />
              <span>Measurement Standards</span>
            </button>
          </div>
        </div>

        {/* =====================================================================
            RIGHT COLUMN: Configuration Sections
            ===================================================================== */}
        <div className="md:col-span-8 xl:col-span-9 space-y-4">
          
          {/* Studio Profile & Currency Section */}
          <div
            className={cn(
              'rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] p-4 sm:p-6 space-y-4 transition-colors hover:border-[var(--border-strong)]',
              mobileTab !== 'studio' ? 'hidden md:block' : 'block'
            )}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div>
                <span className="text-[11px] font-medium text-[var(--text-muted)] tracking-wider uppercase block">
                  ATELIER CONFIGURATION
                </span>
                <h2 className="text-base font-semibold tracking-[-0.01em] text-[var(--text)]">
                  Studio Profile &amp; Preferences
                </h2>
              </div>

              {/* EXACTLY ONE PRIMARY COMMIT BUTTON: Save Changes */}
              <MorphingSaveButton
                idleText="Save Changes"
                onClick={handleSaveSettings}
              />
            </div>

            <div className="space-y-3">
              <div className="border-b border-[var(--border)] pb-1">
                <h3 className="text-sm font-medium text-[var(--text)]">Studio Details</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Atelier Name"
                  value={studioName}
                  onChange={(e) => setStudioName(e.target.value)}
                />
                <Input
                  label="Lead Master Tailor"
                  value={leadTailor}
                  onChange={(e) => setLeadTailor(e.target.value)}
                />
                <Input
                  label="Studio Phone"
                  value={studioPhone}
                  onChange={(e) => setStudioPhone(e.target.value)}
                />
                <Input
                  label="Studio Email"
                  type="email"
                  value={studioEmail}
                  onChange={(e) => setStudioEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Currency Option Cards with --accent border & check */}
            <div className="space-y-3 pt-2">
              <div className="border-b border-[var(--border)] pb-1">
                <h3 className="text-sm font-medium text-[var(--text)]">Preferred Currency</h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {currencyOptions.map((curr) => {
                  const isSelected = selectedCurrency === curr.label;
                  return (
                    <button
                      key={curr.id}
                      type="button"
                      onClick={() => setSelectedCurrency(curr.label)}
                      className={cn(
                        'p-3 rounded-2xl border text-left transition-colors cursor-pointer relative',
                        isSelected
                          ? 'border-[var(--accent)] bg-[var(--surface-2)] shadow-xs'
                          : 'border-[var(--border)] bg-[var(--surface-1)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-2)]'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-semibold text-[var(--text)]">
                          {curr.label}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[var(--accent)]" />}
                      </div>
                      <p className="text-[10px] text-[var(--text-muted)] mt-1">{curr.code}</p>
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs font-normal text-[var(--text-muted)]">
                  Measurement Unit Standard
                </span>
                <SegmentedControl
                  name="unit-standard-toggle"
                  size="sm"
                  value={unit}
                  onChange={(u) => setUnit(u as 'cm' | 'in')}
                  options={[
                    { value: 'cm', label: 'Centimeters (CM)' },
                    { value: 'in', label: 'Inches (IN)' },
                  ]}
                />
              </div>
            </div>
          </div>

          {/* Garments Blueprints Section */}
          <div
            className={cn(
              'rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] p-4 sm:p-6 space-y-4 transition-colors hover:border-[var(--border-strong)]',
              mobileTab !== 'blueprints' ? 'hidden md:block' : 'block'
            )}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div>
                <span className="text-[11px] font-medium text-[var(--text-muted)] tracking-wider uppercase block">
                  TAILORING TEMPLATES
                </span>
                <h2 className="text-base font-semibold tracking-[-0.01em] text-[var(--text)]">
                  Garments Blueprints
                </h2>
              </div>

              {/* OUTLINE PILL: Add Template */}
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => setShowAddTemplateModal(true)}
              >
                Add Template
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {blueprints.map((bp) => {
                const isExpanded = Boolean(expandedBlueprintTags[bp.id]);
                return (
                  <div
                    key={bp.id}
                    className="p-4 rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] flex flex-col justify-between space-y-3 transition-colors hover:border-[var(--border-strong)]"
                  >
                    <div>
                      <h3 className="text-xs font-semibold text-[var(--text)] tracking-[-0.01em] mb-1">
                        {bp.title}
                      </h3>
                      <p className="text-[11px] text-[var(--text-muted)] leading-snug">
                        {bp.description}
                      </p>
                    </div>

                    {/* Tag chips as pills on --surface-2 at 12px with smooth accordion */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {bp.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2.5 py-0.5 rounded-full bg-[var(--surface-2)] text-[11px] font-medium text-[var(--text-muted)] border border-[var(--border)]"
                          >
                            {tag}
                          </span>
                        ))}

                        <button
                          type="button"
                          onClick={() => toggleBlueprintTags(bp.id)}
                          className="px-2 py-0.5 rounded-full text-[11px] font-medium text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer inline-flex items-center gap-0.5"
                        >
                          <span>{isExpanded ? 'less' : `+${bp.extraTags.length} more`}</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={shouldReduceMotion ? { duration: 0.05 } : springGentle}
                            className="overflow-hidden flex flex-wrap gap-1.5 pt-1"
                          >
                            {bp.extraTags.map((tag) => (
                              <span
                                key={tag}
                                className="px-2.5 py-0.5 rounded-full bg-[var(--surface-2)] text-[11px] font-medium text-[var(--text-muted)] border border-[var(--border)]"
                              >
                                {tag}
                              </span>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Measurement Standards Section */}
          <div
            className={cn(
              'rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] p-4 sm:p-6 space-y-4 transition-colors hover:border-[var(--border-strong)]',
              mobileTab !== 'sizing' ? 'hidden md:block' : 'block'
            )}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div>
                <span className="text-[11px] font-medium text-[var(--text-muted)] tracking-wider uppercase block">
                  ANATOMICAL LANDMARKS
                </span>
                <h2 className="text-base font-semibold tracking-[-0.01em] text-[var(--text)]">
                  Measurement Standards
                </h2>
              </div>

              {/* OUTLINE PILL: Add Measurement */}
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => setShowAddMeasurementModal(true)}
              >
                Add Measurement
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {sizingItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] flex items-center justify-between transition-colors hover:border-[var(--border-strong)]"
                >
                  <div>
                    <h4 className="text-xs font-semibold text-[var(--text)] tracking-[-0.01em]">
                      {item.title}
                    </h4>
                    <p className="text-[10px] text-[var(--text-muted)]">{item.category}</p>
                  </div>
                  <Check className="w-3.5 h-3.5 text-[var(--status-success)]" />
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Floating Dock on Mobile */}
      <SmallFloatingDock
        activeTab={mobileTab}
        onChange={setMobileTab}
        tabs={[
          { id: 'studio', label: 'Studio', icon: <Building2 className="w-4 h-4" /> },
          { id: 'blueprints', label: 'Templates', icon: <Sliders className="w-4 h-4" /> },
          { id: 'sizing', label: 'Sizing', icon: <Ruler className="w-4 h-4" /> },
        ]}
      />

      {/* Add Blueprint Modal */}
      <AnimatePresence>
        {showAddTemplateModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
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
              className="w-full max-w-md rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                <h3 className="text-sm font-semibold tracking-[-0.01em] text-[var(--text)]">
                  Add Garment Blueprint
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddTemplateModal(false)}
                  className="w-7 h-7 rounded-full bg-[var(--surface-2)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <form onSubmit={handleCreateTemplate} className="space-y-3.5 pt-1">
                <Input
                  label="Blueprint Title"
                  required
                  placeholder="e.g. Bespoke Safari Jacket"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                />
                <Textarea
                  label="Description"
                  rows={2}
                  placeholder="Outerwear specifications and fitting landmarks..."
                  value={newTemplateDesc}
                  onChange={(e) => setNewTemplateDesc(e.target.value)}
                />

                <div className="pt-2 flex justify-end gap-2 border-t border-[var(--border)]">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddTemplateModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm">
                    Create Blueprint
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Measurement Modal */}
      <AnimatePresence>
        {showAddMeasurementModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
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
              className="w-full max-w-md rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                <h3 className="text-sm font-semibold tracking-[-0.01em] text-[var(--text)]">
                  Add Measurement Standard
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddMeasurementModal(false)}
                  className="w-7 h-7 rounded-full bg-[var(--surface-2)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <form onSubmit={handleCreateMeasurement} className="space-y-3.5 pt-1">
                <Input
                  label="Measurement Label"
                  required
                  placeholder="e.g. Bicep Circumference"
                  value={newMeasurementName}
                  onChange={(e) => setNewMeasurementName(e.target.value)}
                />

                <div className="space-y-1.5">
                  <label className="block text-xs font-normal text-[var(--text-muted)]">
                    Anatomical Zone
                  </label>
                  <select
                    value={newMeasurementCategory}
                    onChange={(e) => setNewMeasurementCategory(e.target.value)}
                    className="w-full rounded-xl h-10 px-3.5 bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
                  >
                    <option value="Upper Body">Upper Body</option>
                    <option value="Lower Body">Lower Body</option>
                    <option value="Head / Neck">Head / Neck</option>
                    <option value="Full Length">Full Length</option>
                  </select>
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-[var(--border)]">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddMeasurementModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm">
                    Add Landmark
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
