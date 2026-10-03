import { describe, expect, it } from 'vitest';
import { groupPrices, isStale, priceText } from '@/modules/price-list/price-list';

describe('price list', () => {
  it('groupPrices keeps order', () => {
    const items = [
      { group: 'Vaccinations', label: 'a', amount: 1 },
      { group: 'Consultations', label: 'b', amount: 2 },
      { group: 'Vaccinations', label: 'c', amount: 3 },
    ];
    const grouped = groupPrices(items);
    expect(grouped.map((g) => g.group)).toEqual(['Vaccinations', 'Consultations']);
    expect(grouped[0].items.map((i) => i.label)).toEqual(['a', 'c']);
  });

  it('isStale at 181 days', () => {
    expect(isStale('2026-01-01', '2026-06-30')).toBe(false); // exactly 180 days
    expect(isStale('2026-01-01', '2026-07-01')).toBe(true);
  });

  it('priceText shows Included for zero and unit when present', () => {
    const fmt = (n: number) => `£${n}`;
    expect(priceText({ group: 'g', label: 'l', amount: 0 }, fmt)).toBe('Included');
    expect(priceText({ group: 'g', label: 'l', amount: 42, unit: '15 minutes' }, fmt)).toBe('£42 for 15 minutes');
  });
});
