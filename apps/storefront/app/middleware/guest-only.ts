/**
 * Sign-in and sign-up pages are for guests. A signed-in visitor goes straight
 * to where the page would have sent them anyway.
 */
export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore();
  if (auth.isAuthenticated) {
    return navigateTo(safeRedirect(to.query.redirect), { replace: true });
  }
});
