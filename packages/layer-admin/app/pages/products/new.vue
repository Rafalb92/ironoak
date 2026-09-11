<script setup lang="ts">
import { createProductSchema } from '@ironoak/contracts';
import type { $ZodIssue } from 'zod/v4/core';
import type { ProductFormValues } from '../../components/product/ProductFields.vue';
import type { VariantFormValues } from '../../components/product/VariantFields.vue';

const createProduct = useCreateProduct();

const product = ref<ProductFormValues>({
  name: '',
  slug: '',
  description: '',
  categoryId: '',
  active: true,
});

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

const variants = ref<VariantFormValues[]>([emptyVariant()]);
const issues = ref<$ZodIssue[]>([]);
const serverError = ref<string | null>(null);

function addVariant() {
  variants.value.push(emptyVariant());
}

function removeVariant(index: number) {
  if (variants.value.length > 1) variants.value.splice(index, 1);
}

async function onSubmit() {
  issues.value = [];
  serverError.value = null;

  // konwersja formularza na kontrakt API
  const payload = {
    name: product.value.name,
    slug: product.value.slug,
    description: product.value.description,
    categoryId: product.value.categoryId,
    variants: variants.value.map((v) => ({
      sku: v.sku,
      name: v.name,
      price: v.priceDollars === null ? 0 : dollarsToCents(v.priceDollars),
      weightGrams: v.weightKg === null ? null : kgToGrams(v.weightKg),
      color: v.color || null,
      material: v.material || null,
      finish: v.finish || null,
      initialStock: v.initialStock,
    })),
  };

  const parsed = createProductSchema.safeParse(payload);
  if (!parsed.success) {
    issues.value = parsed.error.issues;
    return;
  }

  try {
    const { productId } = await createProduct.mutateAsync(parsed.data);
    await navigateTo(`/products/${productId}`);
  } catch (error) {
    serverError.value =
      (error as { data?: { message?: string } })?.data?.message ?? 'Failed to create product';
  }
}
</script>

<template>
  <form class="max-w-3xl space-y-8" @submit.prevent="onSubmit">
    <div class="space-y-2">
      <NuxtLink to="/products" class="t-eyebrow text-fg-muted hover:text-accent">
        ← Products
      </NuxtLink>
      <h1 class="t-display-lg">New product</h1>
    </div>

    <ProductFields v-model="product" :issues="issues" />

    <FieldSeparator />

    <FieldSet>
      <FieldLegend>Variants</FieldLegend>
      <FieldDescription>
        A product needs at least one variant. Each variant has its own SKU, price and stock.
      </FieldDescription>

      <div class="space-y-6">
        <div
          v-for="(variant, index) in variants"
          :key="index"
          class="border border-line p-5"
        >
          <div class="mb-4 flex items-center justify-between">
            <span class="t-label text-fg-muted">Variant {{ index + 1 }}</span>
            <Button
              v-if="variants.length > 1"
              type="button"
              variant="ghost"
              size="sm"
              @click="removeVariant(index)"
            >
              Remove
            </Button>
          </div>

          <ProductVariantFields v-model="variants[index]" :issues="issues" :index="index" />
        </div>
      </div>

      <Button type="button" variant="outline" size="sm" @click="addVariant">
        Add variant
      </Button>
    </FieldSet>

    <p v-if="serverError" class="t-body-sm text-destructive">{{ serverError }}</p>

    <Field orientation="horizontal">
      <Button type="submit" :disabled="createProduct.isLoading.value">
        {{ createProduct.isLoading.value ? 'Creating…' : 'Create product' }}
      </Button>
      <Button type="button" variant="outline" as-child>
        <NuxtLink to="/products">Cancel</NuxtLink>
      </Button>
    </Field>
  </form>
</template>