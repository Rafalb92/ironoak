<script setup lang="ts">
import { IconLogout } from '@tabler/icons-vue';

definePageMeta({ middleware: 'auth' });

const auth = useAuthStore();
const route = useRoute();

const SECTIONS = [
  { to: '/account/orders', label: 'Orders' },
  { to: '/account/addresses', label: 'Addresses' },
] as const;

const isActive = (to: string) => route.path === to || route.path.startsWith(`${to}/`);

const signingOut = ref(false);

async function signOut() {
  signingOut.value = true;
  await auth.logout();
}
</script>

<template>
  <div class="flex flex-col gap-10">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="t-section">Your account</h1>
        <p v-if="auth.user" class="t-spec mt-3 text-fg-muted">Signed in as {{ auth.user.email }}</p>
      </div>
    </header>

    <div class="grid gap-8 lg:grid-cols-[13rem_1fr] lg:gap-16">
      <!-- tabs on mobile, a sidebar from lg up -->
      <nav aria-label="Account" class="flex gap-2 overflow-x-auto lg:flex-col lg:gap-1">
        <NuxtLink
          v-for="section in SECTIONS"
          :key="section.to"
          :to="section.to"
          :aria-current="isActive(section.to) ? 'page' : undefined"
          class="shrink-0 rounded-pill px-5 py-2.5 font-data text-sm transition-colors duration-(--duration-fast) ease-(--ease-lift)"
          :class="isActive(section.to) ? 'bg-surface text-fg' : 'text-fg-muted hover:text-fg'"
        >
          {{ section.label }}
        </NuxtLink>

        <button
          type="button"
          class="flex shrink-0 items-center gap-2 rounded-pill px-5 py-2.5 font-data text-sm text-fg-muted transition-colors duration-(--duration-fast) ease-(--ease-lift) hover:text-fg disabled:opacity-40 lg:mt-6"
          :disabled="signingOut"
          @click="signOut"
        >
          <IconLogout class="size-4" stroke="1.75" aria-hidden="true" />
          {{ signingOut ? 'Signing out…' : 'Sign out' }}
        </button>
      </nav>

      <div class="min-w-0">
        <NuxtPage />
      </div>
    </div>
  </div>
</template>