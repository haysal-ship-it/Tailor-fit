export type UnitType = 'cm' | 'in';

export type OrderStatus = 'Pending' | 'Completed' | 'Paused' | 'In Progress' | 'Ready' | 'Picked Up';

export type AnatomicalZoneId =
  | 'head_neck'
  | 'torso'
  | 'upper_limb'
  | 'lower_limb'
  // Legacy compatibility aliases
  | 'upper_body'
  | 'lower_body'
  | 'arms';

export interface ReferenceImage {
  storagePath?: string;
  id: string;
  url: string;
  note?: string;
  title?: string;
}

export interface Client {
  version?: number;
  photoPath?: string;
  id: string;
  name: string;
  phone: string;
  email: string;
  notes: string;
  photoUrl?: string;
  createdAt: string;
}

export interface MeasurementSnapshot {
  version?: number;
  id: string;
  clientId: string;
  date: string;
  unit: UnitType;
  garmentType: string;
  measurements: Record<string, number | string>;
  notes?: string;
  mannequinGender?: 'female' | 'male';
}

export interface Order {
  version?: number;
  id: string;
  clientId: string;
  garmentType: string;
  measurementSnapshotId?: string;
  referenceImages: ReferenceImage[];
  price: number;
  paidAmount?: number;
  currency?: string;
  notes: string;
  status: OrderStatus;
  pickupDateTime: string;
  createdAt: string;
}

export interface HotspotDefinition {
  key: string;
  label: string;
  view: 'front' | 'back' | 'both';
  category: AnatomicalZoneId;
  // SVG coordinates on 300x600 legacy viewBox
  frontX?: number;
  frontY?: number;
  backX?: number;
  backY?: number;
  defaultValCm?: number;
  hint: string;
  isCustom?: boolean;
}

export interface GarmentTemplate {
  id: string;
  name: string;
  fieldKeys: string[];
  description: string;
}

export interface AppSettings {
  version?: number;
  onboarding?: Record<string, unknown>;
  defaultUnit: UnitType;
  currency?: string;
  customFields: HotspotDefinition[];
  templates: GarmentTemplate[];
}
