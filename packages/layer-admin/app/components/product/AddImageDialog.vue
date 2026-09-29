<script setup lang="ts">
import {
  PRODUCT_IMAGE_CONTENT_TYPES,
  createImageSchema,
  type AdminVariantDetail,
  type CreateImageInput,
} from '@ironoak/contracts';
import { useDropZone, useObjectUrl } from '@vueuse/core';
import type { $ZodIssue } from 'zod/v4/core';

const { productId, variants, nextPosition } = defineProps<{
  productId: string;
  variants: AdminVariantDetail[];
  nextPosition: number;
}>();

const open = defineModel<boolean>('open', { required: true });

const addImage = useAddImage();
const {
  status: uploadStatus,
  progress: uploadProgress,
  error: uploadError,
  start: startUpload,
  result: uploadResult,
  cancel: cancelUpload,
} = useImageUpload();

const issues = ref<$ZodIssue[]>([]);

const fileId = useId();
const urlId = useId();
const altId = useId();
const roleId = useId();
const variantSelectId = useId();

const SHARED = '__shared__'; // Select does not accept empty values
const ACCEPT = PRODUCT_IMAGE_CONTENT_TYPES.join(',');

type Mode = 'upload' | 'url';
const mode = ref<Mode>('upload');

function emptyForm() {
  return { url: '', alt: '', role: 'DETAIL' as const, variantId: SHARED };
}

const form = ref(emptyForm());

// --- file selection: upload starts right away, while the admin fills the form ---
const file = ref<File | null>(null);
const previewUrl = useObjectUrl(file); // revoked automatically when the file changes
const missingFile = ref(false);

function selectFile(selected: File) {
  file.value = selected;
  missingFile.value = false;
  // errors are reflected in uploadError; nothing to handle here
  startUpload(productId, selected).catch(() => {});
}

function onFileInput(event: Event) {
  const input = event.target as HTMLInputElement;
  const selected = input.files?.[0];
  input.value = ''; // allows choosing the same file again
  if (selected) selectFile(selected);
}

const dropZone = useTemplateRef<HTMLElement>('dropZone');
const { isOverDropZone } = useDropZone(dropZone, {
  onDrop(files) {
    const dropped = files?.[0];
    if (dropped) selectFile(dropped);
  },
});

const fileErrors = computed(() => {
  if (missingFile.value) return [{ message: 'Choose an image to upload.' }];
  if (uploadError.value) return [{ message: uploadError.value }];
  return [];
});

// --- URL mode preview ---
const previewFailed = ref(false);
watch(
  () => form.value.url,
  () => {
    previewFailed.value = false;
  },
);

function switchMode(next: Mode) {
  mode.value = next;
  issues.value = [];
  missingFile.value = false;
}

watch(open, (isOpen) => {
  if (isOpen) return;
  // an unfinished or unsaved upload stays in tmp/ and expires on its own
  cancelUpload();
  file.value = null;
  missingFile.value = false;
  issues.value = [];
  mode.value = 'upload';
  form.value = emptyForm();
});

function errorsFor(field: string) {
  return issues.value.filter((issue) => issue.path[0] === field);
}

function baseInput() {
  return {
    alt: form.value.alt,
    role: form.value.role,
    position: nextPosition,
    variantId: form.value.variantId === SHARED ? null : form.value.variantId,
  };
}

async function submit(input: CreateImageInput) {
  try {
    await addImage.mutateAsync({ productId, input });
    open.value = false;
  } catch {
    // toast in onError
  }
}

async function onSubmit() {
  issues.value = [];

  if (mode.value === 'url') {
    const parsed = createImageSchema.safeParse({ ...baseInput(), url: form.value.url });
    if (!parsed.success) {
      issues.value = parsed.error.issues;
      return;
    }
    await submit(parsed.data);
    return;
  }

  if (!file.value) {
    missingFile.value = true;
    return;
  }

  // validate the rest of the form before waiting for the upload
  const draft = createImageSchema.safeParse({ ...baseInput(), uploadKey: 'pending' });
  if (!draft.success) {
    issues.value = draft.error.issues;
    return;
  }

  let uploadKey: string;
  try {
    uploadKey = await uploadResult();
  } catch {
    return; // the reason is shown under the drop zone
  }

  await submit({ ...draft.data, uploadKey });
}

const submitLabel = computed(() => {
  if (addImage.isLoading.value) return 'Adding…';
  if (mode.value === 'upload' && uploadStatus.value === 'uploading') {
    return `Uploading… ${Math.round(uploadProgress.value * 100)}%`;
  }
  return 'Add image';
});

const submitDisabled = computed(
  () => addImage.isLoading.value || (mode.value === 'upload' && uploadStatus.value === 'error'),
);
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="max-w-xl">
      <DialogHeader>
        <DialogTitle>Add image</DialogTitle>
        <DialogDescription>
          {{
            mode === 'upload'
              ? 'Upload a file — it is sent while you fill in the details.'
              : 'Paste a URL from an external image host.'
          }}
        </DialogDescription>
      </DialogHeader>

      <form class="space-y-6" @submit.prevent="onSubmit">
        <FieldGroup>
          <!-- upload mode -->
          <Field v-if="mode === 'upload'" :data-invalid="fileErrors.length > 0">
            <FieldLabel :for="fileId">Image file</FieldLabel>

            <label
              ref="dropZone"
              :for="fileId"
              class="flex min-h-48 cursor-pointer flex-col items-center justify-center gap-2 border border-dashed p-4 text-center transition-colors duration-(--duration-fast) ease-(--ease-lift)"
              :class="isOverDropZone ? 'border-fg bg-raised' : 'border-line hover:border-fg'"
            >
              <input :id="fileId" type="file" class="sr-only" :accept="ACCEPT" @change="onFileInput" />

              <img v-if="previewUrl" :src="previewUrl" alt="" class="max-h-48 object-contain" />
              <template v-else>
                <span class="t-body-sm">Drop an image here or click to choose</span>
                <span class="t-spec text-fg-muted">JPEG, PNG, WebP or AVIF · up to 10 MB</span>
              </template>
            </label>

            <div
              v-if="uploadStatus === 'uploading'"
              role="progressbar"
              aria-label="Upload progress"
              aria-valuemin="0"
              aria-valuemax="100"
              :aria-valuenow="Math.round(uploadProgress * 100)"
              class="h-1 w-full bg-line"
            >
              <div class="h-full bg-fg transition-[width] duration-(--duration-fast)" :style="{ width: `${uploadProgress * 100}%` }" />
            </div>
            <p v-else-if="uploadStatus === 'uploaded'" class="t-spec text-moss">Uploaded</p>

            <FieldError :errors="fileErrors" />

            <button type="button" class="t-spec w-fit text-fg-muted underline-offset-4 hover:underline" @click="switchMode('url')">
              Use an image URL instead
            </button>
          </Field>

          <!-- URL mode -->
          <template v-else>
            <Field :data-invalid="errorsFor('url').length > 0">
              <FieldLabel :for="urlId">Image URL</FieldLabel>
              <Input :id="urlId" v-model="form.url" placeholder="https://…" />
              <FieldError :errors="errorsFor('url')" />
              <button type="button" class="t-spec w-fit text-fg-muted underline-offset-4 hover:underline" @click="switchMode('upload')">
                Upload a file instead
              </button>
            </Field>

            <div v-if="form.url" class="border border-line p-2">
              <img
                v-show="!previewFailed"
                :src="form.url"
                alt="Preview"
                class="mx-auto max-h-48 object-contain"
                @error="previewFailed = true"
              />
              <p v-if="previewFailed" class="t-body-sm py-8 text-center text-fg-muted">Could not load this image.</p>
            </div>
          </template>

          <Field :data-invalid="errorsFor('alt').length > 0">
            <FieldLabel :for="altId">Alt text</FieldLabel>
            <Input :id="altId" v-model="form.alt" placeholder="Atlas Rack in a home gym" />
            <FieldDescription>Describes the image for screen readers and search engines.</FieldDescription>
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
              <FieldDescription>Variant-specific images replace shared ones when that variant is selected.</FieldDescription>
            </Field>
          </div>
        </FieldGroup>

        <DialogFooter>
          <Button type="button" variant="outline" @click="open = false">Cancel</Button>
          <Button type="submit" :disabled="submitDisabled">{{ submitLabel }}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>