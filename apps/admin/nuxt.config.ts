
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  extends: ['@ironoak/layer-base', '@ironoak/layer-admin'],

  // panel admina — brak potrzeby SSR, wszystko za auth
  ssr: false,
  

  devServer: { port: 3001 },
  css: ['~/assets/css/main.css'],
});