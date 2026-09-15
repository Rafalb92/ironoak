<!-- packages/layer-base/app/app.vue -->
<template>
  <NuxtLoadingIndicator color="var(--color-brass)" />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <Toaster />
</template>

<script setup lang="ts">
import 'vue-sonner/style.css'
import { Toaster } from '@/components/ui/sonner'
</script>