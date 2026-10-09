<script setup lang="ts">
import { loginSchema, registerSchema } from '@ironoak/contracts';
import { IconEye, IconEyeOff } from '@tabler/icons-vue';
import { useForm, Field as VeeField } from 'vee-validate';

type AuthMode = 'login' | 'register';

const { mode } = defineProps<{ mode: AuthMode }>();

const auth = useAuthStore();
const route = useRoute();

const isRegister = computed(() => mode === 'register');

// contract schemas, adapted for vee-validate — the same rules the API enforces
const { handleSubmit, setFieldError, isSubmitting } = useForm({
  validationSchema: toFormSchema(mode === 'register' ? registerSchema : loginSchema),
  initialValues: { email: '', password: '' },
})

const formError = ref<string | null>(null);
const showPassword = ref(false);

const emailId = useId();
const passwordId = useId();

// switching between sign in and sign up keeps the destination
const redirectQuery = computed(() =>
  typeof route.query.redirect === 'string' ? { redirect: route.query.redirect } : {},
);

function statusOf(error: unknown): number | undefined {
  return (error as { statusCode?: number } | null)?.statusCode;
}

const onSubmit = handleSubmit(async (values) => {
  formError.value = null;

  try {
    if (isRegister.value) await auth.register(values);
    else await auth.login(values);

    // replace: the sign-in page should not stay in the back-button history
    await navigateTo(safeRedirect(route.query.redirect), { replace: true });
  } catch (error) {
    const status = statusOf(error);

    if (isRegister.value && status === 409) {
      setFieldError('email', 'An account with this email already exists.');
      return;
    }
    // deliberately vague: it must not reveal which of the two fields is wrong
    if (!isRegister.value && status === 401) {
      formError.value = 'Incorrect email or password.';
      return;
    }
    formError.value = 'Something went wrong. Please try again.';
  }
});
</script>

<template>
  <div class="mx-auto w-full max-w-md">
    <!-- looks like tabs, works like links: shareable URLs, a working back button -->
    <nav aria-label="Account" class="grid grid-cols-2 rounded-pill bg-surface p-1.5">
      <NuxtLink
        :to="{ path: '/login', query: redirectQuery }"
        :aria-current="!isRegister ? 'page' : undefined"
        class="rounded-pill py-2.5 text-center font-data text-sm transition-colors duration-(--duration-fast) ease-(--ease-lift)"
        :class="!isRegister ? 'bg-canvas text-fg shadow-sm' : 'text-fg-muted hover:text-fg'"
      >
        Sign in
      </NuxtLink>
      <NuxtLink
        :to="{ path: '/register', query: redirectQuery }"
        :aria-current="isRegister ? 'page' : undefined"
        class="rounded-pill py-2.5 text-center font-data text-sm transition-colors duration-(--duration-fast) ease-(--ease-lift)"
        :class="isRegister ? 'bg-canvas text-fg shadow-sm' : 'text-fg-muted hover:text-fg'"
      >
        Create account
      </NuxtLink>
    </nav>

    <h1 class="t-section mt-10">{{ isRegister ? 'Create your account' : 'Welcome back' }}</h1>
    <p class="t-body-md mt-3 text-fg-secondary">
      {{
        isRegister
          ? 'One account for your orders, delivery details and a cart that follows you between devices.'
          : 'Sign in to check out and see your orders.'
      }}
    </p>

    <form class="mt-8" novalidate @submit="onSubmit">
      <FieldGroup>
        <VeeField v-slot="{ componentField, errors }" name="email">
          <Field :data-invalid="!!errors.length">
            <FieldLabel :for="emailId">Email</FieldLabel>
            <Input
              :id="emailId"
              v-bind="componentField"
              type="email"
              inputmode="email"
              autocomplete="email"
              class="h-12"
              :aria-invalid="!!errors.length"
            />
            <FieldError v-if="errors.length" :errors="errors" />
          </Field>
        </VeeField>

        <VeeField v-slot="{ componentField, errors }" name="password">
          <Field :data-invalid="!!errors.length">
            <FieldLabel :for="passwordId">Password</FieldLabel>
            <div class="relative">
              <Input
                :id="passwordId"
                v-bind="componentField"
                :type="showPassword ? 'text' : 'password'"
                :autocomplete="isRegister ? 'new-password' : 'current-password'"
                class="h-12 pr-12"
                :aria-invalid="!!errors.length"
              />
              <button
                type="button"
                class="absolute inset-y-0 right-0 grid w-12 place-items-center text-fg-muted transition-colors duration-(--duration-fast) ease-(--ease-lift) hover:text-fg"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
                :aria-pressed="showPassword"
                @click="showPassword = !showPassword"
              >
                <IconEyeOff v-if="showPassword" class="size-5" :stroke="1.75" aria-hidden="true" />
                <IconEye v-else class="size-5" :stroke="1.75" aria-hidden="true" />
              </button>
            </div>
            <FieldDescription v-if="isRegister">At least 8 characters.</FieldDescription>
            <FieldError v-if="errors.length" :errors="errors" />
          </Field>
        </VeeField>
      </FieldGroup>

      <p v-if="formError" role="alert" class="t-spec mt-6 text-rust">{{ formError }}</p>

      <Button type="submit" size="lg" class="mt-8 h-14 w-full rounded-pill text-base" :disabled="isSubmitting">
        <template v-if="isSubmitting">{{ isRegister ? 'Creating account…' : 'Signing in…' }}</template>
        <template v-else>{{ isRegister ? 'Create account' : 'Sign in' }}</template>
      </Button>
    </form>
  </div>
</template>