export function useApi() {
  const config = useRuntimeConfig();
  const requestHeaders = import.meta.server ? useRequestHeaders(['cookie']) : {};

  return $fetch.create({
    baseURL: config.public.apiBase,
    credentials: 'include',
    headers: requestHeaders,

    async onResponseError({ response, request, options }) {
      if (response.status !== 401) return;
      if (String(request).includes('/auth/')) return;

      const refreshed = await tryRefresh(config.public.apiBase, requestHeaders);
      if (!refreshed) {
        await navigateTo('/login');
      }
    },
  });
}

let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(baseURL: string, headers: Record<string, string>): Promise<boolean> {
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
