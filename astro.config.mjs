// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()]
  },

  image: {
    service: {
      entrypoint: "astro/assets/services/noop",
    },
  },

  site: 'https://cinerama-seven.vercel.app',
  integrations: [sitemap()],
});