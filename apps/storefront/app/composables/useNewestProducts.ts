import { useQuery } from '@pinia/colada';
import type { ProductListItem } from '@ironoak/contracts';
import { productListQuery } from '../queries/products';

export interface HeroSlide {
  id: string;
  name: string;
  slug: string;
  // null = no image yet; the view renders a placeholder
  image: { url: string | null; alt: string };
}

/**
 * Image of the first variant wins; shared product images are the fallback.
 * HERO role is preferred within each group.
 */
function pickImage(product: ProductListItem) {
  const variantId = product.variants[0]?.id;
  const { images } = product;

  return (
    images.find((i) => i.variantId === variantId && i.role === 'HERO') ??
    images.find((i) => i.variantId === variantId) ??
    images.find((i) => i.variantId === null && i.role === 'HERO') ??
    images[0] ??
    null
  );
}

export function useNewestProducts(limit = 3) {
  const query = useQuery(() => productListQuery({ sort: 'newest', limit }));

  // every product becomes a slide — a missing image is a presentation concern
  const slides = computed<HeroSlide[]>(() =>
    (query.data.value?.items ?? []).map((product) => {
      const image = pickImage(product);
      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        image: { url: image?.url ?? null, alt: image?.alt ?? product.name },
      };
    }),
  );

  return { ...query, slides };
}
