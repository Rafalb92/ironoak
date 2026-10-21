<script setup lang="ts">
const auth = useAuthStore();

const nav = [
  { to: '/', label: 'Dashboard' },
  { to: '/products', label: 'Products' },
  { to: '/orders', label: 'Orders' },
  { to: '/users', label: 'Customers' },
];

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  DEMO_ADMIN: 'Demo admin',
  USER: 'Customer',
};

const roleLabel = computed(() => (auth.user ? (ROLE_LABELS[auth.user.role] ?? auth.user.role) : ''));
</script>

<template>
  <div class="flex min-h-screen bg-canvas">
    <aside class="w-56 shrink-0 border-r border-line bg-surface">
      <div class="flex h-14 items-center border-b border-line px-5">
        <span class="t-wordmark">IRONOAK</span>
      </div>

      <nav aria-label="Admin" class="flex flex-col gap-1 p-3">
        <NuxtLink
          v-for="item in nav"
          :key="item.to"
          :to="item.to"
          class="t-label px-3 py-2 text-fg-muted transition-colors hover:bg-raised hover:text-fg"
          active-class="bg-raised text-fg"
        >
          {{ item.label }}
        </NuxtLink>
      </nav>
    </aside>

    <div class="flex min-w-0 flex-1 flex-col">
      <header class="flex h-14 items-center justify-between border-b border-line px-6">
        <span class="t-eyebrow text-fg-muted">Admin panel</span>
        <div class="flex items-center gap-4">
          <span v-if="auth.user" class="t-spec text-fg-muted">
            {{ auth.user.email }} · {{ roleLabel }}
          </span>
          <Button variant="ghost" size="sm" @click="auth.logout()">Sign out</Button>
        </div>
      </header>

      <main class="min-w-0 flex-1 space-y-6 p-6">
        <!-- explains the disabled controls once, at the top of every page -->
        <DemoAdminNotice />
        <slot />
      </main>
    </div>
  </div>
</template>