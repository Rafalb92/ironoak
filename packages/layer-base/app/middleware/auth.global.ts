export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore();

  const publicRoutes = ['/login'];
  if (publicRoutes.includes(to.path)) {
    // zalogowany nie potrzebuje strony logowania
    if (auth.isAuthenticated) return navigateTo('/');
    return;
  }

  if (!auth.isAuthenticated) {
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`);
  }
});
