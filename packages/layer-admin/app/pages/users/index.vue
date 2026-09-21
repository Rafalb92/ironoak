<script setup lang="ts">
import type { AdminUserListItem } from '@ironoak/contracts';

const { state, page, search, totalPages, nextPage, prevPage } = useAdminUsers();
const changeRole = useChangeUserRole();
const auth = useAuthStore();

const confirmTarget = ref<AdminUserListItem | null>(null);

const nextRoleFor = (user: AdminUserListItem) => (user.role === 'ADMIN' ? 'USER' : 'ADMIN');

function requestChange(user: AdminUserListItem) {
  confirmTarget.value = user;
}

async function confirmChange() {
  const user = confirmTarget.value;
  if (!user) return;
  confirmTarget.value = null;
  await changeRole.mutateAsync({ userId: user.id, role: nextRoleFor(user) });
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date);
}
</script>

<template>
  <div class="space-y-6">
    <h1 class="t-display-lg">Users</h1>

    <Input v-model="search" placeholder="Search by email" class="max-w-sm" />

    <p v-if="state.status === 'pending'" class="t-body-sm text-fg-muted">Loading…</p>
    <p v-else-if="state.status === 'error'" class="t-body-sm text-destructive">
      {{ state.error.message }}
    </p>

    <template v-else>
      <p v-if="!state.data.items.length" class="t-body-sm text-fg-muted">
        No users match this search.
      </p>

      <div v-else class="border border-line">
        <table class="w-full">
          <thead class="border-b border-line bg-surface">
            <tr>
              <th class="t-label px-4 py-3 text-left text-fg-muted">Email</th>
              <th class="t-label px-4 py-3 text-left text-fg-muted">Role</th>
              <th class="t-label px-4 py-3 text-left text-fg-muted">Verified</th>
              <th class="t-label px-4 py-3 text-left text-fg-muted">Joined</th>
              <th class="w-px px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="user in state.data.items"
              :key="user.id"
              class="border-b border-line last:border-0"
            >
              <td class="t-body-sm px-4 py-3">
                {{ user.email }}
                <span v-if="user.id === auth.user?.userId" class="t-label ml-2 text-fg-muted">
                  you
                </span>
              </td>
              <td class="px-4 py-3">
                <span
                  class="t-label px-2 py-1"
                  :class="user.role === 'ADMIN'
                    ? 'bg-[var(--color-brass)]/15 text-[var(--color-brass)]'
                    : 'bg-raised text-fg-muted'"
                >
                  {{ user.role }}
                </span>
              </td>
              <td class="t-spec px-4 py-3 text-fg-muted">
                {{ user.emailVerified ? 'Yes' : 'No' }}
              </td>
              <td class="t-spec px-4 py-3 text-fg-muted">{{ formatDate(user.createdAt) }}</td>
              <td class="px-4 py-3 text-right">
                <Button
                  v-if="user.id !== auth.user?.userId"
                  variant="ghost"
                  size="sm"
                  :disabled="changeRole.isLoading.value"
                  @click="requestChange(user)"
                >
                  {{ user.role === 'ADMIN' ? 'Demote' : 'Promote' }}
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="totalPages > 1" class="flex items-center gap-3">
        <Button variant="outline" size="sm" :disabled="page === 1" @click="prevPage">Previous</Button>
        <span class="t-spec text-fg-muted">{{ page }} / {{ totalPages }}</span>
        <Button variant="outline" size="sm" :disabled="page >= totalPages" @click="nextPage">Next</Button>
      </div>
    </template>

    <Dialog :open="confirmTarget !== null" @update:open="(v) => { if (!v) confirmTarget = null }">
      <DialogContent class="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {{ confirmTarget?.role === 'ADMIN' ? 'Demote to user?' : 'Promote to admin?' }}
          </DialogTitle>
          <DialogDescription>
            {{ confirmTarget?.email }} will be signed out of all devices and must sign in again
            for the new role to take effect.
            <template v-if="confirmTarget?.role !== 'ADMIN'">
              Administrators can manage the catalog, orders and other users.
            </template>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" @click="confirmTarget = null">Cancel</Button>
          <Button :disabled="changeRole.isLoading.value" @click="confirmChange">
            {{ changeRole.isLoading.value ? 'Changing…' : 'Confirm' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>