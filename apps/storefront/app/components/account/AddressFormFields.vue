<script setup lang="ts">
import { Field as VeeField } from 'vee-validate';

/**
 * The delivery address fields. Renders no <form> of its own: it must sit inside
 * a vee-validate form (useForm in a parent), which owns the schema, initial
 * values and submission. Extra fields go into the default slot, at the end.
 */
const ids = {
  recipientName: useId(),
  phone: useId(),
  street: useId(),
  buildingNumber: useId(),
  apartmentNumber: useId(),
  city: useId(),
  postalCode: useId(),
  country: useId(),
};
</script>

<template>
  <FieldGroup class="grid gap-6 sm:grid-cols-2">
    <VeeField v-slot="{ componentField, errors }" name="recipientName">
      <Field :data-invalid="!!errors.length">
        <FieldLabel :for="ids.recipientName">Full name</FieldLabel>
        <Input :id="ids.recipientName" v-bind="componentField" autocomplete="name" class="h-12" :aria-invalid="!!errors.length" />
        <FieldError v-if="errors.length" :errors="errors" />
      </Field>
    </VeeField>

    <VeeField v-slot="{ componentField, errors }" name="phone">
      <Field :data-invalid="!!errors.length">
        <FieldLabel :for="ids.phone">Phone</FieldLabel>
        <Input
          :id="ids.phone"
          v-bind="componentField"
          type="tel"
          inputmode="tel"
          autocomplete="tel"
          placeholder="+1 555 010 0199"
          class="h-12"
          :aria-invalid="!!errors.length"
        />
        <FieldDescription>For the delivery crew to arrange a time.</FieldDescription>
        <FieldError v-if="errors.length" :errors="errors" />
      </Field>
    </VeeField>

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

    <slot />
  </FieldGroup>
</template>