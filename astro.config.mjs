// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { unverifiedMarketWarning } from './src/domain/markets/warning.ts';
import { AU } from './src/domain/markets/au.ts';
import { CA } from './src/domain/markets/ca.ts';
import { UK } from './src/domain/markets/uk.ts';
import { fixtures, registry } from './src/config/registry.ts';

const siteId = process.env.SITE || 'fernway-au';
if (!(siteId in registry) && !(siteId in fixtures)) {
  throw new Error(`Unknown SITE "${siteId}". Register it in src/config/registry.ts. Known sites: ${[...Object.keys(registry), ...Object.keys(fixtures)].join(', ')}`);
}

/** @type {Record<string, { verified: boolean }>} */
const packs = { AU, CA, UK };

/** Prints a warning when a live site (demoMode false) uses a market pack that is not verified. */
/** @type {import('astro').AstroIntegration} */
const marketWarning = {
  name: 'market-pack-warning',
  hooks: {
    'astro:build:start': async ({ logger }) => {
      const s = (registry[siteId] ?? fixtures[siteId]).site;
      const text = unverifiedMarketWarning({ id: siteId, demoMode: s.demoMode, marketIds: [s.market, ...(s.markets ?? [])] }, (id) => packs[id]?.verified === true);
      if (text) logger.warn(text);
    },
  },
};

export default defineConfig({
  site: 'https://health.reozix.com',
  trailingSlash: 'always',
  // One content cache per site, so builds for different brands never share a data store.
  cacheDir: `./.cache/astro/${siteId}`,
  // import.meta.env.SITE is Astro's site URL, so the demo site id travels as SITE_ID.
  vite: { define: { 'import.meta.env.SITE_ID': JSON.stringify(siteId) } },
  integrations: [marketWarning, sitemap({ filter: (page) => !page.includes('/console/') && !page.includes('/dev/') })],
});
