<script setup lang="ts">
const auth = useAuthStore();
</script>

<template>
  <p v-if="auth.isDemoAdmin" role="note" class="t-body-sm border border-line bg-surface px-4 py-3">
    <span class="font-semibold">Demo admin.</span>
    You can browse everything and move orders through fulfillment, shipping and delivery — each step emails the
    customer. Editing the catalogue is disabled.
  </p>
</template>