import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const currentDir = dirname(fileURLToPath(import.meta.url));

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  modules: ['shadcn-nuxt', '@pinia/nuxt', '@pinia/colada-nuxt', '@nuxt/image'],
  runtimeConfig: {
    public: {
      apiBase: process.env.API_BASE || 'http://localhost:3000',
    },
  },
  pinia: {
    storesDirs: [join(currentDir, './app/stores')],
  },
  
  css: [join(currentDir, './app/assets/css/tailwind.css')],
  vite: {
    plugins: [tailwindcss()],
  },
  shadcn: {
    /**
     * Prefix for all the imported component.
     * @default "Ui"
     */
    prefix: '',
    /**
     * Directory that the component lives in.
     * Will respect the Nuxt aliases.
     * @link https://nuxt.com/docs/api/nuxt-config#alias
     * @default "@/components/ui"
     */
    componentDir: join(currentDir, './app/components/ui'),
  },

});