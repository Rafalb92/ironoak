<script setup lang="ts">
const { items, active } = defineProps<{
  items: readonly string[];
  active: readonly string[];
}>();

const isActive = (item: string) => active.includes(item);
</script>

<template>
  <ul aria-label="Product features" class="flex flex-wrap gap-y-2">
    <li v-for="(item, index) in items" :key="item" class="relative" :class="[index > 0 && '-ml-px', isActive(item) && 'z-10']">
      <Badge
        :variant="isActive(item) ? 'default' : 'outline'"
        class="rounded-pill px-4 py-2 font-data text-sm font-normal uppercase transition-colors duration-(--duration-base) ease-(--ease-lift)"
        :class="isActive(item) ? 'border-brass' : 'border-fg text-fg'"
      >
        {{ item }}
      </Badge>
    </li>
  </ul>
</template>