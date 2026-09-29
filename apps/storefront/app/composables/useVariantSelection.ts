import type { ProductDetail, ProductVariant } from '@ironoak/contracts';
import type { Ref } from 'vue';

/**
 * The selected variant lives in the URL (?variant=SKU), so a link opens the
 * exact version and the server renders it. Invalid or missing SKU falls back
 * to the first purchasable variant.
 */
export function useVariantSelection(product: Readonly<Ref<ProductDetail>>) {
  const route = useRoute();
  const router = useRouter();

  const fallback = computed<ProductVariant | null>(
    () => product.value.variants.find((v) => v.inStock) ?? product.value.variants[0] ?? null,
  );

  const selected = computed<ProductVariant | null>(() => {
    const sku = route.query.variant;
    const fromUrl =
      typeof sku === 'string' ? product.value.variants.find((v) => v.sku === sku) : undefined;
    return fromUrl ?? fallback.value;
  });

  function select(variant: ProductVariant) {
    // replace, not push: switching variants should not fill the back-button history
    router.replace({ query: { ...route.query, variant: variant.sku } });
  }

  // images of the selected variant first, then shared product images
  const images = computed(() => {
    const variantId = selected.value?.id;
    const all = product.value.images;
    return [
      ...all.filter((image) => variantId && image.variantId === variantId),
      ...all.filter((image) => image.variantId === null),
    ];
  });

  return { selected, select, images };
}
