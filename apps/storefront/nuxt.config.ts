export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  extends: ['@ironoak/layer-base'],
  devServer: { port: 3002 },
  components: [{ path: '~/components', pathPrefix: false }],
  css: ['~/assets/css/storefront.css'],

  routeRules: {
    '/': { isr: 3600 },
    '/products': { isr: 600 },
    '/products/**': { isr: 600 },
    '/cart': { ssr: false },
    '/checkout/**': { ssr: false },
    '/account/**': { ssr: false },
    '/login': { ssr: false },
  },

  app: {
    head: {
      // storefront jest jasny; panel admina zostaje przy domyślnym ciemnym motywie
      htmlAttrs: { lang: 'en', 'data-theme': 'light' },
      titleTemplate: '%s — IRONOAK',
    },
    pageTransition: { name: 'page', mode: 'out-in' },
  },

  modules: ['@nuxt/image'],
});