// packages/layer-base/app/stores/auth.ts
import { defineStore } from 'pinia';
import {
  currentUserSchema,
  type CurrentUser,
  type LoginInput,
  type RegisterInput,
} from '@ironoak/contracts';

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
   * Resolves identity from cookies.
   * /auth/me is excluded from refresh in the interceptor, so an expired access
   * token is handled here explicitly: one refresh, one retry.
   */
  async function fetchUser(): Promise<void> {
    try {
      user.value = await me();
      return;
    } catch {
      // no access token or it expired — try to renew the session below
    }

    // refreshing on the server is pointless — new cookies would not reach the browser
    if (import.meta.server) {
      user.value = null;
      return;
    }

    const refreshed = await tryRefresh(config.public.apiBase);
    if (!refreshed) {
      user.value = null; // a regular guest — no redirect
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

  async function register(input: RegisterInput): Promise<void> {
    await api('/auth/register', { method: 'POST', body: input });
    // registration only creates the account — sign in right away with the same credentials
    await login({ email: input.email, password: input.password });
  }

  async function logout(): Promise<void> {
    try {
      await api('/auth/logout', { method: 'POST' });
    } finally {
      user.value = null;
      await navigateTo('/login');
    }
  }

  return { user, isAuthenticated, isAdmin, fetchUser, login, register, logout };
});
