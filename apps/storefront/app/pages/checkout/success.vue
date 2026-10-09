<script setup lang="ts">
import { useQuery } from '@pinia/colada';
import { useIntervalFn, useTimeoutFn } from '@vueuse/core';
import { orderDetailQuery } from '../../queries/orders';

definePageMeta({ middleware: 'auth' });

useSeoMeta({
  title: 'Order confirmation',
  robots: 'noindex',
});

// the payment is confirmed by the webhook, not by this page — it only watches the status
const POLL_INTERVAL_MS = 2_000;
const POLL_TIMEOUT_MS = 60_000;

const route = useRoute();
const orderId = computed(() => (typeof route.query.order === 'string' ? route.query.order : null));

const query = useQuery(() => ({
  ...orderDetailQuery(orderId.value ?? ''),
  enabled: orderId.value !== null,
}));

const order = computed(() => query.data.value ?? null);
const status = computed(() => order.value?.status);
const settled = computed(() => status.value !== undefined && status.value !== 'PENDING_PAYMENT');
const confirmed = computed(() => settled.value && status.value !== 'CANCELLED');

const timedOut = ref(false);

const { pause } = useIntervalFn(() => {
  if (orderId.value && !settled.value) void query.refetch();
}, POLL_INTERVAL_MS);

useTimeoutFn(() => {
  if (!settled.value) timedOut.value = true;
  pause();
}, POLL_TIMEOUT_MS);

watch(settled, (done) => {
  if (done) pause();
});

const shortId = computed(() => order.value?.id.slice(0, 8).toUpperCase() ?? '');
</script>

<template>
  <div class="mx-auto flex w-full max-w-2xl flex-col gap-8 py-6 md:py-12">
    <section v-if="!orderId || query.error.value" class="flex flex-col items-start gap-4">
      <h1 class="t-section">We couldn't find this order</h1>
      <p class="t-body-md text-fg-secondary">If you have paid, the order will appear in your account shortly.</p>
      <Button as-child size="lg" class="h-12 rounded-pill px-8">
        <NuxtLink to="/">Back to the shop</NuxtLink>
      </Button>
    </section>

    <section v-else-if="confirmed && order" class="flex flex-col gap-8">
      <div>
        <p class="t-eyebrow text-moss">Payment confirmed</p>
        <h1 class="t-section mt-4">Thank you — your order is on its way to the workshop</h1>
        <p class="t-spec mt-4 text-fg-muted">Order {{ shortId }}</p>
      </div>

      <ul class="divide-y divide-line border-y border-line">
        <li v-for="line in order.lines" :key="line.productVariantId" class="flex justify-between gap-4 py-4">
          <p class="min-w-0">
            <span class="font-semibold">{{ line.productName }}</span>
            <span class="t-spec text-fg-muted"> × {{ line.quantity }}</span>
          </p>
          <p class="t-spec shrink-0">{{ formatPrice(line.lineTotal, 'USD', { trimZeros: true }) }}</p>
        </li>
      </ul>

      <div class="flex items-baseline justify-between">
        <span class="font-semibold">Total paid</span>
        <span class="t-price">{{ formatPrice(order.totalAmount, 'USD', { trimZeros: true }) }}</span>
      </div>

      <div>
        <h2 class="t-label text-fg-muted">Delivering to</h2>
        <address class="t-body-md mt-3 not-italic">
          {{ order.deliveryAddress.street }} {{ order.deliveryAddress.buildingNumber
          }}<template v-if="order.deliveryAddress.apartmentNumber">/{{ order.deliveryAddress.apartmentNumber }}</template><br />
          {{ order.deliveryAddress.postalCode }} {{ order.deliveryAddress.city }}<br />
          {{ countryName(order.deliveryAddress.country) }}
        </address>
      </div>

      <Button as-child size="lg" class="h-12 w-fit rounded-pill px-8">
        <NuxtLink to="/products">Continue shopping</NuxtLink>
      </Button>
    </section>

    <section v-else-if="status === 'CANCELLED'" class="flex flex-col items-start gap-4">
      <h1 class="t-section">This order was cancelled</h1>
      <p class="t-body-md max-w-prose text-fg-secondary">
        Usually this means an item sold out while you were paying. If you were charged, contact us and we'll
        sort it out.
      </p>
      <Button as-child size="lg" class="h-12 rounded-pill px-8">
        <NuxtLink to="/products">Back to the shop</NuxtLink>
      </Button>
    </section>

    <section v-else-if="timedOut" class="flex flex-col items-start gap-4">
      <h1 class="t-section">Your payment is still being confirmed</h1>
      <p class="t-body-md max-w-prose text-fg-secondary">
        This can take a few minutes. You don't need to pay again — the order will update on its own.
      </p>
      <Button as-child size="lg" class="h-12 rounded-pill px-8">
        <NuxtLink to="/">Back to the shop</NuxtLink>
      </Button>
    </section>

    <section v-else class="flex flex-col items-start gap-4" aria-live="polite">
      <h1 class="t-section">Confirming your payment…</h1>
      <p class="t-body-md text-fg-secondary">This usually takes a few seconds. Please keep this page open.</p>
    </section>
  </div>
</template>