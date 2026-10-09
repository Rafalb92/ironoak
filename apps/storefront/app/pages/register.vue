<script setup lang="ts">
definePageMeta({ middleware: 'guest-only' });

useSeoMeta({
  title: 'Create account',
  robots: 'noindex',
});
</script>

<template>
  <div class="py-6 md:py-12">
    <AuthForm mode="register" />
  </div>
</template>