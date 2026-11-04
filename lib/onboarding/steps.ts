export type TourStepId = 'client' | 'template' | 'measure' | 'save' | 'reuse';
export type TourTargetKey =
  | 'client-basics'
  | 'choose-template'
  | 'mannequin-viewer'
  | 'save-order'
  | 'nav-clients';

export interface TourStepDefinition {
  id: TourStepId;
  targetKey: TourTargetKey;
  stepNumber: number;
  totalSteps: number;
  title: string;
  body: string;
  exampleId: 'client-fields' | 'template-picker' | 'mannequin-rotation' | 'order-summary' | 'client-reuse';
  preferredPlacement?: 'bottom' | 'top' | 'left' | 'right';
}

export const TOTAL_TOUR_STEPS = 5;

export const TOUR_STEPS: TourStepDefinition[] = [
  {
    id: 'client',
    targetKey: 'client-basics',
    stepNumber: 1,
    totalSteps: TOTAL_TOUR_STEPS,
    title: 'Start with your client.',
    body: "Add your client's details and the garment you're making. Their measurements and orders stay together.",
    exampleId: 'client-fields',
    preferredPlacement: 'right',
  },
  {
    id: 'template',
    targetKey: 'choose-template',
    stepNumber: 2,
    totalSteps: TOTAL_TOUR_STEPS,
    title: 'Choose the measurements you need.',
    body: 'Choose a garment template to show its measurement points. Use Add Point for any extra measurements.',
    exampleId: 'template-picker',
    preferredPlacement: 'bottom',
  },
  {
    id: 'measure',
    targetKey: 'mannequin-viewer',
    stepNumber: 3,
    totalSteps: TOTAL_TOUR_STEPS,
    title: 'Measure from every angle.',
    body: 'Drag the mannequin to rotate it. Select a measurement point to enter a value, or use List view to type measurements.',
    exampleId: 'mannequin-rotation',
    preferredPlacement: 'right',
  },
  {
    id: 'save',
    targetKey: 'save-order',
    stepNumber: 4,
    totalSteps: TOTAL_TOUR_STEPS,
    title: 'Bring the order together.',
    body: 'Add reference images, price and a due date, then save. Your order stays linked to the client\'s measurements.',
    exampleId: 'order-summary',
    preferredPlacement: 'top',
  },
  {
    id: 'reuse',
    targetKey: 'nav-clients',
    stepNumber: 5,
    totalSteps: TOTAL_TOUR_STEPS,
    title: 'Find the fitting again.',
    body: 'Open Clients to review saved measurements and order history. Reuse a fitting when the client returns.',
    exampleId: 'client-reuse',
    preferredPlacement: 'bottom',
  },
];

export function getTourStep(id: TourStepId): TourStepDefinition {
  const step = TOUR_STEPS.find((s) => s.id === id);
  return step || TOUR_STEPS[0];
}

export function getNextStepId(currentId: TourStepId): TourStepId | null {
  const idx = TOUR_STEPS.findIndex((s) => s.id === currentId);
  if (idx >= 0 && idx < TOUR_STEPS.length - 1) {
    return TOUR_STEPS[idx + 1].id;
  }
  return null;
}

export function getPrevStepId(currentId: TourStepId): TourStepId | null {
  const idx = TOUR_STEPS.findIndex((s) => s.id === currentId);
  if (idx > 0) {
    return TOUR_STEPS[idx - 1].id;
  }
  return null;
}
