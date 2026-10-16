<script setup lang="ts">
import type { OrderStatus } from '@ironoak/contracts';

const { status } = defineProps<{ status: OrderStatus }>();

const display = computed(() => ORDER_STATUS_DISPLAY[status]);
</script>

<template>
  <span class="t-label inline-flex rounded-pill px-3 py-1.5" :class="display.tone">
    {{ display.label }}
  </span>
</template>