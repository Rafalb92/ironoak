<script setup lang="ts">
import { createVariantSchema } from '@ironoak/contracts';
import type { $ZodIssue } from 'zod/v4/core';
import type { VariantFormValues } from './VariantFields.vue';

const { productId } = defineProps<{ productId: string }>();
const open = defineModel<boolean>('open', { required: true });

const addVariant = useAddVariant();
const issues = ref<$ZodIssue[]>([]);

function emptyVariant(): VariantFormValues {
  return {
    sku: '',
    name: '',
    priceDollars: null,
    weightKg: null,
    color: '',
    material: '',
    finish: '',
    initialStock: 0,
  };
}

const form = ref<VariantFormValues>(emptyVariant());

watch(open, (isOpen) => {
  if (isOpen) return;
  issues.value = [];
  form.value = emptyVariant();
});

async function onSubmit() {
  issues.value = [];

  const payload = {
    sku: form.value.sku,
    name: form.value.name,
    price: form.value.priceDollars === null ? 0 : dollarsToCents(form.value.priceDollars),
    weightGrams: form.value.weightKg === null ? null : kgToGrams(form.value.weightKg),
    color: form.value.color || null,
    material: form.value.material || null,
    finish: form.value.finish || null,
    initialStock: form.value.initialStock,
  };

  const parsed = createVariantSchema.safeParse(payload);
  if (!parsed.success) {
    issues.value = parsed.error.issues;
    return;
  }

  try {
    await addVariant.mutateAsync({ productId, input: parsed.data });
    open.value = false;
  } catch {
    // toast w onError
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Add variant</DialogTitle>
        <DialogDescription>
          A new SKU for this product. Stock will be created automatically.
        </DialogDescription>
      </DialogHeader>

      <form class="space-y-6" @submit.prevent="onSubmit">
        <VariantFields v-model="form" :issues="issues" />

        <DialogFooter>
          <Button type="button" variant="outline" @click="open = false">Cancel</Button>
          <Button type="submit" :disabled="addVariant.isLoading.value">
            {{ addVariant.isLoading.value ? 'Adding…' : 'Add variant' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>