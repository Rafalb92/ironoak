<script setup lang="ts">
import { createImageSchema, type AdminVariantDetail } from '@ironoak/contracts';
import type { $ZodIssue } from 'zod/v4/core';

const { productId, variants, nextPosition } = defineProps<{
  productId: string;
  variants: AdminVariantDetail[];
  nextPosition: number;
}>();

const open = defineModel<boolean>('open', { required: true });

const addImage = useAddImage();
const issues = ref<$ZodIssue[]>([]);

const urlId = useId();
const altId = useId();
const roleId = useId();
const variantSelectId = useId();

const SHARED = '__shared__';   // Select nie lubi pustych wartości

function emptyForm() {
  return { url: '', alt: '', role: 'DETAIL' as const, variantId: SHARED };
}

const form = ref(emptyForm());

watch(open, (isOpen) => {
  if (isOpen) return;
  issues.value = [];
  form.value = emptyForm();
});

// podgląd — od razu widać, czy URL jest poprawny
const previewFailed = ref(false);
watch(() => form.value.url, () => { previewFailed.value = false; });

function errorsFor(field: string) {
  return issues.value.filter((issue) => issue.path[0] === field);
}

async function onSubmit() {
  issues.value = [];

  const parsed = createImageSchema.safeParse({
    url: form.value.url,
    alt: form.value.alt,
    role: form.value.role,
    position: nextPosition,
    variantId: form.value.variantId === SHARED ? null : form.value.variantId,
  });

  if (!parsed.success) {
    issues.value = parsed.error.issues;
    return;
  }

  try {
    await addImage.mutateAsync({ productId, input: parsed.data });
    open.value = false;
  } catch {
    // toast w onError
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="max-w-xl">
      <DialogHeader>
        <DialogTitle>Add image</DialogTitle>
        <DialogDescription>
          Paste a URL from your image host. Uploads will be added later.
        </DialogDescription>
      </DialogHeader>

      <form class="space-y-6" @submit.prevent="onSubmit">
        <FieldGroup>
          <Field :data-invalid="errorsFor('url').length > 0">
            <FieldLabel :for="urlId">Image URL</FieldLabel>
            <Input :id="urlId" v-model="form.url" placeholder="https://…" />
            <FieldError :errors="errorsFor('url')" />
          </Field>

          <div v-if="form.url" class="border border-line p-2">
            <img
              v-show="!previewFailed"
              :src="form.url"
              alt="Preview"
              class="mx-auto max-h-48 object-contain"
              @error="previewFailed = true"
            />
            <p v-if="previewFailed" class="t-body-sm py-8 text-center text-fg-muted">
              Could not load this image.
            </p>
          </div>

          <Field :data-invalid="errorsFor('alt').length > 0">
            <FieldLabel :for="altId">Alt text</FieldLabel>
            <Input :id="altId" v-model="form.alt" placeholder="Atlas Rack in a home gym" />
            <FieldDescription>
              Describes the image for screen readers and search engines.
            </FieldDescription>
            <FieldError :errors="errorsFor('alt')" />
          </Field>

          <div class="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel :for="roleId">Role</FieldLabel>
              <Select v-model="form.role">
                <SelectTrigger :id="roleId">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HERO">Hero</SelectItem>
                  <SelectItem value="DETAIL">Detail</SelectItem>
                  <SelectItem value="LIFESTYLE">Lifestyle</SelectItem>
                </SelectContent>
              </Select>
              <FieldDescription>Hero is shown in listings.</FieldDescription>
            </Field>

            <Field>
              <FieldLabel :for="variantSelectId">Variant</FieldLabel>
              <Select v-model="form.variantId">
                <SelectTrigger :id="variantSelectId">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem :value="SHARED">Shared (all variants)</SelectItem>
                  <SelectItem v-for="v in variants" :key="v.id" :value="v.id">
                    {{ v.name }}
                  </SelectItem>
                </SelectContent>
              </Select>
              <FieldDescription>
                Variant-specific images replace shared ones when that variant is selected.
              </FieldDescription>
            </Field>
          </div>
        </FieldGroup>

        <DialogFooter>
          <Button type="button" variant="outline" @click="open = false">Cancel</Button>
          <Button type="submit" :disabled="addImage.isLoading.value">
            {{ addImage.isLoading.value ? 'Adding…' : 'Add image' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>