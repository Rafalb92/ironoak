export default defineNuxtPlugin(async () => {
  const auth = useAuthStore();
  await auth.fetchUser();
  // jeśli pierwszy strzał padł, ale interceptor odświeżył token — spróbuj raz jeszcze
  if (!auth.isAuthenticated) {
    await auth.fetchUser();
  }
});
