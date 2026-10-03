import { formatMoney } from '@/core/format';
import type { MarketId, MarketPack } from '@/domain/markets';
import type { Fee } from '@/domain/types';

export interface FeeRow {
  service: string;
  label: string;
  price: string;
  notes: string[];
}

/** Fee rows for one market: fees without an amount there are left out; notes come from the pack's funding labels. */
export function fundingRows(fees: Fee[], marketId: MarketId, pack: MarketPack): FeeRow[] {
  return fees.flatMap((fee) => {
    const amount = fee.amount[marketId];
    if (amount === undefined) return [];
    const notes = fee.funding.flatMap((key) => pack.fundingLabels[key] ?? []);
    return [{ service: fee.service, label: fee.label, price: formatMoney(amount, pack.currency, pack.locale), notes }];
  });
}

/** Group consecutive rows by service, keeping the order of first appearance. */
export function groupByService(rows: FeeRow[]): { service: string; rows: FeeRow[] }[] {
  const groups: { service: string; rows: FeeRow[] }[] = [];
  for (const row of rows) {
    const g = groups.find((x) => x.service === row.service);
    if (g) g.rows.push(row);
    else groups.push({ service: row.service, rows: [row] });
  }
  return groups;
}
