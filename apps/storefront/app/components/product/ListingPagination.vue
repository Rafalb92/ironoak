<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router';

const { page, totalPages, linkFor } = defineProps<{
  page: number;
  totalPages: number;
  linkFor: (page: number) => RouteLocationRaw;
}>();

// 1 … 4 5 6 … 12 — first, last, and the current page's neighbours
const items = computed<(number | 'gap')[]>(() => {
  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);

  const result: (number | 'gap')[] = [];
  for (const [index, p] of sorted.entries()) {
    if (index > 0 && p - sorted[index - 1]! > 1) result.push('gap');
    result.push(p);
  }
  return result;
});

const linkClass =
  'flex size-11 items-center justify-center rounded-pill font-data text-sm transition-colors duration-(--duration-fast) ease-(--ease-lift)';
</script>

<template>
  <nav v-if="totalPages > 1" aria-label="Pagination" class="flex items-center justify-center gap-1">
    <NuxtLink
      v-if="page > 1"
      :to="linkFor(page - 1)"
      :class="[linkClass, 'w-auto px-4 hover:bg-surface']"
      rel="prev"
    >
      Previous
    </NuxtLink>

    <template v-for="(item, index) in items" :key="index">
      <span v-if="item === 'gap'" class="px-1 text-fg-muted" aria-hidden="true">…</span>
      <NuxtLink
        v-else
        :to="linkFor(item)"
        :aria-current="item === page ? 'page' : undefined"
        :aria-label="`Page ${item}`"
        :class="[linkClass, item === page ? 'bg-fg text-bg' : 'hover:bg-surface']"
      >
        {{ item }}
      </NuxtLink>
    </template>

    <NuxtLink
      v-if="page < totalPages"
      :to="linkFor(page + 1)"
      :class="[linkClass, 'w-auto px-4 hover:bg-surface']"
      rel="next"
    >
      Next
    </NuxtLink>
  </nav>
</template>