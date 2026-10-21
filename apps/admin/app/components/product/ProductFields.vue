<script setup lang="ts">
import { useQuery } from '@pinia/colada';
import type { $ZodIssue } from 'zod/v4/core';
import { categoriesQuery } from '../../queries/categories';

export interface ProductFormValues {
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  active: boolean;
}

const model = defineModel<ProductFormValues>({ required: true });

const { issues = [], showActive = false } = defineProps<{
  issues?: $ZodIssue[];
  showActive?: boolean;
}>();

const { data: categories } = useQuery(categoriesQuery);

// identyfikatory stabilne między SSR a klientem — Vue 3.5
const nameId = useId();
const slugId = useId();
const descriptionId = useId();
const categoryId = useId();
const activeId = useId();

// wyciąga błędy dla konkretnego pola z płaskiej listy zod
function errorsFor(field: keyof ProductFormValues) {
  return issues.filter((issue) => issue.path[0] === field);
}

// slug z nazwy — tylko gdy user go nie tknął
const slugTouched = ref(false);
watch(
  () => model.value.name,
  (name) => {
    if (slugTouched.value) return;
    model.value.slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
  },
);
</script>

<template>
  <FieldSet>
    <FieldLegend>Product</FieldLegend>
    <FieldDescription>Shared across all variants of this product.</FieldDescription>

    <FieldGroup>
      <Field :data-invalid="errorsFor('name').length > 0">
        <FieldLabel :for="nameId">Name</FieldLabel>
        <Input
          :id="nameId"
          v-model="model.name"
          placeholder="Atlas Rack"
          :aria-invalid="errorsFor('name').length > 0"
        />
        <FieldError :errors="errorsFor('name')" />
      </Field>

      <Field :data-invalid="errorsFor('slug').length > 0">
        <FieldLabel :for="slugId">Slug</FieldLabel>
        <Input
          :id="slugId"
          v-model="model.slug"
          placeholder="atlas-rack"
          :aria-invalid="errorsFor('slug').length > 0"
          @input="slugTouched = true"
        />
        <FieldDescription>
          Used in the storefront URL. Lowercase letters, numbers and dashes only.
        </FieldDescription>
        <FieldError :errors="errorsFor('slug')" />
      </Field>

      <Field :data-invalid="errorsFor('description').length > 0">
        <FieldLabel :for="descriptionId">Description</FieldLabel>
        <Textarea
          :id="descriptionId"
          v-model="model.description"
          :rows="4"
          class="resize-none"
          :aria-invalid="errorsFor('description').length > 0"
        />
        <FieldError :errors="errorsFor('description')" />
      </Field>

      <Field :data-invalid="errorsFor('categoryId').length > 0">
        <FieldLabel :for="categoryId">Category</FieldLabel>
        <Select v-model="model.categoryId">
          <SelectTrigger :id="categoryId">
            <SelectValue placeholder="Choose a category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="category in categories" :key="category.id" :value="category.id">
              {{ category.name }}
            </SelectItem>
          </SelectContent>
        </Select>
        <FieldError :errors="errorsFor('categoryId')" />
      </Field>

      <Field v-if="showActive" orientation="horizontal">
        <Switch :id="activeId" v-model="model.active" />
        <FieldContent>
          <FieldLabel :for="activeId">Active</FieldLabel>
          <FieldDescription>Inactive products are hidden from the storefront.</FieldDescription>
        </FieldContent>
      </Field>
    </FieldGroup>
  </FieldSet>
</template>