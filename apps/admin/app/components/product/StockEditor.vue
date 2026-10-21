<script setup lang="ts">
const { variantId, stock, productId } = defineProps<{
  variantId: string;
  stock: { onHand: number; reserved: number; available: number };
  productId: string;
}>();

const setStock = useSetStock(toRef(() => productId));
const editing = ref(false);
const value = ref(stock.onHand);
const inputRef = useTemplateRef<HTMLInputElement>('stock-input');

watch(editing, async (isEditing) => {
  if (!isEditing) return;
  value.value = stock.onHand;
  await nextTick();
  inputRef.value?.focus();
  inputRef.value?.select();
});

async function save() {
  if (value.value === stock.onHand) {
    editing.value = false;
    return;
  }
  editing.value = false;
  await setStock.mutateAsync({ variantId, quantityOnHand: value.value });
}
</script>

<template>
  <div class="flex items-end gap-8">
    <div>
      <span class="t-spec text-fg-muted">On hand</span>
      <div v-if="!editing" class="mt-1 flex items-center gap-2">
        <span class="t-price">{{ stock.onHand }}</span>
        <Button variant="ghost" size="sm" @click="editing = true">Edit</Button>
      </div>
      <div v-else class="mt-1 flex items-center gap-2">
        <input
          ref="stock-input"
          v-model.number="value"
          type="number"
          min="0"
          class="t-price w-20 border border-line bg-raised px-2 py-1"
          @keyup.enter="save"
          @keyup.esc="editing = false"
        />
        <Button size="sm" @click="save">Save</Button>
      </div>
    </div>

    <div>
      <span class="t-spec text-fg-muted">Reserved</span>
      <div class="t-price mt-1">{{ stock.reserved }}</div>
    </div>

    <div>
      <span class="t-spec text-fg-muted">Available</span>
      <div class="t-price mt-1" :class="stock.available === 0 ? 'text-destructive' : ''">
        {{ stock.available }}
      </div>
    </div>
  </div>
</template>