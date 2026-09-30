<script setup lang="ts">
import type { ProductImage } from '@ironoak/contracts';
import { useMediaQuery, usePreferredReducedMotion } from '@vueuse/core';

const { images, productName } = defineProps<{
  images: readonly ProductImage[];
  productName: string;
}>();

// --- selection: click chooses, hover previews ---
const selected = ref(0);
const preview = ref<number | null>(null);
const shown = computed(() => preview.value ?? selected.value);
const hasImages = computed(() => images.length > 0);

// a new variant brings a new image set — start from its first image
watch(
  () => images,
  () => {
    selected.value = 0;
    preview.value = null;
  },
);

function onThumbEnter(index: number, event: PointerEvent) {
  // touch has no hover; a tap would otherwise preview and select at once
  if (event.pointerType === 'mouse') preview.value = index;
}

function choose(index: number) {
  selected.value = index;
  preview.value = null;
}

// --- zoom: precise pointers only, origin follows the cursor ---
const canZoom = useMediaQuery('(pointer: fine)');
const stage = useTemplateRef<HTMLElement>('stage');
const zooming = ref(false);

let frame: number | null = null;
let pending: { x: number; y: number } | null = null;

function onStageMove(event: PointerEvent) {
  if (!canZoom.value || !hasImages.value || event.pointerType !== 'mouse') return;
  const el = stage.value;
  if (!el) return;

  const rect = el.getBoundingClientRect();
  pending = {
    x: ((event.clientX - rect.left) / rect.width) * 100,
    y: ((event.clientY - rect.top) / rect.height) * 100,
  };
  zooming.value = true;

  // one style write per frame, no Vue re-render
  if (frame === null) {
    frame = requestAnimationFrame(() => {
      frame = null;
      if (!pending) return;
      el.style.setProperty('--zoom-x', `${pending.x}%`);
      el.style.setProperty('--zoom-y', `${pending.y}%`);
    });
  }
}

function onStageLeave() {
  zooming.value = false;
}

onBeforeUnmount(() => {
  if (frame !== null) cancelAnimationFrame(frame);
});

// --- mobile: swipeable strip with dots ---
const strip = useTemplateRef<HTMLElement>('strip');
const stripIndex = ref(0);
const reducedMotion = usePreferredReducedMotion();

function onStripScroll() {
  const el = strip.value;
  if (!el) return;
  stripIndex.value = Math.round(el.scrollLeft / el.clientWidth);
}

function scrollToSlide(index: number) {
  const el = strip.value;
  if (!el) return;
  el.scrollTo({
    left: index * el.clientWidth,
    behavior: reducedMotion.value === 'reduce' ? 'auto' : 'smooth',
  });
}
</script>

<template>
  <div>
    <!-- desktop: thumbnails + zoomable stage -->
    <div class="hidden gap-4 lg:grid lg:grid-cols-[5.5rem_1fr]">
      <div
        v-if="images.length > 1"
        role="group"
        aria-label="Product images"
        class="flex flex-col gap-3"
        @pointerleave="preview = null"
      >
        <button
          v-for="(image, index) in images"
          :key="image.url"
          type="button"
          :aria-pressed="index === selected"
          :aria-label="`Show image ${index + 1} of ${images.length}`"
          class="aspect-square overflow-hidden rounded-panel border-2 transition-[opacity,border-color] duration-(--duration-base) ease-lift"
          :class="
            index === shown
              ? 'border-fg opacity-100'
              : 'border-transparent opacity-60 hover:opacity-100'
          "
          @pointerenter="onThumbEnter(index, $event)"
          @click="choose(index)"
        >
          <ProductMedia
            :src="image.url"
            alt=""
            compact
            loading="lazy"
            sizes="88px"
            class="size-full"
          />
        </button>
      </div>

      <div
        ref="stage"
        class="relative aspect-square overflow-hidden rounded-panel bg-surface"
        :class="[
          images.length > 1 ? 'col-start-2' : 'col-span-2',
          canZoom && hasImages && 'cursor-zoom-in',
        ]"
        style="--zoom-x: 50%; --zoom-y: 50%"
        @pointermove="onStageMove"
        @pointerleave="onStageLeave"
      >
        <div
          class="size-full transition-transform duration-(--duration-base) ease-iron"
          :class="zooming ? 'scale-200' : 'scale-100'"
          style="transform-origin: var(--zoom-x) var(--zoom-y)"
        >
          <template v-if="hasImages">
            <ProductMedia
              v-for="(image, index) in images"
              :key="image.url"
              :src="image.url"
              :alt="index === shown ? image.alt : ''"
              :label="productName"
              :aria-hidden="index !== shown"
              :loading="index === 0 ? 'eager' : 'lazy'"
              sizes="100vw lg:55vw"
              class="absolute inset-0 size-full transition-opacity duration-(--duration-slow) ease-(--ease-iron)"
              :class="index === shown ? 'opacity-100' : 'opacity-0'"
            />
          </template>
          <ProductMedia
            v-else
            :src="null"
            :alt="productName"
            :label="productName"
            class="size-full"
          />
        </div>
      </div>
    </div>

    <!-- mobile: swipeable strip -->
    <div class="lg:hidden">
      <ul
        ref="strip"
        aria-label="Product images"
        class="flex snap-x snap-mandatory overflow-x-auto rounded-panel scrollbar-none"
        @scroll.passive="onStripScroll"
      >
        <template v-if="hasImages">
          <li
            v-for="(image, index) in images"
            :key="image.url"
            class="aspect-square w-full shrink-0 snap-center"
          >
            <ProductMedia
              :src="image.url"
              :alt="image.alt"
              :label="productName"
              :loading="index === 0 ? 'eager' : 'lazy'"
              sizes="100vw"
              class="size-full"
            />
          </li>
        </template>
        <li v-else class="aspect-square w-full shrink-0">
          <ProductMedia :src="null" :alt="productName" :label="productName" class="size-full" />
        </li>
      </ul>

      <div v-if="images.length > 1" class="mt-2 flex justify-center">
        <button
          v-for="(image, index) in images"
          :key="image.url"
          type="button"
          :aria-label="`Go to image ${index + 1}`"
          :aria-current="index === stripIndex"
          class="p-2"
          @click="scrollToSlide(index)"
        >
          <span
            class="block size-2 rounded-pill transition-colors duration-(--duration-fast) ease-lift"
            :class="index === stripIndex ? 'bg-fg' : 'bg-fg/25'"
          />
        </button>
      </div>
    </div>
  </div>
</template>
