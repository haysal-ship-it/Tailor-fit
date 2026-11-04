import test from 'node:test';
import assert from 'node:assert/strict';

test('order ID collision resistance: generates unique IDs in rapid succession', () => {
  const ids = new Set<string>();
  for (let i = 0; i < 1000; i++) {
    const id = `ord-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    assert.equal(ids.has(id), false, `Collision detected on ID: ${id}`);
    ids.add(id);
  }
  assert.equal(ids.size, 1000);
});

test('client ID collision resistance: generates unique IDs in rapid succession', () => {
  const ids = new Set<string>();
  for (let i = 0; i < 1000; i++) {
    const id = `c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    assert.equal(ids.has(id), false, `Collision detected on client ID: ${id}`);
    ids.add(id);
  }
  assert.equal(ids.size, 1000);
});
