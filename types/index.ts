export type UnitType = 'cm' | 'in';

export type OrderStatus = 'Pending' | 'Completed' | 'Paused' | 'In Progress' | 'Ready' | 'Picked Up';

export interface ReferenceImage {
  id: string;
  url: string;
  note?: string;
  title?: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  notes: string;
  photoUrl?: string;
  createdAt: string;
}

export interface MeasurementSnapshot {
  id: string;
  clientId: string;
  date: string;
  unit: UnitType;
  garmentType: string;
  measurements: Record<string, number | string>;
  notes?: string;
}

export interface Order {
  id: string;
  clientId: string;
  garmentType: string;
  measurementSnapshotId?: string;
  referenceImages: ReferenceImage[];
  price: number;
  notes: string;
  status: OrderStatus;
  pickupDateTime: string;
  createdAt: string;
}

export interface HotspotDefinition {
  key: string;
  label: string;
  view: 'front' | 'back' | 'both';
  category: 'head_neck' | 'upper_body' | 'lower_body' | 'arms';
  // SVG coordinates on 300x600 viewBox
  frontX?: number;
  frontY?: number;
  backX?: number;
  backY?: number;
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
  defaultUnit: UnitType;
  currency?: string;
  customFields: HotspotDefinition[];
  templates: GarmentTemplate[];
}
