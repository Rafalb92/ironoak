export default defineNuxtPlugin(async () => {
  const auth = useAuthStore();
  await auth.fetchUser();

  if (!auth.isAuthenticated) {
    await auth.fetchUser(); // interceptor właśnie odświeżył token
  }
});
