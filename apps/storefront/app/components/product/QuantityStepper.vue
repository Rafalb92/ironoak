<script setup lang="ts">
import { IconMinus, IconPlus } from '@tabler/icons-vue';

const quantity = defineModel<number>({ required: true });

const {
  min = 1,
  max,
  label = 'Quantity',
  disabled = false,
} = defineProps<{
  min?: number;
  max: number;
  label?: string;
  disabled?: boolean;
}>();

const atMin = computed(() => quantity.value <= min);
const atMax = computed(() => quantity.value >= max);

function step(delta: number) {
  quantity.value = Math.min(max, Math.max(min, quantity.value + delta));
}
</script>

<template>
  <div role="group" :aria-label="label" class="inline-flex items-center rounded-pill border border-line">
    <button
      type="button"
      aria-label="Decrease quantity"
      class="grid size-11 place-items-center rounded-pill transition-colors duration-(--duration-fast) ease-(--ease-lift) hover:bg-surface disabled:pointer-events-none disabled:opacity-40"
      :disabled="disabled || atMin"
      @click="step(-1)"
    >
      <IconMinus class="size-4" :stroke="1.75" aria-hidden="true" />
    </button>

    <output class="w-10 text-center font-data tabular-nums" aria-live="polite">{{ quantity }}</output>

    <button
      type="button"
      aria-label="Increase quantity"
      class="grid size-11 place-items-center rounded-pill transition-colors duration-(--duration-fast) ease-(--ease-lift) hover:bg-surface disabled:pointer-events-none disabled:opacity-40"
      :disabled="disabled || atMax"
      @click="step(1)"
    >
      <IconPlus class="size-4" :stroke="1.75" aria-hidden="true" />
    </button>
  </div>
</template>