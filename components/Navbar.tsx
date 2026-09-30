'use client';

import React from 'react';
import { useStore } from '@/lib/store';
import { Bell, Plus } from 'lucide-react';

// Precision Origami Folded "T" Icon matching mockup
export function OrigamiTailorFitLogo({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Top Left Facet - Cyan / Emerald Teal */}
      <path
        d="M6 10L20 10L14 18L6 10Z"
        fill="#00D2B4"
      />
      {/* Top Right Facet - Royal Blue */}
      <path
        d="M20 10L34 10L26 18L20 10Z"
        fill="#2563EB"
      />
      {/* Center Fold Triangular Cap - Vibrant Indigo */}
      <path
        d="M14 18L20 10L26 18L20 22Z"
        fill="#1D4ED8"
      />
      {/* Left Stem Facet - Rich Cobalt */}
      <path
        d="M16 20L20 22L20 34L16 30Z"
        fill="#1E40AF"
      />
      {/* Right Stem Facet - Deep Violet/Navy */}
      <path
        d="M20 22L24 20L24 30L20 34Z"
        fill="#312E81"
      />
      {/* Bottom Tip Refraction */}
      <path
        d="M16 30L20 34L24 30L20 36Z"
        fill="#0EA5E9"
      />
    </svg>
  );
}

export function Navbar({ 
  onNewClientClick, 
  onNewOrderClick 
}: { 
  onNewClientClick: () => void; 
  onNewOrderClick: () => void 
}) {
  const { activeScreen, setActiveScreen, getOrdersDueToday, getOrdersOverdue } = useStore();

  const urgentCount = getOrdersDueToday().length + getOrdersOverdue().length;

  const isOverview = activeScreen === 'overview' || activeScreen === 'dashboard' || activeScreen === 'new-measurement' || activeScreen === 'edit-measurement';
  const isClients = activeScreen === 'clients' || activeScreen === 'client-profile';
  const isSettings = activeScreen === 'settings';

  return (
    <>
      {/* Desktop Floating Navbar */}
      <div className="w-full px-4 sm:px-6 pt-4 pb-2">
        <header className="max-w-[1400px] mx-auto bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100/90 px-5 py-3 flex items-center justify-between">
          {/* Brand Logo */}
          <div 
            onClick={() => setActiveScreen('overview')}
            className="flex items-center gap-3 cursor-pointer select-none group"
            id="brand-logo-button"
          >
            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center p-1 border border-gray-100 transition-transform group-hover:scale-105">
              <OrigamiTailorFitLogo className="w-7 h-7" />
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-950 font-sans">
              TailorFit
            </span>
          </div>

          {/* Central Black Pill Capsule Navigation */}
          <nav 
            className="hidden md:flex items-center bg-[#0a0a0a] rounded-full p-1 shadow-inner gap-1"
            aria-label="Main Navigation"
          >
            <button
              type="button"
              id="nav-pill-overview"
              onClick={() => setActiveScreen('overview')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer ${
                isOverview
                  ? 'bg-white text-gray-950 font-semibold shadow-xs'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Overview
            </button>
            <button
              type="button"
              id="nav-pill-clients"
              onClick={() => setActiveScreen('clients')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer ${
                isClients
                  ? 'bg-white text-gray-950 font-semibold shadow-xs'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Clients
            </button>
            <button
              type="button"
              id="nav-pill-settings"
              onClick={() => setActiveScreen('settings')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer ${
                isSettings
                  ? 'bg-white text-gray-950 font-semibold shadow-xs'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Settings
            </button>
          </nav>

          {/* Right Actions: Quick Actions + Notification Bell */}
          <div className="flex items-center gap-2.5">
            <button
              id="header-btn-new-order"
              type="button"
              onClick={onNewOrderClick}
              className="hidden lg:inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1d4ed8] text-white text-xs font-semibold hover:bg-[#1e40af] transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Order</span>
            </button>

            <button
              id="header-btn-new-client"
              type="button"
              onClick={onNewClientClick}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-gray-200 bg-white text-gray-800 text-xs font-semibold hover:bg-gray-50 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Client</span>
            </button>

            {/* Notification Bell with Badge */}
            <button
              type="button"
              id="header-bell-button"
              onClick={() => setActiveScreen('overview')}
              className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-colors relative shadow-xs"
              aria-label="Studio Alerts"
            >
              <Bell className="w-4 h-4 text-gray-600" />
              {urgentCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
              )}
            </button>
          </div>
        </header>
      </div>

      {/* Mobile Floating Bottom Bar with Capsule Pill */}
      <div className="md:hidden fixed bottom-3 left-0 right-0 z-50 px-4">
        <nav className="bg-[#0a0a0a] text-white rounded-full p-1.5 shadow-xl flex items-center justify-around max-w-sm mx-auto border border-gray-800">
          <button
            type="button"
            onClick={() => setActiveScreen('overview')}
            className={`flex-1 py-2 rounded-full text-xs font-medium text-center transition-all ${
              isOverview ? 'bg-white text-black font-semibold shadow-xs' : 'text-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveScreen('clients')}
            className={`flex-1 py-2 rounded-full text-xs font-medium text-center transition-all ${
              isClients ? 'bg-white text-black font-semibold shadow-xs' : 'text-gray-300'
            }`}
          >
            Clients
          </button>
          <button
            type="button"
            onClick={() => setActiveScreen('settings')}
            className={`flex-1 py-2 rounded-full text-xs font-medium text-center transition-all ${
              isSettings ? 'bg-white text-black font-semibold shadow-xs' : 'text-gray-300'
            }`}
          >
            Settings
          </button>
        </nav>
      </div>
    </>
  );
}
