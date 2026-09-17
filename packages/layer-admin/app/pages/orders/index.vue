<script setup lang="ts">
const { state, page, status, search, totalPages, nextPage, prevPage } = useAdminOrders();

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'PENDING_PAYMENT', label: 'Awaiting payment' },
  { value: 'PAID', label: 'Paid' },
  { value: 'FULFILLING', label: 'Fulfilling' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
] as const;

const statusFilter = computed({
  get: () => status.value ?? 'ALL',
  set: (v: string) => {
    status.value = v === 'ALL' ? undefined : (v as typeof status.value);
  },
});

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'short', timeStyle: 'short' }).format(date);
}
</script>

<template>
  <div class="space-y-6">
    <h1 class="t-display-lg">Orders</h1>

    <div class="flex items-center gap-3">
      <Input
        v-model="search"
        placeholder="Search by order id or customer email"
        class="max-w-sm"
      />
      <Select v-model="statusFilter">
        <SelectTrigger class="w-48"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem v-for="option in STATUS_OPTIONS" :key="option.value" :value="option.value">
            {{ option.label }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <p v-if="state.status === 'pending'" class="t-body-sm text-fg-muted">Loading…</p>
    <p v-else-if="state.status === 'error'" class="t-body-sm text-destructive">
      {{ state.error.message }}
    </p>

    <template v-else>
      <p v-if="!state.data.items.length" class="t-body-sm text-fg-muted">
        No orders match these filters.
      </p>

      <div v-else class="border border-line">
        <table class="w-full">
          <thead class="border-b border-line bg-surface">
            <tr>
              <th class="t-label px-4 py-3 text-left text-fg-muted">Order</th>
              <th class="t-label px-4 py-3 text-left text-fg-muted">Customer</th>
              <th class="t-label px-4 py-3 text-left text-fg-muted">Status</th>
              <th class="t-label px-4 py-3 text-right text-fg-muted">Items</th>
              <th class="t-label px-4 py-3 text-right text-fg-muted">Total</th>
              <th class="t-label px-4 py-3 text-left text-fg-muted">Placed</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="order in state.data.items"
              :key="order.id"
              class="border-b border-line last:border-0 hover:bg-surface"
            >
              <td class="px-4 py-3">
                <NuxtLink :to="`/orders/${order.id}`" class="t-spec hover:text-accent">
                  {{ order.id.slice(0, 8) }}
                </NuxtLink>
              </td>
              <td class="t-body-sm px-4 py-3 text-fg-secondary">
                {{ order.customerEmail ?? '—' }}
              </td>
              <td class="px-4 py-3">
                <OrderStatusBadge :status="order.status" />
              </td>
              <td class="t-spec px-4 py-3 text-right">{{ order.itemCount }}</td>
              <td class="t-price px-4 py-3 text-right">{{ formatPrice(order.totalAmount) }}</td>
              <td class="t-spec px-4 py-3 text-fg-muted">{{ formatDate(order.createdAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="totalPages > 1" class="flex items-center gap-3">
        <Button variant="outline" size="sm" :disabled="page === 1" @click="prevPage">Previous</Button>
        <span class="t-spec text-fg-muted">{{ page }} / {{ totalPages }}</span>
        <Button variant="outline" size="sm" :disabled="page >= totalPages" @click="nextPage">Next</Button>
      </div>
    </template>
  </div>
</template>