import { describe, expect, it } from 'vitest';
import { resolveOverride } from '@/core/theme';

const allowed = ['fernway', 'harbour'];
describe('resolveOverride', () => {
  it('param wins in demo mode', () => {
    expect(resolveOverride({ param: 'harbour', stored: null, configured: 'fernway', allowed, demoMode: true })).toBe('harbour');
  });
  it('stored is used in demo mode when no param', () => {
    expect(resolveOverride({ param: null, stored: 'harbour', configured: 'fernway', allowed, demoMode: true })).toBe('harbour');
  });
  it('is ignored outside demo mode', () => {
    expect(resolveOverride({ param: 'harbour', stored: 'harbour', configured: 'fernway', allowed, demoMode: false })).toBe('fernway');
  });
  it('unknown param falls back', () => {
    expect(resolveOverride({ param: 'nope', stored: null, configured: 'fernway', allowed, demoMode: true })).toBe('fernway');
    expect(resolveOverride({ param: 'nope', stored: 'harbour', configured: 'fernway', allowed, demoMode: true })).toBe('harbour');
  });
});
