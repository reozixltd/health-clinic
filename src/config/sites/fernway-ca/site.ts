import type { SiteConfigInput } from '@/domain/presets';

export const site: SiteConfigInput['site'] = {
  id: 'fernway-ca',
  url: 'https://health.reozix.com',
  preset: 'allied-health',
  market: 'CA',
  markets: ['AU', 'CA'],
  modules: { referrals: true },
  demoMode: true,
  theme: 'fernway',
  themes: ['fernway', 'harbour'],
  contentDir: 'fernway',
};
