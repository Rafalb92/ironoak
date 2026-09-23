<script setup lang="ts">
import { IconShieldLock, IconTruckDelivery } from '@tabler/icons-vue';
import HeroShowcase from './HeroShowcase.vue';
import HeroBadges  from "./HeroBadges.vue";

const { slides, isPending } = useNewestProducts(3);

const active = ref(0);
watch(
  () => slides.value.length,
  (length) => {
    if (active.value >= length) active.value = 0;
  },
);

// TODO: replace with the union of product tags once Catalog exposes them;
// active badges will become the current product's tags.
const BADGES = ['Resistant', 'Anti-slip', 'Workout', 'Oak-grip'] as const;
const activeBadges = computed(() => [BADGES[active.value % BADGES.length]!]);

const FEATURES = [
  {
    icon: IconShieldLock,
    title: 'Secure checkout',
    text: 'Enjoy a safe and smooth purchasing experience every time.',
  },
  {
    icon: IconTruckDelivery,
    title: 'Free shipping',
    text: 'Delivered to your door at no extra cost, fully insured.',
  },
] as const;
</script>

<template>
  <section aria-labelledby="hero-title" class="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
    <div class="flex flex-col gap-10 lg:py-2">
      <HeroBadges class="rise-in" style="--i: 0" :items="BADGES" :active="activeBadges" />

      <div class="flex flex-col gap-8">
        <h1 id="hero-title" class="t-hero rise-in" style="--i: 1">
          Raw power. Precision <span class="text-oak">craftsmanship</span>.
        </h1>
        <p class="rise-in max-w-[60ch] font-data text-base leading-relaxed text-fg-secondary md:text-lg" style="--i: 2">
          Discover a new definition of training. Ironoak embodies innovative biomechanics encased in
          brushed steel and dark oak accents. Equip your space with gear that makes no compromises.
        </p>
      </div>

      <ul class="mt-auto grid gap-4 sm:grid-cols-2 lg:gap-6">
        <li v-for="(feature, index) in FEATURES" :key="feature.title" class="rise-in grid" :style="{ '--i': 3 + index }">
          <!-- bg-card already resolves to bg-surface through the shadcn bridge -->
          <Card class="gap-0 rounded-panel border-0 py-6 shadow-none">
            <CardHeader class="gap-0">
              <component :is="feature.icon" class="size-7" :stroke="1.75" aria-hidden="true" />
              <CardTitle class="mt-6 text-xl md:text-2xl">{{ feature.title }}</CardTitle>
              <CardDescription class="mt-3 font-data leading-relaxed">{{ feature.text }}</CardDescription>
            </CardHeader>
          </Card>
        </li>
      </ul>
    </div>

    <!-- grid, not height: 100% — a min-height parent doesn't give children a height -->
    <div class="rise-in grid min-h-104 sm:min-h-136 lg:min-h-160" style="--i: 2">
      <HeroShowcase v-if="slides.length" v-model:active="active" :slides="slides" />
      <div v-else class="rounded-panel bg-surface" :class="{ 'animate-pulse': isPending }" aria-hidden="true" />
    </div>
  </section>
</template>