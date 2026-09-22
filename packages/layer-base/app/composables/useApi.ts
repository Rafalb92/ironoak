// packages/layer-base/app/composables/useApi.ts
import { useQueryCache } from '@pinia/colada';
import type { Pinia } from 'pinia';

export function useApi() {
  const nuxtApp = useNuxtApp();
  const config = useRuntimeConfig();
  const requestHeaders = import.meta.server ? useRequestHeaders(['cookie']) : {};

  return $fetch.create({
    baseURL: config.public.apiBase,
    credentials: 'include',
    headers: requestHeaders,

    async onResponseError({ response, request }) {
      // Na serwerze nie odświeżamy sesji — nowe cookies trafiłyby do serwera Nuxta,
      // nie do przeglądarki. Klient odnowi sesję po hydratacji.
      if (import.meta.server) return;

      if (response.status !== 401) return;

      // /auth/* obsługujemy osobno: login i refresh zapętliłyby się,
      // a /auth/me odświeża sesję jawnie w auth store.
      if (String(request).includes('/auth/')) return;

      const refreshed = await tryRefresh(config.public.apiBase);

      if (!refreshed) {
        await navigateTo('/login');
        return;
      }

      // Token odnowiony, ale to żądanie już przepadło. Unieważnienie cache
      // sprawia, że Colada pobierze aktywne zapytania ponownie ze świeżym tokenem.
      // Instancja Pinii przekazana jawnie — bez polegania na globalnej activePinia.
      useQueryCache(nuxtApp.$pinia as Pinia).invalidateQueries();
    },
  });
}

let refreshPromise: Promise<boolean> | null = null;

/**
 * Deduplikacja jest krytyczna: backend rotuje refresh token przy każdym
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
