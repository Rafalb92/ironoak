<script setup lang="ts">
import type { CartLine } from '@ironoak/contracts';
import { IconTrash } from '@tabler/icons-vue';
import { useDebounceFn } from '@vueuse/core';
import { useCartStore } from '../../stores/cart';

const { line } = defineProps<{ line: CartLine }>();

const cart = useCartStore();
const toast = useToast();

const QUANTITY_DEBOUNCE_MS = 300;

// local value reacts instantly; only the settled value is sent
const quantity = ref(line.quantity);
watch(
  () => line.quantity,
  (serverQuantity) => {
    quantity.value = serverQuantity;
  },
);

// the stepper never offers more than can be bought, but keeps a too-high quantity
// visible so the customer can see what to reduce
const maxQuantity = computed(() => Math.max(1, line.maxOrderQuantity));

const sendQuantity = useDebounceFn(async (next: number) => {
  if (next === line.quantity) return;
  try {
    await cart.update(line.productVariantId, next);
  } catch {
    quantity.value = line.quantity;
    toast.error('Could not update the quantity');
  }
}, QUANTITY_DEBOUNCE_MS);

watch(quantity, (next) => {
  void sendQuantity(next);
});

const removing = ref(false);

async function remove() {
  removing.value = true;
  try {
    await cart.remove(line.productVariantId);
  } catch {
    toast.error('Could not remove the item');
    removing.value = false;
  }
}

const productLink = computed(() => (line.productSlug ? `/products/${line.productSlug}` : null));
</script>

<template>
  <li class="flex gap-4 border-b border-line py-6 first:pt-0 sm:gap-6">
    <NuxtLink
      v-if="productLink"
      :to="productLink"
      class="size-24 shrink-0 overflow-hidden rounded-panel bg-surface sm:size-32"
      tabindex="-1"
      aria-hidden="true"
    >
      <ProductMedia :src="line.imageUrl" alt="" compact sizes="128px" class="size-full" />
    </NuxtLink>
    <div v-else class="size-24 shrink-0 overflow-hidden rounded-panel bg-surface sm:size-32">
      <ProductMedia :src="null" alt="" compact class="size-full" />
    </div>

    <div class="flex min-w-0 flex-1 flex-col gap-3">
      <div class="flex items-start justify-between gap-4">
        <div class="min-w-0">
          <NuxtLink
            v-if="productLink"
            :to="productLink"
            class="font-semibold underline-offset-4 hover:underline"
          >
            {{ line.productName }}
          </NuxtLink>
          <p v-else class="font-semibold">{{ line.productName }}</p>
          <p class="t-spec mt-1 text-fg-muted">{{ line.variantName }}</p>
          <p class="t-spec mt-1 text-fg-muted">{{ formatPrice(line.unitPrice, 'USD', { trimZeros: true }) }} each</p>
        </div>
        <p class="t-price shrink-0 text-lg" :class="{ 'text-fg-muted line-through': !line.available }">
          {{ formatPrice(line.lineTotal, 'USD', { trimZeros: true }) }}
        </p>
      </div>

      <p v-if="!line.available" class="t-spec text-rust">No longer available — remove it to continue.</p>
      <p v-else-if="line.exceedsStock" class="t-spec text-rust">
        Only {{ line.maxOrderQuantity }} left — reduce the quantity to continue.
      </p>

      <div class="mt-auto flex items-center justify-between gap-4">
        <QuantityStepper
          v-if="line.available"
          v-model="quantity"
          :max="Math.max(maxQuantity, quantity)"
          :label="`Quantity of ${line.productName}`"
          :disabled="removing"
        />
        <span v-else />

        <button
          type="button"
          class="t-spec flex items-center gap-2 text-fg-muted transition-colors duration-(--duration-fast) ease-(--ease-lift) hover:text-fg disabled:opacity-40"
          :disabled="removing"
          :aria-label="`Remove ${line.productName} from the cart`"
          @click="remove"
        >
          <IconTrash class="size-4" :stroke="1.75" aria-hidden="true" />
          Remove
        </button>
      </div>
    </div>
  </li>
</template>