import { Client, MeasurementSnapshot, Order, AppSettings } from '@/types';

export interface BackupPayload {
  version?: string;
  exportedAt?: string;
  clients: Client[];
  snapshots: MeasurementSnapshot[];
  orders: Order[];
  settings?: AppSettings;
}

export interface BackupValidationResult {
  isValid: boolean;
  error?: string;
  data?: BackupPayload;
  counts?: {
    clients: number;
    orders: number;
    snapshots: number;
  };
}

/**
 * Validates a backup payload parsed from JSON.
 * Ensures data integrity before restoring to prevent corruption.
 */
export function validateBackupPayload(raw: unknown): BackupValidationResult {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {
      isValid: false,
      error: 'Invalid backup file: Root must be a valid JSON object.',
    };
  }

  const obj = raw as Record<string, unknown>;

  // Check required collections
  if (!Array.isArray(obj.clients)) {
    return {
      isValid: false,
      error: 'Invalid backup file: "clients" array is missing or corrupted.',
    };
  }

  if (!Array.isArray(obj.snapshots)) {
    return {
      isValid: false,
      error: 'Invalid backup file: "snapshots" array is missing or corrupted.',
    };
  }

  if (!Array.isArray(obj.orders)) {
    return {
      isValid: false,
      error: 'Invalid backup file: "orders" array is missing or corrupted.',
    };
  }

  // Validate clients
  for (let i = 0; i < obj.clients.length; i++) {
    const c = obj.clients[i];
    if (!c || typeof c !== 'object' || !c.id || typeof c.name !== 'string') {
      return {
        isValid: false,
        error: `Invalid client record at index ${i}: ID and name are required.`,
      };
    }
  }

  // Validate snapshots
  for (let i = 0; i < obj.snapshots.length; i++) {
    const s = obj.snapshots[i];
    if (!s || typeof s !== 'object' || !s.id || !s.clientId) {
      return {
        isValid: false,
        error: `Invalid measurement snapshot record at index ${i}: ID and clientId are required.`,
      };
    }
  }

  // Validate orders
  for (let i = 0; i < obj.orders.length; i++) {
    const o = obj.orders[i];
    if (!o || typeof o !== 'object' || !o.id || !o.clientId) {
      return {
        isValid: false,
        error: `Invalid order record at index ${i}: ID and clientId are required.`,
      };
    }
  }

  const payload: BackupPayload = {
    version: typeof obj.version === 'string' ? obj.version : '2.0',
    exportedAt: typeof obj.exportedAt === 'string' ? obj.exportedAt : new Date().toISOString(),
    clients: obj.clients as Client[],
    snapshots: obj.snapshots as MeasurementSnapshot[],
    orders: obj.orders as Order[],
    settings: (obj.settings && typeof obj.settings === 'object') ? (obj.settings as AppSettings) : undefined,
  };

  return {
    isValid: true,
    data: payload,
    counts: {
      clients: payload.clients.length,
      orders: payload.orders.length,
      snapshots: payload.snapshots.length,
    },
  };
}
