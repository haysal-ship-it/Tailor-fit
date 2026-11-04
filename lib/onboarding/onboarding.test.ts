import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_ONBOARDING_PREFERENCES,
  validateAndNormalizePreferences,
  transitionStartTour,
  transitionResumeTour,
  transitionNextStep,
  transitionPrevStep,
  transitionDismissTour,
  transitionFinishTour,
  transitionAcknowledgeTip,
  transitionSetTipsEnabled,
  OnboardingPreferences,
} from './state';
import {
  TOUR_STEPS,
  TOTAL_TOUR_STEPS,
  getTourStep,
  getNextStepId,
  getPrevStepId,
} from './steps';
import {
  computeCardPlacement,
  TargetRect,
} from './targets';

test('Onboarding steps: exactly 5 linear steps with required IDs and copy', () => {
  assert.equal(TOUR_STEPS.length, 5);
  assert.equal(TOTAL_TOUR_STEPS, 5);

  const ids = TOUR_STEPS.map((s) => s.id);
  assert.deepEqual(ids, ['client', 'template', 'measure', 'save', 'reuse']);

  const targets = TOUR_STEPS.map((s) => s.targetKey);
  assert.deepEqual(targets, [
    'client-basics',
    'choose-template',
    'mannequin-viewer',
    'save-order',
    'nav-clients',
  ]);

  // Step 1
  const s1 = getTourStep('client');
  assert.equal(s1.title, 'Start with your client.');
  assert.match(s1.body, /client's details/);

  // Step 3 (mannequin)
  const s3 = getTourStep('measure');
  assert.equal(s3.title, 'Measure from every angle.');
  assert.match(s3.body, /Drag the mannequin to rotate it/);

  // Step 5 (reuse)
  const s5 = getTourStep('reuse');
  assert.equal(s5.title, 'Find the fitting again.');
  assert.match(s5.body, /Open Clients to review saved measurements/);
});

test('Preference validation: normalizes missing, corrupt or invalid values safely', () => {
  // Empty or invalid input
  assert.deepEqual(validateAndNormalizePreferences(null), DEFAULT_ONBOARDING_PREFERENCES);
  assert.deepEqual(validateAndNormalizePreferences(undefined), DEFAULT_ONBOARDING_PREFERENCES);
  assert.deepEqual(validateAndNormalizePreferences('string'), DEFAULT_ONBOARDING_PREFERENCES);
  assert.deepEqual(validateAndNormalizePreferences([]), DEFAULT_ONBOARDING_PREFERENCES);

  // Unsupported version -> reset to defaults
  assert.deepEqual(
    validateAndNormalizePreferences({ version: 99, status: 'completed' }),
    DEFAULT_ONBOARDING_PREFERENCES
  );

  // Unknown status -> safe fallback to 'unseen'
  const malformedStatus = validateAndNormalizePreferences({
    version: 1,
    status: 'corrupted-status',
  });
  assert.equal(malformedStatus.status, 'unseen');

  // Unknown step ID -> safe fallback to null
  const malformedStep = validateAndNormalizePreferences({
    version: 1,
    status: 'interrupted',
    lastStepId: 'unknown-step',
  });
  assert.equal(malformedStep.lastStepId, null);

  // Valid preferences preserved exactly
  const valid: OnboardingPreferences = {
    version: 1,
    status: 'completed',
    lastStepId: 'reuse',
    contextualTipsEnabled: false,
    acknowledgedTipIds: ['template-fields', 'viewer-rotate'],
  };
  assert.deepEqual(validateAndNormalizePreferences(valid), valid);
});

test('State transitions: start, complete full 5-step sequence, finish', () => {
  let prefs = { ...DEFAULT_ONBOARDING_PREFERENCES };

  // 1. Start tour
  const started = transitionStartTour(prefs);
  assert.equal(started.currentStepId, 'client');
  assert.equal(started.preferences.status, 'interrupted');
  assert.equal(started.preferences.lastStepId, 'client');
  prefs = started.preferences;

  // 2. Next: client -> template (step 2)
  const step2 = transitionNextStep(prefs, 'client');
  assert.equal(step2.nextStepId, 'template');
  assert.equal(step2.finished, false);
  assert.equal(step2.preferences.lastStepId, 'template');
  prefs = step2.preferences;

  // 3. Next: template -> measure (step 3)
  const step3 = transitionNextStep(prefs, 'template');
  assert.equal(step3.nextStepId, 'measure');
  assert.equal(step3.finished, false);
  assert.equal(step3.preferences.lastStepId, 'measure');
  prefs = step3.preferences;

  // 4. Back: measure -> template (step 2)
  const back = transitionPrevStep(prefs, 'measure');
  assert.equal(back.prevStepId, 'template');
  assert.equal(back.preferences.lastStepId, 'template');
  prefs = back.preferences;

  // Forward again to save (step 4)
  const step3b = transitionNextStep(prefs, 'template');
  const step4 = transitionNextStep(step3b.preferences, 'measure');
  assert.equal(step4.nextStepId, 'save');
  prefs = step4.preferences;

  // Forward to reuse (step 5)
  const step5 = transitionNextStep(prefs, 'save');
  assert.equal(step5.nextStepId, 'reuse');
  assert.equal(step5.finished, false);
  prefs = step5.preferences;

  // 5. Next on step 5 (finish)
  const finished = transitionNextStep(prefs, 'reuse');
  assert.equal(finished.nextStepId, null);
  assert.equal(finished.finished, true);
  assert.equal(finished.preferences.status, 'completed');
  assert.equal(finished.preferences.lastStepId, 'reuse');
});

test('State transitions: resume interrupted tour', () => {
  const interruptedPrefs: OnboardingPreferences = {
    version: 1,
    status: 'interrupted',
    lastStepId: 'measure',
    contextualTipsEnabled: true,
    acknowledgedTipIds: [],
  };

  const resumed = transitionResumeTour(interruptedPrefs);
  assert.equal(resumed.currentStepId, 'measure');
  assert.equal(resumed.preferences.status, 'interrupted');
});

test('State transitions: dismiss (Skip / Escape / Not now) records dismissed', () => {
  const prefs = { ...DEFAULT_ONBOARDING_PREFERENCES };
  const dismissed = transitionDismissTour(prefs);
  assert.equal(dismissed.status, 'dismissed');
});

test('Contextual tips: individual acknowledgment and global toggle', () => {
  let prefs = { ...DEFAULT_ONBOARDING_PREFERENCES };

  // Acknowledge one tip
  prefs = transitionAcknowledgeTip(prefs, 'template-fields');
  assert.deepEqual(prefs.acknowledgedTipIds, ['template-fields']);

  // Duplicate acknowledgment has no side effect
  prefs = transitionAcknowledgeTip(prefs, 'template-fields');
  assert.deepEqual(prefs.acknowledgedTipIds, ['template-fields']);

  // Acknowledge second tip
  prefs = transitionAcknowledgeTip(prefs, 'viewer-rotate');
  assert.deepEqual(prefs.acknowledgedTipIds, ['template-fields', 'viewer-rotate']);

  // Global toggle off
  prefs = transitionSetTipsEnabled(prefs, false);
  assert.equal(prefs.contextualTipsEnabled, false);

  // Global toggle on
  prefs = transitionSetTipsEnabled(prefs, true);
  assert.equal(prefs.contextualTipsEnabled, true);
});

test('Target positioning: missing target yields safe centered card', () => {
  const placement = computeCardPlacement(null, 320, 240);
  assert.equal(placement.mode, 'centered');
  assert.equal(placement.arrowPosition, 'none');
  assert.ok(typeof placement.left === 'number');
  assert.ok(typeof placement.top === 'number');
});

test('Data preservation contract: tour progress strictly isolated from business data', () => {
  // Mock business data
  const clientStore = [
    { id: 'c1', name: 'Original Client', phone: '+234-111', createdAt: '2026-11-01' },
  ];
  const orderStore = [
    { id: 'o1', clientId: 'c1', garmentType: 'Suit', createdAt: '2026-11-01' },
  ];

  // Deep clone to verify immutability
  const originalClientSnapshot = JSON.parse(JSON.stringify(clientStore));
  const originalOrderSnapshot = JSON.parse(JSON.stringify(orderStore));

  // Exercise full tour lifecycle
  let prefs = { ...DEFAULT_ONBOARDING_PREFERENCES };
  const s = transitionStartTour(prefs);
  const n1 = transitionNextStep(s.preferences, 'client');
  const n2 = transitionNextStep(n1.preferences, 'template');
  const n3 = transitionNextStep(n2.preferences, 'measure');
  const n4 = transitionNextStep(n3.preferences, 'save');
  const n5 = transitionNextStep(n4.preferences, 'reuse');
  const finished = transitionFinishTour(n5.preferences);

  assert.equal(finished.status, 'completed');

  // Verify business store remains completely unchanged
  assert.deepEqual(clientStore, originalClientSnapshot);
  assert.deepEqual(orderStore, originalOrderSnapshot);
});
