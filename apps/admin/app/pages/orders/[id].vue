<script setup lang="ts">
import { useQuery } from '@pinia/colada';
import { adminOrderDetailQuery } from '../../queries/orders';
import type { OrderStatus } from '@ironoak/contracts';

const route = useRoute();
const orderId = computed(() => route.params.id as string);

const { state } = useQuery(() => adminOrderDetailQuery(orderId.value));
const action = useOrderAction();

// which action is legal from the current status — mirrors the aggregate's state machine
const nextAction = computed<{ action: 'fulfill' | 'ship' | 'deliver'; label: string } | null>(
  () => {
    const status = state.value.data?.status as OrderStatus | undefined;
    if (status === 'PAID') return { action: 'fulfill', label: 'Start fulfillment' };
    if (status === 'FULFILLING') return { action: 'ship', label: 'Mark as shipped' };
    if (status === 'SHIPPED') return { action: 'deliver', label: 'Mark as delivered' };
    return null;
  },
);

const subtotal = computed(
  () =>
    state.value.data?.lines.reduce((sum, line) => sum + line.unitPriceAmount * line.quantity, 0) ?? 0,
);

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}
</script>

<template>
  <div class="space-y-8">
    <p v-if="state.status === 'pending'" class="t-body-sm text-fg-muted">Loading…</p>
    <p v-else-if="state.status === 'error'" class="t-body-sm text-destructive">
      {{ state.error.message }}
    </p>

    <template v-else>
      <div class="flex items-start justify-between gap-6">
        <div class="space-y-2">
          <NuxtLink to="/orders" class="t-eyebrow text-fg-muted hover:text-accent">← Orders</NuxtLink>
          <h1 class="t-display-lg">Order {{ state.data.id.slice(0, 8) }}</h1>
          <OrderStatusBadge :status="state.data.status" />
        </div>

        <Button
          v-if="nextAction"
          :disabled="action.isLoading.value"
          @click="action.mutate({ orderId: state.data.id, action: nextAction.action })"
        >
          {{ action.isLoading.value ? 'Working…' : nextAction.label }}
        </Button>
        <p v-else-if="state.data.status === 'PENDING_PAYMENT'" class="t-body-sm max-w-xs text-fg-muted">
          Waiting for payment. The status updates automatically when the provider confirms it.
        </p>
      </div>

      <section class="grid grid-cols-2 gap-x-8 gap-y-4 border border-line p-5 lg:grid-cols-4">
        <div>
          <div class="t-label text-fg-muted">Customer</div>
          <div class="t-body-sm mt-1">{{ state.data.customerEmail ?? '—' }}</div>
        </div>
        <div>
          <div class="t-label text-fg-muted">Total</div>
          <div class="t-price mt-1">{{ formatPrice(state.data.totalAmount) }}</div>
        </div>
        <div>
          <div class="t-label text-fg-muted">Placed</div>
          <div class="t-spec mt-1">{{ formatDate(state.data.createdAt) }}</div>
        </div>
        <div>
          <div class="t-label text-fg-muted">Updated</div>
          <div class="t-spec mt-1">{{ formatDate(state.data.updatedAt) }}</div>
        </div>
      </section>

      <section class="space-y-3">
        <h2 class="t-label text-fg-muted">Items</h2>
        <div class="border border-line">
          <table class="w-full">
            <thead class="border-b border-line bg-surface">
              <tr>
                <th class="t-label px-4 py-3 text-left text-fg-muted">Product</th>
                <th class="t-label px-4 py-3 text-right text-fg-muted">Unit price</th>
                <th class="t-label px-4 py-3 text-right text-fg-muted">Qty</th>
                <th class="t-label px-4 py-3 text-right text-fg-muted">Line total</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="line in state.data.lines"
                :key="line.productVariantId"
                class="border-b border-line"
              >
                <td class="t-body-sm px-4 py-3">{{ line.productName }}</td>
                <td class="t-price px-4 py-3 text-right">{{ formatPrice(line.unitPriceAmount) }}</td>
                <td class="t-spec px-4 py-3 text-right">{{ line.quantity }}</td>
                <td class="t-price px-4 py-3 text-right">
                  {{ formatPrice(line.unitPriceAmount * line.quantity) }}
                </td>
              </tr>
            </tbody>
            <!-- the order's own snapshot of shipping, not today's price list -->
            <tfoot>
              <tr>
                <td colspan="3" class="t-body-sm px-4 pt-3 text-right text-fg-muted">Subtotal</td>
                <td class="t-price px-4 pt-3 text-right">{{ formatPrice(subtotal) }}</td>
              </tr>
              <tr>
                <td colspan="3" class="t-body-sm px-4 py-1 text-right text-fg-muted">
                  {{ state.data.shippingMethodName }}
                </td>
                <td class="t-price px-4 py-1 text-right">
                  {{ state.data.shippingAmount === 0 ? 'Free' : formatPrice(state.data.shippingAmount) }}
                </td>
              </tr>
              <tr>
                <td colspan="3" class="t-label px-4 pt-1 pb-3 text-right">Total</td>
                <td class="t-price px-4 pt-1 pb-3 text-right">{{ formatPrice(state.data.totalAmount) }}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <p class="t-spec text-fg-muted">
          Prices are snapshots from the time of purchase and do not change with the catalog.
        </p>
      </section>

      <section class="grid gap-6 border border-line p-5 md:grid-cols-3">
        <div class="space-y-2">
          <h2 class="t-label text-fg-muted">Delivery method</h2>
          <p class="t-body-sm">{{ state.data.shippingMethodName }}</p>
          <p
            v-if="state.data.shippingMethod === 'WHITE_GLOVE'"
            class="t-spec text-fg-muted"
          >
            Book an assembly crew — carried in and assembled on site.
          </p>
        </div>

        <div class="space-y-2">
          <h2 class="t-label text-fg-muted">Recipient</h2>
          <p class="t-body-sm">{{ state.data.deliveryAddress.recipientName ?? '—' }}</p>
          <p class="t-spec text-fg-secondary">{{ state.data.deliveryAddress.phone ?? 'No phone' }}</p>
        </div>

        <div class="space-y-2">
          <h2 class="t-label text-fg-muted">Delivery address</h2>
          <address class="t-body-sm not-italic text-fg-secondary">
            {{ state.data.deliveryAddress.street }} {{ state.data.deliveryAddress.buildingNumber
            }}<template v-if="state.data.deliveryAddress.apartmentNumber"
              >/{{ state.data.deliveryAddress.apartmentNumber }}</template
            ><br />
            {{ state.data.deliveryAddress.postalCode }} {{ state.data.deliveryAddress.city }}<br />
            {{ state.data.deliveryAddress.country }}
          </address>
        </div>
      </section>

      <OrderEmailHistory :order-id="state.data.id" :status="state.data.status" />
    </template>
  </div>
</template>