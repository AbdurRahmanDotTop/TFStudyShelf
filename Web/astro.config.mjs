import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  adapter: cloudflare(),
  server: {
    port: 3000
  },
  build: {
    format: 'directory' // Outputs index.html instead of page.html
  }
});
