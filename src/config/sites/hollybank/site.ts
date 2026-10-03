import type { SiteConfigInput } from '@/domain/presets';

export const site: SiteConfigInput['site'] = {
  id: 'hollybank',
  preset: 'vet',
  market: 'UK',
  demoMode: true,
  theme: 'harbour',
  themes: ['harbour', 'fernway'],
  contentDir: 'hollybank',
};
