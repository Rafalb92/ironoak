<script setup lang="ts">
import { IconBarbell } from '@tabler/icons-vue';

const {
  src,
  alt,
  label,
  compact = false,
} = defineProps<{
  src: string | null;
  alt: string;
  label?: string;
  compact?: boolean;
}>();

const failed = ref(false);
const image = useTemplateRef<HTMLImageElement>('image');

watch(
  () => src,
  () => {
    failed.value = false;
  },
);

// An image that failed during SSR fires `error` before hydration attaches
// the listener — the event is lost, so check the element's state instead.
onMounted(() => {
  if (image.value?.complete && image.value.naturalWidth === 0) failed.value = true;
});
</script>

<template>
  <img
    v-if="src && !failed"
    ref="image"
    :src="src"
    :alt="alt"
    decoding="async"
    class="object-cover"
    @error="failed = true"
  />
  <div
    v-else
    :role="alt ? 'img' : undefined"
    :aria-label="alt || undefined"
    class="flex flex-col items-center justify-center gap-4 bg-surface text-fg-muted"
  >
    <IconBarbell class="-rotate-45" :class="compact ? 'size-6' : 'size-16'" :stroke="1.25" aria-hidden="true" />
    <span v-if="label && !compact" class="t-eyebrow">{{ label }}</span>
  </div>
</template>