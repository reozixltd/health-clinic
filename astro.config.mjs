// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

const siteId = process.env.SITE || 'fernway-au';

export default defineConfig({
  site: 'https://health.reozix.com',
  trailingSlash: 'always',
  // One content cache per site, so builds for different brands never share a data store.
  cacheDir: `./.cache/astro/${siteId}`,
  // import.meta.env.SITE is Astro's site URL, so the demo site id travels as SITE_ID.
  vite: { define: { 'import.meta.env.SITE_ID': JSON.stringify(siteId) } },
  integrations: [sitemap({ filter: (page) => !page.includes('/console/') && !page.includes('/dev/') })],
});
