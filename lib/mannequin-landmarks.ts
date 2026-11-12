export type MannequinGender = 'female' | 'male';
export type MannequinViewAngle = 0 | 90 | 180 | 270;

export interface RotatableLandmark3D {
  key: string;
  label: string;
  maleLabel?: string;
  zone: 'Head/Neck' | 'Torso' | 'Upper Limb' | 'Lower limb';
  /** Y coordinate in the 636x730 canvas space */
  y: number;
  /** X offset from spine centerline (318) in Front view (+ is viewer's right) */
  x3dFemale: number;
  x3dMale: number;
  /** Z offset from spine centerline (+ is anterior/front, - is posterior/back) */
  z3dFemale: number;
  z3dMale: number;
  /** Views where this landmark is clearly visible and not occluded */
  visibleViews: MannequinViewAngle[];
  /** Preferred label side per cardinal view */
  sideByView: Record<MannequinViewAngle, 'left' | 'right'>;
  /** Vertical offset for kinked leader lines so labels never collide */
  labelYOffset?: number;
}

/**
 * All 21 Canonical Anatomical Sizing Landmarks mapped onto the 636x730 3D Mannequin:
 * 1. Head/Neck: Head circumference, Neck circumference, Neckline, Shoulder to Neck
 * 2. Torso: Shoulder width, Bust/chest, Waist circumference, Body length, Front length, Hip Height
 * 3. Upper Limb: Sleeve length, Biceps, Wrist circumference, Armhole, Elbow length
 * 4. Lower limb: Inseam, Outseam, Thigh circumference, Knee circumference, Rise, Thigh length
 */
export const MANNEQUIN_LANDMARKS_3D: RotatableLandmark3D[] = [
  // =========================================================================
  // 1. HEAD / NECK (4 items)
  // =========================================================================
  {
    key: 'head_circumference',
    label: 'Head circumference',
    zone: 'Head/Neck',
    y: 78,
    x3dFemale: 0,
    x3dMale: 0,
    z3dFemale: 24,
    z3dMale: 26,
    visibleViews: [0, 90, 180, 270],
    sideByView: { 0: 'left', 90: 'left', 180: 'left', 270: 'right' },
    labelYOffset: -18,
  },
  {
    key: 'neck_circumference',
    label: 'Neck circumference',
    zone: 'Head/Neck',
    y: 144,
    x3dFemale: 0,
    x3dMale: 0,
    z3dFemale: 18,
    z3dMale: 21,
    visibleViews: [0, 90, 180, 270],
    sideByView: { 0: 'left', 90: 'left', 180: 'left', 270: 'right' },
    labelYOffset: -12,
  },
  {
    key: 'neckline',
    label: 'Neckline',
    zone: 'Head/Neck',
    y: 168,
    x3dFemale: 0,
    x3dMale: 0,
    z3dFemale: 26,
    z3dMale: 28,
    visibleViews: [0, 90, 270],
    sideByView: { 0: 'left', 90: 'left', 180: 'left', 270: 'right' },
    labelYOffset: 10,
  },
  {
    key: 'shoulder_to_neck',
    label: 'Shoulder to Neck',
    zone: 'Head/Neck',
    y: 155,
    x3dFemale: -30,
    x3dMale: -36,
    z3dFemale: 8,
    z3dMale: 10,
    visibleViews: [0, 90, 180, 270],
    sideByView: { 0: 'left', 90: 'left', 180: 'right', 270: 'right' },
    labelYOffset: -24,
  },

  // =========================================================================
  // 2. TORSO (6 items)
  // =========================================================================
  {
    key: 'shoulder_width',
    label: 'Shoulder width',
    zone: 'Torso',
    y: 165,
    x3dFemale: 58,
    x3dMale: 72,
    z3dFemale: 0,
    z3dMale: 0,
    visibleViews: [0, 90, 180, 270],
    sideByView: { 0: 'right', 90: 'right', 180: 'left', 270: 'left' },
    labelYOffset: -32,
  },
  {
    key: 'bust_chest',
    label: 'Bust/chest',
    zone: 'Torso',
    y: 222,
    x3dFemale: 34,
    x3dMale: 42,
    z3dFemale: 40,
    z3dMale: 36,
    visibleViews: [0, 90, 270],
    sideByView: { 0: 'right', 90: 'left', 180: 'right', 270: 'right' },
    labelYOffset: -8,
  },
  {
    key: 'waist_circumference',
    label: 'Waist circumference',
    zone: 'Torso',
    y: 288,
    x3dFemale: -42,
    x3dMale: -52,
    z3dFemale: 30,
    z3dMale: 34,
    visibleViews: [0, 90, 180, 270],
    sideByView: { 0: 'left', 90: 'left', 180: 'right', 270: 'right' },
    labelYOffset: -18,
  },
  {
    key: 'body_length',
    label: 'Body length',
    zone: 'Torso',
    y: 256,
    x3dFemale: 0,
    x3dMale: 0,
    z3dFemale: -34,
    z3dMale: -38,
    visibleViews: [0, 90, 180, 270],
    sideByView: { 0: 'right', 90: 'right', 180: 'right', 270: 'left' },
    labelYOffset: 12,
  },
  {
    key: 'front_length',
    label: 'Front length',
    zone: 'Torso',
    y: 248,
    x3dFemale: -14,
    x3dMale: -16,
    z3dFemale: 36,
    z3dMale: 35,
    visibleViews: [0, 90, 270],
    sideByView: { 0: 'left', 90: 'left', 180: 'left', 270: 'right' },
    labelYOffset: 0,
  },
  {
    key: 'hip_height',
    label: 'Hip Height',
    zone: 'Torso',
    y: 346,
    x3dFemale: 58,
    x3dMale: 60,
    z3dFemale: -36,
    z3dMale: -34,
    visibleViews: [0, 90, 180, 270],
    sideByView: { 0: 'right', 90: 'right', 180: 'left', 270: 'left' },
    labelYOffset: 0,
  },

  // =========================================================================
  // 3. UPPER LIMB (5 items)
  // =========================================================================
  {
    key: 'armhole',
    label: 'Armhole',
    zone: 'Upper Limb',
    y: 192,
    x3dFemale: -64,
    x3dMale: -76,
    z3dFemale: 12,
    z3dMale: 14,
    visibleViews: [0, 90, 180, 270],
    sideByView: { 0: 'left', 90: 'left', 180: 'right', 270: 'right' },
    labelYOffset: -14,
  },
  {
    key: 'biceps',
    label: 'Biceps',
    zone: 'Upper Limb',
    y: 184,
    x3dFemale: 108,
    x3dMale: 120,
    z3dFemale: 8,
    z3dMale: 10,
    visibleViews: [0, 180],
    sideByView: { 0: 'right', 90: 'right', 180: 'left', 270: 'left' },
    labelYOffset: -26,
  },
  {
    key: 'elbow_length',
    label: 'Elbow length',
    zone: 'Upper Limb',
    y: 186,
    x3dFemale: -145,
    x3dMale: -158,
    z3dFemale: -6,
    z3dMale: -6,
    visibleViews: [0, 180],
    sideByView: { 0: 'left', 90: 'left', 180: 'right', 270: 'right' },
    labelYOffset: 26,
  },
  {
    key: 'sleeve_length',
    label: 'Sleeve length',
    zone: 'Upper Limb',
    y: 186,
    x3dFemale: 176,
    x3dMale: 188,
    z3dFemale: 0,
    z3dMale: 0,
    visibleViews: [0, 180],
    sideByView: { 0: 'right', 90: 'right', 180: 'left', 270: 'left' },
    labelYOffset: 28,
  },
  {
    key: 'wrist_circumference',
    label: 'Wrist circumference',
    zone: 'Upper Limb',
    y: 186,
    x3dFemale: -228,
    x3dMale: -242,
    z3dFemale: 4,
    z3dMale: 4,
    visibleViews: [0, 180],
    sideByView: { 0: 'left', 90: 'left', 180: 'right', 270: 'right' },
    labelYOffset: 0,
  },

  // =========================================================================
  // 4. LOWER LIMB (6 items)
  // =========================================================================
  {
    key: 'rise',
    label: 'Rise',
    zone: 'Lower limb',
    y: 374,
    x3dFemale: 0,
    x3dMale: 0,
    z3dFemale: 32,
    z3dMale: 34,
    visibleViews: [0, 90, 180, 270],
    sideByView: { 0: 'left', 90: 'left', 180: 'left', 270: 'right' },
    labelYOffset: 12,
  },
  {
    key: 'thigh_circumference',
    label: 'Thigh circumference',
    zone: 'Lower limb',
    y: 432,
    x3dFemale: 38,
    x3dMale: 42,
    z3dFemale: 24,
    z3dMale: 26,
    visibleViews: [0, 90, 180, 270],
    sideByView: { 0: 'right', 90: 'left', 180: 'left', 270: 'right' },
    labelYOffset: 0,
  },
  {
    key: 'thigh_length',
    label: 'Thigh length',
    zone: 'Lower limb',
    y: 468,
    x3dFemale: -38,
    x3dMale: -42,
    z3dFemale: 24,
    z3dMale: 26,
    visibleViews: [0, 90, 270],
    sideByView: { 0: 'left', 90: 'left', 180: 'right', 270: 'right' },
    labelYOffset: 0,
  },
  {
    key: 'knee_circumference',
    label: 'Knee circumference',
    zone: 'Lower limb',
    y: 524,
    x3dFemale: 34,
    x3dMale: 38,
    z3dFemale: 18,
    z3dMale: 20,
    visibleViews: [0, 90, 180, 270],
    sideByView: { 0: 'right', 90: 'left', 180: 'left', 270: 'right' },
    labelYOffset: 0,
  },
  {
    key: 'inseam',
    label: 'Inseam',
    zone: 'Lower limb',
    y: 562,
    x3dFemale: -20,
    x3dMale: -22,
    z3dFemale: 8,
    z3dMale: 8,
    visibleViews: [0, 180],
    sideByView: { 0: 'left', 90: 'left', 180: 'right', 270: 'right' },
    labelYOffset: 16,
  },
  {
    key: 'outseam',
    label: 'Outseam',
    zone: 'Lower limb',
    y: 596,
    x3dFemale: 42,
    x3dMale: 46,
    z3dFemale: 0,
    z3dMale: 0,
    visibleViews: [0, 90, 180, 270],
    sideByView: { 0: 'right', 90: 'right', 180: 'left', 270: 'left' },
    labelYOffset: 16,
  },
];
