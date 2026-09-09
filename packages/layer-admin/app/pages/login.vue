<script setup lang="ts">
import { loginSchema, type LoginInput } from '@ironoak/contracts';

definePageMeta({ layout: 'blank' });

const auth = useAuthStore();
const route = useRoute();

const form = reactive<LoginInput>({ email: '', password: '' });
const errors = ref<Record<string, string>>({});
const serverError = ref<string | null>(null);
const isSubmitting = ref(false);

async function onSubmit() {
  errors.value = {};
  serverError.value = null;

  const parsed = loginSchema.safeParse(form);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === 'string') errors.value[field] = issue.message;
    }
    return;
  }

  isSubmitting.value = true;
  try {
    await auth.login(parsed.data);
    const redirect = route.query.redirect as string | undefined;
    await navigateTo(redirect ?? '/');
  } catch (error) {
    serverError.value = 'Invalid credentials';
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-background">
    <div class="w-full max-w-sm space-y-6 p-8">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">IRONOAK</h1>
        <p class="text-sm text-muted-foreground">Admin panel</p>
      </div>

      <form class="space-y-4" @submit.prevent="onSubmit">
        <div class="space-y-2">
          <label for="email" class="text-sm font-medium">Email</label>
          <Input id="email" v-model="form.email" type="email" autocomplete="email" />
          <p v-if="errors.email" class="text-sm text-destructive">{{ errors.email }}</p>
        </div>

        <div class="space-y-2">
          <label for="password" class="text-sm font-medium">Password</label>
          <Input id="password" v-model="form.password" type="password" autocomplete="current-password" />
          <p v-if="errors.password" class="text-sm text-destructive">{{ errors.password }}</p>
        </div>

        <p v-if="serverError" class="text-sm text-destructive">{{ serverError }}</p>

        <Button type="submit" class="w-full" :disabled="isSubmitting">
          {{ isSubmitting ? 'Signing in…' : 'Sign in' }}
        </Button>
      </form>
    </div>
  </div>
</template>