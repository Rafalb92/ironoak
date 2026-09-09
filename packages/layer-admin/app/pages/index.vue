<template>
  <div class="flex min-h-screen items-center justify-center bg-background">
    <h1 class="text-4xl font-bold">Welcome to the Admin Panel</h1>
    <Button @click="useAuthStore().logout()">Sign out</Button>
  </div>
</template>