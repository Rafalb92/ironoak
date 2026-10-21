<script setup lang="ts">
const { state, asyncStatus, page, totalPages, nextPage, prevPage } = useAdminProducts();
const deactivate = useDeactivateProduct();

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="t-display-lg">Products</h1>
      <Button as-child>
        <NuxtLink to="/products/new">New product</NuxtLink>
      </Button>
    </div>

    <p v-if="state.status === 'pending'" class="t-body-sm text-fg-muted">Loading…</p>
    <p v-else-if="state.status === 'error'" class="t-body-sm text-destructive">
      Failed to load products.
    </p>

    <div v-else-if="state.data" class="border border-line">
      <table class="w-full">
        <thead class="border-b border-line bg-surface">
          <tr>
            <th class="t-label px-4 py-3 text-left text-fg-muted">Name</th>
            <th class="t-label px-4 py-3 text-left text-fg-muted">Category</th>
            <th class="t-label px-4 py-3 text-left text-fg-muted">Variants</th>
            <th class="t-label px-4 py-3 text-right text-fg-muted">From</th>
            <th class="t-label px-4 py-3 text-left text-fg-muted">Status</th>
            <th class="w-px px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="product in state.data.items"
            :key="product.id"
            class="border-b border-line last:border-0"
          >
            <td class="px-4 py-3">
              <NuxtLink :to="`/products/${product.id}`" class="t-body-sm hover:text-accent">
                {{ product.name }}
              </NuxtLink>
              <div class="t-spec text-fg-muted">{{ product.slug }}</div>
            </td>
            <td class="t-body-sm px-4 py-3 text-fg-secondary">
              {{ product.category.name }}
            </td>
            <td class="t-spec px-4 py-3 text-fg-secondary">
              {{ product.variants.length }}
            </td>
            <td class="t-price px-4 py-3 text-right">
              {{ formatPrice(Math.min(...product.variants.map((v) => v.price))) }}
            </td>
            <td class="px-4 py-3">
              <span
                class="t-label px-2 py-1"
                :class="
                  product.active
                    ? 'bg-[var(--status-success)]/15 text-[var(--status-success)]'
                    : 'bg-raised text-fg-muted'
                "
              >
                {{ product.active ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td class="px-4 py-3 text-right">
              <Button
                v-if="product.active"
                variant="ghost"
                size="sm"
                :disabled="deactivate.isLoading.value"
                @click="deactivate.mutate(product.id)"
              >
                Deactivate
              </Button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="state.data && state.data.total > state.data.limit" class="flex items-center gap-3">
      <Button variant="outline" size="sm" :disabled="page === 1" @click="prevPage">Previous</Button>
      <span class="t-spec text-fg-muted">{{ page }} / {{ totalPages }}</span>
      <Button variant="outline" size="sm" :disabled="page >= totalPages" @click="nextPage"
        >Next</Button
      >
    </div>
  </div>
</template>
