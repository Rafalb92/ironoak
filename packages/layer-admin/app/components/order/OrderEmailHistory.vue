<script setup lang="ts">
import { useQuery } from '@pinia/colada';
import { adminOrderEmailsQuery } from '../../queries/orderEmails';

const { orderId, status } = defineProps<{ orderId: string; status: string }>();

const { state, refetch, asyncStatus } = useQuery(() => adminOrderEmailsQuery(orderId));

const TYPE_LABELS: Record<string, string> = {
  ORDER_CONFIRMED: 'Order confirmed',
  ORDER_SHIPPED: 'Order shipped',
  ORDER_CANCELLED: 'Order cancelled',
};

/**
 * Emails go out through the outbox a few seconds after a status change, so a
 * refetch right after the action would still miss them. Look again shortly after.
 */
let pending: ReturnType<typeof setTimeout> | undefined;
watch(
  () => status,
  () => {
    clearTimeout(pending);
    pending = setTimeout(() => void refetch(), 6000);
  },
);
onBeforeUnmount(() => clearTimeout(pending));

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}
</script>

<template>
  <section class="space-y-3">
    <div class="flex items-center justify-between gap-4">
      <h2 class="t-label text-fg-muted">Emails</h2>
      <Button variant="outline" size="sm" :disabled="asyncStatus === 'loading'" @click="refetch()">
        {{ asyncStatus === 'loading' ? 'Refreshing…' : 'Refresh' }}
      </Button>
    </div>

    <p v-if="state.status === 'pending'" class="t-body-sm text-fg-muted">Loading…</p>
    <p v-else-if="state.status === 'error'" class="t-body-sm text-destructive">{{ state.error.message }}</p>

    <p v-else-if="state.data.length === 0" class="t-body-sm text-fg-muted">
      No emails yet. They go out automatically when the order is paid, shipped or cancelled.
    </p>

    <div v-else class="border border-line">
      <table class="w-full">
        <thead class="border-b border-line bg-surface">
          <tr>
            <th class="t-label px-4 py-3 text-left text-fg-muted">Email</th>
            <th class="t-label px-4 py-3 text-left text-fg-muted">Recipient</th>
            <th class="t-label px-4 py-3 text-left text-fg-muted">Status</th>
            <th class="t-label px-4 py-3 text-right text-fg-muted">Time</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="email in state.data" :key="email.id">
            <tr class="border-b border-line last:border-0">
              <td class="t-body-sm px-4 py-3">{{ TYPE_LABELS[email.type] ?? email.type }}</td>
              <td class="t-spec px-4 py-3 text-fg-secondary">{{ email.recipient }}</td>
              <td class="px-4 py-3">
                <span
                  class="t-label"
                  :class="{
                    'text-moss': email.status === 'SENT',
                    'text-destructive': email.status === 'FAILED',
                    'text-fg-muted': email.status === 'PENDING',
                  }"
                >
                  {{ email.status }}
                </span>
              </td>
              <td class="t-spec px-4 py-3 text-right">{{ formatDate(email.sentAt ?? email.createdAt) }}</td>
            </tr>
            <!-- the provider's own words: the fastest way to see why delivery failed -->
            <tr v-if="email.error" class="border-b border-line last:border-0">
              <td colspan="4" class="t-spec px-4 pb-3 text-destructive">{{ email.error }}</td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </section>
</template>