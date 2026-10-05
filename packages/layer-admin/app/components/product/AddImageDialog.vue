<script setup lang="ts">
import {
  PRODUCT_IMAGE_CONTENT_TYPES,
  PRODUCT_MEDIA_CONTENT_TYPES,
  createImageSchema,
  mediaTypeOf,
  type AdminVariantDetail,
  type CreateImageInput,
} from '@ironoak/contracts';
import { useDropZone, useObjectUrl } from '@vueuse/core';
import type { $ZodIssue } from 'zod/v4/core';

const {
  productId,
  variants,
  nextPosition,
  allowVideo = true,
} = defineProps<{
  productId: string;
  variants: AdminVariantDetail[];
  nextPosition: number;
  /** false when the product already has its one video */
  allowVideo?: boolean;
}>();

const open = defineModel<boolean>('open', { required: true });

const addImage = useAddImage();

const {
  status: mediaStatus,
  progress: mediaProgress,
  error: mediaError,
  start: startMediaUpload,
  result: mediaResult,
  cancel: cancelMediaUpload,
} = useMediaUpload();

const {
  status: posterStatus,
  error: posterError,
  start: startPosterUpload,
  result: posterResult,
  cancel: cancelPosterUpload,
} = useMediaUpload();

const issues = ref<$ZodIssue[]>([]);

const fileId = useId();
const urlId = useId();
const altId = useId();
const roleId = useId();
const variantSelectId = useId();

const SHARED = '__shared__'; // Select does not accept empty values

const accept = computed(() =>
  (allowVideo ? PRODUCT_MEDIA_CONTENT_TYPES : PRODUCT_IMAGE_CONTENT_TYPES).join(','),
);

type Mode = 'upload' | 'url';
const mode = ref<Mode>('upload');

type Role = 'HERO' | 'DETAIL' | 'LIFESTYLE';

function emptyForm() {
  return { url: '', alt: '', role: 'DETAIL' as Role, variantId: SHARED };
}

const form = ref(emptyForm());

// --- file selection: uploads start right away, while the admin fills the form ---
const file = ref<File | null>(null);
const previewUrl = useObjectUrl(file); // revoked automatically when the file changes
const selectedType = computed(() => (file.value ? mediaTypeOf(file.value.type) : null));
const isVideo = computed(() => selectedType.value === 'VIDEO');

const missingFile = ref(false);
const missingPoster = ref(false);

function selectFile(selected: File) {
  file.value = selected;
  missingFile.value = false;
  missingPoster.value = false;
  cancelPosterUpload();

  // a presentation video reads as a lifestyle shot, not a product detail
  if (mediaTypeOf(selected.type) === 'VIDEO') form.value.role = 'LIFESTYLE';

  // errors are reflected in mediaError; nothing to handle here
  startMediaUpload(productId, selected, { allowVideo }).catch(() => {});
}

function onPosterCaptured(poster: File) {
  missingPoster.value = false;
  // a new frame replaces the previous poster upload
  startPosterUpload(productId, poster).catch(() => {});
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
  if (missingFile.value) return [{ message: 'Choose an image or video to upload.' }];
  if (mediaError.value) return [{ message: mediaError.value }];
  if (missingPoster.value) return [{ message: 'Pick a poster frame for the video.' }];
  if (posterError.value) return [{ message: `Poster: ${posterError.value}` }];
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
  // unfinished or unsaved uploads stay in tmp/ and expire on their own
  cancelMediaUpload();
  cancelPosterUpload();
  file.value = null;
  missingFile.value = false;
  missingPoster.value = false;
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

  if (isVideo.value && posterStatus.value === 'idle') {
    missingPoster.value = true;
    return;
  }

  // validate the rest of the form before waiting for the uploads
  const draft = createImageSchema.safeParse({
    ...baseInput(),
    uploadKey: 'pending',
    posterUploadKey: isVideo.value ? 'pending' : undefined,
  });
  if (!draft.success) {
    issues.value = draft.error.issues;
    return;
  }

  let uploadKey: string;
  let posterUploadKey: string | undefined;
  try {
    [uploadKey, posterUploadKey] = await Promise.all([
      mediaResult(),
      isVideo.value ? posterResult() : Promise.resolve(undefined),
    ]);
  } catch {
    return; // the reason is shown under the drop zone
  }

  await submit({ ...draft.data, uploadKey, posterUploadKey });
}

const uploading = computed(
  () => mediaStatus.value === 'uploading' || posterStatus.value === 'uploading',
);

const submitLabel = computed(() => {
  if (addImage.isLoading.value) return 'Adding…';
  if (mode.value === 'upload' && uploading.value) {
    return `Uploading… ${Math.round(mediaProgress.value * 100)}%`;
  }
  return isVideo.value ? 'Add video' : 'Add image';
});

const submitDisabled = computed(
  () =>
    addImage.isLoading.value ||
    (mode.value === 'upload' && (mediaStatus.value === 'error' || posterStatus.value === 'error')),
);
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="max-h-[calc(100dvh-2rem)] max-w-xl overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{{ isVideo ? 'Add video' : 'Add image' }}</DialogTitle>
        <DialogDescription>
          {{
            mode === 'upload'
              ? allowVideo
                ? 'Upload an image or one presentation video — it is sent while you fill in the details.'
                : 'Upload an image — this product already has its video.'
              : 'Paste a URL from an external image host.'
          }}
        </DialogDescription>
      </DialogHeader>

      <form class="space-y-6" @submit.prevent="onSubmit">
        <FieldGroup>
          <!-- upload mode -->
          <Field v-if="mode === 'upload'" :data-invalid="fileErrors.length > 0">
            <FieldLabel :for="fileId">{{ allowVideo ? 'Image or video' : 'Image file' }}</FieldLabel>

            <label
              ref="dropZone"
              :for="fileId"
              class="flex cursor-pointer flex-col items-center justify-center gap-2 border border-dashed p-4 text-center transition-colors duration-(--duration-fast) ease-(--ease-lift)"
              :class="[
                isOverDropZone ? 'border-fg bg-raised' : 'border-line hover:border-fg',
                isVideo ? 'min-h-16' : 'min-h-48',
              ]"
            >
              <input :id="fileId" type="file" class="sr-only" :accept="accept" @change="onFileInput" />

              <img v-if="previewUrl && !isVideo" :src="previewUrl" alt="" class="max-h-48 object-contain" />
              <span v-else-if="isVideo" class="t-body-sm">{{ file?.name }} — click or drop to replace</span>
              <template v-else>
                <span class="t-body-sm">Drop a file here or click to choose</span>
                <span class="t-spec text-fg-muted">
                  JPEG, PNG, WebP or AVIF up to 10 MB<template v-if="allowVideo"> · MP4 or WebM up to 50 MB</template>
                </span>
              </template>
            </label>

            <!-- outside the label: clicks on the scrubber must not open the file picker -->
            <ProductVideoPosterPicker v-if="file && isVideo" :file="file" @captured="onPosterCaptured" />

            <div
              v-if="mediaStatus === 'uploading'"
              role="progressbar"
              aria-label="Upload progress"
              aria-valuemin="0"
              aria-valuemax="100"
              :aria-valuenow="Math.round(mediaProgress * 100)"
              class="h-1 w-full bg-line"
            >
              <div
                class="h-full bg-fg transition-[width] duration-(--duration-fast)"
                :style="{ width: `${mediaProgress * 100}%` }"
              />
            </div>
            <p v-else-if="mediaStatus === 'uploaded'" class="t-spec text-moss">
              {{ isVideo ? 'Video uploaded' : 'Uploaded' }}
            </p>

            <FieldError :errors="fileErrors" />

            <button
              type="button"
              class="t-spec w-fit text-fg-muted underline-offset-4 hover:underline"
              @click="switchMode('url')"
            >
              Use an image URL instead
            </button>
          </Field>

          <!-- URL mode -->
          <template v-else>
            <Field :data-invalid="errorsFor('url').length > 0">
              <FieldLabel :for="urlId">Image URL</FieldLabel>
              <Input :id="urlId" v-model="form.url" placeholder="https://…" />
              <FieldError :errors="errorsFor('url')" />
              <button
                type="button"
                class="t-spec w-fit text-fg-muted underline-offset-4 hover:underline"
                @click="switchMode('upload')"
              >
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
            <FieldLabel :for="altId">{{ isVideo ? 'Description' : 'Alt text' }}</FieldLabel>
            <Input
              :id="altId"
              v-model="form.alt"
              :placeholder="isVideo ? 'Solstice Rower — full stroke in a living room' : 'Atlas Rack in a home gym'"
            />
            <FieldDescription>Describes the media for screen readers and search engines.</FieldDescription>
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
              <FieldDescription>Hero is shown in listings. Videos never are.</FieldDescription>
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
              <FieldDescription>Variant-specific media replaces shared media when that variant is selected.</FieldDescription>
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