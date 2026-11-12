import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatPriceInput, parsePriceInput, formatDateInput } from './smart-inputs';

test('formatPriceInput adds commas correctly', () => {
  assert.equal(formatPriceInput(''), '');
  assert.equal(formatPriceInput('100'), '100');
  assert.equal(formatPriceInput('1000'), '1,000');
  assert.equal(formatPriceInput('10000'), '10,000');
  assert.equal(formatPriceInput('1000000'), '1,000,000');
  assert.equal(formatPriceInput('10000.5'), '10,000.5');
  assert.equal(formatPriceInput('10000.50'), '10,000.50');
  assert.equal(formatPriceInput('.5'), '0.5');
  assert.equal(formatPriceInput(5000), '5,000');
});

test('parsePriceInput parses numeric value safely', () => {
  assert.equal(parsePriceInput('1,000'), 1000);
  assert.equal(parsePriceInput('10,000.50'), 10000.5);
  assert.equal(parsePriceInput(''), 0);
  assert.equal(parsePriceInput(2500), 2500);
});

test('formatDateInput automatically inserts slashes for DD/MM/YYYY', () => {
  assert.equal(formatDateInput('1'), '1');
  assert.equal(formatDateInput('15'), '15');
  assert.equal(formatDateInput('150'), '15/0');
  assert.equal(formatDateInput('1505'), '15/05');
  assert.equal(formatDateInput('15052'), '15/05/2');
  assert.equal(formatDateInput('15052026'), '15/05/2026');
  // Backspace over slash
  assert.equal(formatDateInput('15', '15/'), '1');
  assert.equal(formatDateInput('15/05', '15/05/'), '15/0');
});
