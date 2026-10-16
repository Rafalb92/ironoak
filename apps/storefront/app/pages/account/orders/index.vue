<script setup lang="ts">
import { useQuery } from '@pinia/colada';
import { myOrdersQuery } from '../../../queries/orders';

useSeoMeta({
  title: 'Your orders',
  robots: 'noindex',
});

const query = useQuery(myOrdersQuery);
const orders = computed(() => query.data.value ?? []);
</script>

<template>
  <section aria-labelledby="orders-title" class="flex flex-col gap-6">
    <h2 id="orders-title" class="t-label text-fg-muted">Orders</h2>

    <div v-if="query.isPending.value" aria-hidden="true" class="flex flex-col gap-3">
      <div v-for="index in 3" :key="index" class="h-24 animate-pulse rounded-panel bg-surface" />
    </div>

    <p v-else-if="query.error.value" role="alert" class="t-body-md text-rust">
      Could not load your orders. Please refresh the page.
    </p>

    <div v-else-if="orders.length === 0" class="flex flex-col items-start gap-6 rounded-panel bg-surface p-8">
      <p class="t-body-lead">No orders yet.</p>
      <Button as-child size="lg" class="h-12 rounded-pill px-8">
        <NuxtLink to="/products">Browse products</NuxtLink>
      </Button>
    </div>

    <ul v-else class="flex flex-col gap-3">
      <li v-for="order in orders" :key="order.id">
        <NuxtLink
          :to="`/account/orders/${order.id}`"
          class="grid gap-3 rounded-panel border border-line p-5 transition-colors duration-(--duration-fast) ease-(--ease-lift) hover:border-fg sm:grid-cols-[1fr_auto] sm:items-center"
        >
          <div class="flex flex-col gap-1">
            <p class="font-semibold">Order {{ shortOrderId(order.id) }}</p>
            <p class="t-spec text-fg-muted">
              {{ formatOrderDate(order.createdAt) }} · {{ order.itemCount }}
              {{ order.itemCount === 1 ? 'item' : 'items' }}
            </p>
          </div>
          <div class="flex items-center justify-between gap-4 sm:justify-end">
            <OrderStatusBadge :status="order.status" />
            <p class="t-price text-lg">{{ formatPrice(order.totalAmount, 'USD', { trimZeros: true }) }}</p>
          </div>
        </NuxtLink>
      </li>
    </ul>
  </section>
</template>