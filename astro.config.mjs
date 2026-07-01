// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  site: 'https://hydra-web.pages.dev',
  server: {
    port: 4321,
  },
});
