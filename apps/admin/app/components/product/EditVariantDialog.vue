<script setup lang="ts">
import { updateVariantSchema, type AdminVariantDetail } from '@ironoak/contracts';
import type { $ZodIssue } from 'zod/v4/core';
import type { VariantFormValues } from './VariantFields.vue';

const { variant, productActive } = defineProps<{
  variant: AdminVariantDetail;
  productActive: boolean;
}>();

const open = defineModel<boolean>('open', { required: true });

const updateVariant = useUpdateVariant();
const issues = ref<$ZodIssue[]>([]);

function fromVariant(): VariantFormValues {
  return {
    sku: variant.sku,
    name: variant.name,
    priceDollars: centsToDollars(variant.price),
    weightKg: variant.weightGrams === null ? null : gramsToKg(variant.weightGrams),
    color: variant.color ?? '',
    material: variant.material ?? '',
    finish: variant.finish ?? '',
    initialStock: 0,   // nieużywane w edycji
  };
}

const form = ref<VariantFormValues>(fromVariant());
const active = ref(variant.active);

watch(open, (isOpen) => {
  if (isOpen) return;
  issues.value = [];
  form.value = fromVariant();
  active.value = variant.active;
});

async function onSubmit() {
  issues.value = [];

  const payload = {
    sku: form.value.sku,
    name: form.value.name,
    price: form.value.priceDollars === null ? undefined : dollarsToCents(form.value.priceDollars),
    weightGrams: form.value.weightKg === null ? null : kgToGrams(form.value.weightKg),
    color: form.value.color || null,
    material: form.value.material || null,
    finish: form.value.finish || null,
    active: active.value,
  };

  const parsed = updateVariantSchema.safeParse(payload);
  if (!parsed.success) {
    issues.value = parsed.error.issues;
    return;
  }

  try {
    await updateVariant.mutateAsync({ id: variant.id, input: parsed.data });
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
        <DialogTitle>Edit variant</DialogTitle>
        <DialogDescription>{{ variant.sku }}</DialogDescription>
      </DialogHeader>

      <form class="space-y-6" @submit.prevent="onSubmit">
        <ProductVariantFields v-model="form" :issues="issues" :show-stock="false" />

        <Field orientation="horizontal">
          <Switch id="variant-active" v-model="active" :disabled="!productActive" />
          <FieldContent>
            <FieldLabel for="variant-active">Active</FieldLabel>
            <FieldDescription v-if="!productActive">
              Cannot activate a variant of an inactive product.
            </FieldDescription>
          </FieldContent>
        </Field>

        <DialogFooter>
          <Button type="button" variant="outline" @click="open = false">Cancel</Button>
          <Button type="submit" :disabled="updateVariant.isLoading.value">
            {{ updateVariant.isLoading.value ? 'Saving…' : 'Save changes' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>