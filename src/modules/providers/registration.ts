import type { MarketId } from '@/domain/markets';

interface Registration { body: string; number: string }

/** Registration shown for a market: the market's own body when the provider has one, else the main registration. */
export function registrationFor(
  provider: { registration: Registration & { byMarket?: Partial<Record<MarketId, Registration>> } },
  marketId: MarketId,
): Registration {
  const { body, number, byMarket } = provider.registration;
  return byMarket?.[marketId] ?? { body, number };
}

/** "Dr Elena Marsh" → "Elena". */
export function firstName(name: string): string {
  return name.replace(/^(dr|mr|mrs|ms|prof)\.?\s+/i, '').split(/\s+/)[0];
}
