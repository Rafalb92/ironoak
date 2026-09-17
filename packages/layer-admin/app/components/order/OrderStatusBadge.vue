<script setup lang="ts">
import type { OrderStatus } from '@ironoak/contracts';

const { status } = defineProps<{ status: OrderStatus }>();

const STYLES: Record<OrderStatus, string> = {
  PENDING_PAYMENT: 'bg-raised text-fg-muted',
  PAID: 'bg-[var(--color-brass)]/15 text-[var(--color-brass)]',
  FULFILLING: 'bg-[var(--color-oak)]/15 text-[var(--color-oak)]',
  SHIPPED: 'bg-[var(--color-oak)]/25 text-[var(--color-oak)]',
  DELIVERED: 'bg-[var(--status-success)]/15 text-[var(--status-success)]',
  CANCELLED: 'bg-[var(--status-danger)]/15 text-[var(--status-danger)]',
};

const LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: 'Awaiting payment',
  PAID: 'Paid',
  FULFILLING: 'Fulfilling',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};
</script>

<template>
  <span class="t-label px-2 py-1" :class="STYLES[status]">{{ LABELS[status] }}</span>
</template>