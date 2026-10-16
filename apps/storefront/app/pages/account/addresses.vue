<script setup lang="ts">
import type { SavedAddress } from '@ironoak/contracts';

useSeoMeta({
  title: 'Your addresses',
  robots: 'noindex',
});

const { query, addresses, makeDefault, remove } = useAddressBook();
const toast = useToast();

const isComplete = (address: SavedAddress) => Boolean(address.recipientName && address.phone);
const isFull = computed(() => addresses.value.length >= ADDRESS_BOOK_LIMIT);

// --- add / edit ---
const editorOpen = ref(false);
const editing = ref<SavedAddress | null>(null);

function openNew() {
  editing.value = null;
  editorOpen.value = true;
}

function openEdit(address: SavedAddress) {
  editing.value = address;
  editorOpen.value = true;
}

// --- make default ---
const busyId = ref<string | null>(null);

async function setDefault(address: SavedAddress) {
  busyId.value = address.id;
  try {
    await makeDefault(address.id);
    toast.success('Default address updated');
  } catch {
    toast.error('Could not update the default address');
  } finally {
    busyId.value = null;
  }
}

// --- delete ---
const toDelete = ref<SavedAddress | null>(null);
const deleting = ref(false);
const deleteOpen = computed({
  get: () => toDelete.value !== null,
  set: (open: boolean) => {
    if (!open) toDelete.value = null;
  },
});

async function confirmDelete() {
  if (!toDelete.value) return;
  deleting.value = true;
  try {
    await remove(toDelete.value.id);
    toast.success('Address deleted');
    toDelete.value = null;
  } catch {
    toast.error('Could not delete the address');
  } finally {
    deleting.value = false;
  }
}
</script>

<template>
  <section aria-labelledby="addresses-title" class="flex flex-col gap-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <h2 id="addresses-title" class="t-label text-fg-muted">Addresses</h2>
      <div class="flex items-center gap-3">
        <p v-if="isFull" class="t-spec text-fg-muted">Up to {{ ADDRESS_BOOK_LIMIT }} addresses</p>
        <Button class="h-11 rounded-pill px-6" :disabled="isFull || query.isPending.value" @click="openNew">
          Add address
        </Button>
      </div>
    </div>

    <div v-if="query.isPending.value" aria-hidden="true" class="grid gap-3 sm:grid-cols-2">
      <div v-for="index in 2" :key="index" class="h-40 animate-pulse rounded-panel bg-surface" />
    </div>

    <p v-else-if="query.error.value" role="alert" class="t-body-md text-rust">
      Could not load your addresses. Please refresh the page.
    </p>

    <div v-else-if="addresses.length === 0" class="flex flex-col items-start gap-4 rounded-panel bg-surface p-8">
      <p class="t-body-lead">No saved addresses yet.</p>
      <p class="t-body-md text-fg-secondary">Save one here, or tick "Save this address" at checkout.</p>
    </div>

    <ul v-else class="grid gap-3 sm:grid-cols-2">
      <li
        v-for="address in addresses"
        :key="address.id"
        class="flex flex-col gap-4 rounded-panel border p-5"
        :class="address.isDefault ? 'border-fg' : 'border-line'"
      >
        <div class="flex items-start justify-between gap-4">
          <address class="t-body-md not-italic">
            <span v-if="address.recipientName" class="block font-semibold">{{ address.recipientName }}</span>
            <span class="block">{{ addressLines(address)[0] }}</span>
            <span class="t-spec block text-fg-muted">{{ addressLines(address)[1] }}</span>
            <span v-if="address.phone" class="t-spec block text-fg-muted">{{ address.phone }}</span>
          </address>
          <span v-if="address.isDefault" class="t-label shrink-0 text-fg-muted">Default</span>
        </div>

        <p v-if="!isComplete(address)" class="t-spec text-rust">
          Missing recipient or phone — this address can't be used for delivery yet.
        </p>

        <div class="mt-auto flex flex-wrap gap-x-5 gap-y-2">
          <button
            type="button"
            class="t-spec underline-offset-4 hover:underline"
            :class="isComplete(address) ? 'text-fg-muted hover:text-fg' : 'font-semibold text-fg'"
            @click="openEdit(address)"
          >
            {{ isComplete(address) ? 'Edit' : 'Complete address' }}
          </button>
          <button
            v-if="!address.isDefault"
            type="button"
            class="t-spec text-fg-muted underline-offset-4 hover:text-fg hover:underline disabled:opacity-40"
            :disabled="busyId === address.id"
            @click="setDefault(address)"
          >
            {{ busyId === address.id ? 'Updating…' : 'Make default' }}
          </button>
          <button
            type="button"
            class="t-spec text-fg-muted underline-offset-4 hover:text-rust hover:underline"
            @click="toDelete = address"
          >
            Delete
          </button>
        </div>
      </li>
    </ul>

    <Dialog v-model:open="editorOpen">
      <DialogContent class="max-h-[calc(100dvh-2rem)] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{{ editing ? 'Edit address' : 'Add address' }}</DialogTitle>
          <DialogDescription>Used for delivery — the crew calls this number to arrange a time.</DialogDescription>
        </DialogHeader>
        <!-- content unmounts on close, so the form starts fresh on every open -->
        <AddressEditor :address="editing" @saved="editorOpen = false" @cancel="editorOpen = false" />
      </DialogContent>
    </Dialog>

    <AlertDialog v-model:open="deleteOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this address?</AlertDialogTitle>
          <AlertDialogDescription>
            <template v-if="toDelete">{{ addressLines(toDelete)[0] }}, {{ addressLines(toDelete)[1] }}. </template>
            <template v-if="toDelete?.isDefault">Your newest other address becomes the default. </template>
            Past orders keep their delivery address.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel :disabled="deleting">Keep address</AlertDialogCancel>
          <Button variant="destructive" :disabled="deleting" @click="confirmDelete">
            {{ deleting ? 'Deleting…' : 'Delete' }}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </section>
</template>