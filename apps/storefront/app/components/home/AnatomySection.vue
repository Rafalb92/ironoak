<script setup lang="ts">
import { IconArrowRight } from '@tabler/icons-vue';

interface Hotspot {
  id: string;
  /** position on the image, in percent — so it holds at every width */
  x: number;
  y: number;
  title: string;
  material: string;
  body: string;
}

const HOTSPOTS: Hotspot[] = [
  {
    id: 'crown',
    x: 50,
    y: 9,
    title: 'Oak crown',
    material: 'Solid white oak',
    body: 'The top crossmember is wrapped in oiled oak, so the first thing you see in the room is wood, not steel.',
  },
  {
    id: 'pull-up',
    x: 50,
    y: 17,
    title: 'Knurled pull-up bar',
    material: 'Brushed steel',
    body: 'A medium knurl that grips without tearing your hands — the same pattern as the Heirloom Barbell.',
  },
  {
    id: 'j-hooks',
    x: 28,
    y: 42,
    title: 'Lined J-hooks',
    material: 'Steel, polymer-lined',
    body: 'The bar never touches bare metal: the liner protects the knurl and keeps re-racking quiet.',
  },
  {
    id: 'uprights',
    x: 72,
    y: 55,
    title: 'Clad uprights',
    material: 'Steel core, oak panels',
    body: 'A full steel frame carries the load; removable oak panels hide every hole you are not using.',
  },
  {
    id: 'feet',
    x: 30,
    y: 92,
    title: 'Cast iron feet',
    material: 'Cast iron',
    body: 'Poured, not welded. Their weight keeps the rack planted without bolting it to your floor.',
  },
];

const active = ref(0);

function select(index: number) {
  active.value = index;
}

/**
 * Dev-only helper for placing hotspots on a new photo:
 * Alt + click on the image logs coordinates ready to paste into HOTSPOTS.
 */
function logCoordinates(event: MouseEvent) {
  if (!import.meta.dev || !event.altKey) return;
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const x = (((event.clientX - rect.left) / rect.width) * 100).toFixed(1);
  const y = (((event.clientY - rect.top) / rect.height) * 100).toFixed(1);
  console.info(`x: ${x}, y: ${y},`);
}
</script>

<template>
  <section
    aria-labelledby="anatomy-title"
    class="grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-center lg:gap-16"
  >
    <!-- the image with hotspots: a visual mirror of the list, for mouse and touch -->
    <div class="relative overflow-hidden rounded-panel bg-surface" @click="logCoordinates">
      <NuxtImg
        src="/images/home/atlas-anatomy.webp"
        alt="The Atlas Rack: an oak-clad steel power rack standing on cast iron feet"
        width="1200"
        height="1500"
        loading="lazy"
        sizes="xs:100vw sm:100vw lg:52vw 2xl:750px"
        class="aspect-4/5 w-full object-cover"
      />

      <!--
        hidden from assistive tech on purpose: the list below is the accessible
        control, and duplicate buttons would announce every detail twice
      -->
      <button
        v-for="(spot, index) in HOTSPOTS"
        :key="spot.id"
        type="button"
        tabindex="-1"
        aria-hidden="true"
        class="absolute flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
        :style="{ left: `${spot.x}%`, top: `${spot.y}%` }"
        @mouseenter="select(index)"
        @click="select(index)"
      >
        <span
          v-if="active === index"
          class="absolute inset-1 rounded-full bg-bone/60 motion-safe:animate-ping"
        />
        <span
          class="relative flex size-8 items-center justify-center rounded-full font-data text-xs shadow-sm transition-[transform,background-color,color] duration-(--duration-fast) ease-(--ease-lift)"
          :class="active === index ? 'scale-110 bg-ink text-bone' : 'bg-bone/90 text-ink hover:scale-110'"
        >
          {{ index + 1 }}
        </span>
      </button>
    </div>

    <div class="flex flex-col">
      <p class="t-label text-fg-muted">Anatomy of the Atlas Rack</p>
      <h2 id="anatomy-title" class="t-section mt-4">Built like furniture. Loaded like a rack.</h2>

      <!-- the accessible control: a disclosure list, one detail open at a time -->
      <ol class="mt-10 border-b border-line">
        <li v-for="(spot, index) in HOTSPOTS" :key="spot.id" class="border-t border-line">
          <button
            :id="`anatomy-trigger-${spot.id}`"
            type="button"
            class="flex w-full items-baseline gap-4 py-4 text-left"
            :aria-expanded="active === index"
            :aria-controls="`anatomy-panel-${spot.id}`"
            @click="select(index)"
          >
            <span
              class="font-data text-xs transition-colors duration-(--duration-fast) ease-(--ease-lift)"
              :class="active === index ? 'text-fg' : 'text-fg-muted'"
            >
              {{ String(index + 1).padStart(2, '0') }}
            </span>
            <span class="flex flex-1 flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <span class="font-semibold">{{ spot.title }}</span>
              <span class="t-spec text-fg-muted">{{ spot.material }}</span>
            </span>
          </button>

          <!-- 0fr → 1fr: height animates without measuring the content -->
          <div
            :id="`anatomy-panel-${spot.id}`"
            role="region"
            :aria-labelledby="`anatomy-trigger-${spot.id}`"
            class="grid transition-[grid-template-rows] duration-(--duration-base) ease-(--ease-lift)"
            :class="active === index ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
            :inert="active !== index"
          >
            <div class="overflow-hidden">
              <p class="t-body-md max-w-prose pb-5 pl-9 text-fg-secondary">{{ spot.body }}</p>
            </div>
          </div>
        </li>
      </ol>

      <NuxtLink
        to="/products/atlas-rack"
        class="t-spec group mt-8 flex w-fit items-center gap-2 underline-offset-4 hover:underline"
      >
        Explore the Atlas Rack
        <IconArrowRight
          class="size-4 transition-transform duration-(--duration-fast) ease-(--ease-lift) group-hover:translate-x-0.5"
          :stroke="1.75"
          aria-hidden="true"
        />
      </NuxtLink>
    </div>
  </section>
</template>