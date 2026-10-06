<script setup lang="ts">
import type { ProductVariant } from '@ironoak/contracts';

const { variant } = defineProps<{ variant: ProductVariant }>();

const rows = computed(() => variantSpecs(variant));
</script>

<template>
  <section aria-labelledby="specs-title">
    <h2 id="specs-title" class="t-section">Specifications</h2>

    <dl class="mt-8 grid border-t border-line sm:grid-cols-2 sm:gap-x-12">
      <div
        v-for="row in rows"
        :key="row.label"
        class="flex items-baseline justify-between gap-6 border-b border-line py-4"
      >
        <dt class="t-label text-fg-muted">{{ row.label }}</dt>
        <!-- numbers are always monospace — brand signature -->
        <dd class="t-spec text-right">{{ row.value }}</dd>
      </div>
    </dl>
  </section>
</template>