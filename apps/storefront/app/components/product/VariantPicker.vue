<script setup lang="ts">
import type { ProductVariant } from '@ironoak/contracts';

const { variants, selectedId } = defineProps<{
  variants: readonly ProductVariant[];
  selectedId: string;
}>();

const emit = defineEmits<{ select: [variant: ProductVariant] }>();

const groupName = useId();

// Variants are ready-made versions, not independent option axes: attributes
// change together (weight follows finish on a rack). Name the group after the
// one field that varies, when there is exactly one.
const AXIS_LABELS = {
  weightGrams: 'Weight',
  color: 'Color',
  material: 'Material',
  finish: 'Finish',
} as const;

const label = computed(() => {
  const varying = (Object.keys(AXIS_LABELS) as (keyof typeof AXIS_LABELS)[]).filter(
    (field) => new Set(variants.map((v) => v[field])).size > 1,
  );
  return varying.length === 1 ? AXIS_LABELS[varying[0]!] : 'Version';
});
</script>

<template>
  <!-- native radios: arrow keys, focus and screen reader semantics for free -->
  <fieldset>
    <legend class="t-label text-fg-muted">{{ label }}</legend>

    <div class="mt-3 flex flex-wrap gap-2">
      <label v-for="variant in variants" :key="variant.id" class="cursor-pointer">
        <input
          type="radio"
          class="peer sr-only"
          :name="groupName"
          :value="variant.id"
          :checked="variant.id === selectedId"
          @change="emit('select', variant)"
        />
        <span
          class="block rounded-pill border px-4 py-2 font-data text-sm transition-colors duration-(--duration-fast) ease-lift peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-(--focus-ring)"
          :class="
            variant.id === selectedId
              ? 'border-fg bg-fg text-canvas'
              : variant.inStock
                ? 'border-line hover:border-fg'
                : 'border-line text-fg-muted line-through'
          "
        >
          {{ variant.name }}
        </span>
        <span v-if="!variant.inStock" class="sr-only">(out of stock)</span>
      </label>
    </div>
  </fieldset>
</template>