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

interface OverrideInput {
  param: string | null;
  stored: string | null;
  configured: MarketId;
  allowed: MarketId[];
  demoMode: boolean;
}

// Same rule as core/theme resolveOverride, typed to MarketId (merge: wrap it).
export function resolveMarketOverride(i: OverrideInput): MarketId {
  const ok = (v: string | null): v is MarketId => !!v && (i.allowed as string[]).includes(v);
  if (i.demoMode && ok(i.param)) return i.param;
  if (i.demoMode && ok(i.stored)) return i.stored;
  return i.configured;
}
