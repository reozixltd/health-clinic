import { describe, expect, it } from 'vitest';
import { resolveSite, type SiteConfigInput } from '@/domain/presets';
import { routesFor } from '@/domain/modules';
import { resolveMarketOverride } from '@/domain/markets';
import { alliedHealth } from '@/presets/allied-health';
import { vet } from '@/presets/vet';
import type { MessageTemplate } from '@/domain/types';

const presets = { 'allied-health': alliedHealth, vet };

function config(preset: 'allied-health' | 'vet', modules?: SiteConfigInput['site']['modules']): SiteConfigInput {
  return {
    site: { id: 't', preset, market: 'AU', modules, demoMode: false, theme: 'clean', contentDir: 'fernway' },
    clinic: {
      name: 'T', legalName: 'T Pty', legalId: '0', phone: '1', email: 'a@b.c',
      address: { street: '1 A St', locality: 'B', region: 'VIC', postcode: '3000', country: 'AU' },
      timeZone: 'Australia/Melbourne', hours: [], emergency: { text: 'x' }, map: { lat: 0, lng: 0 },
    },
    booking: { provider: 'none', windows: [], leadDays: 1, horizonDays: 30, daysOff: [0], confirmPromise: 'x' },
  };
}

describe('resolveSite', () => {
  it('applies preset defaults', () => {
    const site = resolveSite(config('allied-health'), presets);
    expect(site.modules).toContain('fees');
    expect(site.modules).not.toContain('price-list');
    expect(site.market.id).toBe('AU');
    expect(site.markets).toEqual(['AU']);
  });
  it('overrides switch modules', () => {
    const site = resolveSite(config('allied-health', { referrals: false }), presets);
    expect(site.modules).not.toContain('referrals');
    expect(routesFor(site)).not.toContain('/referrers/');
    expect(site.preset.nav.some((n) => n.href === '/referrers/')).toBe(false);
    expect(resolveSite(config('allied-health'), presets).preset.nav.some((n) => n.href === '/referrers/')).toBe(true);
  });
  it('unknown module throws', () => {
    expect(() => resolveSite(config('vet', { nope: true } as never), presets)).toThrow('Unknown module: nope');
  });
  it('estimates without price-list throws', () => {
    expect(() => resolveSite(config('vet', { 'price-list': false }), presets)).toThrow('estimates requires price-list');
  });
  it('routesFor vet includes prices, estimates, ownership, out-of-hours and not fees', () => {
    const routes = routesFor(resolveSite(config('vet'), presets));
    expect(routes).toEqual(expect.arrayContaining(['/prices/', '/estimates/', '/ownership/', '/out-of-hours/']));
    expect(routes).not.toContain('/fees/');
    expect(routesFor(resolveSite(config('allied-health'), presets))).not.toContain('/out-of-hours/');
  });
  it('messages fall back to preset', () => {
    expect(resolveSite(config('vet'), presets).messages).toBe(vet.messages);
    const own: MessageTemplate[] = [{
      id: 'confirmation', channel: 'sms', marketing: false, appliesTo: 'appointment',
      trigger: { on: 'created', offsetHours: 0 }, body: 'hi',
    }];
    expect(resolveSite({ ...config('vet'), messages: own }, presets).messages).toBe(own);
  });
});

describe('resolveMarketOverride', () => {
  const base = { param: 'UK', stored: null, configured: 'AU' as const, allowed: ['AU' as const, 'UK' as const] };
  it('wraps the shared rule', () => {
    expect(resolveMarketOverride({ ...base, demoMode: true })).toBe('UK');
    expect(resolveMarketOverride({ ...base, demoMode: false })).toBe('AU');
  });
});
