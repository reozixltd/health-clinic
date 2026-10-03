import { describe, expect, it } from 'vitest';
import { getMarket } from '@/domain/markets';
import type { Fee } from '@/domain/types';
import { fundingRows, groupByService } from '@/modules/fees/funding';

const fees: Fee[] = [
  { service: 'physiotherapy', label: 'Follow-up visit', amount: { AU: 95, CA: 95 }, funding: ['fund', 'extended', 'direct'] },
  { service: 'dental-check-up', label: 'Check-up', amount: { AU: 90, CA: 110 }, funding: ['fund', 'medicare', 'extended'] },
  { service: 'au-only', label: 'AU only', amount: { AU: 50 }, funding: [] },
];

describe('fundingRows', () => {
  it('formats per market', () => {
    const au = fundingRows(fees, 'AU', getMarket('AU'));
    expect(au[0]).toEqual({ service: 'physiotherapy', label: 'Follow-up visit', price: '$95', notes: ['Private health fund rebate may apply'] });
    expect(au[1].notes).toEqual(['Private health fund rebate may apply', 'Medicare rebate with an eligible GP referral']);
    const ca = fundingRows(fees, 'CA', getMarket('CA'));
    expect(ca[1]).toMatchObject({ price: '$110', notes: ['Extended health benefits may apply'] });
    expect(ca[0].notes).toEqual(['Extended health benefits may apply', 'Direct billing where offered']);
  });
  it('skips fees with no amount in the market and fractional amounts keep decimals', () => {
    expect(fundingRows(fees, 'CA', getMarket('CA')).map((r) => r.service)).not.toContain('au-only');
    const half: Fee[] = [{ service: 's', label: 'l', amount: { UK: 12.5 }, funding: ['fund'] }];
    expect(fundingRows(half, 'UK', getMarket('UK'))).toEqual([{ service: 's', label: 'l', price: '£12.50', notes: [] }]);
  });
  it('groups rows by service in order', () => {
    const groups = groupByService(fundingRows(fees, 'AU', getMarket('AU')));
    expect(groups.map((g) => g.service)).toEqual(['physiotherapy', 'dental-check-up', 'au-only']);
  });
});
