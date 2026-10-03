import type { SiteConfigInput } from '@/domain/presets';

export const site: SiteConfigInput['site'] = {
  id: 'hollybank',
  url: 'https://health.reozix.com',
  preset: 'vet',
  market: 'UK',
  demoMode: true,
  theme: 'harbour',
  themes: ['harbour', 'fernway'],
  contentDir: 'hollybank',
};
