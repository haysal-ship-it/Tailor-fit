'use client';

import React, { useState } from 'react';
import { HotspotDefinition, UnitType } from '@/types';
import { ChevronRight, X, Plus } from 'lucide-react';
import { RotatableMannequin } from '@/components/mannequin/RotatableMannequin';

interface BodyDiagramProps {
  gender: 'male' | 'female';
  setGender: (g: 'male' | 'female') => void;
  view: 'front' | 'back';
  setView: (v: 'front' | 'back') => void;
  unit: UnitType;
  selectedTemplateId: string;
  templateFieldKeys: string[];
  allHotspots: HotspotDefinition[];
  measurements: Record<string, number | string>;
  onUpdateMeasurement: (key: string, value: number | string) => void;
  onAddCustomFieldClick?: () => void;
  hideHeaderControls?: boolean;
}

export function BodyDiagram({
  gender,
  setGender,
  view,
  setView,
  unit,
  templateFieldKeys,
  allHotspots,
  measurements,
  onUpdateMeasurement,
  onAddCustomFieldClick,
  hideHeaderControls = true,
}: BodyDiagramProps) {
  const [activeHotspotKey, setActiveHotspotKey] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState<string>('');

  // Filter hotspots for current view (front / back)
  const visibleHotspots = allHotspots.filter((h) => {
    const isIncludedInTemplate = templateFieldKeys.length === 0 || templateFieldKeys.includes(h.key);
    if (!isIncludedInTemplate) return false;

    if (view === 'front') {
      return h.view === 'front' || h.view === 'both';
    } else {
      return h.view === 'back' || h.view === 'both';
    }
  });

  const activeHotspot = allHotspots.find((h) => h.key === activeHotspotKey);

  const openHotspot = (hotspot: HotspotDefinition) => {
    setActiveHotspotKey(hotspot.key);
    const curr = measurements[hotspot.key];
    setInputValue(curr !== undefined && curr !== '' ? String(curr) : '');
  };

  const handleSelectRotatablePoint = (key: string, label: string) => {
    const matched =
      allHotspots.find((h) => h.key === key) ||
      allHotspots.find((h) => h.key.startsWith(key)) || {
        key,
        label,
        category: 'upper_body' as const,
        hint: `Measure ${label.toLowerCase()} circumference/span in ${unit}.`,
        view: 'both' as const,
        frontX: 150,
        frontY: 200,
      };
    openHotspot(matched);
  };

  const saveAndClose = () => {
    if (activeHotspotKey) {
      if (inputValue.trim() === '') {
        onUpdateMeasurement(activeHotspotKey, '');
      } else {
        const num = parseFloat(inputValue);
        onUpdateMeasurement(activeHotspotKey, isNaN(num) ? inputValue : num);
      }
    }
    setActiveHotspotKey(null);
  };

  const saveAndNext = () => {
    if (activeHotspotKey) {
      const num = parseFloat(inputValue);
      onUpdateMeasurement(activeHotspotKey, isNaN(num) ? inputValue : num);
    }
    const currentIndex = visibleHotspots.findIndex((h) => h.key === activeHotspotKey);
    const nextHotspots = [
      ...visibleHotspots.slice(currentIndex + 1),
      ...visibleHotspots.slice(0, currentIndex),
    ];
    const nextUnmeasured = nextHotspots.find((h) => !measurements[h.key]);
    if (nextUnmeasured) {
      openHotspot(nextUnmeasured);
    } else if (nextHotspots.length > 0) {
      openHotspot(nextHotspots[0]);
    } else {
      setActiveHotspotKey(null);
    }
  };

  const adjustValue = (delta: number) => {
    const curr = parseFloat(inputValue) || 0;
    const next = Math.max(0, parseFloat((curr + delta).toFixed(1)));
    setInputValue(String(next));
  };

  return (
    <div className="relative w-full flex flex-col items-center select-none">
      {/* View & Gender Controls Bar */}
      {!hideHeaderControls && (
        <div className="w-full flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="inline-flex rounded-full bg-[#f5f3f1] p-1 border border-[#ebe8e4]">
            <button
              type="button"
              onClick={() => setView('front')}
              className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-all ${
                view === 'front'
                  ? 'bg-[#000000] text-white shadow-xs'
                  : 'text-[#777169] hover:text-[#000000]'
              }`}
            >
              Front Silhouette
            </button>
            <button
              type="button"
              onClick={() => setView('back')}
              className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-all ${
                view === 'back'
                  ? 'bg-[#000000] text-white shadow-xs'
                  : 'text-[#777169] hover:text-[#000000]'
              }`}
            >
              Back Silhouette
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-full bg-[#f5f3f1] p-1 border border-[#ebe8e4]">
              <button
                type="button"
                onClick={() => setGender('female')}
                className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-all ${
                  gender === 'female'
                    ? 'bg-[#000000] text-white shadow-xs'
                    : 'text-[#777169] hover:text-[#000000]'
                }`}
              >
                Female
              </button>
              <button
                type="button"
                onClick={() => setGender('male')}
                className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-all ${
                  gender === 'male'
                    ? 'bg-[#000000] text-white shadow-xs'
                    : 'text-[#777169] hover:text-[#000000]'
                }`}
              >
                Male
              </button>
            </div>

            {onAddCustomFieldClick && (
              <button
                type="button"
                onClick={onAddCustomFieldClick}
                title="Add Custom Measurement Point"
                className="px-3 py-1.5 rounded-full border border-[#ebe8e4] text-[#44403b] text-[12px] font-medium hover:bg-[#f5f3f1] inline-flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Add Point</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3D Rotatable Mannequin Stage */}
      <div className="relative w-full max-w-[460px] bg-[#F8F8F8] rounded-[16px] border border-[#EDEDED] p-4 flex flex-col items-center justify-center overflow-hidden shadow-2xs">
        <RotatableMannequin
          gender={gender}
          onGenderChange={setGender}
          showGenderToggle={true}
          activeView={view}
          onViewChange={(v) => {
            if (v === 'front' || v === 'back') setView(v);
          }}
          measurements={measurements}
          activePointKeys={templateFieldKeys}
          selectedPointKey={activeHotspotKey}
          unit={unit}
          onSelectPoint={handleSelectRotatablePoint}
        />

        {/* In-Diagram Popover for Active Hotspot */}
        {activeHotspot && (
          <div className="absolute inset-x-3 bottom-3 z-30 bg-[#fdfcfc] rounded-[18px] border border-[#ebe8e4] p-3.5 shadow-[0_4px_20px_rgba(0,0,0,0.08)] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#0447ff]" />
                  <h4 className="text-[14px] font-medium text-[#000000]">
                    {activeHotspot.label}
                  </h4>
                </div>
                <p className="text-[11px] text-[#777169] mt-0.5 leading-snug line-clamp-2">
                  {activeHotspot.hint}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveHotspotKey(null)}
                className="p-1 rounded-full text-[#a59f97] hover:text-[#000000] hover:bg-[#f5f3f1]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Adjustment & Input */}
            <div className="flex items-center gap-1.5 my-2">
              <button
                type="button"
                onClick={() => adjustValue(-1)}
                className="w-8 h-8 rounded-full border border-[#ebe8e4] bg-[#f5f3f1] text-[#44403b] text-[13px] font-medium hover:bg-[#ebe8e4] active:scale-95 transition-all"
              >
                -1
              </button>
              <div className="relative flex-1">
                <input
                  type="number"
                  step="0.1"
                  autoFocus
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveAndNext();
                  }}
                  placeholder="0.0"
                  className="w-full h-8 px-2.5 text-center text-[15px] font-mono font-medium rounded-[4px] border border-[#ebe8e4] bg-[#fdfcfc] text-[#000000] focus:outline-none focus:border-[#0447ff] focus:ring-1 focus:ring-[#0447ff]"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-mono text-[#a59f97]">
                  {unit}
                </span>
              </div>
              <button
                type="button"
                onClick={() => adjustValue(+1)}
                className="w-8 h-8 rounded-full border border-[#ebe8e4] bg-[#f5f3f1] text-[#44403b] text-[13px] font-medium hover:bg-[#ebe8e4] active:scale-95 transition-all"
              >
                +1
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#ebe8e4]">
              <button
                type="button"
                onClick={saveAndClose}
                className="px-3 py-1.5 rounded-full border border-[#ebe8e4] text-[#44403b] text-[12px] font-medium hover:bg-[#f5f3f1] transition-colors"
              >
                Save
              </button>
              <button
                type="button"
                onClick={saveAndNext}
                className="px-3.5 py-1.5 rounded-full bg-[#000000] text-white text-[12px] font-medium hover:bg-[#222222] inline-flex items-center gap-1 transition-colors"
              >
                <span>Save & Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Hotspots Quick Scroller on Mobile/Tablet */}
      <div className="w-full max-w-[460px] mt-3">
        <div className="flex items-center justify-between text-[11px] text-[#777169] mb-1.5 px-1">
          <span>Tap any point or rotate 360° to capture</span>
          <span className="font-mono text-[#0447ff] font-medium">
            {Object.keys(measurements).filter((k) => measurements[k] !== '' && measurements[k] !== undefined).length} / {templateFieldKeys.length || allHotspots.length} Captured
          </span>
        </div>

        {/* Horizontal Chip Bar of Hotspots for Quick Access */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 px-0.5 no-scrollbar">
          {visibleHotspots.map((h) => {
            const isMeasured = measurements[h.key] !== undefined && measurements[h.key] !== '';
            const isActive = activeHotspotKey === h.key;

            return (
              <button
                key={h.key}
                type="button"
                onClick={() => openHotspot(h)}
                className={`shrink-0 px-2.5 py-1 rounded-full text-[12px] flex items-center gap-1.5 border transition-all ${
                  isActive
                    ? 'border-[#0447ff] bg-[#0447ff]/5 text-[#0447ff] font-medium'
                    : isMeasured
                    ? 'border-[#ebe8e4] bg-[#f5f3f1] text-[#000000]'
                    : 'border-[#ebe8e4] bg-[#fdfcfc] text-[#777169] hover:text-[#000000]'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isMeasured ? 'bg-[#0447ff]' : 'bg-[#a59f97]'
                  }`}
                />
                <span>{h.label.split(' ')[0]}</span>
                {isMeasured && (
                  <span className="font-mono text-[10px] text-[#0447ff]">
                    {measurements[h.key]}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
