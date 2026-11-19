import { TourStepId, TOUR_STEPS, getNextStepId, getPrevStepId } from './steps';

export type TourStatus = 'unseen' | 'interrupted' | 'dismissed' | 'completed';
export type TourRuntimeState = 'closed' | 'preparing' | 'running';

export interface OnboardingPreferences {
  version: 2;
  status: TourStatus;
  lastStepId: TourStepId | null;
  contextualTipsEnabled: boolean;
  acknowledgedTipIds: string[];
}

export const DEFAULT_ONBOARDING_PREFERENCES: OnboardingPreferences = {
  version: 2,
  status: 'unseen',
  lastStepId: null,
  contextualTipsEnabled: true,
  acknowledgedTipIds: [],
};

const VALID_STEP_IDS: Set<string> = new Set<TourStepId>([
  'analytics',
  'chart',
  'calendar',
  'add-client',
  'new-order',
]);

const VALID_STATUSES: Set<string> = new Set<TourStatus>([
  'unseen',
  'interrupted',
  'dismissed',
  'completed',
]);

/**
 * Validates and normalizes raw JSON/object into valid OnboardingPreferences.
 * The previous tour resets its progress; unsupported versions return safe defaults.
 */
export function validateAndNormalizePreferences(raw: unknown): OnboardingPreferences {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ...DEFAULT_ONBOARDING_PREFERENCES };
  }

  const obj = raw as Record<string, unknown>;

  // Migrate the previous tour while retaining contextual-tip preferences.
  if (obj.version !== 1 && obj.version !== 2) {
    return { ...DEFAULT_ONBOARDING_PREFERENCES };
  }

  // Validate status
  const status: TourStatus =
    obj.version === 2 && typeof obj.status === 'string' && VALID_STATUSES.has(obj.status)
      ? (obj.status as TourStatus)
      : 'unseen';

  // Validate lastStepId
  const lastStepId: TourStepId | null =
    obj.version === 2 && typeof obj.lastStepId === 'string' && VALID_STEP_IDS.has(obj.lastStepId)
      ? (obj.lastStepId as TourStepId)
      : null;

  // Validate contextualTipsEnabled
  const contextualTipsEnabled =
    typeof obj.contextualTipsEnabled === 'boolean'
      ? obj.contextualTipsEnabled
      : true;

  // Validate acknowledgedTipIds
  const acknowledgedTipIds = Array.isArray(obj.acknowledgedTipIds)
    ? obj.acknowledgedTipIds.filter((id): id is string => typeof id === 'string')
    : [];

  return {
    version: 2,
    status,
    lastStepId,
    contextualTipsEnabled,
    acknowledgedTipIds,
  };
}

/**
 * Pure transition: start tour from beginning ('analytics')
 */
export function transitionStartTour(
  prefs: OnboardingPreferences
): { preferences: OnboardingPreferences; currentStepId: TourStepId } {
  return {
    preferences: {
      ...prefs,
      status: 'interrupted',
      lastStepId: 'analytics',
    },
    currentStepId: 'analytics',
  };
}

/**
 * Pure transition: resume interrupted tour at saved step (or 'analytics')
 */
export function transitionResumeTour(
  prefs: OnboardingPreferences
): { preferences: OnboardingPreferences; currentStepId: TourStepId } {
  const stepToResume: TourStepId = prefs.lastStepId && VALID_STEP_IDS.has(prefs.lastStepId)
    ? prefs.lastStepId
    : 'analytics';

  return {
    preferences: {
      ...prefs,
      status: 'interrupted',
      lastStepId: stepToResume,
    },
    currentStepId: stepToResume,
  };
}

/**
 * Pure transition: step forward
 */
export function transitionNextStep(
  prefs: OnboardingPreferences,
  currentStepId: TourStepId
): { preferences: OnboardingPreferences; nextStepId: TourStepId | null; finished: boolean } {
  const nextId = getNextStepId(currentStepId);
  if (!nextId) {
    return {
      preferences: {
        ...prefs,
        status: 'completed',
        lastStepId: 'new-order',
      },
      nextStepId: null,
      finished: true,
    };
  }

  return {
    preferences: {
      ...prefs,
      status: 'interrupted',
      lastStepId: nextId,
    },
    nextStepId: nextId,
    finished: false,
  };
}

/**
 * Pure transition: step back
 */
export function transitionPrevStep(
  prefs: OnboardingPreferences,
  currentStepId: TourStepId
): { preferences: OnboardingPreferences; prevStepId: TourStepId } {
  const prevId = getPrevStepId(currentStepId) || 'analytics';
  return {
    preferences: {
      ...prefs,
      status: 'interrupted',
      lastStepId: prevId,
    },
    prevStepId: prevId,
  };
}

/**
 * Pure transition: dismiss (Skip, Not now, Escape, Close)
 */
export function transitionDismissTour(
  prefs: OnboardingPreferences
): OnboardingPreferences {
  return {
    ...prefs,
    status: 'dismissed',
  };
}

/**
 * Pure transition: finish
 */
export function transitionFinishTour(
  prefs: OnboardingPreferences
): OnboardingPreferences {
  return {
    ...prefs,
    status: 'completed',
    lastStepId: 'new-order',
  };
}

/**
 * Pure transition: acknowledge a contextual tip
 */
export function transitionAcknowledgeTip(
  prefs: OnboardingPreferences,
  tipId: string
): OnboardingPreferences {
  if (prefs.acknowledgedTipIds.includes(tipId)) {
    return prefs;
  }
  return {
    ...prefs,
    acknowledgedTipIds: [...prefs.acknowledgedTipIds, tipId],
  };
}

/**
 * Pure transition: toggle contextual tips enabled/disabled
 */
export function transitionSetTipsEnabled(
  prefs: OnboardingPreferences,
  enabled: boolean
): OnboardingPreferences {
  return {
    ...prefs,
    contextualTipsEnabled: enabled,
  };
}
