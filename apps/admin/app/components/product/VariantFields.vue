<script setup lang="ts">
import type { $ZodIssue } from 'zod/v4/core';

export interface VariantFormValues {
  sku: string;
  name: string;
  priceDollars: number | null;     // konwersja do centów przy wysyłce
  weightKg: number | null;
  color: string;
  material: string;
  finish: string;
  initialStock: number;
}

const model = defineModel<VariantFormValues>({ required: true });

const { issues = [], index = 0, showStock = true } = defineProps<{
  issues?: $ZodIssue[];
  index?: number;
  showStock?: boolean;
}>();

const skuId = useId();
const nameId = useId();
const priceId = useId();
const weightId = useId();
const colorId = useId();
const materialId = useId();
const finishId = useId();
const stockId = useId();

// issues mają ścieżkę ['variants', index, 'sku'] — filtrujemy po obu
function errorsFor(field: string) {
  return issues.filter(
    (issue) =>
      (issue.path[0] === 'variants' && issue.path[1] === index && issue.path[2] === field) ||
      issue.path[0] === field,
  );
}
</script>

<template>
  <FieldGroup>
    <div class="grid grid-cols-2 gap-4">
      <Field :data-invalid="errorsFor('sku').length > 0">
        <FieldLabel :for="skuId">SKU</FieldLabel>
        <Input :id="skuId" v-model="model.sku" placeholder="ATL-RCK-BLK" />
        <FieldError :errors="errorsFor('sku')" />
      </Field>

      <Field :data-invalid="errorsFor('name').length > 0">
        <FieldLabel :for="nameId">Variant name</FieldLabel>
        <Input :id="nameId" v-model="model.name" placeholder="Ink Black" />
        <FieldError :errors="errorsFor('name')" />
      </Field>
    </div>

    <div class="grid grid-cols-3 gap-4">
      <Field :data-invalid="errorsFor('price').length > 0">
        <FieldLabel :for="priceId">Price (USD)</FieldLabel>
        <Input
          :id="priceId"
          v-model.number="model.priceDollars"
          type="number"
          step="0.01"
          min="0"
          placeholder="899.00"
        />
        <FieldError :errors="errorsFor('price')" />
      </Field>

      <Field>
        <FieldLabel :for="weightId">Weight (kg)</FieldLabel>
        <Input
          :id="weightId"
          v-model.number="model.weightKg"
          type="number"
          step="0.1"
          min="0"
          placeholder="128"
        />
      </Field>

      <Field v-if="showStock">
        <FieldLabel :for="stockId">Initial stock</FieldLabel>
        <Input :id="stockId" v-model.number="model.initialStock" type="number" min="0" />
      </Field>
    </div>

    <div class="grid grid-cols-3 gap-4">
      <Field>
        <FieldLabel :for="colorId">Color</FieldLabel>
        <Input :id="colorId" v-model="model.color" placeholder="Black" />
      </Field>
      <Field>
        <FieldLabel :for="materialId">Material</FieldLabel>
        <Input :id="materialId" v-model="model.material" placeholder="Steel / Oak" />
      </Field>
      <Field>
        <FieldLabel :for="finishId">Finish</FieldLabel>
        <Input :id="finishId" v-model="model.finish" placeholder="Powder Coat" />
      </Field>
    </div>
  </FieldGroup>
</template>