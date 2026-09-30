'use client';

import React, { useState, useRef } from 'react';
import { useStore } from '@/lib/store';
import { Order, ReferenceImage, OrderStatus } from '@/types';
import { PRESET_IMAGE_SWATCHES } from '@/lib/initial-data';
import { 
  X, 
  UploadCloud, 
  Image as ImageIcon, 
  Trash2, 
  Plus, 
  Sparkles, 
  Calendar, 
  Clock, 
  DollarSign, 
  Scissors, 
  FileText,
  Check
} from 'lucide-react';

interface OrderFormModalProps {
  orderId?: string | null;
  initialClientId?: string | null;
  onClose: () => void;
}

let imageIdCounter = 0;
function generateRefImageId(prefix: string) {
  imageIdCounter += 1;
  return `${prefix}-${imageIdCounter}`;
}

export function OrderFormModal({ orderId, initialClientId, onClose }: OrderFormModalProps) {
  const { 
    clients, 
    orders, 
    snapshots, 
    addOrder, 
    updateOrder, 
    openNewMeasurementForClient 
  } = useStore();

  const existingOrder = orderId ? orders.find((o) => o.id === orderId) : null;

  const [clientId, setClientId] = useState<string>(
    existingOrder?.clientId || initialClientId || (clients[0]?.id ?? '')
  );
  const [garmentType, setGarmentType] = useState<string>(existingOrder?.garmentType || 'Full 2-Piece Suit');
  const [measurementSnapshotId, setMeasurementSnapshotId] = useState<string>(
    existingOrder?.measurementSnapshotId || ''
  );
  const [price, setPrice] = useState<string>(existingOrder ? String(existingOrder.price) : '1200');
  const [status, setStatus] = useState<OrderStatus>(existingOrder?.status || 'In Progress');
  
  // Format pickup date and time for datetime-local input
  const defaultPickup = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    d.setHours(15, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  };

  const [pickupDateTime, setPickupDateTime] = useState<string>(
    existingOrder?.pickupDateTime ? existingOrder.pickupDateTime.slice(0, 16) : defaultPickup()
  );
  const [notes, setNotes] = useState<string>(existingOrder?.notes || '');
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>(
    existingOrder?.referenceImages || []
  );

  // New Image Note modal or state
  const [showPresetPicker, setShowPresetPicker] = useState(false);
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);
  const [imageNoteDraft, setImageNoteDraft] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Client snapshots available
  const clientSnapshots = snapshots.filter((s) => s.clientId === clientId);

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const newImg: ReferenceImage = {
            id: generateRefImageId('img-upload'),
            url: event.target.result as string,
            title: file.name.replace(/\.[^/.]+$/, ''),
            note: 'Client uploaded reference',
          };
          setReferenceImages((prev) => [...prev, newImg]);
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addPresetSwatch = (preset: typeof PRESET_IMAGE_SWATCHES[0]) => {
    const newImg: ReferenceImage = {
      id: generateRefImageId('img-preset'),
      url: preset.url,
      title: preset.title,
      note: preset.note,
    };
    setReferenceImages((prev) => [...prev, newImg]);
  };

  const removeImage = (id: string) => {
    setReferenceImages((prev) => prev.filter((img) => img.id !== id));
  };

  const updateImageNote = (index: number, note: string) => {
    setReferenceImages((prev) =>
      prev.map((img, i) => (i === index ? { ...img, note } : img))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      alert('Please select a client');
      return;
    }

    const parsedPrice = parseFloat(price) || 0;
    const isoPickup = new Date(pickupDateTime).toISOString();

    if (existingOrder) {
      updateOrder(existingOrder.id, {
        clientId,
        garmentType,
        measurementSnapshotId: measurementSnapshotId || undefined,
        referenceImages,
        price: parsedPrice,
        notes,
        status,
        pickupDateTime: isoPickup,
      });
    } else {
      addOrder({
        clientId,
        garmentType,
        measurementSnapshotId: measurementSnapshotId || undefined,
        referenceImages,
        price: parsedPrice,
        notes,
        status,
        pickupDateTime: isoPickup,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#000000]/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-2xl bg-[#fdfcfc] rounded-[24px] border border-[#ebe8e4] shadow-[0_12px_40px_rgba(0,0,0,0.12)] my-auto max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#ebe8e4] bg-[#fdfcfc]">
          <div>
            <h2 className="text-xl sm:text-2xl font-light tracking-tight text-[#000000]">
              {existingOrder ? 'Edit Garment Order' : 'New Bespoke Order'}
            </h2>
            <p className="text-[12px] text-[#777169] mt-0.5">
              Garment specifications, linked measurements, reference board & pickup date
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#a59f97] hover:text-[#000000] hover:bg-[#f5f3f1] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Row 1: Client & Garment Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-medium text-[#777169] mb-1.5">
                Client
              </label>
              <select
                value={clientId}
                onChange={(e) => {
                  setClientId(e.target.value);
                  // Reset snapshot if not matching
                  setMeasurementSnapshotId('');
                }}
                className="w-full h-10 px-3 rounded-[4px] border border-[#ebe8e4] bg-[#fdfcfc] text-[#000000] text-[14px] focus:outline-none focus:border-[#000000]"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#777169] mb-1.5">
                Garment Type
              </label>
              <select
                value={garmentType}
                onChange={(e) => setGarmentType(e.target.value)}
                className="w-full h-10 px-3 rounded-[4px] border border-[#ebe8e4] bg-[#fdfcfc] text-[#000000] text-[14px] focus:outline-none focus:border-[#000000]"
              >
                <option value="Full 2-Piece Suit">Full 2-Piece Suit</option>
                <option value="Gown / Dress">Gown / Dress</option>
                <option value="Shirt / Blouse">Shirt / Blouse</option>
                <option value="Trousers / Slacks">Trousers / Slacks</option>
                <option value="Dinner Jacket / Tuxedo">Dinner Jacket / Tuxedo</option>
                <option value="Overcoat / Trench">Overcoat / Trench</option>
                <option value="Bespoke Vest / Waistcoat">Bespoke Vest / Waistcoat</option>
                <option value="Custom Garment">Custom Garment</option>
              </select>
            </div>
          </div>

          {/* Row 2: Linked Measurement Snapshot */}
          <div className="bg-[#f5f3f1] rounded-[18px] p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[12px] font-medium text-[#44403b] flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5 text-[#777169]" />
                <span>Linked Body Measurement Snapshot</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openNewMeasurementForClient(clientId);
                }}
                className="text-[12px] font-medium text-[#0447ff] hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Take New Diagram</span>
              </button>
            </div>

            {clientSnapshots.length > 0 ? (
              <select
                value={measurementSnapshotId}
                onChange={(e) => setMeasurementSnapshotId(e.target.value)}
                className="w-full h-10 px-3 rounded-[4px] border border-[#ebe8e4] bg-[#fdfcfc] text-[#000000] text-[13px] focus:outline-none focus:border-[#000000]"
              >
                <option value="">— Select a saved snapshot —</option>
                {clientSnapshots.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.date} · {s.garmentType} ({Object.keys(s.measurements).length} points, {s.unit})
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-center py-3 bg-[#fdfcfc] rounded-[12px] border border-dashed border-[#ebe8e4]">
                <p className="text-[12px] text-[#777169]">
                  No measurement snapshots recorded for this client yet.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    openNewMeasurementForClient(clientId);
                  }}
                  className="mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#000000] text-white text-[11px] font-medium"
                >
                  <Scissors className="w-3 h-3" />
                  <span>Launch Body Diagram</span>
                </button>
              </div>
            )}
          </div>

          {/* Row 3: Reference Images (Inspiration, Fabric Swatches, Sketches) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-[13px] font-medium text-[#000000]">
                  Style Reference Images & Swatches
                </label>
                <p className="text-[11px] text-[#777169]">
                  Inspiration photos, fabric swatches, sketches & construction notes
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPresetPicker(!showPresetPicker)}
                  className="px-3 py-1 rounded-full border border-[#ebe8e4] bg-[#f5f3f1] text-[#44403b] text-[11px] font-medium hover:bg-[#ebe8e4] inline-flex items-center gap-1 transition-colors"
                >
                  <Sparkles className="w-3 h-3 text-[#0447ff]" />
                  <span>{showPresetPicker ? 'Hide Swatches' : 'Preset Swatches'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1 rounded-full bg-[#000000] text-white text-[11px] font-medium hover:bg-[#222222] inline-flex items-center gap-1 transition-colors"
                >
                  <UploadCloud className="w-3 h-3" />
                  <span>Upload</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Optional Preset Swatch Tray */}
            {showPresetPicker && (
              <div className="p-3 bg-[#f5f3f1] rounded-[16px] border border-[#ebe8e4] animate-in fade-in duration-150">
                <p className="text-[11px] text-[#777169] mb-2 font-medium">
                  Click to add atelier reference swatch:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PRESET_IMAGE_SWATCHES.map((swatch, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => addPresetSwatch(swatch)}
                      className="p-1.5 rounded-[12px] bg-[#fdfcfc] border border-[#ebe8e4] text-left hover:border-[#000000] transition-colors flex items-center gap-2 group"
                    >
                      <img
                        src={swatch.url}
                        alt={swatch.title}
                        className="w-9 h-9 rounded-[8px] object-cover shrink-0"
                      />
                      <div className="overflow-hidden">
                        <p className="text-[11px] font-medium text-[#000000] truncate group-hover:text-[#0447ff]">
                          {swatch.title}
                        </p>
                        <p className="text-[9px] text-[#a59f97] truncate">{swatch.note}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Gallery Grid of uploaded images */}
            {referenceImages.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {referenceImages.map((img, index) => (
                  <div
                    key={img.id || index}
                    className="p-2.5 rounded-[16px] bg-[#f5f3f1] border border-[#ebe8e4] flex items-start gap-3 relative group"
                  >
                    <img
                      src={img.url}
                      alt={img.title || 'Reference'}
                      className="w-16 h-16 rounded-[10px] object-cover shrink-0 bg-[#ebe8e4]"
                    />
                    <div className="flex-1 min-w-0 pr-6">
                      <p className="text-[12px] font-medium text-[#000000] truncate">
                        {img.title || 'Reference Image'}
                      </p>
                      <input
                        type="text"
                        placeholder="Add note (e.g. lapel width, lining color)..."
                        value={img.note || ''}
                        onChange={(e) => updateImageNote(index, e.target.value)}
                        className="w-full mt-1.5 px-2 py-1 text-[11px] rounded-[4px] border border-[#ebe8e4] bg-[#fdfcfc] text-[#000000] focus:outline-none focus:border-[#000000]"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImage(img.id)}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#fdfcfc] text-[#a59f97] hover:text-[#ff4704] flex items-center justify-center border border-[#ebe8e4] transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-6 rounded-[16px] border border-dashed border-[#ebe8e4] text-center cursor-pointer hover:bg-[#f5f3f1]/40 transition-colors"
              >
                <ImageIcon className="w-8 h-8 text-[#a59f97] mx-auto mb-2" />
                <p className="text-[13px] text-[#44403b] font-medium">
                  Drop style photos, fabric swatches, or sketches here
                </p>
                <p className="text-[11px] text-[#a59f97] mt-0.5">
                  or click to select from files · Presets available above
                </p>
              </div>
            )}
          </div>

          {/* Row 4: Pricing, Status, Pickup Date/Time */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[12px] font-medium text-[#777169] mb-1.5">
                Bespoke Price ($)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#777169] text-[13px] font-mono">
                  $
                </span>
                <input
                  type="number"
                  step="10"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full h-10 pl-7 pr-3 font-mono text-[14px] rounded-[4px] border border-[#ebe8e4] bg-[#fdfcfc] text-[#000000] focus:outline-none focus:border-[#000000]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#777169] mb-1.5">
                Order Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as OrderStatus)}
                className="w-full h-10 px-3 rounded-[4px] border border-[#ebe8e4] bg-[#fdfcfc] text-[#000000] text-[14px] focus:outline-none focus:border-[#000000]"
              >
                <option value="In Progress">In Progress</option>
                <option value="Ready">Ready for Pickup</option>
                <option value="Picked Up">Picked Up (Completed)</option>
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#777169] mb-1.5">
                Pickup Date & Time
              </label>
              <input
                type="datetime-local"
                required
                value={pickupDateTime}
                onChange={(e) => setPickupDateTime(e.target.value)}
                className="w-full h-10 px-3 rounded-[4px] border border-[#ebe8e4] bg-[#fdfcfc] text-[#000000] text-[13px] focus:outline-none focus:border-[#000000]"
              />
            </div>
          </div>

          {/* Row 5: Tailoring Notes */}
          <div>
            <label className="block text-[12px] font-medium text-[#777169] mb-1.5">
              Workroom Notes & Special Finishes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Hand-stitched Milanese buttonhole, horn buttons, silk canvas inner chest piece..."
              className="w-full p-3 rounded-[4px] border border-[#ebe8e4] bg-[#fdfcfc] text-[#000000] text-[13px] focus:outline-none focus:border-[#000000] resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#ebe8e4]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full border border-[#ebe8e4] text-[#44403b] text-[13px] font-medium hover:bg-[#f5f3f1] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-[#000000] text-white text-[13px] font-medium hover:bg-[#222222] transition-colors shadow-sm"
            >
              {existingOrder ? 'Save Changes' : 'Create Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
