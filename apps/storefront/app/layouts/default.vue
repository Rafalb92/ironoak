<template>
  <div class="flex min-h-dvh flex-col bg-canvas text-fg">
    <a
      href="#main"
      class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-pill focus:bg-surface focus:px-5 focus:py-2.5 focus:font-data focus:text-sm"
    >
      Skip to content
    </a>

    <SiteHeader />

    <main id="main" class="mx-auto w-full min-w-0 max-w-site flex-1 px-4 py-10 md:px-6">
      <slot />
    </main>

    <footer class="border-t border-line">
      <div class="mx-auto flex max-w-site items-center justify-between px-4 py-8 md:px-6">
        <span class="t-wordmark">IRONOAK</span>
        <span class="t-spec text-fg-muted">© {{ new Date().getFullYear() }} — fictional store, real architecture</span>
      </div>
    </footer>
  </div>
</template>