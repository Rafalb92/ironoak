<script setup lang="ts">
import { useQuery } from '@pinia/colada';
import { IconArrowRight } from '@tabler/icons-vue';
import { productFacetsQuery } from '../../queries/catalog';

interface MaterialTile {
  /** display name; the filter keeps the catalogue value */
  label: string;
  image: string;
  tagline: string;
}

/**
 * Keys must match the `material` values returned by GET /products/facets exactly.
 * A material without an entry here is skipped — never a tile without a photo.
 */
const MATERIAL_TILES: Record<string, MaterialTile> = {
  'Steel / Oak': {
    label: 'Steel & Oak',
    image: '/images/home/material-oak.webp',
    tagline: 'A steel frame dressed in solid oak.',
  },
  'Cast Iron': {
    label: 'Cast Iron',
    image: '/images/home/material-cast-iron.webp',
    tagline: 'Poured, machined, built to outlast you.',
  },
  'Spring Steel': {
    label: 'Spring Steel',
    image: '/images/home/material-steel.webp',
    tagline: 'Bars with whip, built to take a drop.',
  },
};

// the same cache entry as /products without a category — filters are ready on arrival
const facetsQuery = useQuery(() => productFacetsQuery());

const tiles = computed(() =>
  (facetsQuery.data.value?.materials ?? [])
    .filter((material) => material.value in MATERIAL_TILES)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map((material) => ({ ...material, ...MATERIAL_TILES[material.value]! })),
);
</script>

<template>
  <!-- no facets (or no matching materials) → no section; the homepage never breaks for it -->
  <section v-if="tiles.length" aria-labelledby="materials-title" class="flex flex-col gap-10">
    <div class="flex flex-col gap-4">
      <p class="t-label text-fg-muted">Shop by material</p>
      <h2 id="materials-title" class="t-section">Choose what it's made of.</h2>
    </div>

    <ul class="grid gap-4 md:grid-cols-3">
      <li v-for="tile in tiles" :key="tile.value">
        <NuxtLink
          :to="{ path: '/products', query: { material: tile.value } }"
          class="group relative block overflow-hidden rounded-panel bg-surface"
        >
          <NuxtImg
            :src="tile.image"
            alt=""
            width="900"
            height="1200"
            sizes="100vw md:33vw"
            loading="lazy"
            class="aspect-3/4 w-full object-cover transition-transform duration-(--duration-slow) ease-(--ease-lift) motion-safe:group-hover:scale-[1.03]"
          />
          <!-- the gradient keeps light text readable on any photo -->
          <div class="absolute inset-0 bg-linear-to-t from-ink/80 via-ink/20 to-transparent" />

          <div class="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-6 text-bone">
            <p class="text-2xl font-semibold">{{ tile.label }}</p>
            <p class="t-body-sm text-bone/80">{{ tile.tagline }}</p>
            <p class="t-spec mt-2 flex items-center gap-2">
              {{ tile.count }} {{ tile.count === 1 ? 'product' : 'products' }}
              <IconArrowRight
                class="size-4 transition-transform duration-(--duration-fast) ease-(--ease-lift) group-hover:translate-x-0.5"
                :stroke="1.75"
                aria-hidden="true"
              />
            </p>
          </div>
        </NuxtLink>
      </li>
    </ul>
  </section>
</template>