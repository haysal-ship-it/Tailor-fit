/**
 * Smart Input Formatters for TailorFit
 * - formatPriceInput: dynamically inserts thousands commas (e.g. 1000 -> 1,000)
 * - parsePriceInput: converts formatted price string to numeric value
 * - formatDateInput: automatically inserts slashes for DD/MM/YYYY
 */

export function formatPriceInput(val: string | number | undefined): string {
  if (val === undefined || val === null || val === '') return '';
  const str = String(val);

  // Keep only digits and decimal points
  const sanitized = str.replace(/[^\d.]/g, '');
  if (!sanitized) return '';

  const parts = sanitized.split('.');
  const integerDigits = parts[0];
  const decimalDigits = parts.length > 1 ? parts.slice(1).join('').slice(0, 2) : undefined;

  // Format integer digits with commas
  const formattedInteger = integerDigits ? Number(integerDigits).toLocaleString('en-US') : '';

  if (decimalDigits !== undefined) {
    return `${formattedInteger || '0'}.${decimalDigits}`;
  }
  return formattedInteger;
}

export function parsePriceInput(val: string | number | undefined): number {
  if (typeof val === 'number') return isFinite(val) ? val : 0;
  if (!val) return 0;
  const num = parseFloat(String(val).replace(/,/g, ''));
  return isNaN(num) || !isFinite(num) ? 0 : num;
}

export function formatDateInput(val: string, prevVal = ''): string {
  if (!val) return '';

  // Detect backspace over a slash (e.g. from "15/" to "15" or "15/05/" to "15/05")
  if (
    prevVal.length > val.length &&
    (prevVal.endsWith('/') || prevVal.endsWith('-')) &&
    val.length === prevVal.length - 1
  ) {
    const digits = val.replace(/\D/g, '');
    if (digits.length === 2) return digits.slice(0, 1);
    if (digits.length === 4) return `${digits.slice(0, 2)}/${digits.slice(2, 3)}`;
  }

  // Extract up to 8 digits
  const digits = val.replace(/\D/g, '').slice(0, 8);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
}
