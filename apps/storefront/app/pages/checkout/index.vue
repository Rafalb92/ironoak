<script setup lang="ts">
import { addressSchema } from '@ironoak/contracts';
import { useQueryCache } from '@pinia/colada';
import { useForm, Field as VeeField } from 'vee-validate';
import { CART_QUERY_KEYS, useCartStore } from '../../stores/cart';

definePageMeta({ middleware: 'auth' });

useSeoMeta({
  title: 'Checkout',
  robots: 'noindex',
});

const cart = useCartStore();
const api = useApi();
const cache = useQueryCache();
const { startPayment } = useCheckoutPayment();

const lines = computed(() => cart.cart.items);
const total = computed(() => formatPrice(cart.cart.totalAmount, 'USD', { trimZeros: true }));

// --- delivery address ---
const { handleSubmit, isSubmitting } = useForm({
  validationSchema: toFormSchema(addressSchema),
  initialValues: {
    street: '',
    buildingNumber: '',
    apartmentNumber: '',
    city: '',
    postalCode: '',
    country: '',
  },
});

const ids = {
  street: useId(),
  buildingNumber: useId(),
  apartmentNumber: useId(),
  city: useId(),
  postalCode: useId(),
  country: useId(),
};

// --- order and payment ---
// set once the order exists: from then on a retry may only restart payment,
// never place a second order
const placedOrderId = ref<string | null>(null);
const formError = ref<string | null>(null);
const paymentFailed = ref(false);
const paying = ref(false);

async function pay(orderId: string) {
  paymentFailed.value = false;
  paying.value = true;
  try {
    await startPayment(orderId);
  } catch {
    paymentFailed.value = true;
    paying.value = false;
  }
}

const onSubmit = handleSubmit(async (values) => {
  formError.value = null;

  let orderId: string;
  try {
    const result = await api<{ orderId: string }>('/checkout', {
      method: 'POST',
      body: {
        deliveryAddress: {
          ...values,
          apartmentNumber: values.apartmentNumber?.trim() || undefined,
        },
      },
    });
    orderId = result.orderId;
  } catch (error) {
    const status = httpStatusOf(error);
    formError.value =
      status === 404
        ? 'An item in your cart is no longer available. Review your cart and try again.'
        : status === 400
          ? 'Your cart is empty or the address is incomplete.'
          : 'Could not place the order. Please try again.';
    return;
  }

  placedOrderId.value = orderId;
  // the API emptied the cart when it placed the order
  void cache.invalidateQueries({ key: CART_QUERY_KEYS.root });
  await pay(orderId);
});
</script>

<template>
  <div class="flex flex-col gap-10">
    <h1 class="t-section">Checkout</h1>

    <!-- order placed: the form never comes back, only payment can be retried -->
    <section v-if="placedOrderId" class="flex flex-col items-start gap-4 rounded-panel bg-surface p-8 md:p-12">
      <template v-if="paymentFailed">
        <p class="t-body-lead">Your order is placed, but the payment could not start.</p>
        <p class="t-body-md max-w-prose text-fg-secondary">
          Nothing has been charged and your order is kept. Try again in a moment.
        </p>
        <Button size="lg" class="h-12 rounded-pill px-8" :disabled="paying" @click="pay(placedOrderId)">
          {{ paying ? 'Starting payment…' : 'Retry payment' }}
        </Button>
      </template>
      <p v-else class="t-body-lead">Redirecting to secure payment…</p>
    </section>

    <p v-else-if="lines.length === 0 && cart.isLoading" class="t-body-md text-fg-muted">Loading your cart…</p>

    <section v-else-if="lines.length === 0" class="flex flex-col items-start gap-6 rounded-panel bg-surface p-8 md:p-12">
      <p class="t-body-lead">Your cart is empty.</p>
      <Button as-child size="lg" class="h-12 rounded-pill px-8">
        <NuxtLink to="/products">Browse products</NuxtLink>
      </Button>
    </section>

    <section v-else-if="cart.checkoutIssue" class="flex flex-col items-start gap-6 rounded-panel bg-surface p-8 md:p-12">
      <p class="t-body-lead">{{ cart.checkoutIssue }}</p>
      <Button as-child size="lg" class="h-12 rounded-pill px-8">
        <NuxtLink to="/cart">Review your cart</NuxtLink>
      </Button>
    </section>

    <div v-else class="grid gap-10 lg:grid-cols-[1fr_22rem] lg:gap-16">
      <form id="checkout-form" novalidate @submit="onSubmit">
        <h2 class="t-label text-fg-muted">Delivery address</h2>

        <FieldGroup class="mt-6 grid gap-6 sm:grid-cols-2">
          <VeeField v-slot="{ componentField, errors }" name="street">
            <Field class="sm:col-span-2" :data-invalid="!!errors.length">
              <FieldLabel :for="ids.street">Street</FieldLabel>
              <Input :id="ids.street" v-bind="componentField" autocomplete="address-line1" class="h-12" :aria-invalid="!!errors.length" />
              <FieldError v-if="errors.length" :errors="errors" />
            </Field>
          </VeeField>

          <VeeField v-slot="{ componentField, errors }" name="buildingNumber">
            <Field :data-invalid="!!errors.length">
              <FieldLabel :for="ids.buildingNumber">Building number</FieldLabel>
              <Input :id="ids.buildingNumber" v-bind="componentField" class="h-12" :aria-invalid="!!errors.length" />
              <FieldError v-if="errors.length" :errors="errors" />
            </Field>
          </VeeField>

          <VeeField v-slot="{ componentField, errors }" name="apartmentNumber">
            <Field :data-invalid="!!errors.length">
              <FieldLabel :for="ids.apartmentNumber">Apartment <span class="text-fg-muted">(optional)</span></FieldLabel>
              <Input :id="ids.apartmentNumber" v-bind="componentField" autocomplete="address-line2" class="h-12" :aria-invalid="!!errors.length" />
              <FieldError v-if="errors.length" :errors="errors" />
            </Field>
          </VeeField>

          <VeeField v-slot="{ componentField, errors }" name="postalCode">
            <Field :data-invalid="!!errors.length">
              <FieldLabel :for="ids.postalCode">Postal code</FieldLabel>
              <Input :id="ids.postalCode" v-bind="componentField" autocomplete="postal-code" class="h-12" :aria-invalid="!!errors.length" />
              <FieldError v-if="errors.length" :errors="errors" />
            </Field>
          </VeeField>

          <VeeField v-slot="{ componentField, errors }" name="city">
            <Field :data-invalid="!!errors.length">
              <FieldLabel :for="ids.city">City</FieldLabel>
              <Input :id="ids.city" v-bind="componentField" autocomplete="address-level2" class="h-12" :aria-invalid="!!errors.length" />
              <FieldError v-if="errors.length" :errors="errors" />
            </Field>
          </VeeField>

          <VeeField v-slot="{ componentField, errors }" name="country">
            <Field class="sm:col-span-2" :data-invalid="!!errors.length">
              <FieldLabel :for="ids.country">Country</FieldLabel>
              <Select v-bind="componentField">
                <SelectTrigger :id="ids.country" class="h-12 w-full" :aria-invalid="!!errors.length">
                  <SelectValue placeholder="Choose a country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="country in SHIPPING_COUNTRIES" :key="country.code" :value="country.code">
                    {{ country.name }}
                  </SelectItem>
                </SelectContent>
              </Select>
              <FieldError v-if="errors.length" :errors="errors" />
            </Field>
          </VeeField>
        </FieldGroup>
      </form>

      <aside
        aria-labelledby="checkout-summary-title"
        class="flex flex-col gap-4 rounded-panel bg-surface p-6 lg:sticky lg:top-28 lg:self-start"
      >
        <h2 id="checkout-summary-title" class="t-label text-fg-muted">Order summary</h2>

        <ul class="divide-y divide-line">
          <li v-for="line in lines" :key="line.productVariantId" class="flex justify-between gap-4 py-3 first:pt-0">
            <div class="min-w-0">
              <p class="truncate text-sm font-semibold">{{ line.productName }}</p>
              <p class="t-spec text-fg-muted">{{ line.variantName }} · × {{ line.quantity }}</p>
            </div>
            <p class="t-spec shrink-0">{{ formatPrice(line.lineTotal, 'USD', { trimZeros: true }) }}</p>
          </li>
        </ul>

        <dl class="flex flex-col gap-3 border-t border-line pt-3">
          <div class="flex items-baseline justify-between">
            <dt class="t-body-sm">Shipping</dt>
            <dd class="t-spec text-moss">Free</dd>
          </div>
          <div class="flex items-baseline justify-between">
            <dt class="font-semibold">Total</dt>
            <dd class="t-price">{{ total }}</dd>
          </div>
        </dl>

        <p v-if="formError" role="alert" class="t-spec text-rust">{{ formError }}</p>

        <Button
          type="submit"
          form="checkout-form"
          size="lg"
          class="h-14 w-full rounded-pill text-base"
          :disabled="isSubmitting"
        >
          {{ isSubmitting ? 'Placing order…' : `Pay ${total}` }}
        </Button>
        <p class="t-spec text-center text-fg-muted">You'll pay securely on Stripe.</p>
      </aside>
    </div>
  </div>
</template>