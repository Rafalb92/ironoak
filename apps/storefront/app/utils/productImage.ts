import type { ProductImage, ProductListItem } from '@ironoak/contracts';

/**
 * Image of the first variant wins; shared product images are the fallback.
 * HERO role is preferred within each group. Videos never represent a product
 * in cards, the hero or link previews — they belong to the gallery only.
 */
export function pickPrimaryImage(
  product: Pick<ProductListItem, 'variants' | 'images'>,
): ProductImage | null {
  const variantId = product.variants[0]?.id;
  const images = product.images.filter((image) => image.type === 'IMAGE');

  return (
    images.find((i) => i.variantId === variantId && i.role === 'HERO') ??
    images.find((i) => i.variantId === variantId) ??
    images.find((i) => i.variantId === null && i.role === 'HERO') ??
    images[0] ??
    null
  );
}
