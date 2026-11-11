import { z } from 'zod';

const text = z.string().max(20000);
const uuid = z.string().uuid();
const optionalText = text.optional();
export const imageSchema = z.object({ id: text, url: text, storagePath: optionalText, note: optionalText, title: optionalText });
export const clientSchema = z.object({ id: uuid, name: z.string().trim().min(1).max(200), phone: text, email: z.union([z.literal(''), z.string().email()]), notes: text, photoUrl: optionalText, photoPath: optionalText, createdAt: optionalText, version: z.number().int().optional() });
export const snapshotSchema = z.object({ id: uuid, clientId: uuid, date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), unit: z.enum(['cm', 'in']), garmentType: text, measurements: z.record(z.string().max(100), z.union([z.number().finite(), z.string().max(1000)])), notes: optionalText, mannequinGender: z.enum(['female', 'male']).optional(), version: z.number().int().optional() });
export const orderSchema = z.object({ id: uuid, clientId: uuid, garmentType: z.string().trim().min(1).max(200), measurementSnapshotId: uuid.optional(), referenceImages: z.array(imageSchema).max(6), price: z.number().finite().nonnegative(), paidAmount: z.number().finite().nonnegative().optional(), currency: z.string().max(12).optional(), notes: text, status: z.enum(['Pending', 'Completed', 'Paused', 'In Progress', 'Ready', 'Picked Up']), pickupDateTime: text, createdAt: optionalText, version: z.number().int().optional() });
export const settingsSchema = z.object({ defaultUnit: z.enum(['cm', 'in']), currency: z.string().max(12).optional(), customFields: z.array(z.object({ key: z.string().min(1).max(100), label: z.string().min(1).max(200), view: z.enum(['front','back','both']), category: z.enum(['head_neck','torso','upper_limb','lower_limb','upper_body','lower_body','arms']), frontX: z.number().optional(), frontY: z.number().optional(), backX: z.number().optional(), backY: z.number().optional(), defaultValCm: z.number().optional(), hint: text, isCustom: z.boolean().optional() })).max(500), templates: z.array(z.object({ id: text, name: z.string().min(1).max(200), fieldKeys: z.array(z.string().max(100)).max(500), description: text.optional() })).max(500), onboarding: z.record(z.string(), z.unknown()).optional(), version: z.number().int().optional() });
export const operationSchema = z.object({ kind: z.enum(['clients','measurement_snapshots','orders','studio_settings']), action: z.enum(['put','delete']), id: uuid, expected: z.number().int().nonnegative(), data: z.record(z.string(), z.unknown()).optional() });
export type Operation = z.infer<typeof operationSchema>;
export type ErrorCode = 'AUTH_REQUIRED' | 'VALIDATION' | 'CONFLICT' | 'OFFLINE' | 'CONFIGURATION' | 'SERVER';
export type Result<T> = { ok: true; data: T } | { ok: false; error: { code: ErrorCode; message: string } };
export function normalizeDate(value: string) {
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0,10);
  const match = value.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
  if (match) return `${match[3]}-${match[2]}-${match[1]}`;
  throw new Error('A fitting has an invalid date. Use day/month/year or year-month-day.');
}
export function validateOperation(op: Operation) {
  if (op.action === 'delete') return op;
  const schemas = { clients: clientSchema, measurement_snapshots: snapshotSchema, orders: orderSchema, studio_settings: settingsSchema };
  const data = schemas[op.kind].parse(op.kind === 'studio_settings' ? op.data : { ...op.data, id: op.id });
  return { ...op, data };
}
