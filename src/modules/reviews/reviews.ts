import type { MarketPack } from '@/domain/markets';

export interface Review {
  name: string;
  date: string;
  rating: number;
  source: string;
  text: string;
}

/** AU shows a link to Google reviews only; CA and UK show named, dated reviews. */
export function reviewMode(market: MarketPack): 'link-only' | 'display' {
  return market.reviews;
}

/** Newest first, at most `limit`. */
export function latestReviews<T extends { date: string }>(items: T[], limit = 3): T[] {
  return [...items].sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit);
}
