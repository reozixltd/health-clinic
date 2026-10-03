// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { unverifiedMarketWarning } from './src/domain/markets/warning.ts';
import { AU } from './src/domain/markets/au.ts';
import { CA } from './src/domain/markets/ca.ts';
import { UK } from './src/domain/markets/uk.ts';
import { site as auSite } from './src/config/sites/fernway-au/site.ts';
import { site as caSite } from './src/config/sites/fernway-ca/site.ts';
import { site as hbSite } from './src/config/sites/hollybank/site.ts';
import { site as fxSite } from './src/config/sites/fixture-minimal/site.ts';

const siteId = process.env.SITE || 'fernway-au';

/** @type {Record<string, { verified: boolean }>} */
const packs = { AU, CA, UK };
/** @type {Record<string, { demoMode: boolean; market: string; markets?: string[] }>} */
const sites = { 'fernway-au': auSite, 'fernway-ca': caSite, hollybank: hbSite, 'fixture-minimal': fxSite };

/** Prints a warning when a live site (demoMode false) uses a market pack that is not verified. */
/** @type {import('astro').AstroIntegration} */
const marketWarning = {
  name: 'market-pack-warning',
  hooks: {
    'astro:build:start': async ({ logger }) => {
      const s = sites[siteId];
      if (!s) return;
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
