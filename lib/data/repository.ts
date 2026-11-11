'use client';
import type { AppSettings, Client, MeasurementSnapshot, Order } from '@/types';
import { DEFAULT_SETTINGS } from '@/lib/initial-data';
import { imageUrls, loadWorkspace } from './actions';
import { uploadImage } from './images';
import type { Operation } from './schema';

export type WorkspaceData = { clients: Client[]; snapshots: MeasurementSnapshot[]; orders: Order[]; settings: AppSettings };
type Row = { id: string; data: Record<string, unknown>; version: number; created_at: string };
export async function readWorkspace(): Promise<WorkspaceData> {
  const result = await loadWorkspace();
  if (!result.ok) throw new Error(result.error.message);
  const unpack = <T,>(kind: string) => (result.data[kind] as Row[]).map(row => ({ ...row.data, id: row.id, version: row.version, createdAt: row.created_at }) as T);
  const clients = unpack<Client>('clients');
  const snapshots = unpack<MeasurementSnapshot>('measurement_snapshots');
  const orders = unpack<Order>('orders');
  const settings = { ...DEFAULT_SETTINGS, ...unpack<AppSettings>('studio_settings')[0] };
  const paths = [...new Set([...clients.map(c => c.photoPath), ...orders.flatMap(o => o.referenceImages.map(i => i.storagePath))].filter((p): p is string => !!p))];
  const urls: Record<string, string> = {};
  for (let start = 0; start < paths.length; start += 500) {
    const signed = await imageUrls(paths.slice(start, start + 500));
    if (!signed.ok) throw new Error(signed.error.message);
    Object.assign(urls, signed.data);
  }
  clients.forEach(c => { if (c.photoPath) c.photoUrl = urls[c.photoPath] || ''; });
  orders.forEach(o => o.referenceImages.forEach(i => { if (i.storagePath) i.url = urls[i.storagePath] || ''; }));
  return { clients, snapshots, orders, settings };
}
export async function stageImages(operations: Operation[], owner: string): Promise<Operation[]> {
  const staged = structuredClone(operations);
  for (const op of staged) {
    if (op.action !== 'put' || !op.data) continue;
    if (op.kind === 'clients') {
      const client = op.data as unknown as Client;
      if (client.photoUrl && !client.photoPath) client.photoPath = await uploadImage(client.photoUrl, owner);
      if (client.photoPath) client.photoUrl = '';
    }
    if (op.kind === 'orders') {
      const order = op.data as unknown as Order;
      if (order.referenceImages.length > 6) throw new Error('Use up to six style references.');
      for (const image of order.referenceImages) {
        if (!image.storagePath) image.storagePath = await uploadImage(image.url, owner);
        image.url = '';
      }
    }
  }
  return staged;
}
