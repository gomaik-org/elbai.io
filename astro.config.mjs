import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://elbai.io',
  output: 'static',
  build: {
    format: 'file'
  },
  vite: {
    plugins: [tailwindcss()]
  }
});
