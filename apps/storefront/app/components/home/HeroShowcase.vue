<script setup lang="ts">
import { IconArrowUpRight, IconHeart, IconHeartFilled } from '@tabler/icons-vue';
import type { HeroSlide } from '../../composables/useNewestProducts';

const { slides } = defineProps<{ slides: readonly HeroSlide[] }>();
const active = defineModel<number>('active', { default: 0 });

const current = computed(() => slides[active.value] ?? slides[0]);

// TODO: replaced by wishlist store
const favourites = reactive(new Set<string>());
const isFavourite = computed(() => (current.value ? favourites.has(current.value.id) : false));

function toggleFavourite(id: string) {
  if (favourites.has(id)) favourites.delete(id);
  else favourites.add(id);
}
</script>

<template>
  <div class="relative isolate overflow-hidden rounded-panel bg-surface">
    <!--
      All slides are stacked and cross-faded. The next product is already
      loaded, so switching never flashes an empty frame.
    -->
    <ProductMedia
      v-for="(slide, index) in slides"
      :key="slide.id"
      :src="slide.image.url"
      :alt="index === active ? slide.image.alt : ''"
      :label="slide.name"
      :aria-hidden="index !== active"
      :loading="index === 0 ? 'eager' : 'lazy'"
      :fetchpriority="index === 0 ? 'high' : 'auto'"
      class="absolute inset-0 size-full transition-[opacity,scale] duration-(--duration-heavy) ease-(--ease-iron)"
      :class="index === active ? 'scale-100 opacity-100' : 'scale-[1.03] opacity-0'"
    />

    <!-- product card: solid dark, it must read on any photo -->
    <div
      v-if="current"
      class="absolute top-4 right-4 left-4 flex items-center gap-6 rounded-panel bg-ink py-3 pr-3 pl-5 text-bone shadow-lg  ring-1 ring-bone/10 sm:right-auto sm:min-w-72 bg-canvas"
    >
      <div class="min-w-0" aria-live="polite">
        <p class="t-eyebrow text-bone">New arrival</p>
        <Transition name="swap" mode="out-in">
          <p :key="current.id" class="mt-2 truncate text-lg leading-tight font-semibold">{{ current.name }}</p>
        </Transition>
      </div>

      <div class="ml-auto flex shrink-0 gap-2">
        <Button
          variant="ghost"
          size="icon"
          class="size-10 rounded-pill bg-bone/10 text-bone hover:bg-bone/20 hover:text-bone"
          :aria-pressed="isFavourite"
          :aria-label="isFavourite ? `Remove ${current.name} from favourites` : `Add ${current.name} to favourites`"
          @click="toggleFavourite(current.id)"
        >
          <IconHeartFilled v-if="isFavourite" class="size-5 text-brass-bright" aria-hidden="true" />
          <IconHeart v-else class="size-5" :stroke="1.75" aria-hidden="true" />
        </Button>

        <Button as-child size="icon" class="size-10 rounded-pill bg-bone text-ink hover:bg-brass-bright">
          <NuxtLink :to="`/products/${current.slug}`" :aria-label="`View ${current.name}`">
            <IconArrowUpRight class="size-5" :stroke="1.75" aria-hidden="true" />
          </NuxtLink>
        </Button>
      </div>
    </div>

    <!-- thumbnails: native buttons, Button's padding and height would all be overridden -->
    <div
      v-if="slides.length > 1"
      role="group"
      aria-label="Newest products"
      class="absolute right-4 bottom-4 flex flex-col gap-2"
    >
      <button
        v-for="(slide, index) in slides"
        :key="slide.id"
        type="button"
        :aria-pressed="index === active"
        :aria-label="`Show ${slide.name}`"
        class="size-16 overflow-hidden rounded-panel border-2 transition-[opacity,border-color] duration-(--duration-base) ease-(--ease-lift) sm:size-20 lg:size-24"
        :class="
          index === active
            ? 'border-bone opacity-100 shadow-lg shadow-ink/20'
            : 'border-transparent opacity-50 hover:opacity-80'
        "
        @click="active = index"
      >
        <ProductMedia :src="slide.image.url" alt="" compact loading="lazy" class="size-full" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.swap-enter-active,
.swap-leave-active {
  transition:
    opacity var(--duration-fast) var(--ease-lift),
    transform var(--duration-fast) var(--ease-lift);
}

.swap-enter-from {
  opacity: 0;
  transform: translateY(var(--nudge));
}

.swap-leave-to {
  opacity: 0;
}
</style>