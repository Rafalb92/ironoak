export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore();
  if (to.path === '/login') return;
  if (auth.isAuthenticated && !auth.isAdmin) {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' });
  }
});
