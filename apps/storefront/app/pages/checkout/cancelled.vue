<script setup lang="ts">
definePageMeta({ middleware: 'auth' });

useSeoMeta({
  title: 'Payment not completed',
  robots: 'noindex',
});

const route = useRoute();
const orderId = computed(() => (typeof route.query.order === 'string' ? route.query.order : null));

const { startPayment } = useCheckoutPayment();
const paying = ref(false);
const failed = ref(false);

async function retry() {
  if (!orderId.value) return;
  failed.value = false;
  paying.value = true;
  try {
    await startPayment(orderId.value);
  } catch {
    failed.value = true;
    paying.value = false;
  }
}
</script>

<template>
  <div class="mx-auto flex w-full max-w-2xl flex-col items-start gap-4 py-6 md:py-12">
    <h1 class="t-section">Payment not completed</h1>
    <p class="t-body-md max-w-prose text-fg-secondary">
      Your order is saved and waiting for payment. Nothing has been charged.
    </p>

    <p v-if="failed" role="alert" class="t-spec text-rust">
      Payment could not start — the order may have been paid or cancelled in the meantime.
    </p>

    <div class="mt-4 flex flex-wrap gap-3">
      <Button v-if="orderId" size="lg" class="h-12 rounded-pill px-8" :disabled="paying" @click="retry">
        {{ paying ? 'Starting payment…' : 'Try again' }}
      </Button>
      <Button as-child variant="outline" size="lg" class="h-12 rounded-pill px-8">
        <NuxtLink to="/">Back to the shop</NuxtLink>
      </Button>
    </div>
  </div>
</template>