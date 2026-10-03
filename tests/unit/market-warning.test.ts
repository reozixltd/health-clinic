import { describe, expect, it } from 'vitest';
import { getMarket } from '@/domain/markets';
import { unverifiedMarketWarning } from '@/domain/markets/warning';

const verified = (id: string) => getMarket(id as 'AU').verified;
const base = { id: 'x', demoMode: false, marketIds: ['CA'] };

describe('unverifiedMarketWarning', () => {
  it('warns for a live site on an unverified pack and lists what to confirm', () => {
    const text = unverifiedMarketWarning(base, verified);
    expect(text).toContain('CASL wording');
    expect(text).toContain('Site "x"');
  });
  it('is null for demo sites and verified packs', () => {
    expect(unverifiedMarketWarning({ ...base, demoMode: true }, verified)).toBeNull();
    expect(unverifiedMarketWarning({ ...base, marketIds: ['AU'] }, verified)).toBeNull();
  });
  it('warns when a secondary market is unverified', () => {
    expect(unverifiedMarketWarning({ ...base, marketIds: ['AU', 'CA'] }, verified)).toContain('CA:');
  });
});
