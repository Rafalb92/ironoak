<script setup lang="ts">
import type { ProductListItem } from '@ironoak/contracts';

const { product, rating = null } = defineProps<{
  product: ProductListItem;
  /** average rating; hidden until the product has reviews */
  rating?: number | null;
}>();

const image = computed(() => pickPrimaryImage(product));

// "From" only when variants actually differ in price
const hasPriceRange = computed(() => new Set(product.variants.map((v) => v.price)).size > 1);
</script>

<template>
  <!-- stretched link: one tab stop, one accessible name, whole card clickable -->
  <article
    class="group relative flex flex-col rounded-panel has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-4 has-[a:focus-visible]:outline-(--focus-ring)"
  >
    <div class="aspect-7/8 overflow-hidden rounded-panel bg-surface">
      <ProductMedia
        :src="image?.url ?? null"
        :alt="image?.alt ?? product.name"
        :label="product.name"
        loading="lazy"
        class="size-full transition-transform duration-(--duration-slow) ease-(--ease-iron) group-hover:scale-[1.03]"
      />
    </div>

    <h3 class="mt-5 line-clamp-2 font-data text-lg leading-tight md:text-2xl">
      <NuxtLink :to="`/products/${product.slug}`" class="after:absolute after:inset-0 focus-visible:outline-none">
        {{ product.name }}
      </NuxtLink>
    </h3>

    <RatingStars v-if="rating !== null" :value="rating" class="mt-3" />

    <p class="t-price mt-4">
      <span v-if="hasPriceRange" class="mr-1.5 font-data text-sm font-normal text-fg-muted">From</span>
      {{ formatPrice(product.priceFrom, 'USD', { trimZeros: true }) }}
    </p>
  </article>
</template>