<script setup lang="ts">
import { useQuery } from '@pinia/colada';
import { useIntersectionObserver } from '@vueuse/core';
import type { ProductDetail } from '@ironoak/contracts';
import { productDetailQuery } from '../../queries/products';

// remount per product, not per ?variant change
definePageMeta({ key: (route) => route.params.slug as string });

const route = useRoute();
const config = useRuntimeConfig();
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

const price = computed(() =>
  selected.value ? formatPrice(selected.value.price, 'USD', { trimZeros: true }) : '',
);

const stock = computed(() => {
  const variant = selected.value;
  if (!variant?.inStock) return { label: 'Out of stock', class: 'text-fg-muted' };
  if (variant.lowStock) return { label: 'Only a few left', class: 'text-rust' };
  return { label: 'In stock, ready to ship', class: 'text-moss' };
});

function addToCart() {
  // TODO: cart store — next step
}

// --- mobile buy bar: appears once the main button leaves the viewport ---
const buyButton = useTemplateRef<HTMLElement>('buyButton');
const buyButtonVisible = ref(true);
useIntersectionObserver(buyButton, ([entry]) => {
  buyButtonVisible.value = entry?.isIntersecting ?? true;
});

// --- SEO ---
// one canonical page per product: ?variant= is the same content
const canonicalUrl = computed(() =>
  new URL(`/products/${product.value.slug}`, config.public.siteUrl).toString(),
);
const primaryImage = computed(() => pickPrimaryImage(product.value));

useSeoMeta({
  title: () => product.value.name,
  description: () => product.value.description,
  ogTitle: () => `${product.value.name} — IRONOAK`,
  ogDescription: () => product.value.description,
  ogImage: () => primaryImage.value?.url,
  ogUrl: () => canonicalUrl.value,
  twitterCard: 'summary_large_image',
});

const structuredData = computed(() => ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: product.value.name,
  description: product.value.description,
  category: product.value.category.name,
  url: canonicalUrl.value,
  brand: { '@type': 'Brand', name: 'IRONOAK' },
  image: product.value.images.filter((image) => image.type === 'IMAGE').map((image) => image.url),
  offers: product.value.variants.map((variant) => ({
    '@type': 'Offer',
    sku: variant.sku,
    name: variant.name,
    price: (variant.price / 100).toFixed(2),
    priceCurrency: 'USD',
    availability: variant.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    url: `${canonicalUrl.value}?variant=${encodeURIComponent(variant.sku)}`,
  })),
}));

useHead({
  link: [{ rel: 'canonical', href: canonicalUrl }],
  script: [
    {
      key: 'product-structured-data',
      type: 'application/ld+json',
      // "<" escaped: an admin-written closing script tag in the description
      // must not be able to end this tag early and inject markup
      innerHTML: computed(() => JSON.stringify(structuredData.value).replace(/</g, '\\u003c')),
    },
  ],
});
</script>

<template>
  <!-- single root: required for page transitions; bottom padding leaves room for the mobile buy bar -->
  <div class="flex flex-col gap-16 pb-24 md:gap-24 lg:pb-0">
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
          <p class="t-price mt-6">{{ price }}</p>
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

        <div ref="buyButton" class="mt-10">
          <Button
            size="lg"
            class="h-14 w-full rounded-pill text-base sm:w-auto sm:px-12"
            :disabled="!selected?.inStock"
            @click="addToCart"
          >
            {{ selected?.inStock ? 'Add to cart' : 'Out of stock' }}
          </Button>
        </div>
      </div>
    </article>

    <ProductSpecs v-if="selected" :variant="selected" />

    <MobileBuyBar
      v-if="selected"
      :name="product.name"
      :price="price"
      :in-stock="selected.inStock"
      :visible="!buyButtonVisible"
      @add="addToCart"
    />
  </div>
</template>