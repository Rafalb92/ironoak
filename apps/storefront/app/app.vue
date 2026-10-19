<template>
  <NuxtLayout>
    <NuxtLoadingIndicator color="var(--color-fg)" :height="2" :throttle="150" />
    <NuxtRouteAnnouncer />
    <NuxtPage />
  </NuxtLayout>
</template>
