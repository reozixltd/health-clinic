import type { MarketPack } from './index';
import { CONSENT } from './consent';

export const AU: MarketPack = {
  id: 'AU',
  locale: 'en-AU',
  currency: 'AUD',
  taxNote: 'GST included where it applies',
  testimonials: 'banned',
  reviews: 'link-only',
  priceDisplay: 'from-allowed',
  consent: { ...CONSENT, law: 'Spam Act 2003' },
  legalIdLabel: 'ABN',
  identifiers: { label: 'ABN', pattern: /^\d{2} ?\d{3} ?\d{3} ?\d{3}$/ },
  phone: { pattern: /^(\+61|0)[2-478]\d{8}$/, href: (p) => `tel:${p.replace(/[\s-]/g, '')}` },
  postcode: { label: 'Postcode', pattern: /^\d{4}$/ },
  requiredPages: ['/privacy/', '/accessibility/', '/terms/'],
  verified: true,
  fundingLabels: {
    fund: 'Private health fund rebate may apply',
    medicare: 'Medicare rebate with an eligible GP referral',
  },
};
