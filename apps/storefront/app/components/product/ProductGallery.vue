<script setup lang="ts">
import type { ProductImage } from '@ironoak/contracts';
import { IconPlayerPlayFilled } from '@tabler/icons-vue';
import { useMediaQuery, usePreferredReducedMotion } from '@vueuse/core';

const { images, productName } = defineProps<{
  images: readonly ProductImage[];
  productName: string;
}>();

// Resting on a thumbnail this long selects it; moving across thumbnails does not.
const HOVER_INTENT_MS = 200;

// --- selection: hover intent or click — both stick, nothing reverts on leave ---
const selected = ref(0);
// a video starts playing only when chosen by click, never by hover
const selectedBy = ref<'hover' | 'click'>('hover');

const hasImages = computed(() => images.length > 0);
const shownIsVideo = computed(() => images[selected.value]?.type === 'VIDEO');

const isVideo = (image: ProductImage) => image.type === 'VIDEO';
// a video's thumbnail is its poster
const thumbnailSrc = (image: ProductImage) => (isVideo(image) ? image.posterUrl : image.url);

let hoverTimer: ReturnType<typeof setTimeout> | null = null;

function clearHoverTimer() {
  if (hoverTimer !== null) {
    clearTimeout(hoverTimer);
    hoverTimer = null;
  }
}

function onThumbEnter(index: number, event: PointerEvent) {
  // touch has no hover; a tap goes through click
  if (event.pointerType !== 'mouse') return;
  clearHoverTimer();
  hoverTimer = setTimeout(() => {
    hoverTimer = null;
    if (selected.value === index) return;
    selected.value = index;
    selectedBy.value = 'hover';
  }, HOVER_INTENT_MS);
}

function choose(index: number) {
  clearHoverTimer();
  selected.value = index;
  selectedBy.value = 'click';
}

// a new variant brings a new media set — start from its first item, without autoplay
watch(
  () => images,
  () => {
    clearHoverTimer();
    selected.value = 0;
    selectedBy.value = 'hover';
  },
);

// --- zoom: precise pointers only, images only, origin follows the cursor ---
const canZoom = useMediaQuery('(pointer: fine)');
const stage = useTemplateRef<HTMLElement>('stage');
const zooming = ref(false);
const zoomEnabled = computed(() => canZoom.value && hasImages.value && !shownIsVideo.value);

let frame: number | null = null;
let pending: { x: number; y: number } | null = null;

function onStageMove(event: PointerEvent) {
  if (!zoomEnabled.value || event.pointerType !== 'mouse') return;
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

// switching to a video must not leave the stage zoomed in
watch(shownIsVideo, (video) => {
  if (video) zooming.value = false;
});

onBeforeUnmount(() => {
  clearHoverTimer();
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
    <!-- desktop: thumbnails + stage -->
    <div class="hidden gap-4 lg:grid lg:grid-cols-[5.5rem_1fr]">
      <div v-if="images.length > 1" role="group" aria-label="Product media" class="flex flex-col gap-3">
        <button
          v-for="(image, index) in images"
          :key="image.url"
          type="button"
          :aria-pressed="index === selected"
          :aria-label="`Show ${isVideo(image) ? 'video' : 'image'} ${index + 1} of ${images.length}`"
          class="relative aspect-square overflow-hidden rounded-panel border-2 transition-[opacity,border-color] duration-(--duration-base) ease-(--ease-lift)"
          :class="index === selected ? 'border-fg opacity-100' : 'border-transparent opacity-60 hover:opacity-100'"
          @pointerenter="onThumbEnter(index, $event)"
          @pointerleave="clearHoverTimer"
          @click="choose(index)"
        >
          <ProductMedia :src="thumbnailSrc(image)" alt="" compact loading="lazy" sizes="88px" class="size-full" />
          <span
            v-if="isVideo(image)"
            class="absolute inset-0 grid place-items-center bg-ink/25 text-bone"
            aria-hidden="true"
          >
            <IconPlayerPlayFilled class="size-6" />
          </span>
        </button>
      </div>

      <div
        ref="stage"
        class="relative aspect-square overflow-hidden rounded-panel bg-surface"
        :class="[images.length > 1 ? 'col-start-2' : 'col-span-2', zoomEnabled && 'cursor-zoom-in']"
        style="--zoom-x: 50%; --zoom-y: 50%"
        @pointermove="onStageMove"
        @pointerleave="onStageLeave"
      >
        <div
          class="size-full transition-transform duration-(--duration-base) ease-(--ease-iron)"
          :class="zooming ? 'scale-200' : 'scale-100'"
          style="transform-origin: var(--zoom-x) var(--zoom-y)"
        >
          <template v-if="hasImages">
            <div
              v-for="(image, index) in images"
              :key="image.url"
              class="absolute inset-0 transition-opacity duration-(--duration-slow) ease-(--ease-iron)"
              :class="index === selected ? 'z-10 opacity-100' : 'pointer-events-none opacity-0'"
              :aria-hidden="index !== selected"
            >
              <ProductVideo
                v-if="isVideo(image)"
                :src="image.url"
                :poster="image.posterUrl"
                :label="image.alt"
                :active="index === selected"
                :autoplay="selectedBy === 'click'"
              />
              <ProductMedia
                v-else
                :src="image.url"
                :alt="index === selected ? image.alt : ''"
                :label="productName"
                :loading="index === 0 ? 'eager' : 'lazy'"
                sizes="100vw lg:55vw"
                class="size-full"
              />
            </div>
          </template>
          <ProductMedia v-else :src="null" :alt="productName" :label="productName" class="size-full" />
        </div>
      </div>
    </div>

    <!-- mobile: swipeable strip -->
    <div class="lg:hidden">
      <ul
        ref="strip"
        aria-label="Product media"
        class="flex snap-x snap-mandatory overflow-x-auto rounded-panel [scrollbar-width:none]"
        @scroll.passive="onStripScroll"
      >
        <template v-if="hasImages">
          <li v-for="(image, index) in images" :key="image.url" class="aspect-square w-full shrink-0 snap-center">
            <!-- no autoplay on mobile: a video is downloaded only after a tap -->
            <ProductVideo
              v-if="isVideo(image)"
              :src="image.url"
              :poster="image.posterUrl"
              :label="image.alt"
              :active="index === stripIndex"
            />
            <ProductMedia
              v-else
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
          :aria-label="`Go to ${isVideo(image) ? 'video' : 'image'} ${index + 1}`"
          :aria-current="index === stripIndex"
          class="p-2"
          @click="scrollToSlide(index)"
        >
          <span
            class="block size-2 rounded-pill transition-colors duration-(--duration-fast) ease-(--ease-lift)"
            :class="index === stripIndex ? 'bg-fg' : 'bg-fg/25'"
          />
        </button>
      </div>
    </div>
  </div>
</template>