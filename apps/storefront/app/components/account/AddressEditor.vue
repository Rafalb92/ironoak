<script setup lang="ts">
import { addressSchema, type SavedAddress } from '@ironoak/contracts';
import { useForm } from 'vee-validate';

const { address = null } = defineProps<{
  /** null = a new address */
  address?: SavedAddress | null;
}>();

const emit = defineEmits<{ saved: []; cancel: [] }>();

const { create, update } = useAddressBook();
const toast = useToast();

// mounted fresh on every dialog open, so these are always the chosen address's values
const { handleSubmit, isSubmitting } = useForm({
  validationSchema: toFormSchema(addressSchema),
  initialValues: {
    recipientName: address?.recipientName ?? '',
    phone: address?.phone ?? '',
    street: address?.street ?? '',
    buildingNumber: address?.buildingNumber ?? '',
    apartmentNumber: address?.apartmentNumber ?? '',
    city: address?.city ?? '',
    postalCode: address?.postalCode ?? '',
    country: address?.country ?? '',
  },
});

const makeDefault = ref<boolean | 'indeterminate'>(false);
const defaultId = useId();
const formError = ref<string | null>(null);

const onSubmit = handleSubmit(async (values) => {
  formError.value = null;

  const input = {
    ...values,
    apartmentNumber: values.apartmentNumber?.trim() || undefined,
    ...(makeDefault.value === true && { isDefault: true }),
  };

  try {
    if (address) await update(address.id, input);
    else await create(input);
    toast.success(address ? 'Address updated' : 'Address saved');
    emit('saved');
  } catch (error) {
    formError.value =
      httpStatusOf(error) === 409
        ? `You can save up to ${ADDRESS_BOOK_LIMIT} addresses.`
        : 'Could not save the address. Please try again.';
  }
});
</script>

<template>
  <form novalidate class="flex flex-col gap-6" @submit="onSubmit">
    <AddressFormFields>
      <!-- the current default stays default; making it non-default happens by choosing another -->
      <Field v-if="!address?.isDefault" orientation="horizontal" class="sm:col-span-2">
        <Checkbox :id="defaultId" v-model="makeDefault" />
        <FieldLabel :for="defaultId" class="font-normal">Use as my default address</FieldLabel>
      </Field>
    </AddressFormFields>

    <p v-if="formError" role="alert" class="t-spec text-rust">{{ formError }}</p>

    <div class="flex flex-wrap justify-end gap-3">
      <Button type="button" variant="outline" class="h-11 rounded-pill px-6" @click="emit('cancel')">Cancel</Button>
      <Button type="submit" class="h-11 rounded-pill px-6" :disabled="isSubmitting">
        {{ isSubmitting ? 'Saving…' : 'Save address' }}
      </Button>
    </div>
  </form>
</template>