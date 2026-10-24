import {
  Client,
  MeasurementSnapshot,
  Order,
  HotspotDefinition,
  GarmentTemplate,
  AppSettings,
  AnatomicalZoneId,
} from '@/types';

export interface AnatomicalZoneMeta {
  id: 'head_neck' | 'torso' | 'upper_limb' | 'lower_limb';
  label: string;
  shortLabel: string;
}

export const ANATOMICAL_ZONES: AnatomicalZoneMeta[] = [
  { id: 'head_neck', label: 'Head/Neck', shortLabel: 'Head/Neck' },
  { id: 'torso', label: 'Torso', shortLabel: 'Torso' },
  { id: 'upper_limb', label: 'Upper Limb', shortLabel: 'Upper Limb' },
  { id: 'lower_limb', label: 'Lower limb', shortLabel: 'Lower limb' },
];

export function normalizeZoneId(category: AnatomicalZoneId): 'head_neck' | 'torso' | 'upper_limb' | 'lower_limb' {
  if (category === 'head_neck') return 'head_neck';
  if (category === 'torso' || category === 'upper_body') return 'torso';
  if (category === 'upper_limb' || category === 'arms') return 'upper_limb';
  return 'lower_limb';
}

export function getZoneLabel(category: AnatomicalZoneId): string {
  const norm = normalizeZoneId(category);
  return ANATOMICAL_ZONES.find((z) => z.id === norm)?.label || 'Torso';
}

/**
 * 21 Canonical Anatomical Sizing Measurements across the 4 zones:
 * 1. Head/Neck: Head circumference, Neck circumference, Neckline, Shoulder to Neck
 * 2. Torso: Shoulder width, Bust/chest, Waist circumference, Body length, Front length, Hip Height
 * 3. Upper Limb: Sleeve length, Biceps, Wrist circumference, Armhole, Elbow length
 * 4. Lower limb: Inseam, Outseam, Thigh circumference, Knee circumference, Rise, Thigh length
 */
export const DEFAULT_HOTSPOTS: HotspotDefinition[] = [
  // =========================================================================
  // 1. HEAD / NECK (4 items)
  // =========================================================================
  {
    key: 'head_circumference',
    label: 'Head circumference',
    view: 'both',
    category: 'head_neck',
    frontX: 150,
    frontY: 54,
    backX: 150,
    backY: 54,
    defaultValCm: 56,
    hint: 'Measure horizontally around the fullest part of the head above the brow and ears.',
  },
  {
    key: 'neck_circumference',
    label: 'Neck circumference',
    view: 'both',
    category: 'head_neck',
    frontX: 150,
    frontY: 82,
    backX: 150,
    backY: 82,
    defaultValCm: 36,
    hint: 'Measure around the base of the neck where the collar rests, inserting one finger for ease.',
  },
  {
    key: 'neckline',
    label: 'Neckline',
    view: 'front',
    category: 'head_neck',
    frontX: 150,
    frontY: 96,
    defaultValCm: 40,
    hint: 'Measure the desired neckline opening contour from collarbone across the front.',
  },
  {
    key: 'shoulder_to_neck',
    label: 'Shoulder to Neck',
    view: 'both',
    category: 'head_neck',
    frontX: 128,
    frontY: 92,
    backX: 128,
    backY: 92,
    defaultValCm: 13.5,
    hint: 'Measure from the base of the side neck (HPS) to the outer shoulder tip (acromion).',
  },

  // =========================================================================
  // 2. TORSO (6 items)
  // =========================================================================
  {
    key: 'shoulder_width',
    label: 'Shoulder width',
    view: 'both',
    category: 'torso',
    frontX: 150,
    frontY: 104,
    backX: 150,
    backY: 104,
    defaultValCm: 42,
    hint: 'Measure across the shoulders from outer shoulder bone tip to shoulder bone tip.',
  },
  {
    key: 'bust_chest',
    label: 'Bust/chest',
    view: 'front',
    category: 'torso',
    frontX: 150,
    frontY: 142,
    defaultValCm: 92,
    hint: 'Measure around the fullest part of the bust or chest, keeping the tape level across the back.',
  },
  {
    key: 'waist_circumference',
    label: 'Waist circumference',
    view: 'both',
    category: 'torso',
    frontX: 150,
    frontY: 198,
    backX: 150,
    backY: 198,
    defaultValCm: 72,
    hint: 'Measure around the natural narrowest waistline.',
  },
  {
    key: 'body_length',
    label: 'Body length',
    view: 'both',
    category: 'torso',
    frontX: 150,
    frontY: 224,
    backX: 150,
    backY: 224,
    defaultValCm: 64,
    hint: 'Measure vertically from the high point of the shoulder down to the desired garment hem.',
  },
  {
    key: 'front_length',
    label: 'Front length',
    view: 'front',
    category: 'torso',
    frontX: 150,
    frontY: 172,
    defaultValCm: 41.5,
    hint: 'Measure from the high point shoulder (HPS) over the bust down to the natural front waistline.',
  },
  {
    key: 'hip_height',
    label: 'Hip Height',
    view: 'both',
    category: 'torso',
    frontX: 150,
    frontY: 248,
    backX: 150,
    backY: 248,
    defaultValCm: 96,
    hint: 'Measure around the fullest part of the hips and pelvis or vertical distance from waist to hip line.',
  },

  // =========================================================================
  // 3. UPPER LIMB (5 items)
  // =========================================================================
  {
    key: 'sleeve_length',
    label: 'Sleeve length',
    view: 'both',
    category: 'upper_limb',
    frontX: 88,
    frontY: 200,
    backX: 88,
    backY: 200,
    defaultValCm: 60,
    hint: 'Measure from the outer shoulder point along the arm to the wrist bone.',
  },
  {
    key: 'biceps',
    label: 'Biceps',
    view: 'both',
    category: 'upper_limb',
    frontX: 98,
    frontY: 158,
    backX: 98,
    backY: 158,
    defaultValCm: 31,
    hint: 'Measure around the fullest part of the upper arm (bicep) with slight ease.',
  },
  {
    key: 'wrist_circumference',
    label: 'Wrist circumference',
    view: 'both',
    category: 'upper_limb',
    frontX: 74,
    frontY: 292,
    backX: 74,
    backY: 292,
    defaultValCm: 16.5,
    hint: 'Measure snugly around the wrist bone, adding cuff ease as preferred.',
  },
  {
    key: 'armhole',
    label: 'Armhole',
    view: 'both',
    category: 'upper_limb',
    frontX: 112,
    frontY: 132,
    backX: 112,
    backY: 132,
    defaultValCm: 44,
    hint: 'Measure around the shoulder joint loop under the armpit (armscye circumference).',
  },
  {
    key: 'elbow_length',
    label: 'Elbow length',
    view: 'both',
    category: 'upper_limb',
    frontX: 92,
    frontY: 185,
    backX: 92,
    backY: 185,
    defaultValCm: 34,
    hint: 'Measure from the outer shoulder tip to the tip of the elbow.',
  },

  // =========================================================================
  // 4. LOWER LIMB (6 items)
  // =========================================================================
  {
    key: 'inseam',
    label: 'Inseam',
    view: 'both',
    category: 'lower_limb',
    frontX: 142,
    frontY: 410,
    backX: 142,
    backY: 410,
    defaultValCm: 80,
    hint: 'Measure from the lowest point of the crotch down the inner leg to the ankle/floor.',
  },
  {
    key: 'outseam',
    label: 'Outseam',
    view: 'both',
    category: 'lower_limb',
    frontX: 114,
    frontY: 380,
    backX: 114,
    backY: 380,
    defaultValCm: 104,
    hint: 'Measure from the natural side waistline down the outer leg to the ankle/hem.',
  },
  {
    key: 'thigh_circumference',
    label: 'Thigh circumference',
    view: 'both',
    category: 'lower_limb',
    frontX: 126,
    frontY: 308,
    backX: 126,
    backY: 308,
    defaultValCm: 54,
    hint: 'Measure around the fullest part of the upper thigh.',
  },
  {
    key: 'knee_circumference',
    label: 'Knee circumference',
    view: 'both',
    category: 'lower_limb',
    frontX: 124,
    frontY: 392,
    backX: 124,
    backY: 392,
    defaultValCm: 38,
    hint: 'Measure around the knee joint at the kneecap level.',
  },
  {
    key: 'rise',
    label: 'Rise',
    view: 'both',
    category: 'lower_limb',
    frontX: 150,
    frontY: 268,
    backX: 150,
    backY: 268,
    defaultValCm: 27,
    hint: 'Measure from the front waistline through the crotch up to the center back waistline.',
  },
  {
    key: 'thigh_length',
    label: 'Thigh length',
    view: 'front',
    category: 'lower_limb',
    frontX: 126,
    frontY: 348,
    defaultValCm: 46,
    hint: 'Measure vertically from the hip/upper thigh crease down to the top of the knee.',
  },
];

/**
 * Maps any legacy measurement key or human label to one of the 21 canonical keys.
 */
const LEGACY_KEY_ALIASES: Record<string, string> = {
  // Head / Neck
  head: 'head_circumference',
  head_circumference: 'head_circumference',
  neck: 'neck_circumference',
  neck_circumference: 'neck_circumference',
  neckline: 'neckline',
  shoulder_to_neck: 'shoulder_to_neck',
  shouldertoneck: 'shoulder_to_neck',

  // Torso
  shoulder: 'shoulder_width',
  shoulder_width: 'shoulder_width',
  bust: 'bust_chest',
  chest: 'bust_chest',
  bust_chest: 'bust_chest',
  waist: 'waist_circumference',
  waist_circumference: 'waist_circumference',
  body_length: 'body_length',
  neckToAnkle: 'body_length',
  nape_to_waist: 'body_length',
  back: 'body_length',
  back_width: 'shoulder_width',
  front_length: 'front_length',
  front_lenght: 'front_length',
  torso_length: 'front_length',
  neckToWaist: 'front_length',
  hip: 'hip_height',
  hip_height: 'hip_height',

  // Upper Limb
  sleeve: 'sleeve_length',
  sleeve_length: 'sleeve_length',
  arm_length: 'sleeve_length',
  bicep: 'biceps',
  biceps: 'biceps',
  wrist: 'wrist_circumference',
  wrist_circumference: 'wrist_circumference',
  armhole: 'armhole',
  elbow: 'elbow_length',
  elbow_length: 'elbow_length',

  // Lower Limb
  inseam: 'inseam',
  outseam: 'outseam',
  ankle: 'outseam',
  calf: 'knee_circumference',
  thigh: 'thigh_circumference',
  thigh_circumference: 'thigh_circumference',
  knee: 'knee_circumference',
  knee_circumference: 'knee_circumference',
  rise: 'rise',
  thigh_length: 'thigh_length',
};

export function resolveCanonicalKey(rawKeyOrLabel: string): string {
  const trimmed = rawKeyOrLabel.trim();
  if (LEGACY_KEY_ALIASES[trimmed]) return LEGACY_KEY_ALIASES[trimmed];
  const snake = trimmed
    .toLowerCase()
    .replace(/\//g, '_')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
  if (LEGACY_KEY_ALIASES[snake]) return LEGACY_KEY_ALIASES[snake];
  const byLabel = DEFAULT_HOTSPOTS.find(
    (h) => h.label.toLowerCase() === trimmed.toLowerCase() || h.key === snake
  );
  return byLabel ? byLabel.key : snake;
}

export function normalizeMeasurementsRecord(
  raw: Record<string, number | string> | undefined
): Record<string, number> {
  const result: Record<string, number> = {};
  if (!raw) return result;
  Object.entries(raw).forEach(([k, v]) => {
    const num = typeof v === 'number' ? v : parseFloat(String(v));
    if (!isNaN(num) && num > 0) {
      const canonical = resolveCanonicalKey(k);
      result[canonical] = num;
    }
  });
  return result;
}

export const DEFAULT_TEMPLATES: GarmentTemplate[] = [
  {
    id: 'gown_dress',
    name: 'Gown/Dress',
    fieldKeys: [
      'neck_circumference',
      'neckline',
      'shoulder_width',
      'bust_chest',
      'waist_circumference',
      'hip_height',
      'front_length',
      'body_length',
      'sleeve_length',
      'armhole',
      'wrist_circumference',
    ],
    description: 'Evening wears, party gowns, wedding dress etc',
  },
  {
    id: 'suits_blazers',
    name: 'Suits/Blazers',
    fieldKeys: [
      'neck_circumference',
      'shoulder_to_neck',
      'shoulder_width',
      'bust_chest',
      'waist_circumference',
      'hip_height',
      'front_length',
      'body_length',
      'sleeve_length',
      'biceps',
      'armhole',
      'elbow_length',
      'wrist_circumference',
      'inseam',
      'outseam',
      'thigh_circumference',
      'rise',
    ],
    description: 'Full bespoke fitting of two piece suits or blazers and trousers',
  },
  {
    id: 'trousers_shorts',
    name: 'Trousers/shorts',
    fieldKeys: [
      'waist_circumference',
      'hip_height',
      'rise',
      'thigh_circumference',
      'thigh_length',
      'knee_circumference',
      'inseam',
      'outseam',
    ],
    description: 'Fittings for tailored/pleated pants, trousers, pants and shorts.',
  },
  {
    id: 'shirt_blouse',
    name: 'Shirt/Blouse',
    fieldKeys: [
      'neck_circumference',
      'shoulder_to_neck',
      'shoulder_width',
      'bust_chest',
      'waist_circumference',
      'front_length',
      'body_length',
      'sleeve_length',
      'biceps',
      'armhole',
      'wrist_circumference',
    ],
    description: 'Essential measurements for bespoke dress shirts/blouses',
  },
];

export const DEFAULT_SETTINGS: AppSettings = {
  defaultUnit: 'cm',
  currency: '₦',
  customFields: [],
  templates: DEFAULT_TEMPLATES,
};

export const SAMPLE_CLIENTS: Client[] = [
  {
    id: 'c-1',
    name: 'Chloe Dallas',
    phone: '+234 809 489 2011',
    email: 'chloedallas@couture.com',
    notes: 'Bespoke African Gown commission with hand-stitched beaded embroidery and train.',
    createdAt: '2025-08-12T10:00:00.000Z',
  },
  {
    id: 'c-2',
    name: 'Taylor Razaq',
    phone: '+234 803 929 1100',
    email: 't.razaq@tailorfit.design',
    notes: 'Double-breasted jacket and tailored trousers in Italian wool.',
    createdAt: '2024-05-04T14:30:00.000Z',
  },
  {
    id: 'c-3',
    name: 'Bryan Muhammed',
    phone: '+234 905 123 4567',
    email: 'b.muhammed@heritage.ng',
    notes: 'Bespoke African Gown and gold-threaded Agbada with monogram cuff.',
    createdAt: '2025-08-15T09:15:00.000Z',
  },
  {
    id: 'c-4',
    name: 'Adriana Kunle',
    phone: '+234 802 987 6543',
    email: 'adriana.kunle@vogue.ng',
    notes: 'Prefers silk faille drape with architectural back pleats.',
    createdAt: '2025-08-28T16:00:00.000Z',
  },
  {
    id: 'c-5',
    name: 'Marcus Vance',
    phone: '+234 809 876 5432',
    email: 'm.vance@architectural.net',
    notes: 'Bespoke structured senator ensemble with high collar.',
    createdAt: '2025-09-02T11:45:00.000Z',
  },
  {
    id: 'c-6',
    name: 'Amanda Billings',
    phone: '+237 409 302 990',
    email: 'a.billings@couture.com',
    notes: 'Bespoke Tuxedo Suit with hand-stitched silk faille peak lapel and tailored cigarette trousers.',
    createdAt: '2025-08-10T08:30:00.000Z',
  },
];

export const SAMPLE_SNAPSHOTS: MeasurementSnapshot[] = [
  {
    id: 'ms-1',
    clientId: 'c-1',
    date: '09-10-2025',
    unit: 'cm',
    garmentType: 'Gown/Dress',
    notes: 'Summer couture fitting for Autumn Gala. High heel allowance: 8.5cm.',
    measurements: {
      neck_circumference: 36,
      neckline: 40,
      shoulder_width: 42,
      bust_chest: 92,
      waist_circumference: 72,
      hip_height: 96,
      front_length: 41.5,
      body_length: 135,
      sleeve_length: 60,
      armhole: 44,
      wrist_circumference: 16.5,
    },
  },
  {
    id: 'ms-2',
    clientId: 'c-2',
    date: '02-10-2025',
    unit: 'cm',
    garmentType: 'Suits/Blazers',
    notes: 'Savile Row cut fitting. Left shoulder slightly lower by 0.7cm.',
    measurements: {
      neck_circumference: 41,
      shoulder_to_neck: 15,
      shoulder_width: 47,
      bust_chest: 104,
      waist_circumference: 86,
      hip_height: 102,
      front_length: 45,
      body_length: 76,
      sleeve_length: 64,
      biceps: 35,
      armhole: 48,
      wrist_circumference: 18,
      thigh_circumference: 58,
      inseam: 83,
      outseam: 106,
      rise: 28,
    },
  },
  {
    id: 'ms-3',
    clientId: 'c-3',
    date: '01-09-2025',
    unit: 'cm',
    garmentType: 'Suits/Blazers',
    notes: 'Bespoke Agbada & Senator fitting.',
    measurements: {
      neck_circumference: 40,
      shoulder_width: 46,
      bust_chest: 102,
      waist_circumference: 84,
      hip_height: 100,
      body_length: 138,
      sleeve_length: 63,
      wrist_circumference: 17.5,
      inseam: 82,
      outseam: 105,
    },
  },
  {
    id: 'ms-4',
    clientId: 'c-6',
    date: '14-09-2025',
    unit: 'cm',
    garmentType: 'Gown/Dress',
    notes: 'Evening velvet gown and bespoke tuxedo set.',
    measurements: {
      neck_circumference: 35,
      shoulder_width: 40,
      bust_chest: 90,
      waist_circumference: 70,
      hip_height: 95,
      front_length: 41,
      body_length: 134,
      sleeve_length: 59,
      wrist_circumference: 16,
    },
  },
];

export const SAMPLE_ORDERS: Order[] = [
  {
    id: 'ord-9021',
    clientId: 'c-1',
    garmentType: 'Bespoke African Gown',
    measurementSnapshotId: 'ms-1',
    referenceImages: [
      {
        id: 'img-9021-1',
        url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        title: 'Beaded Bodice Detail',
      },
      {
        id: 'img-9021-2',
        url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=300&q=80',
        title: 'Silhouette Drape',
      },
      {
        id: 'img-9021-3',
        url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=300&q=80',
        title: 'Silk Faille Swatch',
      },
    ],
    price: 130000,
    paidAmount: 100000,
    notes: 'Hand-stitched silk faille peak lapel, custom horn buttons, double vent.',
    status: 'In Progress',
    pickupDateTime: '2026-10-14T15:00:00.000Z',
    createdAt: '2025-10-09T10:00:00.000Z',
  },
  {
    id: 'ord-101',
    clientId: 'c-1',
    garmentType: 'Oxford Three Piece Suit',
    measurementSnapshotId: 'ms-1',
    referenceImages: [
      {
        id: 'img-101-1',
        url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=300&q=80',
        title: 'Couture Silhouette Sketch',
      },
      {
        id: 'img-101-2',
        url: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=300&q=80',
        title: 'Fabric Swatch',
      },
      {
        id: 'img-101-3',
        url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=300&q=80',
        title: 'Lapel Trim',
      },
    ],
    price: 230000,
    paidAmount: 230000,
    notes: 'Hand-stitched, monogram design on wrist and gold buttons.',
    status: 'Ready',
    pickupDateTime: '2026-09-23T16:00:00.000Z',
    createdAt: '2025-10-02T10:00:00.000Z',
  },
  {
    id: 'ord-107',
    clientId: 'c-1',
    garmentType: 'Silk Evening Jumpsuit',
    measurementSnapshotId: 'ms-1',
    referenceImages: [
      {
        id: 'img-107-1',
        url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80',
        title: 'Draped Neckline',
      },
      {
        id: 'img-107-2',
        url: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=300&q=80',
        title: 'Wide Leg Cut',
      },
      {
        id: 'img-107-3',
        url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80',
        title: 'Back Closure',
      },
    ],
    price: 185000,
    paidAmount: 185000,
    notes: 'Completed fitting and pressed for collection.',
    status: 'Completed',
    pickupDateTime: '2026-09-12T16:00:00.000Z',
    createdAt: '2025-09-18T10:00:00.000Z',
  },
  {
    id: 'ord-102',
    clientId: 'c-2',
    garmentType: 'Bespoke African Gown',
    measurementSnapshotId: 'ms-2',
    referenceImages: [
      {
        id: 'img-3',
        url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=600&q=80',
        title: 'Lapel Reference',
      },
      {
        id: 'img-4',
        url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80',
        title: 'Fabric Swatch',
      },
      {
        id: 'img-4b',
        url: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=300&q=80',
        title: 'Button Detail',
      },
    ],
    price: 240000,
    notes: 'Final fitting approved, gold thread embroidery complete.',
    status: 'Completed',
    pickupDateTime: '2026-09-17T14:00:00.000Z',
    createdAt: '2025-08-26T11:30:00.000Z',
  },
  {
    id: 'ord-103',
    clientId: 'c-3',
    garmentType: 'Bespoke African Gown',
    measurementSnapshotId: 'ms-3',
    referenceImages: [
      {
        id: 'img-5',
        url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80',
        title: 'Inspiration Lookbook',
      },
      {
        id: 'img-5b',
        url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        title: 'Embroidery Pattern',
      },
      {
        id: 'img-5c',
        url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=300&q=80',
        title: 'Cuff Detail',
      },
    ],
    price: 120000,
    notes: 'Fabric shipment delayed from artisan weaver.',
    status: 'Paused',
    pickupDateTime: '2026-09-07T18:00:00.000Z',
    createdAt: '2025-09-01T15:00:00.000Z',
  },
  {
    id: 'ord-104',
    clientId: 'c-5',
    garmentType: 'Shirt / Blouse',
    measurementSnapshotId: 'ms-4',
    referenceImages: [
      {
        id: 'img-6',
        url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80',
        title: 'Collar Style',
      },
    ],
    price: 95000,
    notes: 'Set of two bespoke tuxedo shirts with Marcella bib front.',
    status: 'Ready',
    pickupDateTime: '2026-09-13T11:00:00.000Z',
    createdAt: '2025-09-03T12:00:00.000Z',
  },
  {
    id: 'ord-105',
    clientId: 'c-6',
    garmentType: 'Bespoke Tuxedo Suit',
    measurementSnapshotId: 'ms-4',
    referenceImages: [
      {
        id: 'img-7',
        url: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=600&q=80',
        title: 'Embroidery Swatch',
      },
      {
        id: 'img-7b',
        url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=600&q=80',
        title: 'Satin Lapel',
      },
      {
        id: 'img-7c',
        url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80',
        title: 'Lining Silk',
      },
    ],
    price: 210000,
    notes: 'Hand embroidery underway at partner atelier.',
    status: 'In Progress',
    pickupDateTime: '2026-09-18T15:30:00.000Z',
    createdAt: '2025-08-30T10:00:00.000Z',
  },
];

export const PRESET_IMAGE_SWATCHES = [
  {
    title: 'Super 130s Navy Wool',
    url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=600&q=80',
    note: 'Dark navy twill, lightweight 260g four-season wool.',
  },
  {
    title: 'Duchess Satin Ivory',
    url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80',
    note: 'Lustrous heavyweight silk satin for structured eveningwear.',
  },
  {
    title: 'Charcoal Herringbone',
    url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80',
    note: 'Traditional British woolen spun weave for autumn coats.',
  },
  {
    title: 'Emerald Silk Velvet',
    url: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=600&q=80',
    note: 'Rich pile drape with deep luster for formal gowns.',
  },
  {
    title: 'Atelier Tailoring Sketch',
    url: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=600&q=80',
    note: 'Pencil design sketch showing silhouette balance & proportion.',
  },
];
