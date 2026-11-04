import test from 'node:test';
import assert from 'node:assert/strict';
import { convertMeasurement, formatMeasurement, formatCurrency } from './units';

test('convertMeasurement: cm to inches and back', () => {
  // 40 cm to inches
  const inVal = convertMeasurement(40, 'cm', 'in');
  assert.equal(inVal, 15.7);

  // 15.7 in to cm
  const cmVal = convertMeasurement(inVal, 'in', 'cm');
  assert.equal(Math.round(cmVal), 40);

  // Identity conversion
  assert.equal(convertMeasurement(50, 'cm', 'cm'), 50);
  assert.equal(convertMeasurement(20, 'in', 'in'), 20);
});

test('formatMeasurement formats correctly', () => {
  assert.equal(formatMeasurement(40, 'cm'), '40 cm');
  assert.equal(formatMeasurement(15.7, 'in'), '15.7"');
  assert.equal(formatMeasurement(undefined, 'cm'), '—');
});

test('formatCurrency formats accurately', () => {
  assert.equal(formatCurrency(150000, '₦'), '₦150,000.00');
  assert.equal(formatCurrency(250, '$'), '$250.00');
  assert.equal(formatCurrency(undefined, '₦'), '₦0.00');
});
