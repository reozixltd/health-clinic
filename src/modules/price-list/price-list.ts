import type { PriceItem } from '@/domain/types';

/** Groups in the order they first appear, items in content order. */
export function groupPrices(items: PriceItem[]): { group: string; items: PriceItem[] }[] {
  const groups: { group: string; items: PriceItem[] }[] = [];
  for (const item of items) {
    const found = groups.find((g) => g.group === item.group);
    if (found) found.items.push(item);
    else groups.push({ group: item.group, items: [item] });
  }
  return groups;
}

const DAY_MS = 86_400_000;

/** True when the review date ("YYYY-MM-DD") is more than `maxDays` before `today`. */
export function isStale(reviewedAt: string, today: string, maxDays = 180): boolean {
  const days = (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${reviewedAt}T00:00:00Z`)) / DAY_MS;
  return days > maxDays;
}

/** "Included" for a zero amount, otherwise the amount, plus " for <unit>" when there is one. */
export function priceText(item: PriceItem, money: (n: number) => string): string {
  if (item.amount === 0) return 'Included';
  return item.unit ? `${money(item.amount)} for ${item.unit}` : money(item.amount);
}
