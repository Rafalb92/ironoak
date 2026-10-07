<script setup lang="ts">
import { IconBarbell, IconMenu2, IconUser, IconX } from '@tabler/icons-vue';
import { useWindowScroll } from '@vueuse/core';
import { useCartStore } from '../../stores/cart';

const { items, isActive } = useSiteNavigation();
const auth = useAuthStore();
const cart = useCartStore();
const route = useRoute();

const { y } = useWindowScroll();
const scrolled = computed(() => y.value > 8);

const mobileOpen = ref(false);
// every navigation closes the menu — including a link inside it
watch(
  () => route.fullPath,
  () => {
    mobileOpen.value = false;
  },
);

const cartLabel = computed(
  () => `Cart, ${cart.count} ${cart.count === 1 ? 'item' : 'items'}`,
);

const accountTo = computed(() => (auth.isAuthenticated ? '/account' : '/login'));
const accountLabel = computed(() => (auth.isAuthenticated ? 'Your account' : 'Sign in'));
</script>

<template>
  <header
    class="sticky top-0 z-40 border-b transition-[background-color,border-color] duration-(--duration-base) ease-(--ease-lift)"
    :class="scrolled ? 'border-line-subtle bg-canvas/85 backdrop-blur-md' : 'border-transparent bg-canvas'"
  >
    <div class="mx-auto flex h-20 max-w-site items-center justify-between gap-4 px-4 md:px-6">
      <!-- logo -->
      <NuxtLink
        to="/"
        aria-label="IRONOAK — home"
        class="flex items-center gap-3 rounded-pill bg-surface py-2.5 pr-5 pl-4 transition-transform duration-(--duration-fast) ease-(--ease-lift) hover:-translate-y-px"
      >
        <IconBarbell class="size-6 -rotate-45" :stroke="1.75" aria-hidden="true" />
        <span class="text-lg font-semibold tracking-tight">IronOAK</span>
      </NuxtLink>

      <!-- desktop navigation -->
      <nav aria-label="Primary" class="hidden lg:block">
        <ul class="flex items-center gap-1 rounded-pill bg-surface p-1.5">
          <li v-for="item in items" :key="item.to">
            <NuxtLink
              :to="item.to"
              :aria-current="isActive(item.to) ? 'page' : undefined"
              class="block rounded-pill px-5 py-2.5 font-data text-sm transition-colors duration-(--duration-fast) ease-(--ease-lift)"
              :class="isActive(item.to) ? 'text-fg' : 'text-fg-muted hover:text-fg'"
            >
              <!--
                Bold text is wider and would shift its neighbours.
                An invisible bold copy reserves the width permanently.
              -->
              <span class="inline-grid">
                <span class="col-start-1 row-start-1" :class="{ 'font-semibold': isActive(item.to) }">
                  {{ item.label }}
                </span>
                <span class="invisible col-start-1 row-start-1 font-semibold" aria-hidden="true">
                  {{ item.label }}
                </span>
              </span>
            </NuxtLink>
          </li>
        </ul>
      </nav>

      <!-- actions -->
      <div class="flex items-center gap-2">
        <!-- hover preview on desktop; touch has no hover, a tap goes straight to the cart -->
        <HoverCard :open-delay="150" :close-delay="150">
          <HoverCardTrigger as-child>
            <NuxtLink
              to="/cart"
              :aria-label="cartLabel"
              class="flex items-center gap-3 rounded-pill bg-surface py-1.5 pr-1.5 pl-1.5 transition-transform duration-(--duration-fast) ease-(--ease-lift) hover:-translate-y-px sm:pl-5"
            >
              <span class="hidden font-data text-sm sm:inline">Cart</span>
              <span
                class="grid size-9 place-items-center rounded-pill bg-accent font-data text-sm text-accent-foreground tabular-nums"
              >
                <template v-if="cart.count > 0">{{ cart.count }}</template>
                <IconBarbell v-else class="size-5 -rotate-45" :stroke="1.75" aria-hidden="true" />
              </span>
            </NuxtLink>
          </HoverCardTrigger>
          <HoverCardContent align="end" :side-offset="12" class="hidden w-auto rounded-panel p-4 lg:block">
            <CartPeek />
          </HoverCardContent>
        </HoverCard>

        <NuxtLink
          :to="accountTo"
          :aria-label="accountLabel"
          class="grid size-12 place-items-center rounded-pill bg-surface transition-transform duration-(--duration-fast) ease-(--ease-lift) hover:-translate-y-px"
        >
          <IconUser class="size-5" :stroke="1.75" aria-hidden="true" />
        </NuxtLink>

        <button
          type="button"
          class="grid size-12 place-items-center rounded-pill bg-surface lg:hidden"
          :aria-expanded="mobileOpen"
          aria-controls="mobile-menu"
          :aria-label="mobileOpen ? 'Close menu' : 'Open menu'"
          @click="mobileOpen = !mobileOpen"
        >
          <IconX v-if="mobileOpen" class="size-5" :stroke="1.75" aria-hidden="true" />
          <IconMenu2 v-else class="size-5" :stroke="1.75" aria-hidden="true" />
        </button>
      </div>
    </div>

    <MobileMenu v-model:open="mobileOpen" :items="items" :is-active="isActive" />
  </header>
</template>