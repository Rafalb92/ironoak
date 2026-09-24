<script setup lang="ts">
import { useQuery } from '@pinia/colada';
import { productListQuery } from '../../queries/products';

const LIMIT = 4;

const { data, isPending } = useQuery(() => productListQuery({ sort: 'bestselling', limit: LIMIT }));
const products = computed(() => data.value?.items ?? []);
</script>

<template>
  <section aria-labelledby="bestsellers-title">
    <div class="flex items-end justify-between gap-6">
      <div>
        <p class="t-eyebrow text-fg-muted">Most chosen</p>
        <h2 id="bestsellers-title" class="t-section mt-3">Bestsellers</h2>
      </div>
      <NuxtLink
        to="/products?sort=bestselling"
        class="shrink-0 font-data text-sm underline-offset-4 transition-colors duration-(--duration-fast) ease-(--ease-lift) hover:underline"
      >
        View all
      </NuxtLink>
    </div>

    <ul class="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 md:gap-x-6 lg:grid-cols-4">
      <template v-if="isPending && products.length === 0">
        <li v-for="index in LIMIT" :key="index" aria-hidden="true">
          <div class="aspect-7/8 animate-pulse rounded-panel bg-surface" />
          <div class="mt-5 h-6 w-3/4 animate-pulse rounded-milled bg-surface" />
          <div class="mt-4 h-5 w-1/4 animate-pulse rounded-milled bg-surface" />
        </li>
      </template>

      <li v-for="product in products" :key="product.id">
        <ProductCard :product="product" />
      </li>
    </ul>
  </section>
</template>