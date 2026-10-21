<script setup lang="ts">
import { useQuery } from '@pinia/colada';
import { adminProductDetailQuery } from '../../queries/products';

const route = useRoute();
const productId = computed(() => route.params.id as string);
const editOpen = ref(false);
const addVariantOpen = ref(false);
const editingVariantId = ref<string | null>(null);

const { state, asyncStatus } = useQuery(() => adminProductDetailQuery(productId.value));
const { canEditCatalog } = useAdminPermissions();
const locked = computed(() => !canEditCatalog.value);

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

function formatWeight(grams: number | null): string {
  if (grams === null) return '—';
  return `${(grams / 1000).toFixed(1)} kg`;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}
</script>

<template>
  <div class="min-w-0 space-y-8">
    <p v-if="state.status === 'pending'" class="t-body-sm text-fg-muted">Loading…</p>

    <p v-else-if="state.status === 'error'" class="t-body-sm text-destructive">
      {{ state.error.message }}
    </p>

    <template v-else>
      <!-- header -->
      <div class="flex items-start justify-between gap-6">
        <div class="space-y-2">
          <NuxtLink to="/products" class="t-eyebrow text-fg-muted hover:text-accent">← Products</NuxtLink>
          <h1 class="t-display-lg">{{ state.data.name }}</h1>
          <div class="flex items-center gap-3">
            <span class="t-spec text-fg-muted">{{ state.data.slug }}</span>
            <span
              class="t-label px-2 py-1"
              :class="
                state.data.active ? 'bg-(--status-success)/15 text-(--status-success)' : 'bg-raised text-fg-muted'
              "
            >
              {{ state.data.active ? 'Active' : 'Inactive' }}
            </span>
          </div>
        </div>

        <DemoLock :locked="locked">
          <Button variant="outline" :disabled="locked" @click="editOpen = true">Edit</Button>
        </DemoLock>
      </div>

      <!-- metadata -->
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

      <!-- description -->
      <section class="space-y-2">
        <h2 class="t-label text-fg-muted">Description</h2>
        <p class="t-body-md max-w-prose text-fg-secondary">{{ state.data.description }}</p>
      </section>

      <!-- variants -->
      <section class="space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="t-label text-fg-muted">Variants</h2>
          <DemoLock :locked="locked">
            <Button variant="outline" size="sm" :disabled="locked" @click="addVariantOpen = true">
              Add variant
            </Button>
          </DemoLock>
        </div>

        <div class="min-w-0 space-y-3">
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
              <DemoLock :locked="locked">
                <Button variant="ghost" size="sm" :disabled="locked" @click="editingVariantId = variant.id">
                  Edit
                </Button>
              </DemoLock>
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

            <div class="border-t border-line px-5 py-4">
              <div class="t-label mb-2 text-fg-muted">Stock</div>
              <!-- the editor stays visible (the demo shows stock), its controls are disabled -->
              <DemoLock :locked="locked" as="div">
                <fieldset :disabled="locked" class="m-0 min-w-0 border-0 p-0">
                  <ProductStockEditor
                    v-if="variant.stock"
                    :variant-id="variant.id"
                    :stock="variant.stock"
                    :product-id="state.data.id"
                  />
                  <p v-else class="t-body-sm text-fg-muted">No stock record yet.</p>
                </fieldset>
              </DemoLock>
            </div>

            <div v-if="variant.attributes && Object.keys(variant.attributes).length" class="border-t border-line px-5 py-4">
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

      <!-- images -->
      <section class="min-w-0 space-y-3">
        <ProductImageManager :product="state.data" />
      </section>

      <span v-if="asyncStatus === 'loading'" class="t-spec text-fg-muted">Refreshing…</span>

      <!-- dialogs: once per page, outside the loops -->
      <ProductEditDialog v-model:open="editOpen" :product="state.data" />
      <ProductAddVariantDialog v-model:open="addVariantOpen" :product-id="state.data.id" />
      <ProductEditVariantDialog
        v-for="variant in state.data.variants"
        :key="`dialog-${variant.id}`"
        :variant="variant"
        :product-active="state.data.active"
        :open="editingVariantId === variant.id"
        @update:open="
          (isOpen) => {
            if (!isOpen) editingVariantId = null;
          }
        "
      />
    </template>
  </div>
</template>