import { useQuery } from '@pinia/colada';
import { productListQuery } from '../queries/products';
import { pickPrimaryImage } from '../utils/productImage';

export interface HeroSlide {
  id: string;
  name: string;
  slug: string;
  // null = no image yet; the view renders a placeholder
  image: { url: string | null; alt: string };
}

export function useNewestProducts(limit = 3) {
  const query = useQuery(() => productListQuery({ sort: 'newest', limit }));

  // every product becomes a slide — a missing image is a presentation concern
  const slides = computed<HeroSlide[]>(() =>
    (query.data.value?.items ?? []).map((product) => {
      const image = pickPrimaryImage(product);
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
