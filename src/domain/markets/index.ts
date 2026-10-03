import { resolveOverride, type OverrideInput as ThemeOverrideInput } from '@/core/theme';
import { AU } from './au';
import { CA } from './ca';
import { UK } from './uk';

export type MarketId = 'AU' | 'CA' | 'UK';
export type FundingKey = 'fund' | 'medicare' | 'extended' | 'direct';

export interface MarketPack {
  id: MarketId;
  locale: 'en-AU' | 'en-CA' | 'en-GB';
  currency: 'AUD' | 'CAD' | 'GBP';
  taxNote: string;
  testimonials: 'banned' | 'allowed';
  reviews: 'link-only' | 'display';
  priceDisplay: 'from-allowed' | 'list-required';
  consent: { sms: string; email: string; law: string };
  legalIdLabel: 'ABN' | 'BN' | 'Company number';
  identifiers: { label: string; pattern: RegExp };
  phone: { pattern: RegExp; href: (p: string) => string };
  postcode: { label: 'Postcode' | 'Postal code'; pattern: RegExp };
  requiredPages: string[];
  verified: boolean;
  fundingLabels: Partial<Record<FundingKey, string>>;
}

const PACKS: Record<MarketId, MarketPack> = { AU, CA, UK };

export function getMarket(id: MarketId): MarketPack {
  return PACKS[id];
}

type OverrideInput = Omit<ThemeOverrideInput, 'configured' | 'allowed'> & {
  configured: MarketId;
  allowed: MarketId[];
};

/** Typed wrapper over the shared override rule in core/theme. */
export function resolveMarketOverride(i: OverrideInput): MarketId {
  return resolveOverride(i) as MarketId;
}
