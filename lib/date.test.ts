import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDueDateToISO, isValidCalendarDate } from './initial-data';

test('isValidCalendarDate strictly verifies calendar days', () => {
  // Valid dates
  assert.equal(isValidCalendarDate(2026, 2, 28), true);
  assert.equal(isValidCalendarDate(2024, 2, 29), true); // Leap year 2024
  assert.equal(isValidCalendarDate(2026, 12, 31), true);

  // Invalid dates
  assert.equal(isValidCalendarDate(2026, 2, 31), false); // Feb 31 does not exist
  assert.equal(isValidCalendarDate(2025, 2, 29), false); // 2025 is not a leap year
  assert.equal(isValidCalendarDate(2026, 4, 31), false); // April has 30 days
  assert.equal(isValidCalendarDate(2026, 6, 31), false); // June has 30 days
  assert.equal(isValidCalendarDate(2026, 0, 15), false); // Month 0 is invalid
  assert.equal(isValidCalendarDate(2026, 13, 1), false); // Month 13 is invalid
});

test('parseDueDateToISO rejects rollover and invalid dates', () => {
  // Rejects 31/02/2026 without rolling over to 03/03/2026
  assert.equal(parseDueDateToISO('31/02/2026'), '');

  // Rejects 31-04-2026
  assert.equal(parseDueDateToISO('31-04-2026'), '');

  // Accepts valid date
  const valid = parseDueDateToISO('15/05/2026');
  assert.ok(valid.startsWith('2026-05-15'));

  // Does not invent a date for empty input
  assert.equal(parseDueDateToISO(''), '');
  assert.equal(parseDueDateToISO(undefined), '');
});
