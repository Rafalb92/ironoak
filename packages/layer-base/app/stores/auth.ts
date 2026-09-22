// packages/layer-base/app/stores/auth.ts
import { defineStore } from 'pinia';
import { currentUserSchema, type CurrentUser, type LoginInput } from '@ironoak/contracts';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<CurrentUser | null>(null);
  const isAuthenticated = computed(() => user.value !== null);
  const isAdmin = computed(() => user.value?.role === 'ADMIN');

  const api = useApi();
  const config = useRuntimeConfig();

  async function me(): Promise<CurrentUser> {
    return currentUserSchema.parse(await api('/auth/me'));
  }

  /**
   * Ustala tożsamość na podstawie cookies.
   * /auth/me jest wyłączone z refreshu w interceptorze, więc wygasły access token
   * obsługujemy tutaj jawnie: jeden refresh, jedna ponowna próba.
   */
  async function fetchUser(): Promise<void> {
    try {
      user.value = await me();
      return;
    } catch {
      // access token brak albo wygasł — spróbujemy odnowić sesję niżej
    }

    // Na serwerze refresh nie ma sensu — nowe cookies nie dotarłyby do przeglądarki
    if (import.meta.server) {
      user.value = null;
      return;
    }

    const refreshed = await tryRefresh(config.public.apiBase);
    if (!refreshed) {
      user.value = null; // zwykły gość — bez przekierowania
      return;
    }

    try {
      user.value = await me();
    } catch {
      user.value = null;
    }
  }

  async function login(credentials: LoginInput): Promise<void> {
    await api('/auth/login', { method: 'POST', body: credentials });
    await fetchUser();
  }

  async function logout(): Promise<void> {
    try {
      await api('/auth/logout', { method: 'POST' });
    } finally {
      user.value = null;
      await navigateTo('/login');
    }
  }

  return { user, isAuthenticated, isAdmin, fetchUser, login, logout };
});
