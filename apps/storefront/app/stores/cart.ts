import { defineStore } from 'pinia';
import { useQuery, useQueryCache } from '@pinia/colada';
import {
  cartItemsSchema,
  cartViewSchema,
  type CartItemInput,
  type CartView,
} from '@ironoak/contracts';

const GUEST_CART_COOKIE = 'ironoak_cart';
const GUEST_CART_MAX_AGE = 60 * 60 * 24 * 30; // matches the Redis cart TTL
// same limits as the API contracts
const MAX_LINE_QUANTITY = 99;
const MAX_LINES = 50;

const EMPTY_CART: CartView = { items: [], totalAmount: 0, currency: 'USD' };

export const CART_QUERY_KEYS = {
  root: ['cart'] as const,
  user: ['cart', 'user'] as const,
  // the items are part of the key: any change to the guest cart is a new price check
  guest: (items: readonly CartItemInput[]) => ['cart', 'guest', items] as const,
};

/**
 * One cart API for components, whether the visitor is a guest (cookie, priced
 * by POST /cart/preview) or signed in (Redis via /cart). Components never
 * branch on authentication.
 */
export const useCartStore = defineStore('cart', () => {
  const auth = useAuthStore();
  const api = useApi();
  const cache = useQueryCache();
  const toast = useToast();

  // a cookie, not localStorage: the server sees it, so the header count is
  // already correct in the SSR HTML — no hydration flicker
  const cookie = useCookie<unknown>(GUEST_CART_COOKIE, {
    default: () => null,
    maxAge: GUEST_CART_MAX_AGE,
    sameSite: 'lax',
    path: '/',
  });

  const guestItems = computed<CartItemInput[]>({
    get() {
      // client-controlled data — never trust its shape
      const parsed = cartItemsSchema.shape.items.safeParse(cookie.value);
      return parsed.success ? parsed.data : [];
    },
    set(items) {
      // null removes the cookie instead of storing "[]"
      cookie.value = items.length > 0 ? items : null;
    },
  });

  const isUser = computed(() => auth.isAuthenticated);

  const query = useQuery({
    key: () => (isUser.value ? CART_QUERY_KEYS.user : CART_QUERY_KEYS.guest(guestItems.value)),
    query: async () => {
      if (isUser.value) return cartViewSchema.parse(await api('/cart'));
      if (guestItems.value.length === 0) return EMPTY_CART;
      const raw = await api('/cart/preview', {
        method: 'POST',
        body: { items: guestItems.value },
      });
      return cartViewSchema.parse(raw);
    },
    staleTime: 30_000,
    // keep the previous cart on screen while a changed one loads — no flicker on + / −
    placeholderData: (previous) => previous,
  });

  const cart = computed(() => query.data.value ?? EMPTY_CART);
  const isLoading = computed(() => query.isPending.value);

  // guests: counted straight from the cookie — exact during SSR, no request needed
  const count = computed(() => {
    const lines = isUser.value ? cart.value.items : guestItems.value;
    return lines.reduce((sum, line) => sum + line.quantity, 0);
  });

  async function add(productVariantId: string, quantity: number): Promise<void> {
    if (isUser.value) {
      const raw = await api('/cart/items', {
        method: 'POST',
        body: { productVariantId, quantity },
      });
      cache.setQueryData(CART_QUERY_KEYS.user, cartViewSchema.parse(raw));
      return;
    }

    const items = guestItems.value;
    const line = items.find((item) => item.productVariantId === productVariantId);
    if (line) {
      line.quantity = Math.min(line.quantity + quantity, MAX_LINE_QUANTITY);
    } else {
      if (items.length >= MAX_LINES) throw new Error('Your cart is full');
      items.push({ productVariantId, quantity });
    }
    guestItems.value = items;
  }

  async function update(productVariantId: string, quantity: number): Promise<void> {
    if (isUser.value) {
      const raw = await api(`/cart/items/${productVariantId}`, {
        method: 'PATCH',
        body: { quantity },
      });
      cache.setQueryData(CART_QUERY_KEYS.user, cartViewSchema.parse(raw));
      return;
    }

    guestItems.value =
      quantity <= 0
        ? guestItems.value.filter((item) => item.productVariantId !== productVariantId)
        : guestItems.value.map((item) =>
            item.productVariantId === productVariantId
              ? { ...item, quantity: Math.min(quantity, MAX_LINE_QUANTITY) }
              : item,
          );
  }

  async function remove(productVariantId: string): Promise<void> {
    if (isUser.value) {
      const raw = await api(`/cart/items/${productVariantId}`, { method: 'DELETE' });
      cache.setQueryData(CART_QUERY_KEYS.user, cartViewSchema.parse(raw));
      return;
    }

    guestItems.value = guestItems.value.filter(
      (item) => item.productVariantId !== productVariantId,
    );
  }

  // --- moving a guest cart into the account after sign-in ---
  let merging = false;

  async function mergeGuestCart(): Promise<void> {
    const items = guestItems.value;
    if (items.length === 0 || merging) return;

    merging = true;
    try {
      const raw = await api('/cart/merge', { method: 'POST', body: { items } });
      cache.setQueryData(CART_QUERY_KEYS.user, cartViewSchema.parse(raw));
      // cleared only after success — a failed merge keeps the guest cart intact
      guestItems.value = [];
    } catch {
      toast.error(
        'Could not move your cart to your account',
        'Your items are kept — try again later.',
      );
    } finally {
      merging = false;
    }
  }

  // client only: the merge writes cookies and must run with the browser's session
  if (import.meta.client) {
    watch(
      isUser,
      (signedIn, wasSignedIn) => {
        // a different account must never see the previous one's cached cart
        if (wasSignedIn !== undefined) void cache.invalidateQueries({ key: CART_QUERY_KEYS.root });
        if (signedIn) void mergeGuestCart();
      },
      { immediate: true },
    );
  }

  // checkout is blocked until every line can actually be bought
  const checkoutIssue = computed(() => {
    const items = cart.value.items;
    if (items.some((line) => !line.available)) return 'Remove unavailable items to continue.';
    if (items.some((line) => line.exceedsStock))
      return 'Reduce quantities that exceed stock to continue.';
    return null;
  });

    return { cart, count, isLoading, checkoutIssue, add, update, remove, mergeGuestCart };
})
