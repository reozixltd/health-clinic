import type { MarketPack } from '@/domain/markets';

export interface Review {
  name: string;
  date: string;
  rating: number;
  source: string;
  text: string;
  /** Where the reviewer lives, already picked for the market. */
  suburb?: string;
  /** The service they came for, as its display title. */
  service?: string;
  avatarSlot?: string;
}

/** AU shows a link to Google reviews only; CA and UK show named, dated reviews. */
export function reviewMode(market: MarketPack): 'link-only' | 'display' {
  return market.reviews;
}

/** True where a market may show star ratings and quotes. Every rating on the site sits behind this. */
export function showsRatings(market: MarketPack): boolean {
  return market.reviews === 'display';
}

/** Newest first, at most `limit`. */
export function latestReviews<T extends { date: string }>(items: T[], limit = 3): T[] {
  return [...items].sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit);
}

/** A reviews band is worth showing when reviews are displayed and there are some, or when a Google profile link exists. */
export function hasReviewContent(mode: 'link-only' | 'display', count: number, googleUrl?: string): boolean {
  return mode === 'display' ? count > 0 : Boolean(googleUrl);
}
