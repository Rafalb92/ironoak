<script setup lang="ts">
import { useQuery } from '@pinia/colada';
import { dashboardEmailsQuery, dashboardLowStockQuery, dashboardOrdersQuery } from '../queries/dashboard';

// three contexts, three questions — each section loads and fails on its own
const orders = useQuery(dashboardOrdersQuery);
const lowStock = useQuery(dashboardLowStockQuery);
const emails = useQuery(dashboardEmailsQuery);

const STATUSES = [
  { value: 'PENDING_PAYMENT', label: 'Awaiting payment' },
  { value: 'PAID', label: 'To fulfil' },
  { value: 'FULFILLING', label: 'Fulfilling' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
] as const;

const maxDailyRevenue = computed(() =>
  Math.max(1, ...(orders.data.value?.dailyRevenue.map((day) => day.revenue) ?? [])),
);

const dayFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
const weekdayFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'narrow' });
</script>

<template>
  <div class="space-y-8">
    <h1 class="t-display-lg">Dashboard</h1>

    <!-- key figures -->
    <section aria-label="Last 30 days" class="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <template v-if="orders.data.value">
        <div class="border border-line p-5">
          <div class="t-label text-fg-muted">Revenue · 30 days</div>
          <div class="t-price mt-2 text-2xl">{{ formatPrice(orders.data.value.last30Days.revenue) }}</div>
        </div>
        <div class="border border-line p-5">
          <div class="t-label text-fg-muted">Paid orders · 30 days</div>
          <div class="mt-2 text-2xl font-semibold tabular-nums">{{ orders.data.value.last30Days.orders }}</div>
        </div>
        <div class="border border-line p-5">
          <div class="t-label text-fg-muted">Average order</div>
          <div class="t-price mt-2 text-2xl">{{ formatPrice(orders.data.value.last30Days.averageOrderValue) }}</div>
        </div>
        <NuxtLink to="/orders" class="border border-line p-5 transition-colors hover:border-fg">
          <div class="t-label text-fg-muted">To fulfil</div>
          <div class="mt-2 text-2xl font-semibold tabular-nums">{{ orders.data.value.byStatus.PAID ?? 0 }}</div>
        </NuxtLink>
      </template>
      <template v-else-if="orders.isPending.value">
        <div v-for="index in 4" :key="index" class="h-24 animate-pulse border border-line bg-surface" />
      </template>
      <p v-else class="t-body-sm col-span-full text-destructive">Could not load order figures.</p>
    </section>

    <div class="grid gap-8 xl:grid-cols-[2fr_1fr]">
      <!-- daily revenue, plain CSS bars -->
      <section v-if="orders.data.value" aria-labelledby="revenue-title" class="space-y-4 border border-line p-5">
        <h2 id="revenue-title" class="t-label text-fg-muted">Revenue · last 14 days</h2>
        <div class="flex h-48 items-end gap-1.5">
          <div
            v-for="day in orders.data.value.dailyRevenue"
            :key="day.day.toISOString()"
            class="group relative flex h-full flex-1 flex-col justify-end"
          >
            <div
              class="min-h-px bg-fg/80 transition-colors group-hover:bg-fg"
              :style="{ height: `${(day.revenue / maxDailyRevenue) * 100}%` }"
            />
            <span class="t-spec mt-2 text-center text-fg-muted">{{ weekdayFormatter.format(day.day) }}</span>
            <!-- value on hover: the chart stays clean, the number is one move away -->
            <span
              class="t-spec pointer-events-none absolute -top-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap border border-line bg-canvas px-2 py-1 group-hover:block"
            >
              {{ dayFormatter.format(day.day) }}: {{ formatPrice(day.revenue) }} · {{ day.orders }}
            </span>
          </div>
        </div>
      </section>

      <!-- orders by status -->
      <section v-if="orders.data.value" aria-labelledby="status-title" class="space-y-3 border border-line p-5">
        <h2 id="status-title" class="t-label text-fg-muted">Orders by status</h2>
        <dl class="divide-y divide-line">
          <div v-for="status in STATUSES" :key="status.value" class="flex items-center justify-between py-2.5">
            <dt class="t-body-sm">{{ status.label }}</dt>
            <dd class="font-semibold tabular-nums">{{ orders.data.value.byStatus[status.value] ?? 0 }}</dd>
          </div>
        </dl>
      </section>
    </div>

    <div class="grid gap-8 xl:grid-cols-[2fr_1fr]">
      <!-- low stock -->
      <section aria-labelledby="stock-title" class="space-y-3">
        <h2 id="stock-title" class="t-label text-fg-muted">Low stock</h2>
        <p v-if="lowStock.isPending.value" class="t-body-sm text-fg-muted">Loading…</p>
        <p v-else-if="lowStock.error.value" class="t-body-sm text-destructive">Could not load stock levels.</p>
        <p v-else-if="!lowStock.data.value?.length" class="t-body-sm text-fg-muted">Every variant is well stocked.</p>
        <div v-else class="border border-line">
          <table class="w-full">
            <thead class="border-b border-line bg-surface">
              <tr>
                <th class="t-label px-4 py-3 text-left text-fg-muted">Product</th>
                <th class="t-label px-4 py-3 text-left text-fg-muted">SKU</th>
                <th class="t-label px-4 py-3 text-right text-fg-muted">Available</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in lowStock.data.value" :key="item.variantId" class="border-b border-line last:border-0">
                <td class="px-4 py-3">
                  <NuxtLink :to="`/products/${item.productId}`" class="t-body-sm hover:text-accent">
                    {{ item.productName }} — {{ item.variantName }}
                  </NuxtLink>
                </td>
                <td class="t-spec px-4 py-3 text-fg-muted">{{ item.sku }}</td>
                <td class="px-4 py-3 text-right font-semibold tabular-nums" :class="item.available === 0 && 'text-destructive'">
                  {{ item.available === 0 ? 'Out of stock' : item.available }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- email deliverability -->
      <section aria-labelledby="emails-title" class="space-y-3">
        <h2 id="emails-title" class="t-label text-fg-muted">Emails · 7 days</h2>
        <div v-if="emails.data.value" class="space-y-3 border border-line p-5">
          <div class="flex items-center justify-between">
            <span class="t-body-sm">Sent</span>
            <span class="font-semibold tabular-nums">{{ emails.data.value.sent }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="t-body-sm">Failed</span>
            <span class="font-semibold tabular-nums" :class="emails.data.value.failed > 0 && 'text-destructive'">
              {{ emails.data.value.failed }}
            </span>
          </div>
          <p v-if="emails.data.value.failed > 0" class="t-spec text-fg-muted">
            Open an affected order to see the provider's error in its email history.
          </p>
        </div>
        <p v-else-if="emails.error.value" class="t-body-sm text-destructive">Could not load email figures.</p>
      </section>
    </div>
  </div>
</template>