import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://elbai.io',
  output: 'static',
  build: {
    format: 'file'
  }
});
