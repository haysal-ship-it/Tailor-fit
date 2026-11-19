'use client';
import {createContext,useContext} from 'react';
import type {StudioSetupState,StudioSetupUpdate,StudioSetupResult} from '@/lib/onboarding/studio-setup';
export interface StudioSetupContextValue {state:StudioSetupState|null;participant:boolean;openSetup:()=>void;setChecklistHidden:(hidden:boolean)=>Promise<boolean>;saveProgress:(update:StudioSetupUpdate)=>Promise<StudioSetupResult>;reload:()=>Promise<StudioSetupState|null>;}
export const StudioSetupContext=createContext<StudioSetupContextValue|null>(null);
export const useStudioSetup=()=>useContext(StudioSetupContext);
