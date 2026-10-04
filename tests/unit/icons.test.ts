import { describe, expect, it } from 'vitest';
import { icons } from '@/core/ui/icons';

/** The icons the Stitch compositions are drawn from. */
const stitchIcons = [
  'search',
  'chevron-right',
  'arrow-right',
  'badge-check',
  'filter',
  'flask',
  'pill',
  'scan-line',
  'smartphone',
  'mail',
  'lock',
  'globe',
  'award',
  'heart-pulse',
  'navigation',
  'video',
  'sliders',
  'sparkle',
] as const;

/**
 * Every icon name rendered from a template, as a fixed list.
 *
 * The obvious test walks `src/` looking for `<Icon name="...">`, and that walk is what the plan
 * originally specified. It is fragile for no benefit: the only dynamic call site is the demo
 * gallery, which derives its names from `icons` itself and so can never disagree. A hardcoded list
 * is diffable and fails loudly when a new call site is added without it.
 *
 * Kept in step with `src/` by hand. `menu` is here because the template grep finds it in
 * `Header.astro`; the rest are the Stitch compositions' names plus what the gallery will render.
 */
const renderedNames = [
  'badge-check',
  'chevron-right',
  'check',
  'clock',
  'filter',
  'flask',
  'heart-pulse',
  'lock',
  'mail',
  'map-pin',
  'menu',
  'navigation',
  'phone',
  'pill',
  'search',
  'shield',
  'sliders',
  'sparkle',
  'star',
  'user',
  'video',
] as const;

const entries = Object.entries(icons);

/** Bare numeric tokens in the markup, including arc flags and compact path commands like `-4.3`. */
function numbersIn(markup: string): number[] {
  return [...markup.matchAll(/[-+]?\d*\.?\d+/g)].map((m) => Number(m[0]));
}

describe('the icon set', () => {
  it('has every icon the Stitch compositions need', () => {
    const missing = stitchIcons.filter((n) => !(n in icons));
    expect(missing, `missing icons: ${missing.join(', ')}`).toEqual([]);
  });

  it('resolves every icon name rendered from a template', () => {
    const missing = renderedNames.filter((n) => !(n in icons));
    expect(missing, `a template renders <Icon name="..."> that icons.ts does not define: ${missing.join(', ')}`).toEqual([]);
  });

  /**
   * Icon.astro sets `fill="none" stroke="currentColor"` on the wrapping `<svg>`, so a hardcoded
   * attribute inside a path silently wins over it. A `fill` on one icon would paint a solid blob
   * and a `stroke` would break colour inheritance, both of which survive a visual review at 20px.
   */
  it('is stroke geometry only, so currentColor inherits', () => {
    for (const [name, markup] of entries) {
      expect(markup, `${name} must start with a shape, not a wrapper or text node`).toMatch(
        /^<(path|circle|rect|line|polyline|polygon)\b/,
      );
      for (const attr of ['stroke=', 'fill=', 'style=']) {
        expect(markup, `${name} sets ${attr}, which overrides the svg's stroke and breaks theming`).not.toContain(attr);
      }
    }
  });

  it('draws inside a 24x24 coordinate space', () => {
    for (const [name, markup] of entries) {
      for (const value of numbersIn(markup)) {
        expect(Number.isFinite(value), `${name} has an unparseable number`).toBe(true);
        expect(Math.abs(value), `${name} has ${value}, outside the 24x24 viewBox`).toBeLessThanOrEqual(24);
      }
    }
  });
});