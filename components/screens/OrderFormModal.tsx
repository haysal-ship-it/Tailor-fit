'use client';

import React, { useState, useRef } from 'react';
import { useStore } from '@/lib/store';
import { Order, ReferenceImage, OrderStatus } from '@/types';
import { PRESET_IMAGE_SWATCHES } from '@/lib/initial-data';
import { 
  X, 
  Upload, 
  Image as ImageIcon, 
  Trash2, 
  Plus, 
  Sparkles, 
  Calendar, 
  Clock, 
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { cn } from '@/lib/utils';

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
  const [price, setPrice] = useState<string>(existingOrder ? String(existingOrder.price) : '130000');
  const [status, setStatus] = useState<OrderStatus>(existingOrder?.status || 'In Progress');
  
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

  const [showPresetPicker, setShowPresetPicker] = useState(false);
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);
  const [imageNoteDraft, setImageNoteDraft] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const clientSnapshots = snapshots.filter((s) => s.clientId === clientId);

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

  const handleAddPreset = (preset: typeof PRESET_IMAGE_SWATCHES[0]) => {
    const newImg: ReferenceImage = {
      id: generateRefImageId('img-preset'),
      url: preset.url,
      title: preset.title,
      note: preset.note,
    };
    setReferenceImages((prev) => [...prev, newImg]);
    setShowPresetPicker(false);
  };

  const handleRemoveImage = (index: number) => {
    setReferenceImages((prev) => prev.filter((_, i) => i !== index));
    if (editingImageIndex === index) {
      setEditingImageIndex(null);
    }
  };

  const handleSaveImageNote = (index: number) => {
    setReferenceImages((prev) =>
      prev.map((img, i) => (i === index ? { ...img, note: imageNoteDraft } : img))
    );
    setEditingImageIndex(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) return;

    const orderData: Partial<Order> = {
      clientId,
      garmentType,
      measurementSnapshotId: measurementSnapshotId || undefined,
      price: parseFloat(price) || 0,
      status,
      pickupDateTime,
      notes,
      referenceImages,
    };

    if (existingOrder) {
      updateOrder(existingOrder.id, orderData);
    } else {
      addOrder(orderData as Omit<Order, 'id' | 'createdAt'>);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] p-6 shadow-2xl my-8 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
          <div>
            <h2 className="text-base font-semibold tracking-[-0.01em] text-[var(--text)]">
              {existingOrder ? 'Edit Garment Order' : 'Create New Garment Order'}
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Configure atelier specifications, fitting links, and fabric references
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text)] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-normal text-[var(--text-muted)] mb-1.5">
                Client Profile *
              </label>
              <select
                required
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] text-xs focus:outline-none focus:border-[var(--accent)]"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-normal text-[var(--text-muted)] mb-1.5">
                Garment Silhouette
              </label>
              <input
                type="text"
                required
                value={garmentType}
                onChange={(e) => setGarmentType(e.target.value)}
                placeholder="e.g. Bespoke African Gown"
                className="w-full h-10 px-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] text-xs focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
          </div>

          {/* Pricing, Status, Pickup Date/Time */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <Input
              label="Bespoke Price (₦)"
              leftAddon={<span className="font-mono text-xs">₦</span>}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />

            <div>
              <label className="block text-xs font-normal text-[var(--text-muted)] mb-1.5">
                Order Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as OrderStatus)}
                className="w-full h-10 px-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] text-xs focus:outline-none focus:border-[var(--accent)]"
              >
                <option value="In Progress">In Progress</option>
                <option value="Ready">Ready for Pickup</option>
                <option value="Picked Up">Picked Up (Completed)</option>
                <option value="Pending">Pending Approval</option>
              </select>
            </div>

            <Input
              label="Pickup Date & Time"
              type="datetime-local"
              required
              value={pickupDateTime}
              onChange={(e) => setPickupDateTime(e.target.value)}
            />
          </div>

          {/* Notes */}
          <Textarea
            label="Workroom Notes & Finishes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Hand-stitched Milanese buttonhole, horn buttons, silk canvas..."
          />

          {/* Footer Actions: Exactly ONE primary button */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--border)]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
            >
              {existingOrder ? 'Save Changes' : 'Create Order'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
