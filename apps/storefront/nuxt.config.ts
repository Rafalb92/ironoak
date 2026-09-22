export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  extends: ['@ironoak/layer-base'],

  devServer: { port: 3002 },
  modules: ['@pinia/nuxt','@pinia/colada-nuxt'],
  components: [{ path: '~/components', pathPrefix: false }],

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
      htmlAttrs: { lang: 'en' },
      titleTemplate: '%s — IRONOAK',
    },
  },
});
