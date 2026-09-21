// packages/layer-base/app/composables/useApi.ts
import { useQueryCache } from '@pinia/colada';

export function useApi() {
  const config = useRuntimeConfig();
  const requestHeaders = import.meta.server ? useRequestHeaders(['cookie']) : {};
  const cache = useQueryCache();

  return $fetch.create({
    baseURL: config.public.apiBase,
    credentials: 'include',
    headers: requestHeaders,

    async onResponseError({ response, request }) {
      if (response.status !== 401) return;
      // /auth/* nie odświeżamy — to by zapętliło logowanie i sam refresh
      if (String(request).includes('/auth/')) return;

      const refreshed = await tryRefresh(config.public.apiBase, requestHeaders);

      if (!refreshed) {
        await navigateTo('/login');
        return;
      }

      // Token odnowiony, ale to żądanie już przepadło.
      // Unieważnienie cache sprawia, że Colada pobierze aktywne zapytania
      // ponownie — tym razem ze świeżym tokenem.
      cache.invalidateQueries();
    },
  });
}

let refreshPromise: Promise<boolean> | null = null;

/**
 * Deduplikacja jest tu krytyczna: backend rotuje refresh token przy każdym
 * użyciu i traktuje powtórne użycie zrotowanego tokena jako kradzież,
 * kasując wszystkie sesje. Dwa równoległe odświeżenia wylogowałyby
 * prawowitego użytkownika.
 */
export async function tryRefresh(
  baseURL: string,
  headers: Record<string, string> = {},
): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = $fetch('/auth/refresh', {
    baseURL,
    method: 'POST',
    credentials: 'include',
    headers,
  })
    .then(() => true)
    .catch(() => false)
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}
