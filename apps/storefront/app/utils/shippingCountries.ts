/** Countries IRONOAK ships to — ISO 3166-1 alpha-2 codes, as stored on the order. */
export const SHIPPING_COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'PL', name: 'Poland' },
] as const;

export function countryName(code: string): string {
  return SHIPPING_COUNTRIES.find((country) => country.code === code)?.name ?? code;
}
