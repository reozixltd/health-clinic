import type { MarketPack } from './index';
import { CONSENT } from './consent';

export const UK: MarketPack = {
  id: 'UK',
  locale: 'en-GB',
  currency: 'GBP',
  taxNote: 'Prices include VAT',
  testimonials: 'allowed',
  reviews: 'display',
  priceDisplay: 'list-required',
  consent: { ...CONSENT, law: 'PECR' },
  legalIdLabel: 'Company number',
  identifiers: { label: 'Company number', pattern: /^(\d{8}|[A-Z]{2}\d{6})$/i },
  phone: { pattern: /^(\+44|0)\d{9,10}$/, href: (p) => `tel:${p.replace(/[\s-]/g, '')}` },
  postcode: { label: 'Postcode', pattern: /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i },
  requiredPages: ['/privacy/', '/accessibility/', '/terms/'],
  verified: true,
  fundingLabels: {},
};
