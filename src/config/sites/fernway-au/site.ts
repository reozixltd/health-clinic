import type { SiteConfigInput } from '@/domain/presets';

export const site: SiteConfigInput['site'] = {
  id: 'fernway-au',
  url: 'https://health.reozix.com',
  preset: 'allied-health',
  market: 'AU',
  markets: ['AU', 'CA'],
  modules: { referrals: true },
  demoMode: true,
  theme: 'fernway',
  themes: ['fernway', 'harbour'],
  contentDir: 'fernway',
};
