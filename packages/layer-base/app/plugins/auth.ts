// packages/layer-base/app/plugins/auth.ts
export default defineNuxtPlugin({
  name: 'auth-init',
  dependsOn: ['pinia'],
  async setup(nuxtApp) {
    const auth = useAuthStore(nuxtApp.$pinia);

    // Serwer już ustalił użytkownika, a stan przyszedł z hydratacją — nie pytaj drugi raz.
    // Jeśli serwer widział gościa, klient sprawdza ponownie, bo tylko on może odnowić sesję.
    if (import.meta.client && auth.user) return;

    await auth.fetchUser();
  },
});
