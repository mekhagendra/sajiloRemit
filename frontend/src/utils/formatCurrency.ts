/**
 * Format a number with 2–6 decimal places, showing as many significant
 * decimals as the value carries (minimum 2, maximum 6).
 */
export function formatCurrency(value: number): string {
  const fixed6 = value.toFixed(6);
  // Remove trailing zeros but keep at least 2 decimal places
  const trimmed = fixed6.replace(/0+$/, '');
  const [integer, decimal = ''] = trimmed.split('.');
  const padded = decimal.padEnd(2, '0');
  return `${integer}.${padded}`;
}
