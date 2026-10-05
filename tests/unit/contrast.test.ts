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
  // Card's interactive resting border is --color-field-border (it was --color-line, which measured
  // 1.22-1.26:1 and is not safely decorative when the border is the affordance). A card may sit on
  // --color-paper or --color-card, so both adjacencies need 3:1 (introduced in Task 4 fix).
  ['field-border', 'card', 3], ['field-border', 'paper', 3],
  // ink on surface is Chip's resting label (introduced in Task 4).
  ['ink', 'surface', 4.5], ['ink-muted', 'surface', 4.5],
  // primary/card is Card's hover border over a card surface; see the note beside primary/paper.
  // Pinned at 4.5 rather than the 3:1 a boundary strictly needs, so it stays consistent with the
  // primary rows below, which are text pairs. Stricter than required, and cheap.
  ['primary', 'card', 4.5], ['on-ink', 'primary', 4.5], ['on-ink', 'primary-text', 4.5],
  ['primary-text', 'card', 4.5], ['primary-text', 'surface', 4.5], ['primary-text', 'paper', 4.5],
  ['primary', 'surface', 4.5, 'harbour'],
  // Stat's note sits on a card tile, not on the page (introduced in Task 4).
  ['ink-muted', 'card', 4.5],
  // Chip's hover fill is --color-line, and its label is --color-ink. Introduced in Task 4 and
  // held at 4.5:1: this was the pairing most likely to fail and it clears both themes.
  ['ink', 'line', 4.5],
  // Card's hover border is --color-primary. A boundary needs 3:1 against its adjacent
  // background, and a card may sit on --color-paper or --color-card. The card case is the
  // existing primary/card row; this is the paper case (introduced in Task 4).
  ['primary', 'paper', 3],
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

/**
 * Below-AA *non-text* combinations: boundaries that would need 3:1 as graphical objects if they
 * were the only thing identifying a control. These are pinned rather than asserted, because they
 * are an accepted decorative convention, not an oversight.
 *
 * Both remaining rows are reachable, and both are decoration rather than affordance. `line` on
 * `card` and `paper` is drawn by Chip's hover fill and by the 1px --color-line border on Photo,
 * Placeholder and Badge, none of which is a control: each is identified by its own text label far
 * above 3:1, so 1.4.11 does not reach the rule. Chip's own border is no longer one of the paths -
 * it moved to --color-field-border, which clears 3:1, because a chip that renders as a <button>
 * is a control whose border is the affordance. The reason `line` on `surface` is absent, though
 * its neighbours are kept, is below.
 *
 * Card's interactive resting border used to be --color-line too and was pinned here; it has moved
 * to --color-field-border, which clears 3:1 and now lives in `pairs`, because for a clickable card
 * that border *is* the affordance rather than decoration.
 *
 * The plain hairline border is the same decorative idea and predates Task 4: rgba(18,38,58,.08)
 * over card composites to about 1.17:1.
 *
 * There is deliberately no `line` on `surface` row. The pair is reachable, so that is not the
 * reason: Badge's neutral tone (a --color-line border over a --color-surface fill) and
 * Placeholder's .ph both draw it and both render in the dev gallery, and Photo's .initials span
 * draws it too, though not from the gallery - that tile renders from TeamRow, ProviderList and
 * ProviderProfile. It was left out because none of those is a control: each is identified by its
 * own text label far above 3:1, and none is interactive, so 1.4.11 never reaches the boundary and
 * there is no affordance for 3:1 to protect. Pinning it would assert a constraint the design does
 * not make. If an element drawing --color-line on --color-surface ever becomes a control, it
 * belongs in `pairs` at 3:1 rather than here.
 */
const belowAaBoundaries: Record<string, [string, string, number][]> = {
  fernway: [
    ['line', 'card', 1.2893],
    ['line', 'paper', 1.2248],
  ],
  harbour: [
    ['line', 'card', 1.3469],
    ['line', 'paper', 1.2637],
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

describe('below-AA non-text boundaries are pinned, not silently drifting', () => {
  for (const name of ['fernway', 'harbour']) {
    const t = theme(name);
    for (const [fg, bg, pinned] of belowAaBoundaries[name]) {
      it(`${name}: ${fg} on ${bg} is a decorative boundary, not the sole affordance (pinned ${pinned.toFixed(2)}:1)`, () => {
        expect(t['color-' + fg], `--color-${fg}`).toBeTruthy();
        expect(t['color-' + bg], `--color-${bg}`).toBeTruthy();
        const got = contrast(t['color-' + fg], t['color-' + bg]);
        expect(
          Math.abs(got - pinned),
          `${name}: --color-${fg} ${t['color-' + fg]} on --color-${bg} ${t['color-' + bg]} measured ${got.toFixed(2)}:1 but the below-AA boundary table pins ${pinned.toFixed(2)}:1. If this crossed 3:1 the pair belongs in \`pairs\` instead.`
        ).toBeLessThanOrEqual(0.05);
        expect(got, `${name}: --color-${fg} on --color-${bg} is ${got.toFixed(2)}:1`).toBeLessThan(3);
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
