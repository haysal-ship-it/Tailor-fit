'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { Bell, House, Users, Gear } from '@phosphor-icons/react';

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

export function Navbar() {
  const { activeScreen, setActiveScreen } = useStore();

  const isOverview = activeScreen === 'overview' || activeScreen === 'dashboard' || activeScreen === 'new-measurement' || activeScreen === 'edit-measurement';
  const isClients = activeScreen === 'clients' || activeScreen === 'client-profile';
  const isSettings = activeScreen === 'settings';

  return (
    <>
      {/* Desktop Floating Navbar */}
      <div className="w-full px-4 sm:px-6 pt-4 pb-2">
        <header className="max-w-[1440px] mx-auto bg-[#ffffff] p-[2px] rounded-[8px] shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="w-full bg-[#f8f8f8] px-[24px] py-[8px] rounded-[6px] flex items-center justify-between">
            {/* Brand Logo */}
            <div 
              onClick={() => setActiveScreen('overview')}
              className="flex items-center gap-3 cursor-pointer select-none group"
              id="brand-logo-button"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105">
                <OrigamiTailorFitLogo className="w-8 h-8" />
              </div>
              <span className="text-xl font-bold tracking-tight text-gray-950 font-sans">
                TailorFit
              </span>
            </div>

            {/* Central Black Pill Capsule Navigation */}
            <nav 
              className="hidden md:flex items-center bg-[#0a0a0a] rounded-full p-1 shadow-md gap-1"
              aria-label="Main Navigation"
            >
              <button
                type="button"
                id="nav-pill-overview"
                onClick={() => setActiveScreen('overview')}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  isOverview
                    ? 'bg-white text-gray-950 font-bold shadow-xs'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                <House className="w-4 h-4" weight="fill" />
                <span>Overview</span>
              </button>
              <button
                type="button"
                id="nav-pill-clients"
                onClick={() => setActiveScreen('clients')}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  isClients
                    ? 'bg-white text-gray-950 font-bold shadow-xs'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                <Users className="w-4 h-4" weight="fill" />
                <span>Clients</span>
              </button>
              <button
                type="button"
                id="nav-pill-settings"
                onClick={() => setActiveScreen('settings')}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  isSettings
                    ? 'bg-white text-gray-950 font-bold shadow-xs'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                <Gear className="w-4 h-4" weight="fill" />
                <span>Settings</span>
              </button>
            </nav>

            {/* Right Action: Single Circular Notification Bell Button matching mockup */}
            <div className="flex items-center">
              <button
                type="button"
                id="header-bell-button"
                className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-900 hover:bg-gray-50 transition-colors shadow-xs cursor-pointer"
                aria-label="Studio Alerts"
              >
                <Bell className="w-4 h-4 text-gray-950" weight="fill" />
              </button>
            </div>
          </div>
        </header>
      </div>

      {/* Mobile Floating Bottom Bar with Capsule Pill */}
      <div className="md:hidden fixed bottom-3 left-0 right-0 z-50 px-4">
        <nav className="bg-[#0a0a0a] text-white rounded-full p-1.5 shadow-xl flex items-center justify-around max-w-sm mx-auto border border-gray-800">
          <button
            type="button"
            onClick={() => setActiveScreen('overview')}
            className={`flex-1 py-2 rounded-full text-xs font-medium text-center transition-all flex items-center justify-center gap-1.5 ${
              isOverview ? 'bg-white text-black font-semibold shadow-xs' : 'text-gray-300'
            }`}
          >
            <House className="w-3.5 h-3.5" weight="fill" />
            <span>Overview</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveScreen('clients')}
            className={`flex-1 py-2 rounded-full text-xs font-medium text-center transition-all flex items-center justify-center gap-1.5 ${
              isClients ? 'bg-white text-black font-semibold shadow-xs' : 'text-gray-300'
            }`}
          >
            <Users className="w-3.5 h-3.5" weight="fill" />
            <span>Clients</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveScreen('settings')}
            className={`flex-1 py-2 rounded-full text-xs font-medium text-center transition-all flex items-center justify-center gap-1.5 ${
              isSettings ? 'bg-white text-black font-semibold shadow-xs' : 'text-gray-300'
            }`}
          >
            <Gear className="w-3.5 h-3.5" weight="fill" />
            <span>Settings</span>
          </button>
        </nav>
      </div>
    </>
  );
}
