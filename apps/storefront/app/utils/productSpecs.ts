import type { ProductVariant } from '@ironoak/contracts';

export interface SpecRow {
  label: string;
  value: string;
}

const weightFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });

export function formatWeight(grams: number): string {
  return `${weightFormatter.format(grams / 1000)} kg`;
}

/** "shaftDiameter" → "Shaft diameter" */
function humanize(key: string): string {
  const words = key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function formatValue(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number' || typeof value === 'string') return String(value);
  return null; // nested structures are not shown as specs
}

/** Spec rows for the selected variant: typed columns first, free-form attributes after. */
export function variantSpecs(variant: ProductVariant): SpecRow[] {
  const rows: SpecRow[] = [];

  if (variant.weightGrams !== null)
    rows.push({ label: 'Weight', value: formatWeight(variant.weightGrams) });
  if (variant.material) rows.push({ label: 'Material', value: variant.material });
  if (variant.finish) rows.push({ label: 'Finish', value: variant.finish });
  if (variant.color) rows.push({ label: 'Color', value: variant.color });

  for (const [key, raw] of Object.entries(variant.attributes ?? {})) {
    const value = formatValue(raw);
    if (value !== null) rows.push({ label: humanize(key), value });
  }

  rows.push({ label: 'SKU', value: variant.sku });
  return rows;
}
