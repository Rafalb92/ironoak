<script setup lang="ts">
import { onKeyStroke, useScrollLock } from '@vueuse/core';
import type { NavItem } from '../../composables/useSiteNavigation';

const open = defineModel<boolean>('open', { required: true });

const { items, isActive } = defineProps<{
  items: readonly NavItem[];
  isActive: (to: string) => boolean;
}>();

// blokada przewijania tła — getter, bo na serwerze nie ma document
const scrollLocked = useScrollLock(() => (import.meta.client ? document.body : null));
watch(open, (value) => {
  scrollLocked.value = value;
});

onKeyStroke('Escape', () => {
  open.value = false;
});
</script>

<template>
  <!--
    :duration jest konieczne: Vue mierzy czas przejścia na elemencie głównym,
    a pozycje menu mają opóźnienia (stagger). Bez tego klasy zniknęłyby
    przed końcem animacji ostatniej pozycji i ta by przeskoczyła.
  -->
  <Transition name="menu" :duration="{ enter: 720, leave: 160 }">
    <div
      v-if="open"
      id="mobile-menu"
      class="fixed inset-x-0 top-20 bottom-0 z-30 overflow-y-auto bg-canvas lg:hidden"
    >
      <nav aria-label="Mobile" class="mx-auto max-w-site px-4 pt-4 md:px-6">
        <ul>
          <li
            v-for="(item, index) in items"
            :key="item.to"
            class="menu-item border-b border-line"
            :style="{ '--i': index }"
          >
            <NuxtLink
              :to="item.to"
              :aria-current="isActive(item.to) ? 'page' : undefined"
              class="flex items-baseline justify-between py-5"
            >
              <span class="t-display-lg" :class="isActive(item.to) ? 'text-fg' : 'text-fg-muted'">
                {{ item.label }}
              </span>
              <span class="t-eyebrow text-fg-muted">{{ String(index + 1).padStart(2, '0') }}</span>
            </NuxtLink>
          </li>
        </ul>
      </nav>
    </div>
  </Transition>
</template>

<style scoped>
.menu-enter-active,
.menu-leave-active {
  transition: opacity var(--duration-fast) var(--ease-lift);
}

.menu-enter-from,
.menu-leave-to {
  opacity: 0;
}

/* pozycje wjeżdżają kolejno — masa, nie sprężyna */
.menu-enter-active .menu-item {
  transition:
    transform var(--duration-slow) var(--ease-iron),
    opacity var(--duration-slow) var(--ease-iron);
  transition-delay: calc(var(--i) * var(--stagger));
}

.menu-enter-from .menu-item {
  opacity: 0;
  transform: translateY(var(--rise));
}
</style>