'use client';
import {Plus} from 'lucide-react';
export const workspaceActionBase='inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-[var(--primary)] disabled:opacity-50';
export const workspacePrimaryAction=workspaceActionBase+' bg-[var(--primary)] text-white hover:opacity-90';
export const workspaceSecondaryAction=workspaceActionBase+' border border-[var(--outline)] bg-white text-[var(--text)] hover:bg-[var(--card)]';
export function WorkspaceActions({onAddClient,onNewOrder,firstClient=false,tourTargets=false}:{onAddClient:()=>void;onNewOrder:()=>void;firstClient?:boolean;tourTargets?:boolean}){return <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row"><button type="button" data-tour={tourTargets?'overview-add-client':undefined} onClick={onAddClient} className={workspacePrimaryAction}><Plus size={16} aria-hidden="true"/>{firstClient?'Add first client':'Add client'}</button><button type="button" data-tour={tourTargets?'overview-new-order':undefined} onClick={onNewOrder} className={workspaceSecondaryAction}><Plus size={16} aria-hidden="true"/>New order</button></div>}
