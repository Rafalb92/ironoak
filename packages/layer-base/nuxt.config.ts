import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const currentDir = dirname(fileURLToPath(import.meta.url));
const mediaHosts = (process.env.MEDIA_HOSTS ?? '')
  .split(',')
  .map((host) => host.trim())
  .filter(Boolean);
  
export default defineNuxtConfig({
  // `@` in a layer file means the consuming app to vue-tsc; this alias always means the layer
  alias: { '#layer-base': join(currentDir, './app') },
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
  image: {
    quality: 90,
    // the image module keys an unprefixed `sizes` value to a 1px screen (1w/2w candidates);
    // fluid values start with xs: instead, which also covers everything below sm
    screens: { xs: 400 },
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