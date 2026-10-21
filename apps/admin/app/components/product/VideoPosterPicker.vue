<script setup lang="ts">
import { useObjectUrl } from '@vueuse/core';

const { file } = defineProps<{ file: File }>();
const emit = defineEmits<{ captured: [poster: File] }>();

const MAX_POSTER_WIDTH = 1920;
// the very first frames are often black or a fade-in
const DEFAULT_FRAME_SECONDS = 1;

const videoUrl = useObjectUrl(() => file);
const video = useTemplateRef<HTMLVideoElement>('video');

const duration = ref(0);
const time = ref(0);
const capturing = ref(false);
const error = ref<string | null>(null);

const poster = ref<File | null>(null);
const posterUrl = useObjectUrl(poster);

watch(
  () => file,
  () => {
    duration.value = 0;
    time.value = 0;
    poster.value = null;
    error.value = null;
  },
);

function seek(seconds: number): Promise<void> {
  const element = video.value;
  if (!element) return Promise.resolve();
  return new Promise((resolve) => {
    element.addEventListener('seeked', () => resolve(), { once: true });
    element.currentTime = seconds;
  });
}

async function capture() {
  const element = video.value;
  if (!element?.videoWidth) return;

  capturing.value = true;
  error.value = null;

  try {
    const scale = Math.min(1, MAX_POSTER_WIDTH / element.videoWidth);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(element.videoWidth * scale);
    canvas.height = Math.round(element.videoHeight * scale);

    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas is not available');
    context.drawImage(element, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (result) => (result ? resolve(result) : reject(new Error('Could not capture the frame'))),
        'image/webp',
        0.85,
      ),
    );

    // browsers without WebP encoding fall back to PNG — both are allowed poster types
    const extension = blob.type === 'image/webp' ? 'webp' : 'png';
    const captured = new File([blob], `poster.${extension}`, { type: blob.type });

    poster.value = captured;
    emit('captured', captured);
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Could not capture the frame';
  } finally {
    capturing.value = false;
  }
}

async function onLoadedMetadata() {
  const element = video.value;
  if (!element) return;

  duration.value = element.duration;
  time.value = Math.min(DEFAULT_FRAME_SECONDS, element.duration / 2);

  // a sensible poster without any interaction; the admin can pick another frame
  await seek(time.value);
  await capture();
}

function onScrub() {
  void seek(time.value);
}
</script>

<template>
  <div class="space-y-3">
    <video
      ref="video"
      :src="videoUrl"
      muted
      playsinline
      preload="auto"
      class="max-h-40 w-full bg-ink object-contain"
      @loadedmetadata="onLoadedMetadata"
    />

    <div class="flex items-center gap-3">
      <input
        v-model.number="time"
        type="range"
        min="0"
        :max="duration"
        step="0.05"
        aria-label="Poster frame position"
        class="flex-1 accent-fg"
        :disabled="!duration"
        @input="onScrub"
      />
      <span class="t-spec w-12 text-right text-fg-muted tabular-nums">{{ time.toFixed(1) }}s</span>
      <Button type="button" variant="outline" size="sm" :disabled="!duration || capturing" @click="capture">
        Use this frame
      </Button>
    </div>

    <div v-if="posterUrl" class="flex items-center gap-3">
      <img :src="posterUrl" alt="" class="h-14 border border-line object-cover" />
      <span class="t-spec text-fg-muted">Poster — shown before the video plays</span>
    </div>

    <p v-if="error" class="t-spec text-destructive">{{ error }}</p>
  </div>
</template>