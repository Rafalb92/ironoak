<script setup lang="ts">
import { useQuery, useQueryCache } from '@pinia/colada';
import { ORDER_QUERY_KEYS, orderDetailQuery } from '../../../queries/orders';

const route = useRoute();
const api = useApi();
const cache = useQueryCache();
const toast = useToast();
const { startPayment } = useCheckoutPayment();

const orderId = computed(() => route.params.id as string);
const query = useQuery(() => orderDetailQuery(orderId.value));
const order = computed(() => query.data.value ?? null);

useSeoMeta({
  title: () => (order.value ? `Order ${shortOrderId(order.value.id)}` : 'Order'),
  robots: 'noindex',
});

const awaitingPayment = computed(() => order.value?.status === 'PENDING_PAYMENT');
// cancelling a paid order would need a refund, which does not exist yet
const paidButNotShipped = computed(
  () => order.value?.status === 'PAID' || order.value?.status === 'FULFILLING',
);

// --- complete payment ---
const paying = ref(false);

async function completePayment() {
  if (!order.value) return;
  paying.value = true;
  try {
    await startPayment(order.value.id);
  } catch {
    paying.value = false;
    toast.error('Payment could not start', 'The order may have been paid or cancelled in the meantime.');
    void query.refetch();
  }
}

// --- cancel (awaiting payment only) ---
const confirmOpen = ref(false);
const cancelling = ref(false);

async function cancelOrder() {
  if (!order.value) return;
  cancelling.value = true;
  try {
    await api(`/orders/${order.value.id}/cancel`, { method: 'POST' });
    toast.success('Order cancelled');
    confirmOpen.value = false;
    // both the detail and the list now show the new status
    void cache.invalidateQueries({ key: ORDER_QUERY_KEYS.root });
  } catch (error) {
    toast.error(
      'Could not cancel the order',
      httpStatusOf(error) === 409 ? 'It can no longer be cancelled.' : undefined,
    );
    void query.refetch();
  } finally {
    cancelling.value = false;
  }
}

function priceLabel(amount: number): string {
  return amount === 0 ? 'Free' : formatPrice(amount, 'USD', { trimZeros: true });
}
</script>

<template>
  <div class="flex flex-col gap-8">
    <NuxtLink
      to="/account/orders"
      class="t-spec w-fit text-fg-muted underline-offset-4 transition-colors duration-(--duration-fast) ease-(--ease-lift) hover:text-fg hover:underline"
    >
      ← All orders
    </NuxtLink>

    <div v-if="query.isPending.value" aria-hidden="true" class="flex flex-col gap-4">
      <div class="h-10 w-64 animate-pulse rounded-milled bg-surface" />
      <div class="h-48 animate-pulse rounded-panel bg-surface" />
    </div>

    <p v-else-if="query.error.value || !order" role="alert" class="t-body-md text-fg-secondary">
      We couldn't find this order.
    </p>

    <template v-else>
      <header class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 class="text-2xl font-semibold">Order {{ shortOrderId(order.id) }}</h2>
          <p class="t-spec mt-2 text-fg-muted">Placed {{ formatOrderDate(order.createdAt) }}</p>
        </div>
        <OrderStatusBadge :status="order.status" />
      </header>

      <!-- actions that depend on the status -->
      <section
        v-if="awaitingPayment"
        class="flex flex-col gap-4 rounded-panel bg-surface p-6 sm:flex-row sm:items-center sm:justify-between"
      >
        <p class="t-body-md">This order is waiting for payment.</p>
        <div class="flex flex-wrap gap-3">
          <Button size="lg" class="h-12 rounded-pill px-8" :disabled="paying" @click="completePayment">
            {{ paying ? 'Starting payment…' : 'Complete payment' }}
          </Button>
          <Button variant="outline" size="lg" class="h-12 rounded-pill px-8" @click="confirmOpen = true">
            Cancel order
          </Button>
        </div>
      </section>

      <p v-else-if="paidButNotShipped" class="t-body-sm rounded-panel bg-surface p-6 text-fg-secondary">
        Need to change or cancel this order? Contact us and we'll take care of it before it ships.
      </p>

      <section aria-labelledby="order-items-title">
        <h3 id="order-items-title" class="t-label text-fg-muted">Items</h3>
        <ul class="mt-4 divide-y divide-line border-y border-line">
          <li v-for="line in order.lines" :key="line.productVariantId" class="flex justify-between gap-4 py-4">
            <p class="min-w-0">
              <span class="font-semibold">{{ line.productName }}</span>
              <span class="t-spec text-fg-muted"> × {{ line.quantity }}</span>
            </p>
            <p class="t-spec shrink-0">{{ formatPrice(line.lineTotal, 'USD', { trimZeros: true }) }}</p>
          </li>
        </ul>

        <dl class="mt-4 flex flex-col gap-3">
          <div class="flex items-baseline justify-between">
            <dt class="t-body-sm">Subtotal</dt>
            <dd class="t-spec">{{ formatPrice(order.subtotalAmount, 'USD', { trimZeros: true }) }}</dd>
          </div>
          <div class="flex items-baseline justify-between">
            <dt class="t-body-sm">{{ order.shippingMethod.name }}</dt>
            <dd class="t-spec" :class="order.shippingAmount === 0 ? 'text-moss' : ''">
              {{ priceLabel(order.shippingAmount) }}
            </dd>
          </div>
          <div class="flex items-baseline justify-between border-t border-line pt-3">
            <dt class="font-semibold">Total</dt>
            <dd class="t-price">{{ formatPrice(order.totalAmount, 'USD', { trimZeros: true }) }}</dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="order-delivery-title">
        <h3 id="order-delivery-title" class="t-label text-fg-muted">Delivery</h3>
        <address class="t-body-md mt-4 not-italic">
          <template v-if="order.deliveryAddress.recipientName">
            <span class="font-semibold">{{ order.deliveryAddress.recipientName }}</span><br />
          </template>
          {{ addressLines(order.deliveryAddress)[0] }}<br />
          {{ addressLines(order.deliveryAddress)[1] }}
          <template v-if="order.deliveryAddress.phone">
            <br /><span class="t-spec text-fg-muted">{{ order.deliveryAddress.phone }}</span>
          </template>
        </address>
      </section>

      <AlertDialog v-model:open="confirmOpen">
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel order {{ shortOrderId(order.id) }}?</AlertDialogTitle>
            <AlertDialogDescription>
              Nothing has been charged. The items go back into stock and the order can't be restored.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel :disabled="cancelling">Keep order</AlertDialogCancel>
            <!-- a plain button: AlertDialogAction would close the dialog before the request finishes -->
            <Button variant="destructive" :disabled="cancelling" @click="cancelOrder">
              {{ cancelling ? 'Cancelling…' : 'Cancel order' }}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </template>
  </div>
</template>