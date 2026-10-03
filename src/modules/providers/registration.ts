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

/** "Dr Elena Marsh" → "EM"; a one-word name gives one letter; an empty name gives "". */
export function initials(name: string): string {
  const words = name.trim().replace(/^(dr|mr|mrs|ms|prof)\.?\s+/i, '').split(/\s+/).filter(Boolean);
  const picked = words.length > 1 ? [words[0]!, words[words.length - 1]!] : words;
  return picked.map((w) => [...w][0]!.toLocaleUpperCase()).join('');
}
