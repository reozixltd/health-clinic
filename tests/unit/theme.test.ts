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

describe('root font size', () => {
  it('is a percentage, so it follows the visitor\'s browser default', async () => {
    const { readFileSync } = await import('node:fs');
    const tokens = readFileSync('src/styles/tokens.css', 'utf8');
    expect(tokens).toMatch(/--body-size:\s*106\.25%/);
    expect(tokens).not.toMatch(/--body-size:\s*[\d.]+px/);
    expect(readFileSync('src/styles/global.css', 'utf8')).toMatch(/html\s*\{[^}]*font-size:\s*var\(--body-size\)/);
  });
});
