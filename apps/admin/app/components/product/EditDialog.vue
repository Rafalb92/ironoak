<script setup lang="ts">
import { updateProductSchema, type AdminProductDetail } from '@ironoak/contracts';
import type { $ZodIssue } from 'zod/v4/core';
import type { ProductFormValues } from './ProductFields.vue';

const { product } = defineProps<{ product: AdminProductDetail }>();

// v-model:open na dialogu
const open = defineModel<boolean>('open', { required: true });

const updateProduct = useUpdateProduct();
const issues = ref<$ZodIssue[]>([]);

const form = ref<ProductFormValues>({
  name: '',
  slug: '',
  description: '',
  categoryId: '',
  active: true,
});

// wypełnij formularz przy każdym otwarciu — inaczej zostanie stan z poprzedniej edycji
watch(open, (isOpen) => {
  if (!isOpen) return;
  issues.value = [];
  form.value = {
    name: product.name,
    slug: product.slug,
    description: product.description,
    categoryId: product.category.id,
    active: product.active,
  };
});

async function onSubmit() {
  issues.value = [];

  const parsed = updateProductSchema.safeParse(form.value);
  if (!parsed.success) {
    issues.value = parsed.error.issues;
    return;
  }

  try {
    await updateProduct.mutateAsync({ id: product.id, input: parsed.data });
    open.value = false;   // zamknij dopiero po sukcesie
  } catch {
    // toast obsłużony w onError mutacji
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Edit product</DialogTitle>
        <DialogDescription>
          Changes apply to the storefront immediately.
        </DialogDescription>
      </DialogHeader>

      <form class="space-y-6" @submit.prevent="onSubmit">
        <ProductFields v-model="form" :issues="issues" show-active />

        <DialogFooter>
          <Button type="button" variant="outline" @click="open = false">Cancel</Button>
          <Button type="submit" :disabled="updateProduct.isLoading.value">
            {{ updateProduct.isLoading.value ? 'Saving…' : 'Save changes' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>