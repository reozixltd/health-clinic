import type { SiteConfigInput } from '@/domain/presets';

/** Test fixture: a live site (demoMode false) at its own url, with reviews on but no Google profile link. Shares the fixture-minimal content. */
export const site: SiteConfigInput['site'] = {
  id: 'fixture-live',
  url: 'https://clinic.example',
  preset: 'allied-health',
  market: 'AU',
  // Declared on purpose: a live site must still show only its own market.
  markets: ['AU', 'CA'],
  modules: { fees: false, referrals: false },
  demoMode: false,
  theme: 'fernway',
  themes: ['fernway'],
  contentDir: 'fixture-minimal',
};
