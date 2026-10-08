<script setup lang="ts">
import { useCartStore } from '../../stores/cart';

useSeoMeta({
  title: 'Cart',
  robots: 'noindex',
});

const cart = useCartStore();
const auth = useAuthStore();

const lines = computed(() => cart.cart.items);
const isEmpty = computed(() => lines.value.length === 0);

// checkout is blocked until every line can actually be bought
const blockingIssue = computed(() => {
  if (lines.value.some((line) => !line.available)) return 'Remove unavailable items to continue.';
  if (lines.value.some((line) => line.exceedsStock)) return 'Reduce quantities that exceed stock to continue.';
  return null;
});

// guests sign in first and come back to checkout; the cart merges on the way
const checkoutTo = computed(() =>
  auth.isAuthenticated ? '/checkout' : { path: '/login', query: { redirect: '/checkout' } },
);
</script>

<template>
  <div class="flex flex-col gap-10">
    <header class="flex items-baseline justify-between gap-4">
      <h1 class="t-section">Your cart</h1>
      <p v-if="!isEmpty" class="t-spec text-fg-muted">
        {{ cart.count }} {{ cart.count === 1 ? 'item' : 'items' }}
      </p>
    </header>

    <p v-if="isEmpty && cart.isLoading" class="t-body-md text-fg-muted">Loading your cart…</p>

    <section v-else-if="isEmpty" class="flex flex-col items-start gap-6 rounded-panel bg-surface p-8 md:p-12">
      <p class="t-body-lead">Your cart is empty.</p>
      <p class="t-body-md max-w-prose text-fg-secondary">
        Cast iron, brushed steel and solid oak are waiting in the catalogue.
      </p>
      <Button as-child size="lg" class="h-12 rounded-pill px-8">
        <NuxtLink to="/products">Browse products</NuxtLink>
      </Button>
    </section>

    <div v-else class="grid gap-10 lg:grid-cols-[1fr_22rem] lg:gap-16">
      <ul aria-label="Cart items">
        <CartLineItem v-for="line in lines" :key="line.productVariantId" :line="line" />
      </ul>

      <aside
        aria-labelledby="summary-title"
        class="flex flex-col gap-4 rounded-panel bg-surface p-6 lg:sticky lg:top-28 lg:self-start"
      >
        <h2 id="summary-title" class="t-label text-fg-muted">Order summary</h2>

        <dl class="flex flex-col gap-3">
          <div class="flex items-baseline justify-between">
            <dt class="t-body-sm">Subtotal</dt>
            <dd class="t-spec">{{ formatPrice(cart.cart.totalAmount, 'USD', { trimZeros: true }) }}</dd>
          </div>
          <div class="flex items-baseline justify-between">
            <dt class="t-body-sm">Shipping</dt>
            <dd class="t-spec text-moss">Free</dd>
          </div>
          <div class="flex items-baseline justify-between border-t border-line pt-3">
            <dt class="font-semibold">Total</dt>
            <dd class="t-price">{{ formatPrice(cart.cart.totalAmount, 'USD', { trimZeros: true }) }}</dd>
          </div>
        </dl>

        <p v-if="blockingIssue" class="t-spec text-rust">{{ blockingIssue }}</p>

        <Button
          v-if="!blockingIssue"
          as-child
          size="lg"
          class="h-14 w-full rounded-pill text-base"
        >
          <NuxtLink :to="checkoutTo">{{ auth.isAuthenticated ? 'Checkout' : 'Sign in to checkout' }}</NuxtLink>
        </Button>
        <Button v-else size="lg" class="h-14 w-full rounded-pill text-base" disabled>Checkout</Button>
      </aside>
    </div>
  </div>
</template>