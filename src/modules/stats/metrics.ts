import type { IconName } from '@/core/ui/icons';
import type { MarketPack } from '@/domain/markets';

export interface Metric {
  value: string;
  label: string;
  note: string;
  icon: IconName;
}

export interface Nouns {
  service: string;
  clinician: string;
}

/** The one field a review tile needs. Structural, so a module never imports another module. */
export interface Rated {
  rating: number;
}

/** Mean rating to one decimal place, or '' when there is nothing to average. */
export function formatRating(ratings: number[]): string {
  if (ratings.length === 0) return '';
  const mean = ratings.reduce((a, b) => a + b, 0) / ratings.length;
  return mean.toFixed(1);
}

/**
 * The home page metric tiles, all counted from real content.
 * A rating appears only in a market that already displays review quotes, so AU never
 * shows a number it does not show the reviews behind. Nouns come from the preset, so a
 * vet clinic never reads "Clinicians".
 */
export function clinicMetrics(input: {
  services: number;
  providers: number;
  acceptingNew: number;
  reviews: Rated[];
  market: MarketPack;
  nouns: Nouns;
}): Metric[] {
  const { services, providers, acceptingNew, reviews, market, nouns } = input;
  const showsReviews = market.reviews === 'display';
  const tiles: Metric[] = [
    { value: String(services), label: nouns.service, note: 'Listed in full on this site', icon: 'badge-check' },
    { value: String(providers), label: nouns.clinician, note: 'Named with their registration', icon: 'stethoscope' },
    { value: String(acceptingNew), label: 'Taking new patients', note: 'Marked in the team list below', icon: 'user' },
  ];
  if (showsReviews) {
    const rating = formatRating(reviews.map((r) => r.rating));
    if (rating) tiles.push({ value: rating, label: 'Average review rating', note: `From ${reviews.length} published reviews`, icon: 'star' });
  }
  return tiles;
}

export interface StatTile {
  value: number;
  suffix?: string;
  decimals?: number;
  label: string;
  /** A rating tile. Only ever present for a market that displays reviews. */
  rating?: true;
}

/**
 * The counted stats strip: years open, the first authored figure, clinicians, then the average
 * rating where the market shows ratings (a count of services where it does not), then the rest of
 * the authored figures. Years and head counts are worked out, never typed in.
 */
export function clinicStats(input: {
  founded: number;
  year: number;
  clinicians: number;
  services: number;
  nouns: Nouns;
  rating?: { value: number; count: number };
  showsRatings: boolean;
  authored: { value: number; suffix?: string; label: string }[];
}): StatTile[] {
  const { founded, year, clinicians, services, nouns, rating, showsRatings, authored } = input;
  const fourth: StatTile = showsRatings && rating
    ? { value: rating.value, decimals: 1, label: 'Average Google rating', rating: true }
    : { value: services, label: `${nouns.service} under one roof` };
  return [
    { value: year - founded, label: 'Years caring for this neighbourhood' },
    ...authored.slice(0, 1),
    { value: clinicians, label: `Registered ${nouns.clinician.toLowerCase()}` },
    fourth,
    ...authored.slice(1),
  ];
}
