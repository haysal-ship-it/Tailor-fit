import test from 'node:test';
import assert from 'node:assert/strict';
import { validateBackupPayload } from './backup';

test('Backup validation: accepts valid backup payload', () => {
  const valid = {
    version: '2.0',
    exportedAt: '2026-11-02T10:00:00Z',
    clients: [
      { id: 'c1', name: 'Alice Smith', phone: '12345', email: 'alice@test.com', notes: '', createdAt: '2026-11-01' },
      { id: 'c2', name: 'Bob Jones', phone: '67890', email: 'bob@test.com', notes: '', createdAt: '2026-11-01' },
    ],
    snapshots: [
      { id: 's1', clientId: 'c1', date: '01/11/2026', unit: 'cm', garmentType: 'Suit', measurements: { chest: 95 } },
    ],
    orders: [
      { id: 'o1', clientId: 'c1', garmentType: 'Suit', referenceImages: [], price: 1500, notes: '', status: 'In Progress', pickupDateTime: '2026-11-10', createdAt: '2026-11-01' },
    ],
  };

  const result = validateBackupPayload(valid);
  assert.equal(result.isValid, true);
  assert.equal(result.counts?.clients, 2);
  assert.equal(result.counts?.snapshots, 1);
  assert.equal(result.counts?.orders, 1);
});

test('Backup validation: rejects corrupt or missing fields', () => {
  // Non-object
  assert.equal(validateBackupPayload(null).isValid, false);
  assert.equal(validateBackupPayload('string').isValid, false);
  assert.equal(validateBackupPayload([]).isValid, false);

  // Missing collections
  assert.equal(validateBackupPayload({ clients: [] }).isValid, false);
  assert.equal(validateBackupPayload({ clients: [], snapshots: [] }).isValid, false);

  // Corrupt record in clients
  const badClient = {
    clients: [{ id: 'c1' }], // missing name
    snapshots: [],
    orders: [],
  };
  const badClientResult = validateBackupPayload(badClient);
  assert.equal(badClientResult.isValid, false);
  assert.match(badClientResult.error!, /Invalid client record/);

  // Corrupt record in orders
  const badOrder = {
    clients: [{ id: 'c1', name: 'Alice' }],
    snapshots: [],
    orders: [{ price: 100 }], // missing id and clientId
  };
  const badOrderResult = validateBackupPayload(badOrder);
  assert.equal(badOrderResult.isValid, false);
  assert.match(badOrderResult.error!, /Invalid order record/);
});
