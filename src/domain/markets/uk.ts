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
  phone: { pattern: /^(\+44|0)\d{9,10}$/, dial: '44', trunk: '0', example: '0113 496 0123' },
  postcode: { label: 'Postcode', pattern: /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i },
  requiredPages: ['/privacy/', '/accessibility/', '/terms/'],
  verified: true,
  checklist: ['PECR wording', 'price display rules', 'the vet module wording'],
  fundingLabels: {},
};
