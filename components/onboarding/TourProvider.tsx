'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { useStore } from '@/lib/store';
import {
  TourStepId,
  TourStepDefinition,
  TOUR_STEPS,
  getTourStep,
} from '@/lib/onboarding/steps';
import {
  TourStatus,
  OnboardingPreferences,
  DEFAULT_ONBOARDING_PREFERENCES,
  transitionStartTour,
  transitionResumeTour,
  transitionNextStep,
  transitionPrevStep,
  transitionDismissTour,
  transitionFinishTour,
  transitionAcknowledgeTip,
  transitionSetTipsEnabled,
} from '@/lib/onboarding/state';
import {
  loadOnboardingPreferences,
  saveOnboardingPreferences,
} from '@/lib/onboarding/storage';
import { TourOverlay } from './TourOverlay';

interface TourContextValue {
  status: TourStatus;
  currentStepId: TourStepId | null;
  currentStep: TourStepDefinition | null;
  isTourRunning: boolean;
  isReadyForInvitation: boolean;
  hasActiveBlocker: boolean;
  contextualTipsEnabled: boolean;
  acknowledgedTipIds: string[];
  startTour: () => void;
  resumeTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  dismissTour: () => void;
  finishTour: () => void;
  acknowledgeTip: (tipId: string) => void;
  setTipsEnabled: (enabled: boolean) => void;
  registerBlocker: (blockerId: string) => () => void;
  deferInvitation: () => void;
  justFinishedTour: boolean;
  dismissCompletion: () => void;
}

const TourContext = createContext<TourContextValue | null>(null);

export function useTour(): TourContextValue {
  const ctx = useContext(TourContext);
  if (!ctx) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return ctx;
}

interface TourProviderProps {
  children: React.ReactNode;
}

export function TourProvider({ children }: TourProviderProps) {
  const { isHydrated } = useStore();

  const [preferences, setPreferences] = useState<OnboardingPreferences>(
    DEFAULT_ONBOARDING_PREFERENCES
  );
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [currentStepId, setCurrentStepId] = useState<TourStepId | null>(null);
  const [isTourRunning, setIsTourRunning] = useState(false);
  const [isInvitationDeferred, setIsInvitationDeferred] = useState(false);
  const [justFinishedTour, setJustFinishedTour] = useState(false);

  // Active blockers set: open dialogs, saves, uploads, validation errors
  const [blockers, setBlockers] = useState<Set<string>>(new Set());

  // Load preferences once on mount
  useEffect(() => {
    const loaded = loadOnboardingPreferences();
    setPreferences(loaded);
    setPreferencesLoaded(true);

    // Support URL query parameters for test automation & verification
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('tourStep') && ['client', 'template', 'measure', 'save', 'reuse'].includes(params.get('tourStep')!)) {
        setCurrentStepId(params.get('tourStep') as TourStepId);
        setIsTourRunning(true);
      }
      if (params.get('tourShowInvitation') === '1') {
        setPreferences((prev) => ({ ...prev, status: 'unseen' }));
      }
      if (params.get('tourFinished') === '1') {
        setJustFinishedTour(true);
      }
    }
  }, []);

  // Update preferences helper with storage sync
  const updatePreferences = useCallback((updater: (prev: OnboardingPreferences) => OnboardingPreferences) => {
    setPreferences((prev) => {
      const next = updater(prev);
      saveOnboardingPreferences(next);
      return next;
    });
  }, []);

  // Register blocker with automatic cleanup on unmount
  const registerBlocker = useCallback((blockerId: string) => {
    setBlockers((prev) => {
      const next = new Set(prev);
      next.add(blockerId);
      return next;
    });

    return () => {
      setBlockers((prev) => {
        const next = new Set(prev);
        next.delete(blockerId);
        return next;
      });
    };
  }, []);

  const deferInvitation = useCallback(() => {
    setIsInvitationDeferred(true);
  }, []);

  // Actions
  const startTour = useCallback(() => {
    const { preferences: nextPrefs, currentStepId: stepId } = transitionStartTour(preferences);
    updatePreferences(() => nextPrefs);
    setCurrentStepId(stepId);
    setIsTourRunning(true);
    setJustFinishedTour(false);
  }, [preferences, updatePreferences]);

  const resumeTour = useCallback(() => {
    const { preferences: nextPrefs, currentStepId: stepId } = transitionResumeTour(preferences);
    updatePreferences(() => nextPrefs);
    setCurrentStepId(stepId);
    setIsTourRunning(true);
    setJustFinishedTour(false);
  }, [preferences, updatePreferences]);

  const nextStep = useCallback(() => {
    if (!currentStepId) return;
    const { preferences: nextPrefs, nextStepId, finished } = transitionNextStep(
      preferences,
      currentStepId
    );
    updatePreferences(() => nextPrefs);

    if (finished || !nextStepId) {
      setIsTourRunning(false);
      setCurrentStepId(null);
      setJustFinishedTour(true);
    } else {
      setCurrentStepId(nextStepId);
    }
  }, [currentStepId, preferences, updatePreferences]);

  const prevStep = useCallback(() => {
    if (!currentStepId) return;
    const { preferences: nextPrefs, prevStepId } = transitionPrevStep(
      preferences,
      currentStepId
    );
    updatePreferences(() => nextPrefs);
    setCurrentStepId(prevStepId);
  }, [currentStepId, preferences, updatePreferences]);

  const dismissTour = useCallback(() => {
    const nextPrefs = transitionDismissTour(preferences);
    updatePreferences(() => nextPrefs);
    setIsTourRunning(false);
    setCurrentStepId(null);
  }, [preferences, updatePreferences]);

  const finishTour = useCallback(() => {
    const nextPrefs = transitionFinishTour(preferences);
    updatePreferences(() => nextPrefs);
    setIsTourRunning(false);
    setCurrentStepId(null);
    setJustFinishedTour(true);
  }, [preferences, updatePreferences]);

  const acknowledgeTip = useCallback(
    (tipId: string) => {
      updatePreferences((prev) => transitionAcknowledgeTip(prev, tipId));
    },
    [updatePreferences]
  );

  const setTipsEnabled = useCallback(
    (enabled: boolean) => {
      updatePreferences((prev) => transitionSetTipsEnabled(prev, enabled));
    },
    [updatePreferences]
  );

  const dismissCompletion = useCallback(() => {
    setJustFinishedTour(false);
  }, []);

  const hasActiveBlocker = blockers.size > 0;

  // Eligibility for showing first-visit invitation:
  // - Store is hydrated
  // - Preferences are loaded
  // - Tour status is 'unseen'
  // - Tour is not currently running
  // - No active blockers
  // - Not deferred by user typing
  const isReadyForInvitation =
    isHydrated &&
    preferencesLoaded &&
    preferences.status === 'unseen' &&
    !isTourRunning &&
    !hasActiveBlocker &&
    !isInvitationDeferred;

  const currentStep = useMemo(() => {
    return currentStepId ? getTourStep(currentStepId) : null;
  }, [currentStepId]);

  const contextValue = useMemo<TourContextValue>(
    () => ({
      status: preferences.status,
      currentStepId,
      currentStep,
      isTourRunning,
      isReadyForInvitation,
      hasActiveBlocker,
      contextualTipsEnabled: preferences.contextualTipsEnabled,
      acknowledgedTipIds: preferences.acknowledgedTipIds,
      startTour,
      resumeTour,
      nextStep,
      prevStep,
      dismissTour,
      finishTour,
      acknowledgeTip,
      setTipsEnabled,
      registerBlocker,
      deferInvitation,
      justFinishedTour,
      dismissCompletion,
    }),
    [
      preferences.status,
      preferences.contextualTipsEnabled,
      preferences.acknowledgedTipIds,
      currentStepId,
      currentStep,
      isTourRunning,
      isReadyForInvitation,
      hasActiveBlocker,
      startTour,
      resumeTour,
      nextStep,
      prevStep,
      dismissTour,
      finishTour,
      acknowledgeTip,
      setTipsEnabled,
      registerBlocker,
      deferInvitation,
      justFinishedTour,
      dismissCompletion,
    ]
  );

  return (
    <TourContext.Provider value={contextValue}>
      {children}
      <TourOverlay
        step={currentStep}
        isOpen={isTourRunning}
        onNext={nextStep}
        onPrev={prevStep}
        onSkip={dismissTour}
        onFinish={finishTour}
        onClose={dismissTour}
      />
    </TourContext.Provider>
  );
}
