import type { SiteConfigInput } from '@/domain/presets';

/** Test fixture: as fixture-minimal, with booking off too. Built only with SITE=fixture-no-booking. */
export const site: SiteConfigInput['site'] = {
  id: 'fixture-no-booking',
  url: 'https://health.reozix.com',
  preset: 'allied-health',
  market: 'AU',
  markets: ['AU'],
  modules: { booking: false, fees: false, referrals: false, reviews: false },
  demoMode: true,
  theme: 'fernway',
  themes: ['fernway'],
  contentDir: 'fixture-no-booking',
};
