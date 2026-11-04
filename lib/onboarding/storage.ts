import {
  OnboardingPreferences,
  DEFAULT_ONBOARDING_PREFERENCES,
  validateAndNormalizePreferences,
} from './state';

export const ONBOARDING_STORAGE_KEY = 'tailorfit:onboarding:v1';

// In-memory fallback if localStorage throws or is blocked
let inMemoryPreferences: OnboardingPreferences = { ...DEFAULT_ONBOARDING_PREFERENCES };
let isStorageAvailable: boolean | null = null;

function checkStorageAvailability(): boolean {
  if (typeof window === 'undefined') return false;
  if (isStorageAvailable !== null) return isStorageAvailable;

  try {
    const testKey = '__tailorfit_storage_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    isStorageAvailable = true;
    return true;
  } catch {
    isStorageAvailable = false;
    return false;
  }
}

/**
 * Loads and validates stored onboarding preferences.
 * Falls back safely to in-memory state if localStorage is unavailable or corrupt.
 */
export function loadOnboardingPreferences(): OnboardingPreferences {
  if (!checkStorageAvailability()) {
    return inMemoryPreferences;
  }

  try {
    const raw = window.localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_ONBOARDING_PREFERENCES };
    }
    const parsed = JSON.parse(raw);
    const validated = validateAndNormalizePreferences(parsed);
    inMemoryPreferences = validated;
    return validated;
  } catch {
    // Malformed JSON or read error
    return inMemoryPreferences;
  }
}

/**
 * Persists updated onboarding preferences.
 * Fails gracefully into in-memory state on error without disrupting business workflows.
 */
export function saveOnboardingPreferences(prefs: OnboardingPreferences): boolean {
  inMemoryPreferences = prefs;

  if (!checkStorageAvailability()) {
    return false;
  }

  try {
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(prefs));
    return true;
  } catch {
    // Storage quota exceeded or permission denied
    return false;
  }
}

/**
 * Clears onboarding preferences (used strictly in testing or explicit tour reset).
 */
export function resetOnboardingStorage(): void {
  inMemoryPreferences = { ...DEFAULT_ONBOARDING_PREFERENCES };
  if (checkStorageAvailability()) {
    try {
      window.localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    } catch {
      // Ignore
    }
  }
}
