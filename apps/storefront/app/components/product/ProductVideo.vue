<script setup lang="ts">
import {
  IconPlayerPauseFilled,
  IconPlayerPlayFilled,
  IconVolume,
  IconVolumeOff,
} from '@tabler/icons-vue';
import { usePreferredReducedMotion } from '@vueuse/core';

const {
  src,
  poster,
  label,
  active,
  autoplay = false,
} = defineProps<{
  src: string;
  poster: string | null;
  label: string;
  /** this slide is the one currently shown */
  active: boolean;
  /** start (muted) when it becomes active — desktop only */
  autoplay?: boolean;
}>();

const video = useTemplateRef<HTMLVideoElement>('video');
const reducedMotion = usePreferredReducedMotion();

const playing = ref(false);
const muted = ref(true);

async function play() {
  const element = video.value;
  if (!element) return;
  // browsers only allow autoplay when muted; the user unmutes explicitly
  element.muted = muted.value;
  try {
    await element.play();
  } catch {
    // autoplay blocked — the play button stays available
  }
}

function pause() {
  video.value?.pause();
}

function togglePlay() {
  if (playing.value) pause();
  else void play();
}

function toggleMute() {
  muted.value = !muted.value;
  if (video.value) video.value.muted = muted.value;
}

function sync(isActive: boolean) {
  if (!isActive) {
    pause();
    return;
  }
  if (autoplay && reducedMotion.value !== 'reduce') void play();
}

watch(
  () => [active, autoplay] as const,
  ([isActive]) => sync(isActive),
)
onMounted(() => sync(active));
</script>

<template>
  <div class="relative size-full bg-ink">
    <!-- preload none: only the poster is fetched until the video is played -->
    <video
      ref="video"
      :src="src"
      :poster="poster ?? undefined"
      :aria-label="label"
      muted
      loop
      playsinline
      preload="none"
      class="size-full object-cover"
      @play="playing = true"
      @pause="playing = false"
    />

    <!-- large play button while paused; the whole poster is the target -->
    <button
      v-if="!playing"
      type="button"
      :aria-label="`Play video: ${label}`"
      class="absolute inset-0 grid place-items-center"
      @click="togglePlay"
    >
      <span class="grid size-16 place-items-center rounded-pill bg-ink/70 text-bone backdrop-blur-sm">
        <IconPlayerPlayFilled class="size-7" aria-hidden="true" />
      </span>
    </button>

    <!-- auto-playing content must be pausable (WCAG 2.2.2) -->
    <div v-else class="absolute bottom-4 left-4 flex gap-2">
      <button
        type="button"
        aria-label="Pause video"
        class="grid size-10 place-items-center rounded-pill bg-ink/70 text-bone backdrop-blur-sm"
        @click="togglePlay"
      >
        <IconPlayerPauseFilled class="size-5" aria-hidden="true" />
      </button>
      <button
        type="button"
        :aria-label="muted ? 'Unmute video' : 'Mute video'"
        :aria-pressed="!muted"
        class="grid size-10 place-items-center rounded-pill bg-ink/70 text-bone backdrop-blur-sm"
        @click="toggleMute"
      >
        <IconVolumeOff v-if="muted" class="size-5" :stroke="1.75" aria-hidden="true" />
        <IconVolume v-else class="size-5" :stroke="1.75" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>