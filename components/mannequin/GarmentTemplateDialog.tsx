'use client';
import {useState} from 'react';
import {Check, X} from 'lucide-react';
import {LegacyDialog} from '@/components/ui/LegacyDialog';
import {cn} from '@/lib/utils';
import type {GarmentTemplate} from '@/types';

export function GarmentTemplateDialog({templates: storeTemplates, initialId, onSelect, onClose}: {
  templates: GarmentTemplate[];
  initialId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const [dialogSelectedTemplateId, setDialogSelectedTemplateId] = useState(initialId || storeTemplates[0]?.id || '');
  return (
    <LegacyDialog label="Garment templates" onClose={onClose}><div className="relative w-full max-w-[calc(100vw-32px)] max-h-[90dvh] overflow-y-auto rounded-[16px] bg-[var(--surface)] p-4 sm:p-6 z-10 flex flex-col gap-5 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-[16px] font-bold text-[var(--text)]">
                  Garment Templates
                </h3>
                <button
                  type="button"
                  aria-label="Close templates modal"
                  onClick={onClose}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col gap-2.5 max-h-[360px] overflow-y-auto">
                {!storeTemplates.length && <p>No templates available.</p>}
                {storeTemplates.map((tmpl) => {
                  const isSelected = dialogSelectedTemplateId === tmpl.id;
                  return (
                    <button
                      type="button"
                      aria-pressed={isSelected}
                      key={tmpl.id}
                      onClick={() => setDialogSelectedTemplateId(tmpl.id)}
                      className={cn(
                        'w-full p-3.5 rounded-[12px] text-left transition-all flex items-center justify-between cursor-pointer border',
                        isSelected
                          ? 'border-[var(--selected)] bg-[var(--selected-bg)]'
                          : 'border-[var(--outline)] bg-[var(--card)] hover:bg-[var(--chip)]'
                      )}
                    >
                      <div className="flex-1 pr-3 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-semibold text-[var(--text)] truncate">
                            {tmpl.name}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-[var(--surface)] text-[10px] font-medium text-[var(--text-2)] border border-[var(--hairline)] shrink-0">
                            {tmpl.fieldKeys.length} pts
                          </span>
                        </div>
                        <div className="text-[12px] font-normal text-[var(--text-2)] mt-0.5 leading-snug">
                          {tmpl.description}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div
                          className={cn(
                            'w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors',
                            isSelected
                              ? 'bg-[var(--selected)] text-white'
                              : 'border border-[var(--outline)] bg-[var(--surface)]'
                          )}
                        >
                          {isSelected && (
                            <Check className="w-3 h-3 stroke-[2.5]" />
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-9 px-4 rounded-[24px] bg-[var(--chip)] border border-[var(--outline)] text-[var(--text-2)] text-[14px] font-medium hover:opacity-90 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!dialogSelectedTemplateId}
                  onClick={() => {
                    onSelect(dialogSelectedTemplateId);
                    onClose();
                  }}
                  className="h-9 px-6 rounded-[24px] bg-[var(--primary)] text-white text-[14px] font-medium hover:opacity-95 cursor-pointer shadow-xs disabled:opacity-40"
                >
                  Select Template
                </button>
              </div>
            </div>
          </LegacyDialog>
  );
}
