<script setup lang="ts">
import type { AdminProductDetail } from '@ironoak/contracts';

const { product } = defineProps<{ product: AdminProductDetail }>();

const updateImage = useUpdateImage();
const removeImage = useRemoveImage();

const addOpen = ref(false);
const SHARED = '__shared__';

const nextPosition = computed(() =>
  product.images.length === 0
    ? 0
    : Math.max(...product.images.map((i) => i.position)) + 1,
);

const variantName = (id: string | null) =>
  id === null ? 'Shared' : product.variants.find((v) => v.id === id)?.name ?? 'Unknown';

async function reassign(imageId: string, value: string) {
  await updateImage.mutateAsync({
    id: imageId,
    input: { variantId: value === SHARED ? null : value },
  });
}

async function changeRole(imageId: string, role: 'HERO' | 'DETAIL' | 'LIFESTYLE') {
  await updateImage.mutateAsync({ id: imageId, input: { role } });
}

// przesuwanie: zamiana pozycji z sąsiadem
async function move(index: number, direction: -1 | 1) {
  const sorted = [...product.images].sort((a, b) => a.position - b.position);
  const current = sorted[index];
  const neighbour = sorted[index + direction];
  if (!current || !neighbour) return;

  await Promise.all([
    updateImage.mutateAsync({ id: current.id, input: { position: neighbour.position } }),
    updateImage.mutateAsync({ id: neighbour.id, input: { position: current.position } }),
  ]);
}

const sortedImages = computed(() =>
  [...product.images].sort((a, b) => a.position - b.position),
);
</script>

<template>
  <section class="space-y-3">
    <div class="flex items-center justify-between">
      <h2 class="t-label text-fg-muted">Images</h2>
      <Button variant="outline" size="sm" @click="addOpen = true">Add image</Button>
    </div>

    <p v-if="!sortedImages.length" class="t-body-sm text-fg-muted">
      No images yet. Products without a hero image look unfinished in the storefront.
    </p>

    <div v-else class="space-y-3">
      <article
        v-for="(image, index) in sortedImages"
        :key="image.id"
        class="flex gap-4 border border-line p-3"
      >
        <img
          :src="image.url"
          :alt="image.alt"
          class="size-24 shrink-0 border border-line object-cover"
        />

        <div class="flex flex-1 flex-col justify-between gap-3">
          <div>
            <p class="t-body-sm">{{ image.alt }}</p>
            <p class="t-spec truncate text-fg-muted">{{ image.url }}</p>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <Select
              :model-value="image.role"
              @update:model-value="(v) => changeRole(image.id, v as 'HERO' | 'DETAIL' | 'LIFESTYLE')"
            >
              <SelectTrigger class="h-8 w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HERO">Hero</SelectItem>
                <SelectItem value="DETAIL">Detail</SelectItem>
                <SelectItem value="LIFESTYLE">Lifestyle</SelectItem>
              </SelectContent>
            </Select>

            <Select
              :model-value="image.variantId ?? SHARED"
              @update:model-value="(v) => reassign(image.id, v as string)"
            >
              <SelectTrigger class="h-8 w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem :value="SHARED">Shared</SelectItem>
                <SelectItem v-for="v in product.variants" :key="v.id" :value="v.id">
                  {{ v.name }}
                </SelectItem>
              </SelectContent>
            </Select>

            <span class="t-spec text-fg-muted">#{{ image.position }}</span>
          </div>
        </div>

        <div class="flex shrink-0 flex-col gap-1">
          <Button variant="ghost" size="sm" :disabled="index === 0" @click="move(index, -1)">
            ↑
          </Button>
          <Button
            variant="ghost"
            size="sm"
            :disabled="index === sortedImages.length - 1"
            @click="move(index, 1)"
          >
            ↓
          </Button>
          <Button variant="ghost" size="sm" @click="removeImage.mutate(image.id)">
            ✕
          </Button>
        </div>
      </article>
    </div>

    <ProductAddImageDialog
      v-model:open="addOpen"
      :product-id="product.id"
      :variants="product.variants"
      :next-position="nextPosition"
    />
  </section>
</template>