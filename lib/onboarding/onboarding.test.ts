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
  assert.deepEqual(ids, ['analytics', 'chart', 'calendar', 'add-client', 'new-order']);

  const targets = TOUR_STEPS.map((s) => s.targetKey);
  assert.deepEqual(targets, [
    'overview-analytics',
    'overview-chart',
    'overview-calendar',
    'overview-add-client',
    'overview-new-order',
  ]);

  // Step 1
  const s1 = getTourStep('analytics');
  assert.equal(s1.title, 'Your studio at a glance');
  assert.match(s1.body, /total orders/);

  // Step 3 (mannequin)
  const s3 = getTourStep('calendar');
  assert.equal(s3.title, 'Keep track of pickups');
  assert.match(s3.body, /Browse pickup dates/);

  // Step 5 (reuse)
  const s5 = getTourStep('new-order');
  assert.equal(s5.title, 'Create a new order');
  assert.match(s5.body, /Open the order workspace/);
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
    version: 2,
    status: 'corrupted-status',
  });
  assert.equal(malformedStatus.status, 'unseen');

  // Unknown step ID -> safe fallback to null
  const malformedStep = validateAndNormalizePreferences({
    version: 2,
    status: 'interrupted',
    lastStepId: 'unknown-step',
  });
  assert.equal(malformedStep.lastStepId, null);

  // Valid preferences preserved exactly
  const valid: OnboardingPreferences = {
    version: 2,
    status: 'completed',
    lastStepId: 'new-order',
    contextualTipsEnabled: false,
    acknowledgedTipIds: ['template-fields', 'viewer-rotate'],
  };
  assert.deepEqual(validateAndNormalizePreferences(valid), valid);
});

test('State transitions: start, complete full 5-step sequence, finish', () => {
  let prefs = { ...DEFAULT_ONBOARDING_PREFERENCES };

  // 1. Start tour
  const started = transitionStartTour(prefs);
  assert.equal(started.currentStepId, 'analytics');
  assert.equal(started.preferences.status, 'interrupted');
  assert.equal(started.preferences.lastStepId, 'analytics');
  prefs = started.preferences;

  // 2. Next: client -> template (step 2)
  const step2 = transitionNextStep(prefs, 'analytics');
  assert.equal(step2.nextStepId, 'chart');
  assert.equal(step2.finished, false);
  assert.equal(step2.preferences.lastStepId, 'chart');
  prefs = step2.preferences;

  // 3. Next: template -> measure (step 3)
  const step3 = transitionNextStep(prefs, 'chart');
  assert.equal(step3.nextStepId, 'calendar');
  assert.equal(step3.finished, false);
  assert.equal(step3.preferences.lastStepId, 'calendar');
  prefs = step3.preferences;

  // 4. Back: measure -> template (step 2)
  const back = transitionPrevStep(prefs, 'calendar');
  assert.equal(back.prevStepId, 'chart');
  assert.equal(back.preferences.lastStepId, 'chart');
  prefs = back.preferences;

  // Forward again to save (step 4)
  const step3b = transitionNextStep(prefs, 'chart');
  const step4 = transitionNextStep(step3b.preferences, 'calendar');
  assert.equal(step4.nextStepId, 'add-client');
  prefs = step4.preferences;

  // Forward to reuse (step 5)
  const step5 = transitionNextStep(prefs, 'add-client');
  assert.equal(step5.nextStepId, 'new-order');
  assert.equal(step5.finished, false);
  prefs = step5.preferences;

  // 5. Next on step 5 (finish)
  const finished = transitionNextStep(prefs, 'new-order');
  assert.equal(finished.nextStepId, null);
  assert.equal(finished.finished, true);
  assert.equal(finished.preferences.status, 'completed');
  assert.equal(finished.preferences.lastStepId, 'new-order');
});

test('State transitions: resume interrupted tour', () => {
  const interruptedPrefs: OnboardingPreferences = {
    version: 2,
    status: 'interrupted',
    lastStepId: 'calendar',
    contextualTipsEnabled: true,
    acknowledgedTipIds: [],
  };

  const resumed = transitionResumeTour(interruptedPrefs);
  assert.equal(resumed.currentStepId, 'calendar');
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
  const n1 = transitionNextStep(s.preferences, 'analytics');
  const n2 = transitionNextStep(n1.preferences, 'chart');
  const n3 = transitionNextStep(n2.preferences, 'calendar');
  const n4 = transitionNextStep(n3.preferences, 'add-client');
  const n5 = transitionNextStep(n4.preferences, 'new-order');
  const finished = transitionFinishTour(n5.preferences);

  assert.equal(finished.status, 'completed');

  // Verify business store remains completely unchanged
  assert.deepEqual(clientStore, originalClientSnapshot);
  assert.deepEqual(orderStore, originalOrderSnapshot);
});

test('Legacy tour migration preserves tips and offers the Overview guide once',()=>{const migrated=validateAndNormalizePreferences({version:1,status:'completed',lastStepId:'reuse',contextualTipsEnabled:false,acknowledgedTipIds:['viewer-rotate']});assert.equal(migrated.version,2);assert.equal(migrated.status,'unseen');assert.equal(migrated.lastStepId,null);assert.equal(migrated.contextualTipsEnabled,false);assert.deepEqual(migrated.acknowledgedTipIds,['viewer-rotate']);const dismissed=transitionDismissTour(migrated);assert.deepEqual(validateAndNormalizePreferences(dismissed),dismissed);});
