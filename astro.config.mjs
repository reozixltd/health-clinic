// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { localLeadStoreWarning, unverifiedMarketWarning } from './src/domain/markets/warning.ts';
import { AU } from './src/domain/markets/au.ts';
import { CA } from './src/domain/markets/ca.ts';
import { UK } from './src/domain/markets/uk.ts';
import { LEAD_STORE } from './src/core/leads/store.ts';
import { fixtures, registry } from './src/config/registry.ts';

const siteId = process.env.SITE || 'fernway-au';
const input = registry[siteId] ?? fixtures[siteId];
if (!input) {
  throw new Error(`Unknown SITE "${siteId}". Register it in src/config/registry.ts. Known sites: ${[...Object.keys(registry), ...Object.keys(fixtures)].join(', ')}`);
}

/** @type {Record<string, { verified: boolean, checklist: string[] }>} */
const packs = { AU, CA, UK };

/** Prints warnings when a live site (demoMode false) uses an unverified market pack or the browser-only lead store. */
/** @type {import('astro').AstroIntegration} */
const marketWarning = {
  name: 'market-pack-warning',
  hooks: {
    'astro:build:start': async ({ logger }) => {
      const s = input.site;
      const market = unverifiedMarketWarning({ id: siteId, demoMode: s.demoMode, marketIds: [s.market] }, (id) => packs[id]);
      if (market) logger.warn(market);
      const leads = localLeadStoreWarning({ id: siteId, demoMode: s.demoMode, leadStore: LEAD_STORE });
      if (leads) logger.warn(leads);
    },
  },
};

export default defineConfig({
  // Each clinic sets its own origin in site.ts (`url`): canonical links, sitemap, og:url and JSON-LD all follow it.
  site: input.site.url,
  trailingSlash: 'always',
  // One content cache per site, so builds for different brands never share a data store.
  cacheDir: `./.cache/astro/${siteId}`,
  // import.meta.env.SITE is Astro's site URL, so the demo site id travels as SITE_ID.
  vite: { define: { 'import.meta.env.SITE_ID': JSON.stringify(siteId) } },
  integrations: [marketWarning, sitemap({ filter: (page) => !page.includes('/console/') && !page.includes('/dev/') })],
});
