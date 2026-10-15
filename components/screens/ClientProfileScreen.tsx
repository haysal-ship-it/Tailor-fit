'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { 
  ArrowLeft, 
  Phone, 
  Mail, 
  Plus, 
  Clock, 
  Pencil, 
  Check, 
  X,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Ruler
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AnimatedNumberMorph } from '@/components/ui/AnimatedNumberMorph';
import { AtelierMannequin } from '@/components/AtelierMannequin';
import { cn } from '@/lib/utils';
import { OrderStatus, ReferenceImage } from '@/types';

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
    selectedClientId,
    setActiveScreen,
    getClientById,
    getClientOrders,
    getClientSnapshots,
    updateClient,
    settings,
    setSelectedClientId,
  } = useStore();

  const client = selectedClientId ? getClientById(selectedClientId) : null;
  const orders = selectedClientId ? getClientOrders(selectedClientId) : [];
  const snapshots = selectedClientId ? getClientSnapshots(selectedClientId) : [];

  const [expandedSnapshotId, setExpandedSnapshotId] = useState<string | null>(
    snapshots[0]?.id || null
  );

  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState(client?.notes || '');

  if (!client) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 py-12 text-center">
        <p className="text-xs text-[var(--text-muted)]">No client selected.</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => setActiveScreen('clients')}
        >
          Return to Clients Directory
        </Button>
      </div>
    );
  }

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

  const totalSpend = orders.reduce((sum, o) => sum + (o.price || 0), 0);

  const activeMeasurements = snapshots[0]?.measurements || {
    shoulder: 42,
    neck: 36,
    bust: 92,
    waist: 72,
    sleeve: 60,
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 py-3 space-y-4 pb-28 md:pb-6">
      {/* Top Header Card */}
      <div className="rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setActiveScreen('clients')}
            title="Back to Clients"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--surface-2)] text-[var(--text)] font-semibold text-xs flex items-center justify-center border border-[var(--border)] shrink-0">
              {initials}
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-[-0.01em] text-[var(--text)]">
                {client.name}
              </h1>
              <p className="text-[11px] text-[var(--text-muted)] font-mono">
                Atelier Client #{client.id.slice(-4)} • Registered{' '}
                {new Date(client.createdAt).toLocaleDateString('en-GB', {
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons: Exactly ONE primary button per screen */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            variant="outline"
            size="md"
            leftIcon={<Ruler className="w-3.5 h-3.5" />}
            onClick={() => {
              setSelectedClientId(client.id);
              setActiveScreen('overview');
            }}
          >
            Measure on Mannequin
          </Button>

          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => onNewOrder(client.id)}
          >
            New Order
          </Button>
        </div>
      </div>

      {/* 2-Column Dossier Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Column: Client Dossier & Notes */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] p-4 sm:p-6 space-y-4">
            <h3 className="text-sm font-semibold tracking-[-0.01em] text-[var(--text)] pb-2 border-b border-[var(--border)]">
              Client Dossier
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
                <Phone className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                <span className="font-mono text-[var(--text)]">{client.phone}</span>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
                <Mail className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                <span className="text-[var(--text)] truncate">{client.email}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
                <span className="text-[var(--text-muted)]">Cumulative Spend</span>
                <span className="font-mono font-semibold text-[var(--text)]">
                  <AnimatedNumberMorph value={totalSpend} />
                </span>
              </div>
            </div>

            {/* Bespoke Notes */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-[var(--text-muted)]">
                  Bespoke Fitting Notes
                </label>
                {!isEditingNotes ? (
                  <button
                    type="button"
                    onClick={() => {
                      setNotesDraft(client.notes || '');
                      setIsEditingNotes(true);
                    }}
                    className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] flex items-center gap-1 cursor-pointer"
                  >
                    <Pencil className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingNotes(false)}
                      className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={saveNotes}
                      className="text-xs text-[var(--text)] font-semibold flex items-center gap-1 cursor-pointer"
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
                  className="w-full p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--text)] focus:outline-none focus:border-[var(--accent)] resize-none"
                />
              ) : (
                <p className="text-xs text-[var(--text-muted)] italic p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
                  {client.notes || 'No bespoke notes logged yet.'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Historical Mannequin & Commissions */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Mannequin Historical View */}
          <div className="rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
              <div>
                <h3 className="text-sm font-semibold tracking-[-0.01em] text-[var(--text)]">
                  Historical Body Landmarks
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Non-interactive fitting snapshot
                </p>
              </div>
            </div>

            <div className="w-full flex items-center justify-center py-2">
              <AtelierMannequin
                gender="F"
                unit="cm"
                measurements={activeMeasurements}
                readOnly={true}
              />
            </div>
          </div>

          {/* Commissions & Orders */}
          <div className="rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
              <h3 className="text-sm font-semibold tracking-[-0.01em] text-[var(--text)]">
                Order History &amp; Garments
              </h3>
              <span className="text-xs font-mono text-[var(--text-muted)]">
                {orders.length} commissions
              </span>
            </div>

            {orders.length === 0 ? (
              <div className="p-4 text-center rounded-xl bg-[var(--surface-2)] text-xs text-[var(--text-muted)]">
                No orders registered for this client yet.
              </div>
            ) : (
              <div className="space-y-2">
                {orders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-3.5 rounded-xl bg-[var(--surface-1)] border border-[var(--border)] flex items-center justify-between transition-colors hover:border-[var(--border-strong)]"
                  >
                    <div>
                      <h4 className="text-xs font-semibold text-[var(--text)]">
                        {ord.garmentType}
                      </h4>
                      <p className="text-[11px] text-[var(--text-muted)] font-mono">
                        Due: {ord.pickupDateTime ? ord.pickupDateTime.slice(0, 10) : 'Pending'}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-semibold text-[var(--text)]">
                        <AnimatedNumberMorph value={ord.price} />
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditOrder(ord.id)}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
