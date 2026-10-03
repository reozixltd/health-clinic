import type { SiteConfigInput } from '@/domain/presets';

/** Test fixture: allied-health with the optional modules off. Built only with SITE=fixture-minimal. */
export const site: SiteConfigInput['site'] = {
  id: 'fixture-minimal',
  preset: 'allied-health',
  market: 'AU',
  markets: ['AU'],
  modules: { fees: false, referrals: false, reviews: false },
  demoMode: true,
  theme: 'fernway',
  themes: ['fernway'],
  contentDir: 'fixture-minimal',
};
