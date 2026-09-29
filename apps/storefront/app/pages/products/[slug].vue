<script setup lang="ts">
import { useQuery } from '@pinia/colada';
import type { ProductDetail } from '@ironoak/contracts';
import { productDetailQuery } from '../../queries/products';

// remount per product, not per ?variant change
definePageMeta({ key: (route) => route.params.slug as string });

const route = useRoute();
const slug = computed(() => route.params.slug as string);

const query = useQuery(() => productDetailQuery(slug.value));

// wait for data during SSR, so a missing product returns a real 404 status
await query.refresh();
if (query.error.value || !query.data.value) {
  const statusCode = (query.error.value as { statusCode?: number } | null)?.statusCode ?? 404;
  throw createError({
    statusCode,
    statusMessage: statusCode === 404 ? 'Product not found' : 'Could not load product',
    fatal: true,
  });
}

const product = computed(() => query.data.value as ProductDetail);
const { selected, select, images } = useVariantSelection(product);

const stock = computed(() => {
  const variant = selected.value;
  if (!variant?.inStock) return { label: 'Out of stock', class: 'text-fg-muted' };
  if (variant.lowStock) return { label: 'Only a few left', class: 'text-rust' };
  return { label: 'In stock, ready to ship', class: 'text-moss' };
});

function addToCart() {
  // TODO: cart store — next step
}

// full SEO with JSON-LD comes with the spec section
useSeoMeta({
  title: () => product.value.name,
  description: () => product.value.description,
});
</script>

<template>
  <article class="grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
    <ProductGallery :images="images" :product-name="product.name" class="min-w-0" />

    <div class="flex flex-col lg:sticky lg:top-28 lg:self-start">
      <NuxtLink
        :to="{ path: '/products', query: { category: product.category.slug } }"
        class="t-eyebrow w-fit text-fg-muted transition-colors duration-(--duration-fast) ease-lift hover:text-fg"
      >
        {{ product.category.name }}
      </NuxtLink>

      <h1 class="t-section mt-4">{{ product.name }}</h1>

      <template v-if="selected">
        <p class="t-price mt-6">{{ formatPrice(selected.price, 'USD', { trimZeros: true }) }}</p>
        <p class="mt-2 font-data text-sm" :class="stock.class">{{ stock.label }}</p>
      </template>

      <p class="mt-8 max-w-prose text-base leading-relaxed text-fg-secondary">
        {{ product.description }}
      </p>

      <VariantPicker
        v-if="selected && product.variants.length > 1"
        class="mt-10"
        :variants="product.variants"
        :selected-id="selected.id"
        @select="select"
      />

      <Button
        size="lg"
        class="mt-10 h-14 w-full rounded-pill text-base sm:w-auto sm:px-12"
        :disabled="!selected?.inStock"
        @click="addToCart"
      >
        {{ selected?.inStock ? 'Add to cart' : 'Out of stock' }}
      </Button>
    </div>
  </article>
</template>