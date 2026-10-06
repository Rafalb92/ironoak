<script setup lang="ts">
const { name, price, inStock, visible } = defineProps<{
  name: string;
  price: string;
  inStock: boolean;
  /** shown only once the page's own add-to-cart button scrolls out of view */
  visible: boolean;
}>();

const emit = defineEmits<{ add: [] }>();
</script>

<template>
  <!-- inert while hidden: off-screen controls must not take keyboard focus -->
  <div
    class="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-canvas/95 backdrop-blur-md transition-transform duration-(--duration-base) ease-(--ease-iron) lg:hidden"
    :class="visible ? 'translate-y-0' : 'translate-y-full'"
    :aria-hidden="!visible"
    :inert="!visible"
  >
    <div
      class="mx-auto flex max-w-site items-center justify-between gap-4 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    >
      <div class="min-w-0">
        <p class="truncate font-semibold">{{ name }}</p>
        <p class="t-price text-lg">{{ price }}</p>
      </div>
      <Button size="lg" class="h-12 shrink-0 rounded-pill px-8" :disabled="!inStock" @click="emit('add')">
        {{ inStock ? 'Add to cart' : 'Out of stock' }}
      </Button>
    </div>
  </div>
</template>