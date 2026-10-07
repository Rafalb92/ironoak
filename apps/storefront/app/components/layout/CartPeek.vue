<script setup lang="ts">
import { useCartStore } from '../../stores/cart';

const store = useCartStore();

const PREVIEW_LINES = 3;
const lines = computed(() => store.cart.items.slice(0, PREVIEW_LINES));
const hiddenCount = computed(() => store.cart.items.length - lines.value.length);
const isEmpty = computed(() => store.cart.items.length === 0);
</script>

<template>
  <div class="w-80">
    <p v-if="isEmpty && store.isLoading" class="t-body-sm text-fg-muted">Loading your cart…</p>
    <p v-else-if="isEmpty" class="t-body-sm text-fg-muted">Your cart is empty.</p>

    <template v-else>
      <ul class="divide-y divide-line">
        <li v-for="line in lines" :key="line.productVariantId" class="flex gap-3 py-3 first:pt-0">
          <ProductMedia
            :src="line.imageUrl"
            alt=""
            compact
            sizes="48px"
            class="size-12 shrink-0 overflow-hidden rounded-milled"
          />
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-semibold">{{ line.productName }}</p>
            <p class="t-spec truncate text-fg-muted">{{ line.variantName }} · × {{ line.quantity }}</p>
          </div>
          <p class="t-spec shrink-0">{{ formatPrice(line.lineTotal, 'USD', { trimZeros: true }) }}</p>
        </li>
      </ul>

      <p v-if="hiddenCount > 0" class="t-spec pt-1 text-fg-muted">+ {{ hiddenCount }} more</p>

      <div class="mt-3 flex items-baseline justify-between border-t border-line pt-3">
        <span class="t-label text-fg-muted">Total</span>
        <span class="t-price text-lg">{{ formatPrice(store.cart.totalAmount, 'USD', { trimZeros: true }) }}</span>
      </div>

      <Button as-child class="mt-4 h-11 w-full rounded-pill">
        <NuxtLink to="/cart">View cart</NuxtLink>
      </Button>
    </template>
  </div>
</template>