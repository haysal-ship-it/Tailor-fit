'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { AtelierMannequin } from '@/components/AtelierMannequin';
import { 
  MagnifyingGlass, 
  CaretRight, 
  Phone, 
  EnvelopeSimple, 
  User, 
  List,
  Check,
  X,
  Plus
} from '@phosphor-icons/react';

interface ClientsScreenProps {
  onOpenClient: (clientId: string) => void;
  onNewMeasurement: (clientId: string) => void;
  onNewOrder: (clientId: string) => void;
}

export function ClientsScreen({ 
  onOpenClient, 
  onNewMeasurement, 
  onNewOrder 
}: ClientsScreenProps) {
  const { clients, getClientSnapshots, updateSnapshot, addSnapshot } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [mannequinView, setMannequinView] = useState<'mannequin' | 'table'>('mannequin');
  const [pointModalData, setPointModalData] = useState<{
    key: string;
    name: string;
    value: string;
    isCustom?: boolean;
  } | null>(null);

  const [selectedClientProfile, setSelectedClientProfile] = useState({
    id: 'c-1',
    initials: 'CD',
    name: 'Chloe Dallas',
    since: 'Client since Jun 2025',
    phone: '+234 8141 432 211',
    email: 'chloedallas@email.com',
  });

  const recentClients = [
    {
      id: 'c-6',
      initials: 'CD',
      name: 'Amanda Billings',
      phone: '+23740930299',
      email: 'a.billings@couture.com',
      since: 'Client since Aug 2025',
    },
    {
      id: 'c-2',
      initials: 'TR',
      name: 'Taylor Razaq',
      phone: '+44740930509',
      email: 'taylor.razaq@londoncouture.co.uk',
      since: 'Client since May 2025',
    },
    {
      id: 'c-1',
      initials: 'CD',
      name: 'Chloe Dallas',
      phone: '+234 8141 432 211',
      email: 'chloedallas@email.com',
      since: 'Client since Jun 2025',
    },
  ];

  // Exact measurements from design / store
  const [measurements, setMeasurements] = useState<Record<string, number | string>>(() => {
    const clientSnaps = getClientSnapshots('c-1');
    if (clientSnaps && clientSnaps.length > 0) {
      const latest = clientSnaps[clientSnaps.length - 1];
      if (latest.measurements) {
        return latest.measurements;
      }
    }
    return {
      shoulder: 42,
      neck: 36,
      bust: 92,
      waist: 72,
      sleeve: 60,
      thigh: 54,
    };
  });

  const handleSelectClient = (client: typeof recentClients[0]) => {
    setSelectedClientProfile(client);
    const clientSnaps = getClientSnapshots(client.id);
    if (clientSnaps && clientSnaps.length > 0) {
      const latest = clientSnaps[clientSnaps.length - 1];
      if (latest.measurements) {
        setMeasurements(latest.measurements);
        return;
      }
    }
    setMeasurements({
      shoulder: 42,
      neck: 36,
      bust: 92,
      waist: 72,
      sleeve: 60,
      thigh: 54,
    });
  };

  const handleMeasurementChange = (key: string, value: number) => {
    const updated = {
      ...measurements,
      [key]: value,
    };
    setMeasurements(updated);

    // Persist change to store
    const clientSnaps = getClientSnapshots(selectedClientProfile.id);
    if (clientSnaps && clientSnaps.length > 0) {
      const latest = clientSnaps[clientSnaps.length - 1];
      updateSnapshot(latest.id, {
        measurements: updated,
      });
    } else {
      addSnapshot({
        clientId: selectedClientProfile.id,
        date: new Date().toISOString().slice(0, 10),
        unit: 'cm',
        garmentType: 'Bespoke Fitting',
        measurements: updated,
        notes: 'Updated via Body Measurement History',
      });
    }
  };

  const handleSavePoint = (key: string, name: string, valStr: string) => {
    const numVal = parseFloat(valStr);
    if (!isNaN(numVal) && numVal > 0) {
      const updated = {
        ...measurements,
        [key]: numVal,
      };
      setMeasurements(updated);

      // Persist directly to client profile store
      const clientSnaps = getClientSnapshots(selectedClientProfile.id);
      if (clientSnaps && clientSnaps.length > 0) {
        const latest = clientSnaps[clientSnaps.length - 1];
        updateSnapshot(latest.id, {
          measurements: updated,
        });
      } else {
        addSnapshot({
          clientId: selectedClientProfile.id,
          date: new Date().toISOString().slice(0, 10),
          unit: 'cm',
          garmentType: 'Bespoke Fitting',
          measurements: updated,
          notes: 'Updated via Body Measurement History',
        });
      }
    }
    setPointModalData(null);
  };

  // Curated reference photos for the 3 Order History cards matching Clients.png
  const orderHistoryCards = [
    {
      id: 'ord-hist-1',
      title: 'Gown/ Dress',
      badge: 'Urgent',
      badgeClass: 'bg-orange-500 text-white',
      date: 'Size taken on 09-10-2025',
      price: '₦130,000',
      images: [
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=300&q=80',
        'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=300&q=80',
      ],
    },
    {
      id: 'ord-hist-2',
      title: 'Oxford Three Piece Suit',
      badge: 'Completed',
      badgeClass: 'bg-emerald-600 text-white',
      date: 'Size taken on 09-10-2025',
      price: '₦230,000',
      images: [
        'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=300&q=80',
        'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=300&q=80',
        'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=300&q=80',
      ],
    },
    {
      id: 'ord-hist-3',
      title: 'Gown/ Dress',
      badge: 'Pending',
      badgeClass: 'bg-lime-500 text-white',
      date: 'Size taken on 09-10-2025',
      price: '₦130,000',
      images: [
        'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80',
        'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=300&q=80',
        'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80',
      ],
    },
  ];

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 py-4">
      {/* 2-Column Cockpit strictly matching Clients.png */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* =========================================================================
            LEFT COLUMN: "Client Directory" Main Container
            ========================================================================= */}
        <div className="lg:col-span-3 bg-white rounded-[8px] p-[2px] shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col gap-[2px]">
          <div className="bg-[#F8F8F8] rounded-[8px] p-4 space-y-4 shadow-xs">
            <h2 className="text-sm font-bold text-gray-950 font-sans tracking-tight">
              Client Directory
            </h2>

            {/* Search Bar */}
            <div className="relative">
              <MagnifyingGlass className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" weight="bold" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search clients by name, phone number, email..."
                className="w-full h-10 pl-9 pr-3.5 rounded-[8px] bg-white border border-gray-100 text-[11px] text-gray-900 placeholder:text-gray-400 focus:outline-none shadow-xs"
              />
            </div>

            {/* Subheading: Recently Viewed Clients */}
            <div className="space-y-2 pt-1">
              <h3 className="text-xs font-bold text-gray-900">Recently Viewed Clients</h3>

              <div className="space-y-2">
                {recentClients
                  .filter((c) =>
                    searchQuery
                      ? c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        c.phone.includes(searchQuery) ||
                        c.email.toLowerCase().includes(searchQuery.toLowerCase())
                      : true
                  )
                  .map((client) => {
                    const isSelected = selectedClientProfile.id === client.id;
                    return (
                      <div
                        key={client.id}
                        onClick={() => handleSelectClient(client)}
                        className={`p-3 rounded-[8px] transition-all flex items-center justify-between cursor-pointer border ${
                          isSelected
                            ? 'bg-blue-50/60 border-blue-200 shadow-xs'
                            : 'bg-white border-gray-100 hover:bg-gray-100 shadow-xs'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-[8px] font-bold text-xs flex items-center justify-center border ${
                            isSelected ? 'bg-[#1d4ed8] text-white border-[#1d4ed8]' : 'bg-[#f4f5f7] text-gray-800 border-gray-200'
                          }`}>
                            {client.initials}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-gray-950">{client.name}</h4>
                            <p className="text-[10px] text-gray-500">{client.phone}</p>
                          </div>
                        </div>
                        <CaretRight className={`w-4 h-4 ${isSelected ? 'text-[#1d4ed8]' : 'text-gray-400'}`} weight="fill" />
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            RIGHT COLUMN: Client Profile Dossier
            ========================================================================= */}
        <div className="lg:col-span-9 bg-white rounded-[8px] p-[2px] shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col gap-[2px]">
          {/* Top Profile Card Container */}
          <div className="bg-[#F8F8F8] rounded-[8px] p-6 space-y-6 shadow-xs">
            {/* Top Bar: Subtitle & Title & "New Order" Action */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  CLIENT PROFILE
                </span>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-950 font-sans tracking-tight">
                  {selectedClientProfile.name}
                </h1>
              </div>

              <button
                type="button"
                id="btn-client-new-order"
                onClick={() => onNewOrder(selectedClientProfile.id)}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" weight="bold" />
                <span>New Order</span>
              </button>
            </div>

            {/* Centered Client Profile Hero */}
            <div className="flex flex-col items-center justify-center text-center space-y-2 py-1">
              <div className="w-16 h-16 rounded-full bg-black text-white font-bold text-lg flex items-center justify-center shadow-sm">
                {selectedClientProfile.initials}
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-950">{selectedClientProfile.name}</h2>
                <p className="text-[11px] text-gray-400">{selectedClientProfile.since}</p>
              </div>
              <div className="flex items-center gap-4 text-[11px] text-gray-600 font-medium">
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-gray-700" weight="fill" />
                  {selectedClientProfile.phone}
                </span>
                <span className="flex items-center gap-1">
                  <EnvelopeSimple className="w-3.5 h-3.5 text-gray-700" weight="fill" />
                  {selectedClientProfile.email}
                </span>
              </div>
            </div>
          </div>

          {/* Section: Body Measurement History Container (Fill: #F8F8F8, stroke removed) */}
          <div className="bg-[#F8F8F8] rounded-[8px] p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200/60">
              <div>
                <h4 className="text-sm font-bold text-gray-950 font-sans tracking-tight">Body Measurement History</h4>
                <p className="text-[10px] text-gray-400">All available points</p>
              </div>

              {/* Add Point Button & Toggle */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setPointModalData({
                      key: 'sleeve',
                      name: 'Sleeve',
                      value: measurements.sleeve ? String(measurements.sleeve) : '60.0',
                      isCustom: true,
                    })
                  }
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-[#1d4ed8] text-white text-xs font-semibold hover:bg-[#1e40af] transition-colors cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" weight="bold" />
                  <span>Add Point</span>
                </button>

                <div className="flex items-center bg-[#E5E7EB] p-0.5 rounded-full border border-gray-200/50 shadow-xs">
                  <button
                    type="button"
                    onClick={() => setMannequinView('mannequin')}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                      mannequinView === 'mannequin'
                        ? 'bg-[#1d4ed8] text-white shadow-xs'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" weight="fill" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setMannequinView('table')}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                      mannequinView === 'table'
                        ? 'bg-[#1d4ed8] text-white shadow-xs'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" weight="fill" />
                  </button>
                </div>
              </div>
            </div>

            {/* Mannequin Graphic OR Table Cards */}
            {mannequinView === 'mannequin' ? (
              <div className="w-full flex items-center justify-center py-2">
                <AtelierMannequin
                  gender="F"
                  unit="cm"
                  measurements={measurements}
                  onMeasurementChange={handleMeasurementChange}
                  onSelectLandmark={(key, name, currentVal) => {
                    setPointModalData({
                      key,
                      name,
                      value: String(currentVal),
                      isCustom: false,
                    });
                  }}
                />
              </div>
            ) : (
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 self-start py-2">
                {[
                  { id: 'shoulder', label: 'Shoulder width', val: measurements.shoulder || 42 },
                  { id: 'neck', label: 'Neck', val: measurements.neck || 36 },
                  { id: 'bust', label: 'Bust/Chest', val: measurements.bust || 92 },
                  { id: 'waist', label: 'Waist', val: measurements.waist || 72 },
                  { id: 'sleeve', label: 'Sleeve', val: measurements.sleeve || 60 },
                  { id: 'thigh', label: 'Thigh', val: measurements.thigh || 54 },
                  { id: 'hip', label: 'Hip', val: measurements.hip || 96 },
                  { id: 'ankle', label: 'Ankle', val: measurements.ankle || 24 },
                  { id: 'back', label: 'Back', val: measurements.back || 40 },
                ].map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-[8px] bg-white border border-gray-200/70 flex flex-col justify-between h-20 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-900 truncate">
                        {item.label}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-bold font-mono text-gray-950">
                        {typeof item.val === 'number' ? item.val.toFixed(1) : item.val}
                      </span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase">CM</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Order History Container (Fill: #F8F8F8, stroke removed) */}
          <div className="bg-[#F8F8F8] rounded-[8px] p-5 space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-gray-950 font-sans tracking-tight">Order History</h3>

            {/* 3 Horizontal Cards in a row matching Clients.png */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {orderHistoryCards.map((card) => (
                <div
                  key={card.id}
                  className="rounded-[8px] border border-gray-100 overflow-hidden flex flex-col justify-between bg-white shadow-xs"
                >
                  {/* Card Header */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-gray-950">{card.title}</h4>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${card.badgeClass}`}>
                        {card.badge}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400">{card.date}</p>

                    {/* Style references photos */}
                    <div className="pt-2">
                      <span className="text-[10px] text-gray-500 block mb-1.5">Style references</span>
                      <div className="grid grid-cols-3 gap-1.5">
                        {card.images.map((img, idx) => (
                          <div key={idx} className="aspect-square rounded-[6px] overflow-hidden bg-gray-100 border border-gray-100">
                            <img
                              src={img}
                              alt="Style reference"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Dark Price Footer matching Clients.png */}
                  <div className="bg-[#111827] text-white px-4 py-2.5 flex items-center justify-between text-xs">
                    <span className="text-gray-400 text-[11px]">Price</span>
                    <span className="font-bold font-mono">{card.price}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SET POINT SIZE: Responsive Modal (Web Backdrop Blur) & Bottom Sheet Drawer (Mobile)
          ========================================================================= */}
      {pointModalData && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-md transition-all animate-in fade-in duration-200">
          {/* Backdrop dismiss */}
          <div
            className="absolute inset-0"
            onClick={() => setPointModalData(null)}
          />

          {/* Modal / Bottom Sheet Card */}
          <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-7 shadow-2xl z-10 flex flex-col max-h-[85vh] overflow-y-auto pb-8 sm:pb-7 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            {/* Mobile Top Drag Handle */}
            <div className="sm:hidden pt-1 pb-3 flex justify-center">
              <div className="w-12 h-1 bg-black rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-gray-100">
              <h2 className="text-lg sm:text-xl font-bold text-gray-950 font-sans tracking-tight">
                {pointModalData.isCustom ? 'Add point size' : 'Set point size'}
              </h2>
              <button
                type="button"
                onClick={() => setPointModalData(null)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" weight="bold" />
              </button>
            </div>

            {/* Body: Landmark Label + Input Capsule matching Overview modal point.png */}
            <div className="py-5 sm:py-6">
              <div className="flex items-center justify-between gap-4">
                {pointModalData.isCustom ? (
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                      Landmark Point
                    </label>
                    <input
                      type="text"
                      value={pointModalData.name}
                      onChange={(e) =>
                        setPointModalData({
                          ...pointModalData,
                          name: e.target.value,
                          key: e.target.value.toLowerCase().replace(/\s+/g, '_'),
                        })
                      }
                      placeholder="e.g. Sleeve, Neck, Bicep"
                      className="w-full text-base font-semibold text-gray-900 bg-[#F8F8F8] border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#1d4ed8]"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0084FF] shadow-[0_0_8px_#0084FF]" />
                    <span className="text-base sm:text-lg font-semibold text-gray-900">
                      {pointModalData.name}
                    </span>
                  </div>
                )}

                {/* Numerical Input Capsule */}
                <div className="flex items-center bg-[#F8F8F8] border border-gray-200/90 rounded-xl px-3 sm:px-4 py-2 w-32 sm:w-40 justify-between focus-within:border-[#0084FF] focus-within:bg-white transition-colors">
                  <input
                    type="number"
                    step="0.1"
                    value={pointModalData.value}
                    onChange={(e) =>
                      setPointModalData({ ...pointModalData, value: e.target.value })
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSavePoint(
                          pointModalData.key,
                          pointModalData.name,
                          pointModalData.value
                        );
                      }
                    }}
                    className="w-full bg-transparent text-right font-bold text-base sm:text-lg text-gray-950 focus:outline-none pr-1.5"
                    placeholder="0.0"
                  />
                  <span className="text-xs font-bold text-gray-400 select-none uppercase tracking-wide">
                    CM
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Actions matching design */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={() => setPointModalData(null)}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-full bg-[#f3f4f6] hover:bg-[#e5e7eb] text-gray-700 text-xs sm:text-sm font-semibold transition-colors text-center cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() =>
                  handleSavePoint(
                    pointModalData.key,
                    pointModalData.name,
                    pointModalData.value
                  )
                }
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-full bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-xs sm:text-sm font-semibold transition-colors shadow-xs text-center cursor-pointer"
              >
                {pointModalData.isCustom ? 'Add Point' : 'Update Point'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
