'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { 
  ArrowLeft, 
  Phone, 
  Mail, 
  Calendar, 
  Scissors, 
  Plus, 
  ShoppingBag, 
  Image as ImageIcon, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  ExternalLink,
  Trash2,
  Edit2,
  Upload,
  Check,
  X
} from 'lucide-react';
import { MeasurementSnapshot, Order, ReferenceImage, OrderStatus } from '@/types';

interface ClientProfileScreenProps {
  onNewOrder: (clientId: string) => void;
  onNewMeasurement: (clientId: string) => void;
  onEditOrder: (orderId: string) => void;
}

export function ClientProfileScreen({
  onNewOrder,
  onNewMeasurement,
  onEditOrder,
}: ClientProfileScreenProps) {
  const {
    clients,
    selectedClientId,
    setActiveScreen,
    getClientById,
    getClientOrders,
    getClientSnapshots,
    updateClient,
    deleteSnapshot,
    setSelectedSnapshotId,
    updateOrderStatus,
    settings,
    setSelectedClientId,
  } = useStore();

  const client = selectedClientId ? getClientById(selectedClientId) : null;
  const orders = selectedClientId ? getClientOrders(selectedClientId) : [];
  const snapshots = selectedClientId ? getClientSnapshots(selectedClientId) : [];
  const currency = settings.currency || '₦';

  const [expandedSnapshotId, setExpandedSnapshotId] = useState<string | null>(
    snapshots[0]?.id || null
  );
  const [selectedGalleryImage, setSelectedGalleryImage] = useState<ReferenceImage | null>(null);

  // Editable client notes
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState(client?.notes || '');

  if (!client) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 py-12 text-center">
        <p className="text-gray-500">No client selected.</p>
        <button
          onClick={() => setActiveScreen('clients')}
          className="mt-4 px-6 py-2.5 rounded-full bg-[#1d4ed8] text-white text-xs font-semibold shadow-xs"
        >
          Return to Clients Directory
        </button>
      </div>
    );
  }

  // Aggregate all reference images across client's orders
  const aggregatedImages: ReferenceImage[] = orders.flatMap((o) => o.referenceImages || []);

  const saveNotes = () => {
    updateClient(client.id, { notes: notesDraft });
    setIsEditingNotes(false);
  };

  const initials = client.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const getStatusDotColor = (status: OrderStatus) => {
    switch (status) {
      case 'Completed':
      case 'Ready':
        return 'bg-[#10b981]';
      case 'Paused':
        return 'bg-[#ef4444]';
      case 'Pending':
      case 'In Progress':
      default:
        return 'bg-[#f59e0b]';
    }
  };

  const totalSpend = orders.reduce((sum, o) => sum + (o.price || 0), 0);

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 py-4 space-y-6">
      {/* Top Breadcrumb Header */}
      <div className="bg-white rounded-3xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-gray-100/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={() => setActiveScreen('clients')}
            className="w-10 h-10 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-colors shadow-xs"
            title="Back to Clients"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-[#e5e7eb] text-gray-800 font-bold text-sm flex items-center justify-center border border-gray-200/60 shrink-0">
              {initials}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-950 font-sans">
                {client.name}
              </h1>
              <p className="text-xs text-gray-400">
                Atelier Client #{client.id.slice(-4)} • Registered {new Date(client.createdAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setSelectedClientId(client.id);
              setActiveScreen('overview');
            }}
            className="px-5 py-2.5 rounded-full bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-xs font-semibold shadow-xs flex items-center gap-2 transition-colors"
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>Measure on 3D Mannequin</span>
          </button>

          <button
            type="button"
            onClick={() => onNewOrder(client.id)}
            className="px-4 py-2.5 rounded-full border border-gray-200 text-gray-800 text-xs font-semibold hover:bg-gray-50 transition-colors shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Commission</span>
          </button>
        </div>
      </div>

      {/* 2-Column Dossier Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* =========================================================================
            LEFT COLUMN: Client Info & Style Book (4 Columns)
            ========================================================================= */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card 1: Contact & Dossier Details */}
          <div className="bg-white rounded-3xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-gray-100/90 space-y-5">
            <h3 className="text-base font-bold text-gray-950 font-sans pb-3 border-b border-gray-100">
              Client Dossier
            </h3>

            <div className="space-y-3.5 text-xs text-gray-700">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#f7f8fa] border border-gray-100">
                <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="font-semibold text-gray-900">{client.phone}</span>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#f7f8fa] border border-gray-100">
                <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="font-semibold text-gray-900 truncate">{client.email}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#f7f8fa] border border-gray-100">
                <span className="text-gray-500">Cumulative Spend</span>
                <span className="font-bold text-gray-900 text-sm">
                  {currency}{totalSpend.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Bespoke Notes */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-gray-500">
                  Bespoke Fitting Notes
                </label>
                {!isEditingNotes ? (
                  <button
                    type="button"
                    onClick={() => {
                      setNotesDraft(client.notes || '');
                      setIsEditingNotes(true);
                    }}
                    className="text-[11px] font-semibold text-[#1d4ed8] hover:underline flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingNotes(false)}
                      className="text-[11px] text-gray-400 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={saveNotes}
                      className="text-[11px] font-semibold text-[#1d4ed8] hover:underline flex items-center gap-0.5"
                    >
                      <Check className="w-3 h-3" />
                      <span>Save</span>
                    </button>
                  </div>
                )}
              </div>

              {isEditingNotes ? (
                <textarea
                  rows={3}
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-[#f7f8fa] border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-[#1d4ed8] focus:bg-white resize-none"
                />
              ) : (
                <p className="text-xs text-gray-600 bg-[#f7f8fa] p-3.5 rounded-2xl border border-gray-100 italic leading-relaxed">
                  {client.notes || 'No custom fit notes recorded yet.'}
                </p>
              )}
            </div>
          </div>

          {/* Card 2: Style Book & Swatch References */}
          <div className="bg-white rounded-3xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-gray-100/90 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-950 font-sans">
                Style Book
              </h3>
              <span className="text-xs font-semibold text-gray-400">
                {aggregatedImages.length} Image{aggregatedImages.length === 1 ? '' : 's'}
              </span>
            </div>

            {aggregatedImages.length > 0 ? (
              <div className="grid grid-cols-2 gap-2.5">
                {aggregatedImages.map((img) => (
                  <div
                    key={img.id}
                    onClick={() => setSelectedGalleryImage(img)}
                    className="aspect-square rounded-2xl overflow-hidden border border-gray-100 relative group cursor-pointer shadow-2xs"
                  >
                    <img
                      src={img.url}
                      alt={img.title || 'Style reference'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2 text-center">
                      <span className="text-white text-[10px] font-semibold line-clamp-2">
                        {img.title || 'View Reference'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-400 text-xs">
                <ImageIcon className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                <span>No reference photos uploaded for this client yet.</span>
              </div>
            )}
          </div>
        </div>

        {/* =========================================================================
            RIGHT COLUMN: Measurement Snapshots & Orders History (8 Columns)
            ========================================================================= */}
        <div className="lg:col-span-8 space-y-6">
          {/* Snapshots History Card */}
          <div className="bg-white rounded-3xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-gray-100/90 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-950 font-sans">
                  Body Measurement History
                </h3>
                <p className="text-xs text-gray-400">
                  Past fitting visits are preserved without overwriting
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedClientId(client.id);
                  setActiveScreen('overview');
                }}
                className="px-4 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Snapshot</span>
              </button>
            </div>

            {snapshots.length > 0 ? (
              <div className="space-y-3">
                {snapshots.map((snap) => {
                  const isExpanded = expandedSnapshotId === snap.id;
                  const keys = Object.keys(snap.measurements);

                  return (
                    <div
                      key={snap.id}
                      className="rounded-2xl border border-gray-100 bg-[#f7f8fa] p-4 transition-all"
                    >
                      <div
                        onClick={() => setExpandedSnapshotId(isExpanded ? null : snap.id)}
                        className="flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#1d4ed8]/10 text-[#1d4ed8] flex items-center justify-center font-bold text-xs">
                            {snap.unit.toUpperCase()}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-gray-900">
                              {snap.garmentType}
                            </h4>
                            <p className="text-[11px] text-gray-400">
                              Fitting on {snap.date} • {keys.length} landmarks recorded
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-xs font-semibold text-[#1d4ed8]">
                            {isExpanded ? 'Collapse' : 'Inspect'}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </div>

                      {/* Expanded Measurements Grid */}
                      {isExpanded && (
                        <div className="mt-4 pt-3 border-t border-gray-200/60 animate-in fade-in">
                          {snap.notes && (
                            <p className="text-xs text-gray-600 mb-3 italic">
                              Fitting Note: {snap.notes}
                            </p>
                          )}

                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                            {Object.entries(snap.measurements).map(([k, v]) => (
                              <div
                                key={k}
                                className="bg-white rounded-xl p-2.5 border border-gray-100 text-center shadow-2xs"
                              >
                                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold truncate">
                                  {k.replace(/_/g, ' ')}
                                </p>
                                <p className="text-sm font-bold text-gray-950 font-serif mt-0.5">
                                  {v} <span className="text-[11px] font-normal text-gray-400 font-sans">{snap.unit}</span>
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-400 text-xs">
                <Scissors className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                <span>No measurement records taken yet for {client.name}.</span>
              </div>
            )}
          </div>

          {/* Garment Orders History Card */}
          <div className="bg-white rounded-3xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-gray-100/90 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-950 font-sans">
                  Commission History
                </h3>
                <p className="text-xs text-gray-400">
                  {orders.length} custom commission{orders.length === 1 ? '' : 's'} on record
                </p>
              </div>

              <button
                type="button"
                onClick={() => onNewOrder(client.id)}
                className="px-4 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Order</span>
              </button>
            </div>

            {orders.length > 0 ? (
              <div className="space-y-3">
                {orders.map((ord) => {
                  const pickupDate = ord.pickupDateTime ? ord.pickupDateTime.slice(0, 10) : 'TBD';

                  return (
                    <div
                      key={ord.id}
                      onClick={() => onEditOrder(ord.id)}
                      className="flex items-center justify-between p-4 rounded-2xl bg-[#f7f8fa] hover:bg-gray-100/80 border border-gray-100 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-[#e5e7eb] text-gray-800 font-bold text-xs flex items-center justify-center shrink-0 border border-gray-200/60 group-hover:bg-[#1d4ed8] group-hover:text-white transition-colors">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-gray-900 truncate">
                            {ord.garmentType}
                          </h4>
                          <p className="text-[11px] text-gray-400">
                            Due {pickupDate} {ord.notes ? `• ${ord.notes}` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="flex items-center gap-1.5 justify-end">
                          <span className={`w-2 h-2 rounded-full ${getStatusDotColor(ord.status)}`} />
                          <span className="text-[11px] font-semibold text-gray-700">
                            {ord.status}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-gray-900 mt-0.5">
                          {currency}{ord.price?.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-400 text-xs">
                <ShoppingBag className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                <span>No garment orders created yet.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox Modal for Gallery Images */}
      {selectedGalleryImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedGalleryImage(null)}
        >
          <div 
            className="max-w-lg w-full bg-white rounded-3xl p-5 overflow-hidden shadow-2xl animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
              <h4 className="text-sm font-bold text-gray-900 font-sans">
                {selectedGalleryImage.title || 'Reference Image'}
              </h4>
              <button
                type="button"
                onClick={() => setSelectedGalleryImage(null)}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:text-gray-900 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <img
              src={selectedGalleryImage.url}
              alt="Reference"
              className="w-full h-80 object-cover rounded-2xl border border-gray-100 shadow-inner"
            />
            {selectedGalleryImage.note && (
              <p className="text-xs text-gray-600 mt-3 italic">
                {selectedGalleryImage.note}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
