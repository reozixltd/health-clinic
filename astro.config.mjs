// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://health.reozix.com',
  trailingSlash: 'always',
  integrations: [sitemap({ filter: (page) => !page.includes('/console/') && !page.includes('/dev/') })],
});
