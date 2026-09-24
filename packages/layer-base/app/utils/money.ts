export function dollarsToCents(dollars: number): number {
  // Math.round guards against 79.9 * 100 = 7989.999...
  return Math.round(dollars * 100);
}

export function centsToDollars(cents: number): number {
  return cents / 100;
}

interface FormatPriceOptions {
  /** drop ".00" for whole amounts: 30000 → "$300", 34950 → "$349.50" */
  trimZeros?: boolean;
}

// Intl.NumberFormat is expensive to construct — reuse one per configuration
const formatters = new Map<string, Intl.NumberFormat>();

function formatterFor(currency: string, fractionDigits: 0 | 2): Intl.NumberFormat {
  const key = `${currency}:${fractionDigits}`;
  let formatter = formatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
    formatters.set(key, formatter);
  }
  return formatter;
}

export function formatPrice(cents: number, currency = 'USD', { trimZeros = false }: FormatPriceOptions = {}): string {
  const fractionDigits = trimZeros && cents % 100 === 0 ? 0 : 2;
  return formatterFor(currency, fractionDigits).format(cents / 100);
}

export function kgToGrams(kg: number): number {
  return Math.round(kg * 1000);
}

export function gramsToKg(grams: number): number {
  return grams / 1000;
}