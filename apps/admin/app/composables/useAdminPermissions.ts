/**
 * What the signed-in admin may change. Mirrors the API's rule — the server
 * still enforces it; this only keeps the UI from offering actions that would fail.
 */
export function useAdminPermissions() {
  const auth = useAuthStore();

  const canEditCatalog = computed(() => !auth.isDemoAdmin);
  const canManageUsers = computed(() => !auth.isDemoAdmin);

  const demoReason = 'Disabled in the demo';

  return { canEditCatalog, canManageUsers, demoReason };
}
