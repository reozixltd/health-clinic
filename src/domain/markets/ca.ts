import type { MarketPack } from './index';
import { CONSENT } from './consent';

export const CA: MarketPack = {
  id: 'CA',
  locale: 'en-CA',
  currency: 'CAD',
  taxNote: 'Taxes extra where they apply',
  testimonials: 'allowed',
  reviews: 'display',
  priceDisplay: 'from-allowed',
  consent: { ...CONSENT, law: 'CASL' },
  legalIdLabel: 'BN',
  identifiers: { label: 'BN', pattern: /^\d{9}$/ },
  phone: { pattern: /^(\+1)?\d{10}$/, dial: '1', trunk: '1', example: '613-555-0123' },
  postcode: { label: 'Postal code', pattern: /^[A-Z]\d[A-Z] ?\d[A-Z]\d$/i },
  requiredPages: ['/privacy/', '/accessibility/', '/terms/'],
  verified: false,
  checklist: ['provincial privacy and health information rules', 'college advertising and testimonial rules for Ontario', 'CASL wording', 'AODA wording'],
  fundingLabels: {
    extended: 'Extended health benefits may apply',
    direct: 'Direct billing where offered',
  },
};
