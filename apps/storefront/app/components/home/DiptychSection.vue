<script setup lang="ts">
const root = useTemplateRef<HTMLElement>('root');
const { value, min, max, moveTo, followPointer, reset, nudge } = useDiptychSplit(root);

// touch keeps the position where the finger lifted; only the mouse springs back
function onPointerLeave(event: PointerEvent) {
  if (event.pointerType === 'mouse') reset();
}

function onKeydown(event: KeyboardEvent) {
  const step = event.shiftKey ? 10 : 2;

  switch (event.key) {
    case 'ArrowLeft':
    case 'ArrowDown':
      nudge(-step);
      break;
    case 'ArrowRight':
    case 'ArrowUp':
      nudge(step);
      break;
    case 'Home':
      moveTo(min);
      break;
    case 'End':
      moveTo(max);
      break;
    default:
      return;
  }

  event.preventDefault();
}
</script>

<template>
  <section aria-labelledby="diptych-title">
    <h2 id="diptych-title" class="sr-only">Two collections</h2>

    <div
      ref="root"
      class="relative isolate h-[min(85dvh,56rem)] min-h-144 touch-pan-y overflow-hidden rounded-panel select-none"
      style="--split: 50"
      @pointermove="followPointer"
      @pointerleave="onPointerLeave"
    >
      <!-- Wood: bottom layer, always full width -->
      <article aria-labelledby="wood-title" class="absolute inset-0 bg-oak text-ink">
        <NuxtImg
          src="/images/diptych/wood.webp"
          alt=""
          aria-hidden="true"
          format="webp"
          sizes="90vw lg:60vw 2xl:900px"
          loading="lazy"
          class="pointer-events-none absolute bottom-[10%] left-[3%] w-[62%] max-w-4xl"
        />

        <div
          class="absolute right-6 bottom-10 flex max-w-md flex-col items-end text-right md:right-10 lg:top-1/2 lg:bottom-auto lg:-translate-y-1/2"
        >
          <p class="t-eyebrow text-rust">Collection 02 — Wood Series</p>
          <h3 id="wood-title" class="t-series mt-4">Wood</h3>
          <p class="mt-6 text-base leading-snug text-iron md:text-xl">
            Solid oak, dry-oiled. Equipment that belongs in the living room — it looks better than
            most furniture.
          </p>
        </div>
      </article>

      <!-- Forge: top layer, clipped to the split -->
      <article aria-labelledby="forge-title" class="diptych-forge absolute inset-0 bg-charcoal text-bone">
        <NuxtImg
          src="/images/diptych/forge.webp"
          alt=""
          aria-hidden="true"
          format="webp"
          sizes="90vw lg:60vw 2xl:900px"
          loading="lazy"
          class="pointer-events-none absolute bottom-[22%] left-[34%] w-[36%] max-w-2xl"
        />

        <div class="absolute top-10 left-6 max-w-md md:left-10 lg:top-1/2 lg:-translate-y-1/2">
          <p class="t-eyebrow text-brass">Collection 01 — Forge Series</p>
          <h3 id="forge-title" class="t-series mt-4">Forge</h3>
          <p class="mt-6 text-base leading-snug text-bone-dim md:text-xl">
            Cast, relief-finished, ±10 g tolerance. A structure that outlasts everything.
          </p>
        </div>
      </article>

      <!-- seam line -->
      <div aria-hidden="true" class="diptych-seam pointer-events-none absolute inset-y-0 w-px -translate-x-1/2 bg-moss" />

      <!-- handle -->
      <div
        role="slider"
        tabindex="0"
        aria-label="Compare Forge and Wood collections"
        aria-orientation="horizontal"
        :aria-valuemin="min"
        :aria-valuemax="max"
        :aria-valuenow="value"
        :aria-valuetext="`${value}% Forge, ${100 - value}% Wood`"
        class="diptych-seam absolute top-1/2 grid size-14 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize place-items-center"
        @keydown="onKeydown"
      >
        <span class="absolute inset-2 rotate-45 rounded-milled border border-moss bg-ink/40 backdrop-blur-sm" />
        <span class="relative size-2 bg-bone" />
      </div>
    </div>
  </section>
</template>

<style scoped>
/* --split is a unitless 0–100 number written by useDiptychSplit */
.diptych-forge {
  clip-path: inset(0 calc(100% - var(--split) * 1%) 0 0);
}

.diptych-seam {
  left: calc(var(--split) * 1%);
}
</style>