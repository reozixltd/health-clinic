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
  /** `dial` is the country code without +, `trunk` the national prefix dropped in international form, `example` the hint in form errors. */
  phone: { pattern: RegExp; dial: string; trunk: string; example: string };
  postcode: { label: 'Postcode' | 'Postal code'; pattern: RegExp };
  requiredPages: string[];
  verified: boolean;
  /** What local counsel confirms before a live site uses this pack (printed by the build warning). */
  checklist: string[];
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
