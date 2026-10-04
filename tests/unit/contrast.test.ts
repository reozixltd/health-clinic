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
function declaredColors(name: string): string[] {
  return [...themeBlock(name).matchAll(/--([\w-]+)\s*:/g)].map((x) => x[1]).filter((n) => n.startsWith('color-'));
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
 * Pairs that must clear AA for normal text. A fourth element, when present, restricts the pair
 * to that one theme; the rest apply to every theme.
 *
 * field-border is checked against surface rather than paper because surface is the darker of the
 * two surfaces a field can sit on, so it is the stricter case and clearing it clears paper too.
 *
 * primary on surface is scoped to harbour, where it measures 7.06:1 and may carry text. Fernway's
 * primary is too dark on that panel at 4.46:1, so it is pinned as an exception below instead.
 */
const pairs: [string, string, number, string?][] = [
  ['ink', 'paper', 4.5], ['ink-muted', 'paper', 4.5], ['ink', 'card', 4.5], ['ink', 'accent', 4.5],
  ['on-ink', 'ink', 4.5], ['field-border', 'surface', 3], ['focus', 'paper', 3],
  ['ink', 'surface', 4.5], ['ink-muted', 'surface', 4.5],
  ['primary', 'card', 4.5], ['on-ink', 'primary', 4.5], ['on-ink', 'primary-text', 4.5],
  ['primary-text', 'card', 4.5], ['primary-text', 'surface', 4.5], ['primary-text', 'paper', 4.5],
  ['primary', 'surface', 4.5, 'harbour'],
];

/**
 * Combinations that must not carry normal-sized text, with their measured ratio pinned.
 *
 * Every row here is genuinely below AA, so the title's claim holds for each one. The values are
 * recorded per theme because the two palettes differ: fernway's primary is far darker than
 * harbour's, so the same token pair measures very differently. Each ratio must stay within 0.05
 * of the number below, so changing either colour fails loudly and forces a conscious decision
 * rather than a silent drift.
 */
const exceptions: Record<string, [string, string, number][]> = {
  fernway: [
    ['primary', 'surface', 4.4587],
    ['ink', 'primary', 3.2929],
    ['ink-muted', 'primary', 1.8003],
  ],
  harbour: [
    ['ink', 'primary', 1.8544],
    ['ink-muted', 'primary', 1.1628],
  ],
};

describe('tokens meet AA in both themes', () => {
  for (const name of ['fernway', 'harbour']) {
    const t = theme(name);
    for (const [fg, bg, min, only] of pairs) {
      if (only && only !== name) continue;
      it(`${name}: ${fg} on ${bg} >= ${min}`, () => {
        expect(t['color-' + fg], `--color-${fg}`).toBeTruthy();
        expect(t['color-' + bg], `--color-${bg}`).toBeTruthy();
        const got = contrast(t['color-' + fg], t['color-' + bg]);
        expect(got, `${name}: --color-${fg} ${t['color-' + fg]} on --color-${bg} ${t['color-' + bg]} = ${got.toFixed(2)}:1, needs ${min}:1`).toBeGreaterThanOrEqual(min);
      });
    }
  }
});

describe('pinned below-AA combinations that must not drift', () => {
  for (const name of ['fernway', 'harbour']) {
    const t = theme(name);
    for (const [fg, bg, pinned] of exceptions[name]) {
      it(`${name}: ${fg} on ${bg} must not carry normal text (pinned ${pinned.toFixed(2)}:1)`, () => {
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

describe('focus tracks primary in both themes', () => {
  for (const name of ['fernway', 'harbour']) {
    it(`${name}: --color-focus equals --color-primary`, () => {
      const t = theme(name);
      expect(
        t['color-focus'],
        `${name}: --color-focus ${t['color-focus']} must equal --color-primary ${t['color-primary']}. Focus tracks primary; change both together.`
      ).toBe(t['color-primary']);
    });
  }
});

describe('both themes declare the same colour tokens', () => {
  it('fernway and harbour declare an identical set of --color-* names', () => {
    const fernway = [...declaredColors('fernway')].sort();
    const harbour = [...declaredColors('harbour')].sort();
    expect(
      harbour,
      `harbour does not declare every colour token fernway does. A token declared in one theme only is invalid-at-computed-value-time in the other, so its components silently lose their colour. Missing from harbour: ${fernway.filter((n) => !harbour.includes(n)).join(', ') || '(none)'}. Not in fernway: ${harbour.filter((n) => !fernway.includes(n)).join(', ') || '(none)'}`
    ).toEqual(fernway);
  });
});

describe('every colour token is readable and unique in both themes', () => {
  for (const name of ['fernway', 'harbour']) {
    it(`${name}: declared colour tokens match the parsed set exactly`, () => {
      const decl = declaredColors(name);
      const parsed = Object.keys(theme(name)).filter((n) => n.startsWith('color-'));
      expect(new Set(decl).size, `${name}: duplicate colour declaration, last one silently wins`).toBe(decl.length);
      expect(
        [...decl].sort(),
        `${name}: a --color-* token was dropped by the parser. Only 6-digit hex is recognised; a colour written as rgba(), 3/4/8-digit hex or a named colour is not, and would otherwise escape contrast testing silently. Non-colour tokens such as shadows and hairlines are deliberately out of scope.`
      ).toEqual([...parsed].sort());
    });
  }
});
