import { defineStore } from 'pinia';
import type { CurrentUser, LoginInput } from '@ironoak/contracts';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<CurrentUser | null>(null);
  const isAuthenticated = computed(() => user.value !== null);
  const isAdmin = computed(() => user.value?.role === 'ADMIN');

  const api = useApi();

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

  // wywoływane przy starcie i po logowaniu
  async function fetchUser(): Promise<void> {
    try {
      user.value = await api<CurrentUser>('/auth/me');
    } catch {
      user.value = null;
    }
  }

  return { user, isAuthenticated, isAdmin, login, logout, fetchUser };
});
