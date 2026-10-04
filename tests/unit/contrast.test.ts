import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/styles/tokens.css', 'utf8');

function themeBlock(name: string): string {
  const m = css.match(new RegExp(`\\[data-theme='${name}'\\]\\s*\\{([^}]*)\\}`));
  if (!m) throw new Error(`theme ${name} missing`);
  return m[1];
}
function theme(name: string): Record<string, string> {
  return Object.fromEntries([...themeBlock(name).matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\b/g)].map((x) => [x[1], x[2]]));
}
function declared(name: string): string[] {
  return [...themeBlock(name).matchAll(/--([\w-]+)\s*:/g)].map((x) => x[1]);
}
function lum(hex: string): number {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function contrast(a: string, b: string): number {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/*
 * Pairs that must clear AA for normal text.
 *
 * field-border is checked against surface rather than paper because surface is the darker of
 * the two surfaces a field can sit on, so it is the stricter case. docs/design-system.md
 * currently describes this as "at least 3:1 against the page"; that wording is wrong and is
 * being corrected separately.
 */
const pairs: [string, string, number][] = [
  ['ink', 'paper', 4.5], ['ink-muted', 'paper', 4.5], ['ink', 'card', 4.5], ['ink', 'accent', 4.5],
  ['on-ink', 'ink', 4.5], ['field-border', 'surface', 3], ['focus', 'paper', 3],
  ['ink', 'surface', 4.5], ['ink-muted', 'surface', 4.5],
  ['primary', 'card', 4.5], ['on-ink', 'primary', 4.5], ['on-ink', 'primary-text', 4.5],
  ['primary-text', 'card', 4.5], ['primary-text', 'surface', 4.5], ['primary-text', 'paper', 4.5],
];

/**
 * Combinations that must never carry normal-sized text, with their measured ratio pinned.
 *
 * The values are recorded per theme because the two themes' palettes genuinely differ: fernway's
 * primary is far darker than harbour's, so the same token pair measures very differently. Each
 * ratio must stay within 0.05 of the number below, so darkening or lightening either colour
 * fails loudly and forces a conscious decision rather than a silent drift.
 *
 * These are not all failures -- harbour's primary on surface clears AA at 7.06:1 -- but every one
 * of them is pinned so that any future change to a primary is an explicit table edit.
 */
const exceptions: Record<string, [string, string, number][]> = {
  fernway: [
    ['primary', 'surface', 4.4587],
    ['ink', 'primary', 3.2929],
    ['ink-muted', 'primary', 1.8003],
    ['focus', 'primary', 1],
  ],
  harbour: [
    ['primary', 'surface', 7.061],
    ['ink', 'primary', 1.8544],
    ['ink-muted', 'primary', 1.1628],
    ['focus', 'primary', 1],
  ],
};

describe('tokens meet AA in both themes', () => {
  for (const name of ['fernway', 'harbour']) {
    const t = theme(name);
    for (const [fg, bg, min] of pairs) {
      it(`${name}: ${fg} on ${bg} >= ${min}`, () => {
        expect(t['color-' + fg], `--color-${fg}`).toBeTruthy();
        expect(t['color-' + bg], `--color-${bg}`).toBeTruthy();
        const got = contrast(t['color-' + fg], t['color-' + bg]);
        expect(got, `${name}: --color-${fg} ${t['color-' + fg]} on --color-${bg} ${t['color-' + bg]} = ${got.toFixed(2)}:1, needs ${min}:1`).toBeGreaterThanOrEqual(min);
      });
    }
  }
});

describe('below-AA combinations are pinned so they cannot drift', () => {
  for (const name of ['fernway', 'harbour']) {
    const t = theme(name);
    for (const [fg, bg, pinned] of exceptions[name]) {
      it(`${name}: ${fg} on ${bg} must never carry normal text (pinned ${pinned.toFixed(2)}:1)`, () => {
        expect(t['color-' + fg], `--color-${fg}`).toBeTruthy();
        expect(t['color-' + bg], `--color-${bg}`).toBeTruthy();
        const got = contrast(t['color-' + fg], t['color-' + bg]);
        expect(
          Math.abs(got - pinned),
          `${name}: --color-${fg} ${t['color-' + fg]} on --color-${bg} ${t['color-' + bg]} measured ${got.toFixed(2)}:1 but the exceptions table pins ${pinned.toFixed(2)}:1. Either the palette changed or the table is stale; update it deliberately.`
        ).toBeLessThanOrEqual(0.05);
      });
    }
  }
});

describe('every declared token is readable and unique in both themes', () => {
  for (const name of ['fernway', 'harbour']) {
    it(`${name}: declared tokens match the parsed set exactly`, () => {
      const decl = declared(name);
      const parsed = Object.keys(theme(name));
      expect(new Set(decl).size, `${name}: duplicate declaration, last one silently wins`).toBe(decl.length);
      expect(
        [...decl].sort(),
        `${name}: a declared token was dropped by the parser. Only 6-digit hex is recognised; rgba(), 3/4/8-digit hex and named colours are not, and will vanish here silently.`
      ).toEqual([...parsed].sort());
    });
  }
});