import test from 'node:test';
import assert from 'node:assert/strict';
import { getOrderStatusPresentation, formatDate } from './status';

test('Order Status Presentation - Standard mappings', () => {
  const pending = getOrderStatusPresentation('Pending');
  assert.equal(pending.label, 'Pending');
  assert.equal(pending.badgeLabel, 'Pending');

  const inProgress = getOrderStatusPresentation('In Progress');
  assert.equal(inProgress.label, 'In progress');
  assert.equal(inProgress.badgeLabel, 'In progress');

  const ready = getOrderStatusPresentation('Ready');
  assert.equal(ready.label, 'Ready for pickup');
  assert.equal(ready.badgeLabel, 'Ready for pickup');

  const pickedUp = getOrderStatusPresentation('Picked Up');
  assert.equal(pickedUp.label, 'Collected');
  assert.equal(pickedUp.badgeLabel, 'Collected');

  const completed = getOrderStatusPresentation('Completed');
  assert.equal(completed.label, 'Completed');
  assert.equal(completed.badgeLabel, 'Completed');
});

test('Order Status Presentation - Deadline risk', () => {
  const fakeNow = new Date('2026-11-02T12:00:00Z');

  // Past due date on in-progress order should be Overdue
  const overdueOrder = getOrderStatusPresentation('In Progress', '2026-10-25T00:00:00Z', fakeNow);
  assert.equal(overdueOrder.badgeLabel, 'Overdue');
  assert.equal(overdueOrder.risk, 'overdue');

  // Completed order with past due date should NOT be Overdue
  const completedOrder = getOrderStatusPresentation('Completed', '2026-10-25T00:00:00Z', fakeNow);
  assert.equal(completedOrder.badgeLabel, 'Completed');
  assert.equal(completedOrder.risk, 'none');

  // Order due in 1 day should be Due soon
  const dueSoonOrder = getOrderStatusPresentation('In Progress', '2026-11-03T00:00:00Z', fakeNow);
  assert.equal(dueSoonOrder.badgeLabel, 'Due soon');
  assert.equal(dueSoonOrder.risk, 'due-soon');

  // Order due in 10 days should remain In progress (NOT Urgent)
  const futureOrder = getOrderStatusPresentation('In Progress', '2026-11-12T00:00:00Z', fakeNow);
  assert.equal(futureOrder.badgeLabel, 'In progress');
  assert.equal(futureOrder.risk, 'none');
});

test('Format Date helper', () => {
  assert.equal(formatDate('2026-11-02T00:00:00Z', '-'), '02-11-2026');
  assert.equal(formatDate('2026-05-09T00:00:00Z', '/'), '09/05/2026');
  assert.equal(formatDate(''), '');
  assert.equal(formatDate(null), '');
});
