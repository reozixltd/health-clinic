import { formatMoney } from '@/core/format';
import type { MarketId, MarketPack } from '@/domain/markets';

/** One figure for every market, or one per market where the fees differ. */
export type FromPrice = number | Partial<Record<MarketId, number>>;

/** The lowest fee to quote for this market, when there is one and the market allows a "from" price. */
export function fromPriceFor(service: { fromPrice?: FromPrice }, market: MarketPack): number | undefined {
  if (market.priceDisplay !== 'from-allowed') return undefined;
  return typeof service.fromPrice === 'object' ? service.fromPrice[market.id] : service.fromPrice;
}

/** "From $95" when the service has a from price and the market allows one; otherwise null. */
export function fromPriceLabel(service: { fromPrice?: FromPrice }, market: MarketPack): string | null {
  const price = fromPriceFor(service, market);
  return price === undefined ? null : `From ${formatMoney(price, market.currency, market.locale)}`;
}
