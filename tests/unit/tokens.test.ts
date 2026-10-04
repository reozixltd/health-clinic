import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/** Comments stripped: the header names `:root` in prose, and a commented-out token is not declared. */
const css = readFileSync('src/styles/tokens.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

/** Every file under `src/`, so the consumer guard reads the same tree the browser does. */
function srcFiles(dir = 'src'): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const p = join(dir, entry);
    return statSync(p).isDirectory() ? srcFiles(p) : [p];
  });
}

const srcText = srcFiles()
  .filter((f) => /\.(astro|css|ts|tsx|js)$/.test(f))
  .map((f) => readFileSync(f, 'utf8'))
  .join('\n');

const spaceTokens = [...css.matchAll(/--(space-[\w-]+)\s*:/g)].map((m) => m[1]!);

/**
 * The standalone `:root` block, not the whole file.
 *
 * Scoped deliberately: the themes below it may later vary type or spacing per site, and a helper
 * that scanned the whole file would keep reporting the `:root` value while the rendered site used
 * something else. The suite would pass over a real divergence.
 *
 * Anchored on the first `:root` left in the file, and the match must reach its opening brace with
 * nothing but whitespace, so it cannot settle for a theme block written as a bare `:root {`. The
 * type scale and spacing tests below read only what this returns.
 */
function rootBlock(): string {
  const start = css.indexOf(':root');
  if (start < 0) throw new Error('tokens.css has no :root block');
  const open = css.indexOf('{', start);
  if (open < 0 || !/^\s*$/.test(css.slice(start + ':root'.length, open))) {
    throw new Error(`the first :root in tokens.css is not a plain ":root {" block: ${css.slice(start, open + 1)}`);
  }
  const close = css.indexOf('}', open);
  if (close < 0) throw new Error('the :root block in tokens.css is not closed');
  return css.slice(open + 1, close);
}

/** Value of a custom property declared in the `:root` block. */
function token(name: string): string {
  const m = rootBlock().match(new RegExp(`--${name}:\\s*([^;]+);`));
  if (!m) throw new Error(`--${name} is missing`);
  return m[1]!.trim();
}

/** Names declared in the `:root` block, in declaration order. */
const declared = [...rootBlock().matchAll(/--([\w-]+)\s*:/g)].map((m) => m[1]);

describe('Stitch type scale', () => {
  it('keeps the body size and leads at Stitch values', () => {
    expect(token('body-size')).toBe('106.25%');
    expect(token('leading-body')).toBe('1.55');
  });

  it('holds the measure so long-form pages stay readable', () => {
    expect(token('measure')).toBe('68ch');
  });

  it('uses the Stitch display and headline sizes', () => {
    expect(token('text-14')).toBe('0.875rem');
    expect(token('text-16')).toBe('1rem');
    expect(token('text-18')).toBe('1.125rem');
    expect(token('text-20')).toBe('1.25rem');
    expect(token('text-24')).toBe('1.5rem');
    expect(token('text-28')).toBe('1.75rem');
    expect(token('text-36')).toBe('2.25rem');
  });

  it('names every scale step for the pixels it renders', () => {
    // Anchored to the 16px browser default, not --body-size, which is how the scale is named: a
    // step called --text-24 is 1.5rem, and it renders slightly larger at this project's 17px root.
    for (const name of declared.filter((n) => /^text-\d+$/.test(n))) {
      const value = token(name);
      // Required to be rem, or the arithmetic below is meaningless: parseFloat('24px') * 16 would
      // report 384px for a 24px step and accuse the name of being wrong when the unit is.
      expect(value, `--${name} must be a rem step to be checked against its name, got "${value}"`).toMatch(/^[\d.]+rem$/);
      const px = parseFloat(value) * 16;
      expect(px, `--${name} is ${px}px at a 16px root, so the name should be --text-${px}`).toBe(Number(name.replace('text-', '')));
    }
  });

  it('pins the hero clamp literal', () => {
    expect(token('text-hero')).toBe('clamp(2.25rem, 4.5vw, 3.5rem)');
  });

  it('resolves the hero clamp bounds against the project root size', () => {
    // global.css sets html { font-size: var(--body-size) }, so 1rem is the browser default of
    // 16px scaled by --body-size, not 16px. Derived, never hardcoded, so the two cannot drift.
    const rem = 16 * (parseFloat(token('body-size')) / 100);
    const [min, preferred, max] = token('text-hero')
      .match(/^clamp\((.+)\)$/)![1]!
      .split(',')
      .map((t) => t.trim());
    const length = /^[\d.]+(rem|em|px|%|vw|vh|vmin|vmax|ch)$/;

    for (const term of [min!, preferred!, max!]) {
      expect(term, `"${term}" is not a length`).toMatch(length);
    }
    expect(
      parseFloat(min!) * rem,
      `clamp min ${min} resolves above max ${max} at a ${rem}px root, so the hero has no range`
    ).toBeLessThan(parseFloat(max!) * rem);
    expect(min!).toMatch(/rem$/);
    expect(max!).toMatch(/rem$/);
    expect(parseFloat(min!) * rem, 'hero floor at the project root size').toBe(38.25);
    expect(parseFloat(max!) * rem, 'hero ceiling at the project root size').toBe(59.5);
  });

  it('uses Stitch letter spacing for the hero, headings and labels', () => {
    expect(token('track-hero')).toBe('-0.03em');
    expect(token('track-heading')).toBe('-0.02em');
    expect(token('track-label')).toBe('0.04em');
  });
});

describe('Stitch shapes and depth', () => {
  it('uses the Stitch radius set', () => {
    expect(token('radius-control')).toBe('8px');
    expect(token('radius-card')).toBe('16px');
    expect(token('radius-panel')).toBe('24px');
    expect(token('radius-pill')).toBe('9999px');
  });

  it('keeps the 44px tap target floor and gives fields 48px', () => {
    expect(token('target')).toBe('44px');
    expect(token('target-field')).toBe('48px');
  });

  it('keeps the card fill fade at 160ms', () => {
    expect(token('dur-fill')).toBe('160ms');
  });

  it('defines the three Stitch elevation levels and the hairline', () => {
    expect(token('shadow-1')).toBe('0 4px 20px -2px rgba(18,38,58,.04)');
    expect(token('shadow-2')).toBe('0 12px 32px -4px rgba(18,38,58,.08)');
    expect(token('shadow-3')).toBe('0 24px 48px -8px rgba(18,38,58,.14)');
    expect(token('hairline')).toBe('1px solid rgba(18,38,58,.08)');
  });
});

describe('spacing', () => {
  it('keeps the existing numbered scale', () => {
    for (const [name, value] of [['space-1', '4px'], ['space-2', '8px'], ['space-3', '12px'], ['space-4', '16px'], ['space-5', '24px'], ['space-6', '32px'], ['space-7', '48px'], ['space-8', '64px']] as const) {
      expect(token(name), name).toBe(value);
    }
  });

  /**
   * Every step has to earn its place.
   *
   * This replaces a guard that rejected unnumbered steps. Numbering is a naming preference that
   * `docs/design-system.md` never states, so enforcing it hard-failed a convention nobody had agreed
   * to — and its comment talked about consumers while the assertion checked names. What actually
   * goes wrong is a token nothing reads: it looks available, so a later task reaches for it and
   * inherits a value that was never exercised. `--space-xl` was exactly that, sitting unnumbered
   * between two numbered steps.
   *
   * Scoped to `space-*` on purpose. A repo-wide version fails today on eleven other tokens that the
   * remaining tasks consume, which would make it a standing red rather than a signal.
   */
  it('gives every space token at least one consumer', () => {
    const orphans = spaceTokens.filter((t) => !new RegExp(`var\\(--${t}[)\\s,]`).test(srcText));
    expect(orphans, `these space tokens are declared but nothing uses them: ${orphans.join(', ')}`).toEqual([]);
  });
});

/**
 * Parity guards for the `:root` block. contrast.test.ts does the same two jobs for colours: catch
 * a duplicate declaration, and catch a token that escapes the tests that are supposed to cover it.
 */
describe('the :root block is well formed', () => {
  it('declares every token exactly once', () => {
    const dupes = declared.filter((n, i) => declared.indexOf(n) !== i);
    expect(dupes, `duplicate declaration in :root, last one silently wins: ${[...new Set(dupes)].join(', ')}`).toEqual([]);
  });

  it('declares no colour tokens', () => {
    const colours = declared.filter((n) => n.startsWith('color-'));
    expect(
      colours,
      `contrast.test.ts parses only the theme blocks, so a --color-* token declared in :root is never contrast-tested. Colours belong in the theme blocks: ${colours.join(', ')}`
    ).toEqual([]);
  });
});
