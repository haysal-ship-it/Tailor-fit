import { UnitType } from '@/types';

/**
 * 1 inch = 2.54 cm exact conversion constant.
 */
export const CM_PER_INCH = 2.54;

/**
 * Convert a numerical measurement between centimeters and inches.
 * Keeps precision and rounds to 1 decimal place for tailoring display.
 */
export function convertMeasurement(
  value: number,
  fromUnit: UnitType,
  toUnit: UnitType
): number {
  if (fromUnit === toUnit || isNaN(value)) return value;
  if (fromUnit === 'cm' && toUnit === 'in') {
    return Math.round((value / CM_PER_INCH) * 10) / 10;
  }
  if (fromUnit === 'in' && toUnit === 'cm') {
    return Math.round((value * CM_PER_INCH) * 10) / 10;
  }
  return value;
}

/**
 * Format a measurement value with its unit symbol.
 */
export function formatMeasurement(
  value: number | string | undefined,
  unit: UnitType
): string {
  if (value === undefined || value === null || value === '') return '—';
  const num = typeof value === 'number' ? value : parseFloat(String(value));
  if (isNaN(num)) return String(value);
  const suffix = unit === 'in' ? '"' : ' cm';
  return `${num}${suffix}`;
}

/**
 * Format currency with symbol, supporting NGN (₦), USD ($), EUR (€), GBP (£).
 */
export function formatCurrency(
  amount: number | string | undefined,
  currencySymbol: string = '₦'
): string {
  if (amount === undefined || amount === null || amount === '') return `${currencySymbol}0.00`;
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount));
  if (isNaN(num)) return `${currencySymbol}0.00`;
  return `${currencySymbol}${num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
