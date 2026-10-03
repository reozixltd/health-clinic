import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/styles/tokens.css', 'utf8');

function theme(name: string): Record<string, string> {
  const m = css.match(new RegExp(`\\[data-theme='${name}'\\]\\s*\\{([^}]*)\\}`));
  if (!m) throw new Error(`theme ${name} missing`);
  return Object.fromEntries([...m[1].matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\b/g)].map((x) => [x[1], x[2]]));
}
function lum(hex: string): number {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function contrast(a: string, b: string): number {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const pairs: [string, string, number][] = [
  ['ink', 'paper', 4.5], ['ink-muted', 'paper', 4.5], ['ink', 'card', 4.5], ['ink', 'accent', 4.5],
  ['on-ink', 'ink', 4.5], ['field-border', 'surface', 3], ['focus', 'paper', 3],
];

describe('tokens meet AA in both themes', () => {
  for (const name of ['fernway', 'harbour']) {
    const t = theme(name);
    for (const [fg, bg, min] of pairs) {
      it(`${name}: ${fg} on ${bg} >= ${min}`, () => {
        expect(t['color-' + fg], `--color-${fg}`).toBeTruthy();
        expect(t['color-' + bg], `--color-${bg}`).toBeTruthy();
        expect(contrast(t['color-' + fg], t['color-' + bg])).toBeGreaterThanOrEqual(min);
      });
    }
  }
});
