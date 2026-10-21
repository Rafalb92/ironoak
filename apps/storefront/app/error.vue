<script setup lang="ts">
import type { NuxtError } from '#app';

const { error } = defineProps<{ error: NuxtError }>();

const notFound = computed(() => error.statusCode === 404);

useSeoMeta({
  title: () => (notFound.value ? 'Page not found' : 'Something went wrong'),
  robots: 'noindex',
});

// clearError resets Nuxt's error state — a plain link would keep showing this page
function goHome() {
  return clearError({ redirect: '/' });
}

function browse() {
  return clearError({ redirect: '/products' });
}
</script>

<template>
  <!-- the shop's own layout: header, demo banner and footer stay on error pages -->
  <NuxtLayout>
    <section class="flex flex-col items-start gap-6 py-16 md:py-24">
      <p class="t-label text-fg-muted">{{ error.statusCode }}</p>
      <h1 class="t-section max-w-2xl">
        {{ notFound ? "This page doesn't exist — or it was moved." : 'Something went wrong on our side.' }}
      </h1>
      <p class="t-body-md max-w-prose text-fg-secondary">
        {{
          notFound
            ? 'The product may no longer be available. The rest of the shop is still here.'
            : 'Please try again in a moment. If it keeps happening, the demo may be restarting.'
        }}
      </p>
      <div class="flex flex-wrap gap-3">
        <Button size="lg" class="h-12 rounded-pill px-8" @click="browse">Browse products</Button>
        <Button variant="outline" size="lg" class="h-12 rounded-pill px-8" @click="goHome">Go to the homepage</Button>
      </div>
    </section>
  </NuxtLayout>
</template>