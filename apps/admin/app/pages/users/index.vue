<script setup lang="ts">
import type { AdminUserListItem, ChangeRoleInput } from '@ironoak/contracts';

type Role = ChangeRoleInput['role'];

const { state, page, search, totalPages, nextPage, prevPage } = useAdminUsers();
const changeRole = useChangeUserRole();
const auth = useAuthStore();
const { canManageUsers } = useAdminPermissions();
const locked = computed(() => !canManageUsers.value);

const ROLES: { value: Role; label: string }[] = [
  { value: 'USER', label: 'Customer' },
  { value: 'DEMO_ADMIN', label: 'Demo admin' },
  { value: 'ADMIN', label: 'Admin' },
];

const roleLabel = (role: Role) => ROLES.find((r) => r.value === role)?.label ?? role;

const ROLE_BADGE: Record<Role, string> = {
  ADMIN: 'bg-[var(--color-brass)]/15 text-[var(--color-brass)]',
  DEMO_ADMIN: 'bg-raised text-fg',
  USER: 'bg-raised text-fg-muted',
};

// what the new role lets the person do — shown before confirming
const ROLE_CONSEQUENCE: Record<Role, string> = {
  ADMIN: 'Administrators can manage the catalogue, orders and other users.',
  DEMO_ADMIN:
    'Demo admins can view everything and move orders through fulfillment, but cannot change the catalogue or users.',
  USER: 'They lose access to the admin panel.',
};

const pending = ref<{ user: AdminUserListItem; role: Role } | null>(null);

function requestChange(user: AdminUserListItem, role: Role) {
  if (role === user.role) return;
  pending.value = { user, role };
}

async function confirmChange() {
  const change = pending.value;
  if (!change) return;
  pending.value = null;
  await changeRole.mutateAsync({ userId: change.user.id, role: change.role });
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
      <p v-if="!state.data.items.length" class="t-body-sm text-fg-muted">No users match this search.</p>

      <div v-else class="border border-line">
        <table class="w-full">
          <thead class="border-b border-line bg-surface">
            <tr>
              <th class="t-label px-4 py-3 text-left text-fg-muted">Email</th>
              <th class="t-label px-4 py-3 text-left text-fg-muted">Role</th>
              <th class="t-label px-4 py-3 text-left text-fg-muted">Verified</th>
              <th class="t-label px-4 py-3 text-left text-fg-muted">Joined</th>
              <th class="t-label px-4 py-3 text-right text-fg-muted">Change role</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in state.data.items" :key="user.id" class="border-b border-line last:border-0">
              <td class="t-body-sm px-4 py-3">
                {{ user.email }}
                <span v-if="user.id === auth.user?.userId" class="t-label ml-2 text-fg-muted">you</span>
              </td>
              <td class="px-4 py-3">
                <span class="t-label px-2 py-1" :class="ROLE_BADGE[user.role]">
                  {{ roleLabel(user.role) }}
                </span>
              </td>
              <td class="t-spec px-4 py-3 text-fg-muted">{{ user.emailVerified ? 'Yes' : 'No' }}</td>
              <td class="t-spec px-4 py-3 text-fg-muted">{{ formatDate(user.createdAt) }}</td>
              <td class="px-4 py-3 text-right">
                <!-- nobody changes their own role: the API refuses it too -->
                <DemoLock v-if="user.id !== auth.user?.userId" :locked="locked">
                  <Select
                    :model-value="user.role"
                    :disabled="locked || changeRole.isLoading.value"
                    @update:model-value="(role) => requestChange(user, role as Role)"
                  >
                    <SelectTrigger class="ml-auto h-8 w-36" :aria-label="`Role of ${user.email}`">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem v-for="role in ROLES" :key="role.value" :value="role.value">
                        {{ role.label }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </DemoLock>
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

    <Dialog
      :open="pending !== null"
      @update:open="
        (isOpen) => {
          if (!isOpen) pending = null;
        }
      "
    >
      <DialogContent class="max-w-md">
        <DialogHeader>
          <DialogTitle>Change role to {{ pending ? roleLabel(pending.role) : '' }}?</DialogTitle>
          <DialogDescription>
            {{ pending?.user.email }} will be signed out of all devices and must sign in again for the new role to
            take effect.
            <template v-if="pending">{{ ROLE_CONSEQUENCE[pending.role] }}</template>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" @click="pending = null">Cancel</Button>
          <Button :disabled="changeRole.isLoading.value" @click="confirmChange">
            {{ changeRole.isLoading.value ? 'Changing…' : 'Confirm' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>