import { formatMoney } from '@/core/format';
import type { MarketPack } from '@/domain/markets';

/** "From $95" when the service has a from price and the market allows one; otherwise null. */
export function fromPriceLabel(service: { fromPrice?: number }, market: MarketPack): string | null {
  if (service.fromPrice === undefined || market.priceDisplay !== 'from-allowed') return null;
  return `From ${formatMoney(service.fromPrice, market.currency, market.locale)}`;
}
