<script setup lang="ts">
import { IconStar, IconStarFilled } from '@tabler/icons-vue';

const { value, max = 5 } = defineProps<{
  /** average rating, e.g. 4.3 — rounded to whole stars for display */
  value: number;
  max?: number;
}>();

const filled = computed(() => Math.min(max, Math.max(0, Math.round(value))));
</script>

<template>
  <div role="img" :aria-label="`Rated ${value.toFixed(1)} out of ${max}`" class="flex items-center gap-1">
    <template v-for="index in max" :key="index">
      <IconStarFilled v-if="index <= filled" class="size-5 text-moss" aria-hidden="true" />
      <IconStar v-else class="size-5 text-fg" :stroke="1.75" aria-hidden="true" />
    </template>
  </div>
</template>