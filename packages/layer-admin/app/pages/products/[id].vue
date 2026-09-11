<script setup lang="ts">
import { useQuery } from '@pinia/colada';
import { adminProductDetailQuery } from '../../queries/products';

const route = useRoute();
const productId = computed(() => route.params.id as string);

const { state, asyncStatus } = useQuery(() =>
  adminProductDetailQuery(productId.value),
);

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

function formatWeight(grams: number | null): string {
  if (grams === null) return '—';
  return `${(grams / 1000).toFixed(1)} kg`;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}
</script>

<template>
  <div class="space-y-8">
    <p v-if="state.status === 'pending'" class="t-body-sm text-fg-muted">Loading…</p>

    <p v-else-if="state.status === 'error'" class="t-body-sm text-destructive">
      {{ state.error.message }}
    </p>

    <template v-else>
      <!-- nagłówek -->
      <div class="flex items-start justify-between gap-6">
        <div class="space-y-2">
          <NuxtLink to="/products" class="t-eyebrow text-fg-muted hover:text-accent">
            ← Products
          </NuxtLink>
          <h1 class="t-display-lg">{{ state.data.name }}</h1>
          <div class="flex items-center gap-3">
            <span class="t-spec text-fg-muted">{{ state.data.slug }}</span>
            <span
              class="t-label px-2 py-1"
              :class="state.data.active
                ? 'bg-[var(--status-success)]/15 text-[var(--status-success)]'
                : 'bg-raised text-fg-muted'"
            >
              {{ state.data.active ? 'Active' : 'Inactive' }}
            </span>
          </div>
        </div>

        <Button variant="outline" disabled>Edit</Button>
      </div>

      <!-- metadane -->
      <section class="grid grid-cols-2 gap-x-8 gap-y-4 border border-line p-5 lg:grid-cols-4">
        <div>
          <div class="t-label text-fg-muted">Category</div>
          <div class="t-body-sm mt-1">{{ state.data.category.name }}</div>
        </div>
        <div>
          <div class="t-label text-fg-muted">Variants</div>
          <div class="t-spec mt-1">{{ state.data.variants.length }}</div>
        </div>
        <div>
          <div class="t-label text-fg-muted">Created</div>
          <div class="t-spec mt-1">{{ formatDate(state.data.createdAt) }}</div>
        </div>
        <div>
          <div class="t-label text-fg-muted">Updated</div>
          <div class="t-spec mt-1">{{ formatDate(state.data.updatedAt) }}</div>
        </div>
      </section>

      <!-- opis -->
      <section class="space-y-2">
        <h2 class="t-label text-fg-muted">Description</h2>
        <p class="t-body-md max-w-prose text-fg-secondary">{{ state.data.description }}</p>
      </section>

      <!-- warianty -->
      <section class="space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="t-label text-fg-muted">Variants</h2>
          <Button variant="outline" size="sm" disabled>Add variant</Button>
        </div>

        <div class="space-y-3">
          <article
            v-for="variant in state.data.variants"
            :key="variant.id"
            class="border border-line"
            :class="{ 'opacity-50': !variant.active }"
          >
            <header class="flex items-center justify-between border-b border-line bg-surface px-5 py-3">
              <div class="flex items-center gap-4">
                <span class="t-body-sm font-medium">{{ variant.name }}</span>
                <span class="t-spec text-fg-muted">{{ variant.sku }}</span>
                <span v-if="!variant.active" class="t-label text-fg-muted">Inactive</span>
              </div>
              <span class="t-price">{{ formatPrice(variant.price) }}</span>
            </header>

            <div class="grid grid-cols-2 gap-x-8 gap-y-4 p-5 lg:grid-cols-4">
              <div>
                <div class="t-label text-fg-muted">Weight</div>
                <div class="t-spec mt-1">{{ formatWeight(variant.weightGrams) }}</div>
              </div>
              <div>
                <div class="t-label text-fg-muted">Color</div>
                <div class="t-body-sm mt-1">{{ variant.color ?? '—' }}</div>
              </div>
              <div>
                <div class="t-label text-fg-muted">Material</div>
                <div class="t-body-sm mt-1">{{ variant.material ?? '—' }}</div>
              </div>
              <div>
                <div class="t-label text-fg-muted">Finish</div>
                <div class="t-body-sm mt-1">{{ variant.finish ?? '—' }}</div>
              </div>
            </div>

            <!-- stan magazynowy -->
            <div class="border-t border-line px-5 py-4">
              <div class="t-label mb-2 text-fg-muted">Stock</div>
              <div v-if="variant.stock" class="flex gap-8">
                <div>
                  <span class="t-spec text-fg-muted">On hand</span>
                  <div class="t-price mt-1">{{ variant.stock.onHand }}</div>
                </div>
                <div>
                  <span class="t-spec text-fg-muted">Reserved</span>
                  <div class="t-price mt-1">{{ variant.stock.reserved }}</div>
                </div>
                <div>
                  <span class="t-spec text-fg-muted">Available</span>
                  <div
                    class="t-price mt-1"
                    :class="variant.stock.available === 0 ? 'text-destructive' : ''"
                  >
                    {{ variant.stock.available }}
                  </div>
                </div>
              </div>
              <p v-else class="t-body-sm text-fg-muted">
                No stock record — the inventory event may still be in flight.
              </p>
            </div>

            <!-- atrybuty -->
            <div
              v-if="variant.attributes && Object.keys(variant.attributes).length"
              class="border-t border-line px-5 py-4"
            >
              <div class="t-label mb-2 text-fg-muted">Attributes</div>
              <dl class="grid grid-cols-2 gap-x-8 gap-y-2 lg:grid-cols-3">
                <div v-for="(value, attrKey) in variant.attributes" :key="attrKey" class="flex justify-between gap-4">
                  <dt class="t-spec text-fg-muted">{{ attrKey }}</dt>
                  <dd class="t-spec">{{ value }}</dd>
                </div>
              </dl>
            </div>
          </article>
        </div>
      </section>

      <!-- zdjęcia -->
      <section class="space-y-3">
        <h2 class="t-label text-fg-muted">Images</h2>
        <p v-if="!state.data.images.length" class="t-body-sm text-fg-muted">
          No images yet.
        </p>
        <div v-else class="grid grid-cols-3 gap-4 lg:grid-cols-5">
          <figure v-for="image in state.data.images" :key="image.id" class="space-y-2">
            <img :src="image.url" :alt="image.alt" class="aspect-square w-full border border-line object-cover" />
            <figcaption class="t-spec text-fg-muted">
              {{ image.role }}{{ image.variantId ? ' · variant' : ' · shared' }}
            </figcaption>
          </figure>
        </div>
      </section>

      <span v-if="asyncStatus === 'loading'" class="t-spec text-fg-muted">Refreshing…</span>
    </template>
  </div>
</template>