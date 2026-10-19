import { productQuerySchema, type ProductQuery } from '@ironoak/contracts';

export const LISTING_PAGE_SIZE = 12;
const DEFAULT_SORT: ProductQuery['sort'] = 'newest';

export type ListingSort = ProductQuery['sort'];

export interface ListingFilters {
  category?: string;
  material?: string;
  minPrice?: number; // cents — the API's unit, no conversions in the URL
  maxPrice?: number;
  minWeight?: number; // grams
  maxWeight?: number;
  sort: ListingSort;
  page: number;
}

export type FilterPatch = Partial<ListingFilters>;

/**
 * The URL is the only source of truth for the listing: shareable, bookmarkable,
 * and the back button undoes the last filter. Components propose changes,
 * this composable writes them.
 */
export function useProductFilters() {
  const route = useRoute();

  const filters = computed<ListingFilters>(() => {
    // same schema as the API; junk in the URL falls back to defaults instead of erroring
    const parsed = productQuerySchema.safeParse(route.query);
    const query = parsed.success ? parsed.data : productQuerySchema.parse({});
    return {
      category: query.category,
      material: query.material,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      minWeight: query.minWeight,
      maxWeight: query.maxWeight,
      sort: query.sort ?? DEFAULT_SORT,
      page: query.page ?? 1,
    };
  });

  /** Only what differs from the defaults ends up in the URL. */
  function toQuery(next: ListingFilters): Record<string, string> {
    const query: Record<string, string> = {};
    if (next.category) query.category = next.category;
    if (next.material) query.material = next.material;
    if (next.minPrice !== undefined) query.minPrice = String(next.minPrice);
    if (next.maxPrice !== undefined) query.maxPrice = String(next.maxPrice);
    if (next.minWeight !== undefined) query.minWeight = String(next.minWeight);
    if (next.maxWeight !== undefined) query.maxWeight = String(next.maxWeight);
    if (next.sort !== DEFAULT_SORT) query.sort = next.sort;
    if (next.page > 1) query.page = String(next.page);
    return query;
  }

  /** Any change of filters starts again from page 1, unless it is the page itself. */
  function locationFor(patch: FilterPatch, { resetPage = true } = {}) {
    const next = { ...filters.value, ...(resetPage && { page: 1 }), ...patch };
    return { path: '/products', query: toQuery(next) };
  }

  function update(patch: FilterPatch, options?: { resetPage?: boolean }) {
    return navigateTo(locationFor(patch, options));
  }

  /** Clears refinements; keeps the category and the sort the customer chose. */
  function clear() {
    return navigateTo(
      locationFor({
        material: undefined,
        minPrice: undefined,
        maxPrice: undefined,
        minWeight: undefined,
        maxWeight: undefined,
      }),
    );
  }

  const apiParams = computed(() => {
    const { category, material, minPrice, maxPrice, minWeight, maxWeight, sort, page } =
      filters.value;
    return {
      ...(category && { category }),
      ...(material && { material }),
      ...(minPrice !== undefined && { minPrice }),
      ...(maxPrice !== undefined && { maxPrice }),
      ...(minWeight !== undefined && { minWeight }),
      ...(maxWeight !== undefined && { maxWeight }),
      sort,
      page,
      limit: LISTING_PAGE_SIZE,
    };
  });

  /** Filters beyond the category — they narrow a list rather than define one. */
  const hasRefinements = computed(() => {
    const f = filters.value;
    return Boolean(
      f.material ||
      f.minPrice !== undefined ||
      f.maxPrice !== undefined ||
      f.minWeight !== undefined ||
      f.maxWeight !== undefined,
    );
  });

  return { filters, apiParams, hasRefinements, update, clear, locationFor };
}

/** 22500 → "22.5 kg" */
export function formatKg(grams: number): string {
  const kg = grams / 1000;
  return `${Number.isInteger(kg) ? kg : kg.toFixed(1)} kg`;
}
