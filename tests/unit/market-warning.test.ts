import { describe, expect, it } from 'vitest';
import { getMarket } from '@/domain/markets';
import { localLeadStoreWarning, unverifiedMarketWarning } from '@/domain/markets/warning';

const verified = (id: string) => getMarket(id as 'AU');
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
  it('uses the checklist carried by the pack and falls back for an unknown market', () => {
    const custom = (id: string) => (id === 'ZZ' ? { verified: false, checklist: ['local rule X'] } : undefined);
    expect(unverifiedMarketWarning({ ...base, marketIds: ['ZZ'] }, custom)).toContain('ZZ: confirm local rule X');
    expect(unverifiedMarketWarning({ ...base, marketIds: ['QQ'] }, custom)).toContain('QQ: confirm the market rules');
  });
  it('warns when a secondary market is unverified', () => {
    expect(unverifiedMarketWarning({ ...base, marketIds: ['AU', 'CA'] }, verified)).toContain('CA:');
  });
});

describe('localLeadStoreWarning', () => {
  const live = { id: 'x', demoMode: false, leadStore: 'local' };
  it('warns for a live site that keeps leads in the browser', () => {
    const text = localLeadStoreWarning(live);
    expect(text).toContain('Site "x"');
    expect(text).toContain('HttpLeadRepository');
  });
  it('is null for demo sites and for a real store', () => {
    expect(localLeadStoreWarning({ ...live, demoMode: true })).toBeNull();
    expect(localLeadStoreWarning({ ...live, leadStore: 'http' })).toBeNull();
  });
});
