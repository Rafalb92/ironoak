<script setup lang="ts">
import type { ProductFacets } from '@ironoak/contracts';
import type { FilterPatch, ListingFilters } from '../../composables/useProductFilters';

const props = defineProps<{
  facets: ProductFacets | null;
  filters: ListingFilters;
}>();

const emit = defineEmits<{ change: [patch: FilterPatch] }>();

const ALL = '';

const allCount = computed(() => props.facets?.categories.reduce((sum, c) => sum + c.count, 0) ?? 0);

function chooseCategory(slug: string) {
  // another category has other materials and ranges — keeping them would empty the page
  emit('change', {
    category: slug || undefined,
    material: undefined,
    minPrice: undefined,
    maxPrice: undefined,
    minWeight: undefined,
    maxWeight: undefined,
  });
}

function chooseMaterial(value: string) {
  emit('change', { material: value || undefined });
}

// --- range sliders: local while dragging, committed on release ---
const priceRange = ref<number[]>([0, 0]);
const weightRange = ref<number[]>([0, 0]);

watchEffect(() => {
  const range = props.facets?.price;
  if (range) priceRange.value = [props.filters.minPrice ?? range.min, props.filters.maxPrice ?? range.max];
});

watchEffect(() => {
  const range = props.facets?.weight;
  if (range) weightRange.value = [props.filters.minWeight ?? range.min, props.filters.maxWeight ?? range.max];
});

// a thumb at the edge of the range means "no limit" — not a filter in the URL
function commitPrice(value: number[] | undefined) {
  const range = props.facets?.price;
  if (!range || !value) return;
  const [min, max] = value as [number, number];
  emit('change', {
    minPrice: min > range.min ? min : undefined,
    maxPrice: max < range.max ? max : undefined,
  });
}

function commitWeight(value: number[] | undefined) {
  const range = props.facets?.weight;
  if (!range || !value) return;
  const [min, max] = value as [number, number];
  emit('change', {
    minWeight: min > range.min ? min : undefined,
    maxWeight: max < range.max ? max : undefined,
  });
}

const showPrice = computed(() => {
  const range = props.facets?.price;
  return Boolean(range && range.max > range.min);
});
const showWeight = computed(() => {
  const range = props.facets?.weight;
  return Boolean(range && range.max > range.min);
});

const money = (cents: number) => formatPrice(cents, 'USD', { trimZeros: true });

const optionRow =
  'flex cursor-pointer items-center justify-between gap-3 rounded-milled px-3 py-2 transition-colors duration-(--duration-fast) ease-(--ease-lift) hover:bg-surface has-[:checked]:bg-surface has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-(--focus-ring)';
</script>

<template>
  <div class="flex flex-col gap-10">
    <div v-if="!facets" aria-hidden="true" class="flex flex-col gap-3">
      <div v-for="index in 5" :key="index" class="h-8 animate-pulse rounded-milled bg-surface" />
    </div>

    <template v-else>
      <!-- category -->
      <fieldset>
        <legend class="t-label text-fg-muted">Category</legend>
        <div class="mt-3 flex flex-col gap-0.5">
          <label :class="optionRow">
            <span class="flex items-center gap-3">
              <input
                type="radio"
                name="filter-category"
                :value="ALL"
                :checked="!filters.category"
                class="size-4 accent-fg focus-visible:outline-none"
                @change="chooseCategory(ALL)"
              />
              <span class="t-body-sm">All products</span>
            </span>
            <span class="t-spec text-fg-muted">{{ allCount }}</span>
          </label>
          <label v-for="category in facets.categories" :key="category.slug" :class="optionRow">
            <span class="flex items-center gap-3">
              <input
                type="radio"
                name="filter-category"
                :value="category.slug"
                :checked="filters.category === category.slug"
                class="size-4 accent-fg focus-visible:outline-none"
                @change="chooseCategory(category.slug)"
              />
              <span class="t-body-sm">{{ category.name }}</span>
            </span>
            <span class="t-spec text-fg-muted">{{ category.count }}</span>
          </label>
        </div>
      </fieldset>

      <!-- material -->
      <fieldset v-if="facets.materials.length > 1">
        <legend class="t-label text-fg-muted">Material</legend>
        <div class="mt-3 flex flex-col gap-0.5">
          <label :class="optionRow">
            <span class="flex items-center gap-3">
              <input
                type="radio"
                name="filter-material"
                :value="ALL"
                :checked="!filters.material"
                class="size-4 accent-fg focus-visible:outline-none"
                @change="chooseMaterial(ALL)"
              />
              <span class="t-body-sm">Any material</span>
            </span>
          </label>
          <label v-for="material in facets.materials" :key="material.value" :class="optionRow">
            <span class="flex items-center gap-3">
              <input
                type="radio"
                name="filter-material"
                :value="material.value"
                :checked="filters.material === material.value"
                class="size-4 accent-fg focus-visible:outline-none"
                @change="chooseMaterial(material.value)"
              />
              <span class="t-body-sm">{{ material.value }}</span>
            </span>
            <span class="t-spec text-fg-muted">{{ material.count }}</span>
          </label>
        </div>
      </fieldset>

      <!-- price -->
      <div v-if="showPrice && facets.price">
        <p id="filter-price-label" class="t-label text-fg-muted">Price</p>
        <p class="t-spec mt-3" aria-live="polite">{{ money(priceRange[0]!) }} – {{ money(priceRange[1]!) }}</p>
        <Slider
          v-model="priceRange"
          :min="facets.price.min"
          :max="facets.price.max"
          :step="1000"
          :min-steps-between-thumbs="1"
          aria-labelledby="filter-price-label"
          class="mt-4"
          @value-commit="commitPrice"
        />
      </div>

      <!-- weight -->
      <div v-if="showWeight && facets.weight">
        <p id="filter-weight-label" class="t-label text-fg-muted">Weight</p>
        <p class="t-spec mt-3" aria-live="polite">{{ formatKg(weightRange[0]!) }} – {{ formatKg(weightRange[1]!) }}</p>
        <Slider
          v-model="weightRange"
          :min="facets.weight.min"
          :max="facets.weight.max"
          :step="500"
          :min-steps-between-thumbs="1"
          aria-labelledby="filter-weight-label"
          class="mt-4"
          @value-commit="commitWeight"
        />
      </div>
    </template>
  </div>
</template>