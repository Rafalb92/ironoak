<script setup lang="ts">
import { useQuery } from '@pinia/colada';
import { IconAdjustmentsHorizontal, IconX } from '@tabler/icons-vue';
import { productListQuery } from '../../queries/products';
import { productFacetsQuery } from '../../queries/catalog';

const { filters, apiParams, hasRefinements, update, clear, locationFor } = useProductFilters();

// previous results stay on screen (dimmed) while the next ones load — no skeleton jump
const listQuery = useQuery(() => ({
  ...productListQuery(apiParams.value),
  placeholderData: (previous) => previous,
}));
const facetsQuery = useQuery(() => productFacetsQuery(filters.value.category));

const products = computed(() => listQuery.data.value?.items ?? []);
const total = computed(() => listQuery.data.value?.total ?? 0);
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / LISTING_PAGE_SIZE)));
const facets = computed(() => facetsQuery.data.value ?? null);
const refreshing = computed(() => listQuery.asyncStatus.value === 'loading' && !!listQuery.data.value);

const categoryName = computed(
  () => facets.value?.categories.find((category) => category.slug === filters.value.category)?.name,
);

// --- SEO: index the shop and its categories, not every filter combination ---
const siteUrl = useRuntimeConfig().public.siteUrl;
const canonicalPath = computed(() =>
  filters.value.category ? `/products?category=${encodeURIComponent(filters.value.category)}` : '/products',
);

useSeoMeta({
  title: () => categoryName.value ?? 'Shop all',
  description: () =>
    categoryName.value
      ? `${categoryName.value} in cast iron, brushed steel and solid oak — built to live in your home.`
      : 'Home gym equipment in cast iron, brushed steel and solid oak — built to live in your home.',
  robots: () => (hasRefinements.value || filters.value.sort !== 'newest' ? 'noindex, follow' : undefined),
});
useHead({
  link: [{ rel: 'canonical', href: () => `${siteUrl}${canonicalPath.value}` }],
});

// --- sort ---
const SORT_OPTIONS: { value: ListingSort; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'bestselling', label: 'Bestselling' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'name', label: 'Name' },
];

// --- active filter chips ---
const money = (cents: number) => formatPrice(cents, 'USD', { trimZeros: true });

function rangeLabel(min: number | undefined, max: number | undefined, format: (value: number) => string) {
  if (min !== undefined && max !== undefined) return `${format(min)} – ${format(max)}`;
  if (min !== undefined) return `From ${format(min)}`;
  return `Up to ${format(max!)}`;
}

const chips = computed(() => {
  const f = filters.value;
  const list: { key: string; label: string; remove: FilterPatch }[] = [];
  if (f.material) list.push({ key: 'material', label: f.material, remove: { material: undefined } });
  if (f.minPrice !== undefined || f.maxPrice !== undefined) {
    list.push({
      key: 'price',
      label: rangeLabel(f.minPrice, f.maxPrice, money),
      remove: { minPrice: undefined, maxPrice: undefined },
    });
  }
  if (f.minWeight !== undefined || f.maxWeight !== undefined) {
    list.push({
      key: 'weight',
      label: rangeLabel(f.minWeight, f.maxWeight, formatKg),
      remove: { minWeight: undefined, maxWeight: undefined },
    });
  }
  return list;
});

// --- mobile filters sheet ---
const filtersOpen = ref(false);

// --- pagination: bring the customer back to the top of the results ---
const resultsTop = useTemplateRef<HTMLElement>('resultsTop');
watch(
  () => filters.value.page,
  () => {
    // read at scroll time: page changes only happen in the browser, never during SSR
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    resultsTop.value?.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  },
);

const pageLink = (page: number) => locationFor({ page }, { resetPage: false });
</script>

<template>
  <div class="flex flex-col gap-10">
    <header ref="resultsTop" class="flex scroll-mt-28 flex-col gap-3">
      <h1 class="t-section">{{ categoryName ?? 'Shop all' }}</h1>
      <p class="t-spec text-fg-muted" aria-live="polite">
        {{ total }} {{ total === 1 ? 'product' : 'products' }}
      </p>
    </header>

    <div class="grid gap-10 lg:grid-cols-[15rem_1fr] lg:gap-16">
      <!-- desktop: filters in a sidebar -->
      <aside aria-label="Filters" class="hidden lg:block">
        <ProductFilters :facets="facets" :filters="filters" @change="update" />
      </aside>

      <div class="flex min-w-0 flex-col gap-8">
        <!-- toolbar -->
        <div class="flex flex-wrap items-center justify-between gap-3">
          <Button variant="outline" class="h-11 rounded-pill px-5 lg:hidden" @click="filtersOpen = true">
            <IconAdjustmentsHorizontal class="size-4" stroke="1.75" aria-hidden="true" />
            Filters
            <span v-if="chips.length" class="t-spec text-fg-muted">({{ chips.length }})</span>
          </Button>

          <div class="ml-auto flex items-center gap-3">
            <label for="listing-sort" class="t-spec text-fg-muted">Sort by</label>
            <Select :model-value="filters.sort" @update:model-value="(value) => update({ sort: value as ListingSort })">
              <SelectTrigger id="listing-sort" class="h-11 w-52 rounded-pill">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="option in SORT_OPTIONS" :key="option.value" :value="option.value">
                  {{ option.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <!-- active filters -->
        <div v-if="chips.length" class="flex flex-wrap items-center gap-2">
          <button
            v-for="chip in chips"
            :key="chip.key"
            type="button"
            class="t-spec flex items-center gap-2 rounded-pill bg-surface py-2 pr-3 pl-4 transition-colors duration-(--duration-fast) ease-(--ease-lift) hover:bg-line"
            :aria-label="`Remove filter: ${chip.label}`"
            @click="update(chip.remove)"
          >
            {{ chip.label }}
            <IconX class="size-3.5" stroke="2" aria-hidden="true" />
          </button>
          <button
            type="button"
            class="t-spec px-2 text-fg-muted underline-offset-4 hover:text-fg hover:underline"
            @click="clear"
          >
            Clear all
          </button>
        </div>

        <!-- results -->
        <div
          v-if="listQuery.isPending.value"
          aria-hidden="true"
          class="grid gap-x-6 gap-y-12 sm:grid-cols-2 xl:grid-cols-3"
        >
          <div v-for="index in 6" :key="index" class="aspect-4/5 animate-pulse rounded-panel bg-surface" />
        </div>

        <p v-else-if="listQuery.error.value && !listQuery.data.value" role="alert" class="t-body-md text-rust">
          Could not load products. Please refresh the page.
        </p>

        <div
          v-else-if="products.length === 0"
          class="flex flex-col items-start gap-6 rounded-panel bg-surface p-8 md:p-12"
        >
          <p class="t-body-lead">No products match these filters.</p>
          <Button v-if="hasRefinements" size="lg" class="h-12 rounded-pill px-8" @click="clear">
            Clear filters
          </Button>
        </div>

        <ul
          v-else
          class="grid gap-x-6 gap-y-12 transition-opacity duration-(--duration-fast) ease-(--ease-lift) sm:grid-cols-2 xl:grid-cols-3"
          :class="refreshing && 'opacity-50'"
          :aria-busy="refreshing"
        >
          <li v-for="product in products" :key="product.id">
            <ProductCard :product="product" sizes="xs:100vw sm:50vw lg:35vw xl:25vw 2xl:350px" />
          </li>
        </ul>

        <ListingPagination :page="filters.page" :total-pages="totalPages" :link-for="pageLink" />
      </div>
    </div>

    <!-- mobile: the same filters in a sheet; results update underneath, so the count is real -->
    <Sheet v-model:open="filtersOpen">
      <SheetContent side="left" class="flex w-full max-w-sm flex-col gap-0 p-0">
        <SheetHeader class="border-b border-line p-6">
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription class="sr-only">Narrow the product list</SheetDescription>
        </SheetHeader>
        <div class="flex-1 overflow-y-auto p-6">
          <ProductFilters :facets="facets" :filters="filters" @change="update" />
        </div>
        <SheetFooter class="border-t border-line p-6">
          <Button size="lg" class="h-12 w-full rounded-pill" @click="filtersOpen = false">
            Show {{ total }} {{ total === 1 ? 'product' : 'products' }}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  </div>
</template>