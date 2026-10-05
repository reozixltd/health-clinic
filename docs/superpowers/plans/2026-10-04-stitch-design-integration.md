# Stitch design integration, phases 1 to 6, implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the visual design of the health-clinic Astro site with the Google Stitch "Lumina Health Clinic" design, ported into the existing layer architecture and driven by real site config and content.

**Architecture:** The Stitch HTML is not copied. Its palette, type scale, radii, elevation and section compositions are ported into `src/styles/tokens.css`, `src/core/ui/` and `src/sections/`, driven by the existing content collections and site config. Every Stitch element with no real data source renders a labelled stub using the existing `Placeholder.astro` convention. Behaviour, routing, the boundary rules and the test suite are preserved; tests that assert the old visual structure are updated to the new markup, not weakened.

**Tech Stack:** Astro 7, TypeScript strict, plain CSS on custom properties (no Tailwind, no UI framework), vitest for unit tests, Playwright for e2e, self-hosted Atkinson Hyperlegible Next, inline SVG icons.

**Spec:** `docs/superpowers/specs/2026-10-04-stitch-design-integration-design.md`

**Phase 7, the booking flow, is a separate plan.** It shares only the tokens from Task 1 and 2.

---

## Constraints that shape every task

Read these before writing any code. Each is enforced by an existing test.

1. **No raw colour outside `src/styles/tokens.css`.** `tools/boundaries.mjs` regex-matches `#hex`, `rgb()`, `hsl()` in every file under `src/`. Use `var(--...)` only. `npm test` runs the checker first.
2. **Layer direction is `pages` to `layouts` to `sections` to `modules` to `domain` to `core`.** `core` imports nothing outside `core`. `modules/x` must not import `modules/y`. `sections` must not import `pages`. New shared components go in `core/ui/` because both `sections/` and `modules/` need them.
3. **No `localStorage` or `sessionStorage`** except in `src/core/storage.ts` and `src/layouts/ThemeBoot.astro`.
4. **No `site.market` reads** outside `src/domain/presets.ts` and `src/layouts/`. No `=== 'CA'` style market branching in `pages`, `layouts`, `sections` or `modules`. Every market's markup is rendered and CSS picks the winner from `html[data-market]`.
5. **Only `<ol>` on the home page is `#first-visit`.** `tests/e2e/home.e2e.mjs` asserts `main ol` count is exactly 1. New card grids use `<ul>`.
6. **Home section ids keep their relative order:** `services, team, first-visit, reviews, location, faq`.
7. **No new `href` in header or footer** outside the routes a site already generates. `tests/e2e/shell.e2e.mjs` checks every one against an allowlist. Chips and card links inside `main` are not covered.
8. **Tap targets are at least 44px** for every `a` and `button` inside `header` and `.hero`, and inside `.mobile-bar`. `tests/e2e/quality.e2e.mjs` measures them at 375px.
9. **Do not add entries to `photoAlt` in `src/config/photo-slots.ts`.** `tests/unit/photos.test.ts` asserts every slot with alt text has a file in `src/assets/photos/`. There are nine files and nine alt entries. A new section that wants a photo reuses an existing slot; anything else renders `Placeholder.astro` directly with a literal label.
10. **No third-party origins** on `/book/`, `/estimates/`, `/referrers/`. No Google Fonts, no CDN. Page JS stays under 30,720 gzipped bytes.
11. **`.astro` files are not unit tested.** vitest has no Astro plugin. The project pattern is: logic in a `.ts` file with unit tests, markup in `.astro` verified by e2e and the `/dev/ui/` gallery. Follow it.
12. **Docs headings** in `README.md` and top-level `docs/*.md` must have no run of two or more capitals outside `ABN BN GST VAT AHPRA RCVS SMS CASL PECR AODA WCAG GP`, and no arrow or middle-dot characters. `docs/superpowers/` is not scanned.

---

## File structure

**Created, logic (unit tested):**

| File | Responsibility |
| --- | --- |
| `src/modules/stats/metrics.ts` | Derives the home page metric tiles from collections and the market. No formatting of anything else. |
| `src/modules/providers/search.ts` | Free-text matching for the hero search box and building each provider's `data-search` string. |
| `src/modules/providers/lookup.ts` | Resolves provider slugs to display data, so a service card can name its clinicians. |
| `src/core/provider-filter.ts` | Client script and count summary for the team page query filter. Lives in `core` so a module may import it. |

**Created, presentation:**

| File | Responsibility |
| --- | --- |
| `src/core/ui/Card.astro` | White elevated surface. The one card in the system. |
| `src/core/ui/Eyebrow.astro` | Uppercase tracked label above a heading. |
| `src/core/ui/Stat.astro` | One metric tile: value, label, note, icon. |
| `src/core/ui/Chip.astro` | Pill link or button. |
| `src/layouts/UtilityBar.astro` | Thin bar above the header: out-of-hours line, address, phone. Lives in `layouts/` because it reads `site.market`. |
| `src/sections/MetricsBand.astro` | The four real metric tiles. |
| `src/sections/UrgentBand.astro` | Out-of-hours and emergency band, plus labelled stubs. |
| `src/sections/FeaturesBand.astro` | Photo, overlapping stat and the four feature cards, all stubbed. |
| `src/sections/CoverageBand.astro` | Fees link, real, beside the stubbed carrier grid and insurance link. |

**Modified:** `src/styles/tokens.css`, `src/styles/global.css`, `src/core/ui/icons.ts`, `src/core/ui/Button.astro`, `src/core/ui/Field.astro`, `src/core/ui/Placeholder.astro`, `src/layouts/Header.astro`, `src/layouts/Footer.astro`, `src/layouts/BaseLayout.astro`, `src/sections/Hero.astro`, `src/sections/ServicesBand.astro`, `src/sections/TeamRow.astro`, `src/sections/ReviewsBand.astro`, `src/sections/CtaBand.astro`, `src/sections/PageHeader.astro`, `src/modules/reviews/Reviews.astro`, `src/modules/services/ServiceList.astro`, `src/modules/providers/ProviderList.astro`, `src/pages/index.astro`, `src/pages/dev/[slug].astro`, `tests/unit/contrast.test.ts`, `tests/unit/photos.test.ts`, and the e2e files named in each task.

---

### Task 1: Stitch palette in both themes

**Files:**
- Modify: `tests/unit/contrast.test.ts`
- Modify: `src/styles/tokens.css`

- [ ] **Step 1: Add the new token pairs to the contrast test**

In `tests/unit/contrast.test.ts`, replace the `pairs` array with:

```ts
const pairs: [string, string, number][] = [
  ['ink', 'paper', 4.5], ['ink-muted', 'paper', 4.5], ['ink', 'card', 4.5], ['ink', 'accent', 4.5],
  ['on-ink', 'ink', 4.5], ['field-border', 'surface', 3], ['focus', 'paper', 3],
  ['ink', 'surface', 4.5], ['ink-muted', 'surface', 4.5],
  ['primary', 'card', 4.5], ['on-ink', 'primary', 4.5],
  ['primary-text', 'card', 4.5], ['primary-text', 'surface', 4.5], ['primary-text', 'paper', 4.5],
];
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `npx vitest run tests/unit/contrast.test.ts`
Expected: FAIL. `fernway: primary on card >= 4.5` fails with "expected '#005f5a' to be truthy" style messages for the three new tokens.

- [ ] **Step 3: Write the fernway block**

In `src/styles/tokens.css`, replace the `:root,\n[data-theme='fernway']` block with:

```css
:root,
[data-theme='fernway'] {
  --color-paper: #f7f9ff;
  --color-ink: #121d26;
  --color-ink-muted: #3e4947;
  --color-card: #ffffff;
  --color-accent: #99f2e9;
  --color-primary: #0d7a73;
  --color-primary-text: #005f5a;
  --color-line: #d8e4f1;
  --color-field-border: #6e7977;
  --color-surface: #e4effc;
  --color-on-ink: #ffffff;
  --color-success: #345c49;
  --color-success-soft: #e6f3ea;
  --color-warning: #8a5300;
  --color-warning-soft: #fdf1d9;
  --color-danger: #ba1a1a;
  --color-danger-soft: #fbe9e8;
  --color-focus: #0d7a73;
}
```

`--color-accent` stays a light fill because `docs/design-system.md` fixes its meaning: the appointment card and selected states only, always under ink text. `#005f5a` cannot serve there.

- [ ] **Step 4: Write the harbour block**

Replace the `[data-theme='harbour']` block with:

```css
[data-theme='harbour'] {
  --color-paper: #f5f8fb;
  --color-ink: #17263a;
  --color-ink-muted: #475a70;
  --color-card: #ffffff;
  --color-accent: #c7ddf5;
  --color-primary: #1d4f8c;
  --color-primary-text: #163d6e;
  --color-line: #d6dfe9;
  --color-field-border: #66788c;
  --color-surface: #e9eef4;
  --color-on-ink: #ffffff;
  --color-success: #1f6b3a;
  --color-success-soft: #e6f3ea;
  --color-warning: #8a5300;
  --color-warning-soft: #fdf1d9;
  --color-danger: #a6262b;
  --color-danger-soft: #fbe9e8;
  --color-focus: #1d4f8c;
}
```

- [ ] **Step 5: Run the test and confirm it passes**

Run: `npx vitest run tests/unit/contrast.test.ts`
Expected: PASS, 30 tests.

- [ ] **Step 6: Confirm the boundary checker is still happy**

Run: `node tools/check-boundaries.mjs`
Expected: no output, exit 0.

- [ ] **Step 7: Commit**

```bash
git add src/styles/tokens.css tests/unit/contrast.test.ts
git commit -m "feat: Stitch palette as design tokens in both themes"
```

---

### Task 2: Type scale, spacing, radii and elevation

**Files:**
- Create: `tests/unit/tokens.test.ts`
- Modify: `src/styles/tokens.css`
- Modify: `src/styles/global.css`

- [ ] **Step 1: Write the failing token test**

Create `tests/unit/tokens.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/styles/tokens.css', 'utf8');

/** Value of a custom property declared in the `:root` block. */
function token(name: string): string {
  const m = css.match(new RegExp(`--${name}:\\s*([^;]+);`));
  if (!m) throw new Error(`--${name} is missing`);
  return m[1]!.trim();
}

describe('Stitch type scale', () => {
  it('keeps the body size and leads at Stitch values', () => {
    expect(token('body-size')).toBe('106.25%');
    expect(token('leading-body')).toBe('1.55');
  });

  it('uses the Stitch display and headline sizes', () => {
    expect(token('text-14')).toBe('0.875rem');
    expect(token('text-16')).toBe('1rem');
    expect(token('text-18')).toBe('1.125rem');
    expect(token('text-20')).toBe('1.25rem');
    expect(token('text-22')).toBe('1.5rem');
    expect(token('text-28')).toBe('1.75rem');
    expect(token('text-36')).toBe('2.25rem');
  });

  it('runs the hero from 36px on mobile to 56px on desktop', () => {
    expect(token('text-hero')).toBe('clamp(2.25rem, 4.5vw, 3.5rem)');
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
  it('keeps the existing scale and adds Stitch space-xl', () => {
    for (const [name, value] of [['space-1', '4px'], ['space-2', '8px'], ['space-3', '12px'], ['space-4', '16px'], ['space-5', '24px'], ['space-6', '32px'], ['space-7', '48px'], ['space-8', '64px'], ['space-xl', '40px']] as const) {
      expect(token(name), name).toBe(value);
    }
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx vitest run tests/unit/tokens.test.ts`
Expected: FAIL with "--track-hero is missing".

- [ ] **Step 3: Rewrite the `:root` block in `src/styles/tokens.css`**

Replace everything from `:root {` to its closing brace with:

```css
:root {
  --font-body: 'Atkinson Hyperlegible Next Variable', system-ui, sans-serif;

  --text-14: 0.875rem;
  --text-16: 1rem;
  --text-18: 1.125rem;
  --text-20: 1.25rem;
  --text-22: 1.5rem;
  --text-28: 1.75rem;
  --text-36: 2.25rem;
  --text-hero: clamp(2.25rem, 4.5vw, 3.5rem);
  --body-size: 106.25%; /* 17px at the browser default of 16px, and it follows a larger default */
  --leading-body: 1.55;
  --measure: 68ch;

  --track-hero: -0.03em;
  --track-heading: -0.02em;
  --track-label: 0.04em;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
  --space-8: 64px;
  --space-xl: 40px;

  --radius-control: 8px;
  --radius-card: 16px;
  --radius-panel: 24px;
  --radius-pill: 9999px;
  --target: 44px;
  --target-field: 48px;
  --dur-fill: 160ms;

  --shadow-1: 0 4px 20px -2px rgba(18,38,58,.04);
  --shadow-2: 0 12px 32px -4px rgba(18,38,58,.08);
  --shadow-3: 0 24px 48px -8px rgba(18,38,58,.14);
  --hairline: 1px solid rgba(18,38,58,.08);
}
```

Also update the file's leading comment so it stops naming the old two-theme accents.

- [ ] **Step 4: Apply the tracking in `src/styles/global.css`**

Replace the heading rules with:

```css
h1, h2, h3, h4 { line-height: 1.2; text-wrap: balance; letter-spacing: var(--track-heading); }
h1 { font-size: var(--text-hero); letter-spacing: var(--track-hero); }
h2 { font-size: var(--text-28); }
h3 { font-size: var(--text-22); }
```

- [ ] **Step 5: Run the test and confirm it passes**

Run: `npx vitest run tests/unit/tokens.test.ts`
Expected: PASS, 12 tests.

- [ ] **Step 6: Run the whole unit suite**

Run: `npm test`
Expected: boundaries clean, all suites pass.

- [ ] **Step 7: Commit**

```bash
git add src/styles/tokens.css src/styles/global.css tests/unit/tokens.test.ts
git commit -m "feat: Stitch type scale, radii, spacing and elevation tokens"
```

---

### Task 3: Icon set for the Stitch compositions

**Files:**
- Create: `tests/unit/icons.test.ts`
- Modify: `src/core/ui/icons.ts`

- [ ] **Step 1: Write the failing icon test**

Create `tests/unit/icons.test.ts`:

```ts
import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { icons } from '@/core/ui/icons';

const NEEDED = [
  'search', 'chevron-right', 'arrow-right', 'badge-check', 'filter', 'flask', 'pill',
  'scan-line', 'smartphone', 'mail', 'lock', 'globe', 'award', 'heart-pulse',
  'navigation', 'video', 'sliders', 'sparkle',
];

describe('icon set', () => {
  it('has every icon the Stitch compositions need', () => {
    for (const name of NEEDED) expect(icons[name as keyof typeof icons], name).toBeTruthy();
  });

  it('draws every icon with stroke geometry only, so currentColor works', () => {
    for (const [name, path] of Object.entries(icons)) {
      expect(path, name).toMatch(/^<path|<circle|<rect|<line|<polyline|<polygon/);
      expect(path, name).not.toMatch(/stroke=|fill=|style=/);
    }
  });

  it('uses a 24x24 viewBox coordinate space', () => {
    for (const [name, path] of Object.entries(icons)) {
      const numbers = [...path.matchAll(/-?\d+(?:\.\d+)?/g)].map((m) => Number(m[0]));
      expect(numbers.length, name).toBeGreaterThan(0);
      expect(Math.max(...numbers), name).toBeLessThanOrEqual(24);
    }
  });

  it('is referenced only by name, and every referenced name exists', () => {
    const used = new Set<string>();
    for (const file of readdirSync('src', { recursive: true, withFileTypes: true })) {
      if (!file.isFile() || !/\.(astro|ts)$/.test(file.name)) continue;
      const text = readFileSync(`src/${file.parentPath.split('src' + (file.parentPath.includes('\\') ? '\\' : '/')).pop()}/${file.name}`, 'utf8');
      for (const m of text.matchAll(/<Icon\s+name="([\w-]+)"/g)) used.add(m[1]!);
    }
    for (const name of used) expect(icons[name as keyof typeof icons], `${name} used but not defined`).toBeTruthy();
  });
});
```

If the recursive read in the last test proves fragile on this platform, replace that one test body with a fixed list of the names used in `src/` (`badge-check`, `chevron-right`, `check`, `clock`, `filter`, `flask`, `heart-pulse`, `lock`, `mail`, `map-pin`, `navigation`, `phone`, `pill`, `search`, `shield`, `sliders`, `sparkle`, `star`, `user`, `video`) and assert each resolves. Do not leave the test skipped.

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx vitest run tests/unit/icons.test.ts`
Expected: FAIL, "search" is undefined.

- [ ] **Step 3: Add the Lucide paths**

In `src/core/ui/icons.ts`, insert these entries into the `icons` object after the existing `alert` entry:

```ts
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  'chevron-right': '<path d="m9 18 6-6-6-6"/>',
  'arrow-right': '<path d="M5 12h14M12 5l7 7-7 7"/>',
  'badge-check': '<path d="M3.9 12a9 9 0 0 1 9-9 9 9 0 0 1 6.4 2.6l1.4-1.4v5h-5l1.4-1.4A7 7 0 0 0 5 12a9 9 0 0 1-1.1 0Z"/><path d="m8.5 12.5 2.5 2.5 5-5"/>',
  filter: '<path d="M3 5h18M6 12h12M10 19h4"/>',
  sliders: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h10M18 18h2"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="16" cy="18" r="2"/>',
  flask: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-9V3"/><path d="M7.5 15h9"/>',
  pill: '<path d="m10.5 20.5-7-7a5 5 0 0 1 7-7l7 7a5 5 0 0 1-7 7Z"/><path d="m8.5 8.5 7 7"/>',
  'scan-line': '<path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 12h10"/>',
  smartphone: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20Z"/>',
  award: '<circle cx="12" cy="8" r="6"/><path d="m8.2 13-1.4 8 5.2-3 5.2 3-1.4-8"/>',
  'heart-pulse': '<path d="M19 14c1.5-1.5 3-3.4 3-5.5A5.5 5.5 0 0 0 12 5a5.5 5.5 0 0 0-10 3.5C2 12 7 17 12 21c1.7-1.4 3.3-2.9 4.6-4.4"/><path d="M3.5 12H8l1.5-3 3 6 1.5-3h3.5"/>',
  navigation: '<path d="m3 11 19-9-9 19-2-8-8-2Z"/>',
  video: '<path d="m22 8-6 4 6 4V8Z"/><rect x="2" y="6" width="14" height="12" rx="2"/>',
  sparkle: '<path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z"/><path d="M18 15.5 18.8 18l2.2.8-2.2.8L18 21.5l-.8-1.9-2.2-.8 2.2-.8L18 15.5Z"/>',
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `npx vitest run tests/unit/icons.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/core/ui/icons.ts tests/unit/icons.test.ts
git commit -m "feat: icon set for the Stitch compositions"
```

---

### Task 4: Card, Eyebrow, Stat and Chip

**Files:**
- Create: `src/core/ui/Card.astro`
- Create: `src/core/ui/Eyebrow.astro`
- Create: `src/core/ui/Stat.astro`
- Create: `src/core/ui/Chip.astro`
- Modify: `src/pages/dev/[slug].astro`

No unit tests: these are presentation only and the project does not unit test `.astro`. The `/dev/ui/` gallery is where they are checked by eye, and Tasks 6 to 15 cover them in e2e and axe.

- [ ] **Step 1: Create `src/core/ui/Card.astro`**

```astro
---
/** White elevated surface. The one card in the system; components place their own content inside. */
interface Props {
  as?: string;
  class?: string;
}
const { as: Tag = 'div', class: className } = Astro.props;
---

<Tag class:list={['card', className]}><slot /></Tag>

<style>
  .card {
    box-sizing: border-box;
    display: grid;
    gap: var(--space-3);
    align-content: start;
    padding: var(--space-5);
    background: var(--color-card);
    border: var(--hairline);
    border-radius: var(--radius-card);
    box-shadow: var(--shadow-1);
    transition: box-shadow 200ms cubic-bezier(0.22, 1, 0.36, 1), border-color 200ms linear;
  }
  @media (hover: hover) and (pointer: fine) {
    .card:where(:has(a), :has(button)) { border-color: var(--color-line); }
    .card:where(:has(a), :has(button)):hover { box-shadow: var(--shadow-2); border-color: var(--color-primary); }
  }
</style>
```

`--hairline` and the shadows are `rgba`, declared in `tokens.css` only. Nothing here holds a raw colour.

- [ ] **Step 2: Create `src/core/ui/Eyebrow.astro`**

```astro
---
/** Small uppercase label above a heading. */
interface Props {
  as?: 'p' | 'span';
  class?: string;
}
const { as: Tag = 'p', class: className } = Astro.props;
---

<Tag class:list={['eyebrow', className]}><slot /></Tag>

<style>
  .eyebrow {
    margin: 0;
    color: var(--color-primary-text);
    font-size: var(--text-14);
    font-weight: 700;
    line-height: 1.4;
    letter-spacing: var(--track-label);
    text-transform: uppercase;
  }
</style>
```

- [ ] **Step 3: Create `src/core/ui/Stat.astro`**

```astro
---
/** One metric tile: a number, what it counts, and a note. */
import Icon from './Icon.astro';
import type { IconName } from './icons';

interface Props {
  value: string;
  label: string;
  note?: string;
  icon: IconName;
}
const { value, label, note, icon } = Astro.props;
---

<div class="stat">
  <span class="stat__icon"><Icon name={icon} size={28} /></span>
  <p class="stat__value">{value}</p>
  <p class="stat__label">{label}</p>
  {note && <p class="stat__note">{note}</p>}
</div>

<style>
  .stat {
    display: grid;
    gap: var(--space-2);
    align-content: start;
    padding: var(--space-5);
    background: var(--color-card);
    border: var(--hairline);
    border-radius: var(--radius-card);
    box-shadow: var(--shadow-1);
  }
  .stat__icon { color: var(--color-primary); }
  .stat__value { font-size: var(--text-36); font-weight: 700; line-height: 1.1; letter-spacing: var(--track-heading); }
  .stat__label { font-weight: 600; }
  .stat__note { color: var(--color-ink-muted); font-size: var(--text-14); }
</style>
```

- [ ] **Step 4: Create `src/core/ui/Chip.astro`**

```astro
---
/** Pill link or button, for filters and quick links. */
import type { HTMLAttributes } from 'astro/types';

interface Props extends Omit<HTMLAttributes<'a'> & HTMLAttributes<'button'>, 'type'> {
  href?: string;
  pressed?: boolean;
  type?: 'button' | 'submit';
}

const { href, pressed, type = 'button', class: className, ...rest } = Astro.props;
const Tag = href ? 'a' : 'button';
---

<Tag href={href} type={href ? undefined : type} aria-pressed={href ? undefined : String(pressed)} class:list={['chip', className]} {...rest}>
  <slot />
</Tag>

<style>
  .chip {
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    min-height: var(--target);
    padding: 0 var(--space-4);
    background: var(--color-surface);
    border: var(--hairline);
    border-radius: var(--radius-pill);
    color: var(--color-ink);
    font-size: var(--text-14);
    font-weight: 600;
    line-height: 1.2;
    text-decoration: none;
  }
  @media (hover: hover) and (pointer: fine) {
    .chip:hover { background: var(--color-line); }
  }
  .chip[aria-pressed='true'] { background: var(--color-primary); border-color: var(--color-primary); color: var(--color-on-ink); }
</style>
```

- [ ] **Step 5: Show all four in the component gallery**

In `src/pages/dev/[slug].astro`, add the imports:

```astro
import Card from '@/core/ui/Card.astro';
import Chip from '@/core/ui/Chip.astro';
import Eyebrow from '@/core/ui/Eyebrow.astro';
import Stat from '@/core/ui/Stat.astro';
```

and add these rows inside each `themes.map` block, after the existing `<div class="row">` that holds the badges:

```astro
          <div class="stack-demo">
            <Eyebrow>Section label</Eyebrow>
            <h3>Card heading</h3>
            <Card>
              <h4>Card title</h4>
              <p>Card body copy sits here.</p>
              <Chip href="/">A chip</Chip>
            </Card>
            <div class="row">
              <Stat value="12" label="Services" note="Across every department" icon="badge-check" />
              <Stat value="4.8" label="Average rating" icon="star" />
            </div>
          </div>
```

and add to that file's `<style>` block:

```css
  .stack-demo { display: grid; gap: var(--space-3); margin-block: var(--space-4); }
```

- [ ] **Step 6: Build and check the gallery**

Run: `SITE=fernway-au npx astro build --outDir dist/fernway-au`
Expected: build succeeds.
Run: `SITE=fernway-au npx astro dev`
Open `http://localhost:4321/dev/ui/` and confirm both themes render cards, eyebrows, stats and chips without raw white-on-white text. Stop the dev server.

- [ ] **Step 7: Commit**

```bash
git add src/core/ui/Card.astro src/core/ui/Eyebrow.astro src/core/ui/Stat.astro src/core/ui/Chip.astro src/pages/dev
git commit -m "feat: Card, Eyebrow, Stat and Chip primitives"
```

---

### Task 5: Clinic metrics logic

**Files:**
- Modify: `src/domain/presets.ts`
- Modify: `src/presets/allied-health.ts`
- Modify: `src/presets/vet.ts`
- Create: `src/modules/stats/metrics.ts`
- Create: `tests/unit/metrics.test.ts`

Preset copy is the only place wording lives, and `tests/e2e/home.e2e.mjs` checks the vet build for vet wording. A hardcoded "Clinicians" in a metric tile would be wrong on `hollybank`, so the nouns come from the preset.

- [ ] **Step 1: Add the nouns to the preset type and both presets**

In `src/domain/presets.ts`, change the `copy` member of `Preset`:

```ts
  copy: {
    heroLine: string;
    bookLabel: string;
    trust: string[];
    treatsLead: string;
    firstVisit: string[];
    /** Plural nouns for the metric tiles and the team page. A vet clinic says "Vets and nurses". */
    nouns: { service: string; clinician: string };
  };
```

In `src/presets/allied-health.ts`, add to its `copy` object:

```ts
    nouns: { service: 'Services', clinician: 'Clinicians' },
```

In `src/presets/vet.ts`, add to its `copy` object:

```ts
    nouns: { service: 'Treatments and services', clinician: 'Vets and nurses' },
```

- [ ] **Step 2: Write the failing test**

Create `tests/unit/metrics.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { AU, CA } from '@/domain/markets';
import { clinicMetrics, formatRating } from '@/modules/stats/metrics';
import { alliedHealth } from '@/presets/allied-health';
import { vet } from '@/presets/vet';

const NOUNS = alliedHealth.copy.nouns;
const REVIEWS = [
  { name: 'A', date: '2026-01-01', rating: 5, source: 'Google', text: 'Great' },
  { name: 'B', date: '2026-01-02', rating: 4, source: 'Google', text: 'Good' },
  { name: 'C', date: '2026-01-03', rating: 5, source: 'Google', text: 'Great' },
];

describe('formatRating', () => {
  it.each([
    [[5], '5.0'],
    [[5, 4, 5], '4.7'],
    [[1, 2], '1.5'],
  ])('mean of %j is %j', (ratings, expected) => {
    expect(formatRating(ratings as number[])).toBe(expected);
  });

  it('is empty for no ratings', () => {
    expect(formatRating([])).toBe('');
  });
});

describe('preset nouns', () => {
  it('gives both presets a service and a clinician noun', () => {
    for (const preset of [alliedHealth, vet]) {
      expect(preset.copy.nouns.service, preset.id).toBeTruthy();
      expect(preset.copy.nouns.clinician, preset.id).toBeTruthy();
    }
  });

  it('gives the vet preset vet wording', () => {
    expect(vet.copy.nouns.clinician).toMatch(/vet/i);
  });
});

describe('clinicMetrics', () => {
  const base = { services: 5, providers: 6, acceptingNew: 4, reviews: REVIEWS, nouns: NOUNS };

  it('counts services, clinicians and who is taking new patients', () => {
    expect(clinicMetrics({ ...base, market: AU }).map((m) => m.label)).toEqual(['Services', 'Clinicians', 'Taking new patients']);
  });

  it('uses the preset nouns, so a vet clinic is not labelled Clinicians', () => {
    const labels = clinicMetrics({ ...base, nouns: vet.copy.nouns, market: AU }).map((m) => m.label);
    expect(labels[1]).toBe('Vets and nurses');
    expect(labels).not.toContain('Clinicians');
  });

  it('never shows a rating in a market that hides review quotes', () => {
    expect(clinicMetrics({ ...base, market: AU }).some((m) => m.label.includes('rating'))).toBe(false);
  });

  it('shows the average rating where reviews are displayed', () => {
    const rated = clinicMetrics({ ...base, market: CA });
    expect(rated.map((m) => m.label)).toEqual(['Services', 'Clinicians', 'Taking new patients', 'Average review rating']);
    expect(rated[3]!.value).toBe('4.7');
  });

  it('omits the rating when there are no reviews to average', () => {
    expect(clinicMetrics({ ...base, reviews: [], market: CA }).map((m) => m.label)).not.toContain('Average review rating');
  });

  it('reports zero rather than hiding a count of none', () => {
    const m = clinicMetrics({ services: 0, providers: 0, acceptingNew: 0, reviews: [], nouns: NOUNS, market: CA });
    expect(m.map((x) => x.value)).toEqual(['0', '0', '0']);
  });

  it('gives every tile a note', () => {
    for (const m of clinicMetrics({ ...base, market: CA })) expect(m.note, m.label).toBeTruthy();
  });
});
```

- [ ] **Step 3: Run it and confirm it fails**

Run: `npx vitest run tests/unit/metrics.test.ts`
Expected: FAIL, "Cannot find module '@/modules/stats/metrics'".

- [ ] **Step 4: Implement it**

Create `src/modules/stats/metrics.ts`:

```ts
import type { IconName } from '@/core/ui/icons';
import type { MarketPack } from '@/domain/markets';
import type { Review } from '@/modules/reviews/reviews';

export interface Metric {
  value: string;
  label: string;
  note: string;
  icon: IconName;
}

export interface Nouns {
  service: string;
  clinician: string;
}

/** Mean rating to one decimal place, or '' when there is nothing to average. */
export function formatRating(ratings: number[]): string {
  if (ratings.length === 0) return '';
  const mean = ratings.reduce((a, b) => a + b, 0) / ratings.length;
  return mean.toFixed(1);
}

/**
 * The home page metric tiles, all counted from real content.
 * A rating appears only in a market that already displays review quotes, so AU never
 * shows a number it does not show the reviews behind. Nouns come from the preset, so a
 * vet clinic never reads "Clinicians".
 */
export function clinicMetrics(input: {
  services: number;
  providers: number;
  acceptingNew: number;
  reviews: Review[];
  market: MarketPack;
  nouns: Nouns;
}): Metric[] {
  const { services, providers, acceptingNew, reviews, market, nouns } = input;
  const showsReviews = market.reviews === 'display';
  const tiles: Metric[] = [
    { value: String(services), label: nouns.service, note: 'Listed in full on this site', icon: 'badge-check' },
    { value: String(providers), label: nouns.clinician, note: 'Named with their registration', icon: 'stethoscope' },
    { value: String(acceptingNew), label: 'Taking new patients', note: 'Marked in the team list below', icon: 'user' },
  ];
  if (showsReviews) {
    const rating = formatRating(reviews.map((r) => r.rating));
    if (rating) tiles.push({ value: rating, label: 'Average review rating', note: `From ${reviews.length} published reviews`, icon: 'star' });
  }
  return tiles;
}
```

`market.reviews === 'display'` is read inline rather than by importing `reviewMode` from `modules/reviews`, because a module must not import another module. `market.reviews` is the same field `reviewMode` returns.

- [ ] **Step 5: Run it and confirm it passes**

Run: `npx vitest run tests/unit/metrics.test.ts`
Expected: PASS, 16 tests.

- [ ] **Step 6: Run the whole suite**

Run: `npm test`
Expected: boundaries clean, all suites pass, including `tests/unit/presets.test.ts` which may assert the shape of `copy`.

- [ ] **Step 7: Commit**

```bash
git add src/domain/presets.ts src/presets src/modules/stats/metrics.ts tests/unit/metrics.test.ts
git commit -m "feat: home page metrics counted from real content, worded by preset"
```

---

### Task 6: MetricsBand on the home page

**Files:**
- Create: `src/sections/MetricsBand.astro`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Create the section**

```astro
---
/** Counted figures, one set per market variant. Replaces the fabricated statistics in the Stitch design. */
import Stat from '@/core/ui/Stat.astro';
import type { MarketId, MarketPack } from '@/domain/markets';
import type { Review } from '@/modules/reviews/reviews';
import { clinicMetrics, type Nouns } from '@/modules/stats/metrics';

interface Props {
  services: number;
  providers: number;
  acceptingNew: number;
  reviews: Review[];
  nouns: Nouns;
  variants: { id: MarketId; market: MarketPack }[];
}
const { services, providers, acceptingNew, reviews, nouns, variants } = Astro.props;
---

{providers > 0 && (
  <section id="metrics" aria-labelledby="metrics-title" data-reveal>
    <h2 id="metrics-title" class="visually-hidden">What this clinic offers</h2>
    {variants.map((v) => (
      <ul class="tiles" data-market-only={v.id}>
        {clinicMetrics({ services, providers, acceptingNew, reviews, market: v.market, nouns }).map((m) => (
          <li><Stat {...m} /></li>
        ))}
      </ul>
    ))}
  </section>
)}

<style>
  .tiles { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--space-4); }
  @media (min-width: 640px) { .tiles { grid-template-columns: repeat(2, 1fr); } }
  @media (min-width: 1024px) { .tiles { grid-template-columns: repeat(4, 1fr); } }
</style>
```

The section hides itself when the providers module is off, so `fixture-minimal` never renders a row of zeros.

- [ ] **Step 2: Wire it into `src/pages/index.astro`**

Add the import:

```astro
import MetricsBand from '@/sections/MetricsBand.astro';
```

Add the accepting-new count after the existing `providers` line:

```astro
const acceptingNew = providers.filter((p) => p.acceptingNew).length;
```

Add the section inside `<div class="stack">`, directly after `<TrustRow ... />`:

```astro
    {on('providers') && <MetricsBand services={services.length} providers={providers.length} acceptingNew={acceptingNew} reviews={reviews} nouns={preset.copy.nouns} variants={variants} />}
```

`sections` may import `modules`, which is why `MetricsBand` reaches for `clinicMetrics` itself and `index.astro` only passes raw counts.

- [ ] **Step 3: Build and confirm the section renders**

Run: `SITE=fernway-au npx astro build --outDir dist/fernway-au`
Expected: build succeeds. Confirm `#metrics` exists in `dist/fernway-au/index.html` and contains four tiles for AU, three for CA.

- [ ] **Step 4: Check the boundaries again**

Run: `node tools/check-boundaries.mjs`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add src/sections/MetricsBand.astro src/pages/index.astro
git commit -m "feat: metrics band on the home page"
```

---

### Task 7: Provider lookup and free-text search

**Files:**
- Create: `src/modules/providers/lookup.ts`
- Create: `src/modules/providers/search.ts`
- Create: `tests/unit/search.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/search.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { normalise, matchesQuery } from '@/modules/providers/search';
import { providerNamesFor, providersBySlug } from '@/modules/providers/lookup';

const PROVIDERS = [
  { slug: 'elena-marsh', name: 'Dr Elena Marsh', role: 'Physiotherapist', languages: ['English', 'Spanish'] },
  { slug: 'priya-nair', name: 'Dr Priya Nair', role: 'Psychologist', languages: ['English', 'Hindi'] },
];

describe('normalise', () => {
  it('lowercases and collapses whitespace', () => {
    expect(normalise('  Dr   Elena   MARSH ')).toBe('dr elena marsh');
  });

  it('strips accents so a search for Zoe finds Zoë', () => {
    expect(normalise('Zoë Müller-Lang')).toBe('zoe muller-lang');
  });
});

describe('matchesQuery', () => {
  const clinician = ['Dr Elena Marsh', 'Physiotherapist', 'English Spanish'];

  it('matches everything for an empty query', () => {
    expect(matchesQuery(clinician, '')).toBe(true);
    expect(matchesQuery(clinician, '   ')).toBe(true);
  });

  it('matches a single term anywhere, ignoring case', () => {
    expect(matchesQuery(clinician, 'elena')).toBe(true);
    expect(matchesQuery(clinician, 'SPANISH')).toBe(true);
  });

  it('needs every term to match somewhere', () => {
    expect(matchesQuery(clinician, 'elena physiotherapist')).toBe(true);
    expect(matchesQuery(clinician, 'elena dentist')).toBe(false);
  });

  it('is not fooled by a term in the wrong place', () => {
    expect(matchesQuery(['Dental check-up'], 'check')).toBe(true);
    expect(matchesQuery(['Dental check-up'], 'check dentist')).toBe(false);
  });

  it('never matches on an empty haystack', () => {
    expect(matchesQuery([], 'elena')).toBe(false);
    expect(matchesQuery([], '')).toBe(true);
  });
});

describe('provider lookup', () => {
  it('indexes providers by slug', () => {
    const index = providersBySlug(PROVIDERS);
    expect(index.get('priya-nair')?.name).toBe('Dr Priya Nair');
    expect(index.has('nobody')).toBe(false);
  });

  it('names the clinicians on a service, skipping slugs it cannot find', () => {
    expect(providerNamesFor(PROVIDERS, ['elena-marsh', 'priya-nair'])).toEqual(['Dr Elena Marsh', 'Dr Priya Nair']);
    expect(providerNamesFor(PROVIDERS, ['elena-marsh', 'ghost'])).toEqual(['Dr Elena Marsh']);
    expect(providerNamesFor(PROVIDERS, [])).toEqual([]);
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx vitest run tests/unit/search.test.ts`
Expected: FAIL, "Cannot find module '@/modules/providers/search'".

- [ ] **Step 3: Implement `search.ts`**

Create `src/modules/providers/search.ts`:

```ts
/** Lowercase, collapse whitespace and drop accents, so a search is forgiving of typing. */
export function normalise(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Every whitespace-separated term of the query must appear in one of the searchable strings. */
export function matchesQuery(haystack: string[], query: string): boolean {
  const terms = normalise(query).split(' ').filter(Boolean);
  if (terms.length === 0) return true;
  const text = normalise(haystack.join(' '));
  return terms.every((t) => text.includes(t));
}
```

- [ ] **Step 4: Implement `lookup.ts`**

Create `src/modules/providers/lookup.ts`:

```ts
/** Resolve provider slugs to display names, so a service can say who sees you. */

export function providersBySlug<T extends { slug: string }>(providers: T[]): Map<string, T> {
  return new Map(providers.map((p) => [p.slug, p]));
}

/** Names for the given slugs, in the order asked for, skipping any that do not resolve. */
export function providerNamesFor<T extends { slug: string; name: string }>(providers: T[], slugs: string[]): string[] {
  const index = providersBySlug(providers);
  return slugs.map((slug) => index.get(slug)?.name).filter((n): n is string => Boolean(n));
}
```

- [ ] **Step 5: Run it and confirm it passes**

Run: `npx vitest run tests/unit/search.test.ts`
Expected: PASS, 14 tests.

- [ ] **Step 6: Commit**

```bash
git add src/modules/providers/search.ts src/modules/providers/lookup.ts tests/unit/search.test.ts
git commit -m "feat: provider lookup and forgiving free-text search"
```

---

### Task 8: Stitch hero with a real search box

**Files:**
- Modify: `src/sections/Hero.astro`
- Modify: `src/pages/index.astro`

The hero must keep three things the e2e suite already depends on: a visible `a[href^="/book/"]`, a visible `a[href^="tel:"]`, and a visible `.emergency-note`, all inside `.hero`, all with a 44px hit area.

- [ ] **Step 1: Rewrite `src/sections/Hero.astro`**

```astro
---
/** Clinic name, what it treats, a real search box, and the after-hours note. */
import Button from '@/core/ui/Button.astro';
import Chip from '@/core/ui/Chip.astro';
import Icon from '@/core/ui/Icon.astro';
import Photo from '@/core/ui/Photo.astro';
import type { MarketId } from '@/domain/markets';
import type { Preset } from '@/domain/presets';
import type { Clinic } from '@/domain/types';
import EmergencyNote from '@/modules/emergency/EmergencyNote.astro';

interface Props {
  name: string;
  treats: string;
  preset: Preset;
  variants: { id: MarketId; clinic: Clinic; tel: string }[];
  bookingOn: boolean;
  emergencyOn: boolean;
  photo?: { slot: string; alt: string };
  /** Popular searches, already limited by the page. */
  quickLinks: { label: string; href: string }[];
  acceptingNew: number;
}
const { name, treats, preset, variants, bookingOn, emergencyOn, photo, quickLinks, acceptingNew } = Astro.props;
---

<section class:list={['hero', photo && 'has-photo']} aria-labelledby="hero-title">
  <div class="copy">
    {acceptingNew > 0 && (
      <p class="pill">
        <span class="pill__dot" aria-hidden="true"></span>
        Taking new patients
      </p>
    )}
    <h1 id="hero-title">{name}</h1>
    <p class="line">{preset.copy.heroLine}. {treats}</p>

    <form class="search" action="/team/" method="get" role="search">
      <div class="search__field">
        <label for="hero-q">Search a clinician or a service</label>
        <span class="search__icon"><Icon name="search" size={20} /></span>
        <input id="hero-q" name="q" type="search" placeholder="For example physiotherapy or Elena Marsh" />
      </div>
      <div class="search__field search__field--stub">
        <span class="search__icon"><Icon name="shield" size={20} /></span>
        <label for="hero-insurer">Health fund or insurer</label>
        <p class="stub" id="hero-insurer-note">Not yet listed. Call us and we will check your cover.</p>
      </div>
      <Button type="submit" size="lg">
        <Icon name="search" size={20} />
        Find and book
      </Button>
    </form>

    {quickLinks.length > 0 && (
      <nav class="quick" aria-label="Popular searches">
        <h2 class="quick__title">Popular searches</h2>
        <ul>
          {quickLinks.map((q) => (
            <li><Chip href={q.href}>{q.label}</Chip></li>
          ))}
        </ul>
      </nav>
    )}

    {variants.map((v) => (
      <div class="actions" data-market-only={v.id}>
        {bookingOn && <Button href="/book/" size="lg">{preset.copy.bookLabel}</Button>}
        <a class="phone" href={v.tel}>
          <Icon name="phone" size={20} />
          Call {v.clinic.phone}
        </a>
        {emergencyOn && <EmergencyNote clinic={v.clinic} preset={preset} compact />}
      </div>
    ))}
  </div>

  {photo && (
    <div class="art">
      <Photo slot={photo.slot} alt={photo.alt} ratio="4 / 5" sizes="(min-width: 1024px) 560px, 100vw" priority />
      <p class="badge">
        <Icon name="user" size={20} />
        <span>{acceptingNew} taking new patients</span>
      </p>
    </div>
  )}
</section>

<style>
  .hero { max-width: 72rem; margin: 0 auto; padding: var(--space-7) var(--space-4) var(--space-6); display: grid; gap: var(--space-6); }
  .copy { display: grid; gap: var(--space-4); }
  @media (min-width: 1024px) { .has-photo { grid-template-columns: 7fr 5fr; align-items: center; column-gap: var(--space-7); } }

  .pill { display: inline-flex; align-items: center; gap: var(--space-2); justify-self: start; padding: var(--space-1) var(--space-4); background: var(--color-surface); border: var(--hairline); border-radius: var(--radius-pill); color: var(--color-primary-text); font-size: var(--text-14); font-weight: 600; }
  .pill__dot { width: 8px; height: 8px; border-radius: 50%; background: var(--color-primary); }

  h1 { font-size: var(--text-hero); max-width: 20ch; }
  .line { font-size: var(--text-18); max-width: var(--measure); color: var(--color-ink-muted); }

  .search { display: grid; gap: var(--space-3); padding: var(--space-3); background: var(--color-card); border: var(--hairline); border-radius: var(--radius-panel); box-shadow: var(--shadow-1); }
  @media (min-width: 768px) { .search { grid-template-columns: 1fr 1fr auto; align-items: end; } }
  .search__field { position: relative; display: grid; gap: var(--space-1); padding: var(--space-2) var(--space-3); background: var(--color-surface); border-radius: var(--radius-control); }
  .search__field label { font-size: var(--text-14); font-weight: 600; }
  .search__icon { position: absolute; top: var(--space-2); right: var(--space-3); color: var(--color-ink-muted); }
  .search__field input { min-height: var(--target-field); padding-right: var(--space-7); background: transparent; border: 1px solid transparent; border-radius: var(--radius-control); }
  .search__field input:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 1px; }
  .search__field--stub { opacity: 1; }
  .stub { margin: 0; color: var(--color-ink-muted); font-size: var(--text-14); }

  .quick { display: grid; gap: var(--space-2); }
  .quick__title { font-size: var(--text-14); font-weight: 600; }
  .quick ul { list-style: none; display: flex; flex-wrap: wrap; gap: var(--space-2); margin: 0; padding: 0; }

  .actions { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-3) var(--space-5); }
  .actions :global(.emergency-note) { flex-basis: 100%; }
  .phone { display: inline-flex; align-items: center; gap: var(--space-2); min-height: var(--target); font-weight: 600; text-decoration: underline; }

  .art { position: relative; }
  .art :global(.photo) { border-radius: var(--radius-panel); box-shadow: var(--shadow-2); }
  .badge { position: absolute; top: var(--space-4); right: var(--space-4); display: flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-4); background: var(--color-card); border: var(--hairline); border-radius: var(--radius-card); box-shadow: var(--shadow-2); font-size: var(--text-14); font-weight: 600; }

  @media (prefers-reduced-motion: no-preference) {
    @keyframes hero-rise { from { opacity: 0; transform: translateY(12px); } }
    @keyframes hero-settle { from { opacity: 0; transform: scale(1.04); } }
    :global(html:not([data-motion='off'])) .copy > * { animation: hero-rise 400ms cubic-bezier(0.22, 1, 0.36, 1) backwards; }
    :global(html:not([data-motion='off'])) .copy > :nth-child(2) { animation-delay: 60ms; }
    :global(html:not([data-motion='off'])) .copy > :nth-child(n + 3) { animation-delay: 120ms; }
    :global(html:not([data-motion='off'])) .art :global(.photo img) { animation: hero-settle 600ms cubic-bezier(0.22, 1, 0.36, 1) backwards; }
  }
</style>
```

The insurance field is a labelled stub, not a `<select>`: a disabled control reads as broken, while honest text reads as pending. The form still submits to `/team/` with the query, which Task 13 wires up.

- [ ] **Step 2: Pass the new props from `src/pages/index.astro`**

Add after the `treats` line:

```astro
const quickLinks = services.slice(0, 4).map((s) => ({ label: s.title, href: `/services/${s.slug}/` }));
```

The floating average-rating card from the Stitch hero is not reproduced here. It would show a rating on AU, which deliberately shows no review quotes. It is rebuilt per market inside `ReviewsBand` in Task 12, where the existing `data-empty` machinery already decides what each market may see.

- [ ] **Step 3: Update the `Hero` call site in `src/pages/index.astro`**

```astro
  <Hero name={clinic.name} treats={treats} preset={preset} variants={variants} bookingOn={on('booking')} emergencyOn={on('emergency')} photo={photo('hero')} quickLinks={quickLinks} acceptingNew={acceptingNew} />
```

- [ ] **Step 4: Build and check**

Run: `SITE=fernway-au npx astro build --outDir dist/fernway-au`
Expected: succeeds, and `dist/fernway-au/index.html` contains `id="hero-q"`, `name="q"`, `action="/team/"` and `Popular searches`.

- [ ] **Step 5: Check the tap targets by hand in the browser**

Run: `SITE=fernway-au npx astro dev`, open `http://localhost:4321/` at 375px wide, and confirm every link and button in `.hero` is at least 44px tall. Stop the server.

- [ ] **Step 6: Commit**

```bash
git add src/sections/Hero.astro src/pages/index.astro
git commit -m "feat: Stitch hero with a real search box and honest insurer stub"
```

---

### Task 9: Utility bar, header and footer

**Files:**
- Create: `src/layouts/UtilityBar.astro`
- Modify: `src/layouts/Header.astro`
- Modify: `src/layouts/Footer.astro`
- Modify: `src/layouts/BaseLayout.astro`

- [ ] **Step 1: Create `src/layouts/UtilityBar.astro`**

It lives in `layouts/` because it reads `site.market`, which the boundary rule permits only in `presets` and `layouts`.

```astro
---
/** Thin bar above the header: the after-hours line, the address and the phone number. */
import { site, allSites } from '@/config';
import Icon from '@/core/ui/Icon.astro';
import { marketVariants, telHref } from './site';

const variants = marketVariants(site, allSites());
const booking = site.modules.includes('booking');
---

<div class="bar">
  {variants.map((v) => (
    <div class="inner" data-market-only={v.id}>
      <p class="hours"><Icon name="clock" size={16} /> {v.clinic.emergency.text}</p>
      <p class="where">
        <Icon name="map-pin" size={16} />
        {v.clinic.address.street}, {v.clinic.address.locality} {v.clinic.address.region} {v.clinic.address.postcode}
      </p>
      <a class="call" href={telHref(v.clinic.phone, v.id)}>
        <Icon name="phone" size={16} />
        {v.clinic.phone}
      </a>
    </div>
  ))}
  {booking && <p class="book"><a href="/book/">{site.preset.copy.bookLabel}</a></p>}
</div>

<style>
  .bar { background: var(--color-surface); color: var(--color-ink); font-size: var(--text-14); }
  .inner, .book { max-width: 72rem; margin: 0 auto; padding: 0 var(--space-4); }
  .inner { display: none; align-items: center; gap: var(--space-5); min-height: var(--target); }
  .book { display: flex; align-items: center; min-height: var(--target); }
  .book a { display: inline-flex; align-items: center; gap: var(--space-2); min-height: var(--target); font-weight: 600; }
  p { margin: 0; }
  .hours, .where { display: inline-flex; align-items: center; gap: var(--space-2); }
  .hours { color: var(--color-primary-text); font-weight: 600; }
  .call { display: inline-flex; align-items: center; gap: var(--space-2); min-height: var(--target); margin-left: auto; font-weight: 600; }
  @media (min-width: 768px) { .inner { display: flex; } .book { display: none; } }
</style>
```

Both `.inner a` and `.book a` carry `min-height: var(--target)` because `tests/e2e/quality.e2e.mjs` measures every `a` inside `header` at 375px and fails under 44px.

- [ ] **Step 2: Put the utility bar inside the header in `src/layouts/Header.astro`**

Add the import and the component:

```astro
import UtilityBar from './UtilityBar.astro';
```

```astro
<header class="header">
  <UtilityBar />
  <div class="bar">
```

Restyle the bar to the Stitch header: white surface, hairline bottom border, 16px radii on the controls, and the call link in teal.

Replace the `<style>` block with:

```css
  .header { background: var(--color-card); border-bottom: var(--hairline); position: relative; z-index: 20; view-transition-name: site-header; }
  .bar { display: flex; align-items: center; gap: var(--space-4); max-width: 72rem; margin: 0 auto; padding: var(--space-3) var(--space-4); }
  .wordmark { display: inline-flex; align-items: center; min-height: var(--target); margin-right: auto; font-size: var(--text-20); font-weight: 700; letter-spacing: var(--track-heading); text-decoration: none; }
  .nav ul { display: flex; gap: var(--space-1); list-style: none; margin: 0; padding: 0; }
  .nav a { display: inline-flex; align-items: center; min-height: var(--target); padding: 0 var(--space-3); border-radius: var(--radius-control); font-weight: 600; text-decoration: none; }
  .nav a[aria-current='page'] { background: var(--color-surface); }
  .cta { flex: none; }
  .cta :global(.btn) { white-space: nowrap; }
  .nav a, .wordmark, .call { white-space: nowrap; }
  .call { display: inline-flex; align-items: center; gap: var(--space-2); min-height: var(--target); color: var(--color-primary-text); font-weight: 600; text-decoration: none; }
  .menu { display: none; min-width: var(--target); min-height: var(--target); align-items: center; justify-content: center; background: transparent; border: 1px solid var(--color-field-border); border-radius: var(--radius-control); }
  @media (hover: hover) and (pointer: fine) { .nav a:hover { background: var(--color-surface); } }
  @media (max-width: 1023px) {
    .menu { display: inline-flex; }
    .call span, .cta { display: none; }
    .nav { display: none; position: absolute; left: 0; right: 0; top: 100%; background: var(--color-card); border-bottom: var(--hairline); padding: var(--space-2) var(--space-4); z-index: 20; }
    .nav[data-open] { display: block; }
    .nav ul { flex-direction: column; }
  }
```

The call link must keep an `aria-label` starting with "Call" and hide its `<span>` on mobile, because `tests/e2e/shell.e2e.mjs` asserts exactly that. Wrap the number in a `<span>` if it is not already.

- [ ] **Step 3: Restyle the footer in `src/layouts/Footer.astro`**

Add a newsletter stub and a patient-portal stub inside `.inner`, so the Stitch footer composition survives. Both are labelled notes, not forms: there is no mailing list service and no patient authentication in this project, and a disabled credential field would be a false affordance.

```astro
<div class="stub" role="note">
  <h2 class="stub__title">Newsletter</h2>
  <p class="stub__body">We have no mailing list service yet, so there is nothing to sign up for. Call the clinic and ask to be added when we have one.</p>
</div>
<div class="stub" role="note">
  <h2 class="stub__title">Patient portal</h2>
  <p class="stub__body">There is no patient portal and no online sign-in. Everything on this site works without an account, and your records are not stored here.</p>
</div>
<p class="stub" role="note">
  <h2 class="stub__title">Accreditation</h2>
  <p class="stub__body">Accreditation badges are not shown until the clinic has confirmed them in writing. Ask us which bodies our clinicians are registered with.</p>
</p>
```

Replace the footer `<style>` block with:

```css
  .footer { margin-top: var(--space-8); background: var(--color-surface); border-top: var(--hairline); font-size: var(--text-16); }
  .inner { max-width: 72rem; margin: 0 auto; padding: var(--space-7) var(--space-4); display: grid; gap: var(--space-6); }
  @media (min-width: 768px) { .inner { grid-template-columns: 1fr 2fr; } }
  @media (min-width: 1024px) { .inner { grid-template-columns: 1fr 1fr 2fr; } }
  ul { list-style: none; margin: 0; padding: 0; }
  li a, .identity a { display: inline-flex; align-items: center; min-height: var(--target); }
  .identity { display: grid; gap: var(--space-2); align-content: start; }
  .name { font-weight: 700; }
  address { font-style: normal; }
  .policies { display: flex; flex-wrap: wrap; gap: var(--space-4); }
  .stub { display: grid; gap: var(--space-2); align-content: start; padding: var(--space-5); background: var(--color-card); border: var(--hairline); border-radius: var(--radius-card); }
  .stub__title { font-size: var(--text-20); }
  .stub__body { margin: 0; color: var(--color-ink-muted); font-size: var(--text-14); }
```

- [ ] **Step 4: Build all three sites**

Run: `npm run build:all`
Expected: three successful builds.

- [ ] **Step 5: Run the shell e2e against one site**

Run: `SITE=fernway-au npx astro build --outDir dist/fernway-au` then
`SITE=fernway-au npx astro preview --outDir dist/fernway-au --port 4321`
and in another shell
`SITE_ID=fernway-au SITE_URL=http://localhost:4321 node tests/e2e/shell.e2e.mjs`
Expected: every step reports `ok`. If the mobile tap-target check fails, the offending utility bar link is missing `min-height: var(--target)`.

- [ ] **Step 6: Commit**

```bash
git add src/layouts/UtilityBar.astro src/layouts/Header.astro src/layouts/Footer.astro
git commit -m "feat: Stitch utility bar, header and footer"
```

---

### Task 10: Services as a card grid

**Files:**
- Modify: `src/sections/ServicesBand.astro`
- Modify: `src/modules/services/ServiceList.astro`
- Modify: `src/pages/index.astro`

This is the change that retires the "services are a list" rule. `tests/e2e/home.e2e.mjs` asserts `#services li` is at least 3 and that from-prices appear only where the market allows, so both must survive the grid.

- [ ] **Step 1: Rewrite `src/sections/ServicesBand.astro`**

```astro
---
/** Services as cards. Each names the clinicians who provide it and links to the service page. */
import Card from '@/core/ui/Card.astro';
import Icon from '@/core/ui/Icon.astro';
import type { MarketId, MarketPack } from '@/domain/markets';
import { fromPriceLabel } from '@/modules/services/from-price';

interface Props {
  services: { slug: string; title: string; summary: string; fromPrice?: number; providers: string[] }[];
  /** Provider slug to display name, for naming who provides each service. */
  providerNames: Record<string, string>;
  variants: { id: MarketId; market: MarketPack }[];
}
const { services, providerNames, variants } = Astro.props;
---

<section id="services" aria-labelledby="services-title">
  <div class="head">
    <h2 id="services-title">Our services</h2>
    <a class="all" href="/services/">
      All {services.length} services
      <Icon name="arrow-right" size={18} />
    </a>
  </div>
  <ul class="grid" data-reveal-group>
    {services.map((s) => {
      const names = s.providers.map((slug) => providerNames[slug]).filter(Boolean);
      return (
        <li>
          <Card interactive>
            <h3><a href={`/services/${s.slug}/`}>{s.title}</a></h3>
            <p>{s.summary}</p>
            {names.length > 0 && <p class="who"><Icon name="stethoscope" size={18} /> {names.join(', ')}</p>}
            <p class="foot">
              {variants.map((v) => {
                const label = fromPriceLabel(s, v.market);
                return label && <span class="price" data-market-only={v.id}>{label}</span>;
              })}
              <a class="more" href={`/services/${s.slug}/`}>
                About this service
                <Icon name="chevron-right" size={18} />
              </a>
            </p>
          </Card>
        </li>
      );
    })}
  </ul>
</section>

<style>
  .head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: var(--space-2); }
  .all { display: inline-flex; align-items: center; gap: var(--space-1); min-height: var(--target); color: var(--color-primary-text); font-weight: 600; text-decoration: none; }
  @media (hover: hover) { .all:hover { text-decoration: underline; } }
  .grid { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--space-4); }
  @media (min-width: 640px) { .grid { grid-template-columns: repeat(2, 1fr); } }
  @media (min-width: 1024px) { .grid { grid-template-columns: repeat(3, 1fr); } }
  h3 { font-size: var(--text-20); }
  h3 a { display: inline-flex; align-items: center; min-height: var(--target); text-decoration: none; }
  p { color: var(--color-ink-muted); }
  .who { display: flex; align-items: flex-start; gap: var(--space-2); font-size: var(--text-14); }
  .foot { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--space-2); padding-top: var(--space-2); border-top: var(--hairline); }
  .price { color: var(--color-ink); font-weight: 600; }
  .more { display: inline-flex; align-items: center; gap: var(--space-1); min-height: var(--target); color: var(--color-primary-text); font-weight: 600; text-decoration: none; }
  @media (hover: hover) { .more:hover { text-decoration: underline; } }
</style>
```

- [ ] **Step 2: Pass `providerNames` from `src/pages/index.astro`**

Add the import:

```astro
import { providersBySlug } from '@/modules/providers/lookup';
```

Add after the `services` line:

```astro
const providerNames = Object.fromEntries([...providersBySlug(providers)].map(([slug, p]) => [slug, p.name]));
```

And change the `ServicesBand` call to:

```astro
    {services.length > 0 && <ServicesBand services={services} providerNames={providerNames} variants={variants} />}
```

- [ ] **Step 3: Restyle `src/modules/services/ServiceList.astro` as cards**

Keep the same `Props` and the same from-price logic. Replace the template and styles with:

```astro
<ul class="grid" data-reveal-group>
  {services.map((s) => (
    <li>
      <div class="card">
        <h2><a href={`/services/${s.slug}/`}>{s.title}</a></h2>
        <p>{s.summary}</p>
        <p class="meta">
          <span>{s.duration}</span>
          {variants.map((v) => {
            const label = fromPriceLabel(s, v.market);
            return label && <span data-market-only={v.id}>{label}</span>;
          })}
        </p>
      </div>
    </li>
  ))}
</ul>
```

```css
  .grid { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--space-4); }
  @media (min-width: 640px) { .grid { grid-template-columns: repeat(2, 1fr); } }
  @media (min-width: 1024px) { .grid { grid-template-columns: repeat(3, 1fr); } }
  .card { display: grid; gap: var(--space-3); align-content: start; height: 100%; padding: var(--space-5); background: var(--color-card); border: var(--hairline); border-radius: var(--radius-card); box-shadow: var(--shadow-1); }
  h2 { font-size: var(--text-20); }
  h2 a { display: inline-flex; align-items: center; min-height: var(--target); text-decoration: none; }
  p { color: var(--color-ink-muted); }
  .meta { display: flex; flex-wrap: wrap; gap: var(--space-3); color: var(--color-ink); font-weight: 600; }
  .meta span:not([data-market-only]) { font-weight: 400; color: var(--color-ink-muted); }
```

The class is `card` here rather than the `Card.astro` component because this file sits in `modules/services`, and importing `core/ui/Card.astro` from a module is allowed but would import a component whose styles are scoped; keeping the markup local here keeps the ruled-row and card treatments independent. If you prefer one card, import `Card` from `@/core/ui/Card.astro` and drop the local `.card` rules.

- [ ] **Step 4: Build and run the home e2e**

Run: `SITE=fernway-au npx astro build --outDir dist/fernway-au`, preview on 4321, then
`SITE_ID=fernway-au SITE_URL=http://localhost:4321 node tests/e2e/home.e2e.mjs`
Expected: all steps `ok`, including `services band has from prices only where allowed`.

- [ ] **Step 5: Commit**

```bash
git add src/sections/ServicesBand.astro src/modules/services/ServiceList.astro src/pages/index.astro
git commit -m "feat: services as a card grid, each naming its clinicians"
```

---

### Task 11: Features, urgent care and coverage bands

**Files:**
- Create: `src/sections/FeaturesBand.astro`
- Create: `src/sections/UrgentBand.astro`
- Create: `src/sections/CoverageBand.astro`
- Modify: `src/pages/index.astro`

Every number and claim in these three sections is stubbed. They must respect `isOn()` the way `ServicesBand` and `ReviewsBand` do, or the `fixture-minimal` and `fixture-no-booking` builds break in Task 16.

- [ ] **Step 1: Create `src/sections/FeaturesBand.astro`**

The four Stitch feature cards describe on-site lab work, a pharmacy, imaging and an app. None of that exists in this project, so all four are labelled stubs. The photo is the real `treatment-room-physio` slot for Fernway.

```astro
---
/** Why choose us: a room photo, and the facilities this clinic has not published yet. */
import Card from '@/core/ui/Card.astro';
import Eyebrow from '@/core/ui/Eyebrow.astro';
import Icon from '@/core/ui/Icon.astro';
import type { IconName } from '@/core/ui/icons';
import Photo from '@/core/ui/Photo.astro';

interface Props {
  /** Room slot for the photograph. Omit to render no picture. */
  photo?: { slot: string; alt: string };
}

const { photo } = Astro.props;

const PENDING: { icon: IconName; title: string; body: string }[] = [
  { icon: 'flask', title: 'On-site pathology', body: 'Not published yet. Ask us whether samples are taken here or referred.' },
  { icon: 'pill', title: 'Dispensing on site', body: 'Not published yet. Ask us whether prescriptions can be filled before you leave.' },
  { icon: 'scan-line', title: 'Imaging', body: 'Not published yet. Ask us whether imaging happens here or nearby.' },
  { icon: 'smartphone', title: 'An app', body: 'There is no app. Booking and every form on this site work without one.' },
];
---

<section id="facilities" aria-labelledby="facilities-title" data-reveal>
  <div class="split">
    <div class="art">
      {photo && <Photo slot={photo.slot} alt={photo.alt} ratio="4 / 3" sizes="(min-width: 1024px) 560px, 100vw" />}
      <p class="callout">
        <Icon name="clock" size={22} />
        <span>
          <strong>Same-day results</strong>
          <br />
          Turnaround times are not published yet. Ask when you book.
        </span>
      </p>
    </div>
    <div class="copy">
      <Eyebrow>What this clinic has</Eyebrow>
      <h2 id="facilities-title">Facilities, stated honestly</h2>
      <p class="lede">We would rather tell you what we can do than list things we have not confirmed. Anything below marked as not published is a question to ask us, not a claim.</p>
      <ul class="cards">
        {PENDING.map((p) => (
          <li>
            <Card>
              <span class="icon"><Icon name={p.icon} size={22} /></span>
              <h3>{p.title}</h3>
              <p>{p.body}</p>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  </div>
</section>

<style>
  .split { display: grid; gap: var(--space-6); align-items: start; }
  @media (min-width: 1024px) { .split { grid-template-columns: 1fr 1fr; column-gap: var(--space-7); } }
  .art { position: relative; }
  .art :global(.photo) { border-radius: var(--radius-panel); box-shadow: var(--shadow-1); }
  .callout { position: absolute; right: var(--space-4); bottom: calc(-1 * var(--space-4)); display: flex; align-items: flex-start; gap: var(--space-3); max-width: 20rem; padding: var(--space-4); background: var(--color-card); border: var(--hairline); border-radius: var(--radius-card); box-shadow: var(--shadow-2); font-size: var(--text-14); }
  .lede { font-size: var(--text-18); color: var(--color-ink-muted); }
  .cards { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--space-4); }
  @media (min-width: 640px) { .cards { grid-template-columns: repeat(2, 1fr); } }
  h3 { font-size: var(--text-18); }
  .cards p { color: var(--color-ink-muted); font-size: var(--text-14); }
  .icon { display: grid; place-items: center; width: 40px; height: 40px; background: var(--color-surface); border-radius: var(--radius-control); color: var(--color-primary); }
</style>
```

- [ ] **Step 2: Create `src/sections/UrgentBand.astro`**

```astro
---
/** Out-of-hours and emergency information. Live status claims are not made, because nothing here knows them. */
import Eyebrow from '@/core/ui/Eyebrow.astro';
import Icon from '@/core/ui/Icon.astro';
import type { MarketId } from '@/domain/markets';
import type { Clinic } from '@/domain/types';
import EmergencyNote from '@/modules/emergency/EmergencyNote.astro';

interface Props {
  variants: { id: MarketId; clinic: Clinic; tel: string }[];
  preset: Preset;
  emergencyOn: boolean;
  /** Hours already formatted per market, keyed by market id. */
  hours: Record<string, string[]>;
}
const { variants, preset, emergencyOn, hours } = Astro.props;
---

<section id="urgent" aria-labelledby="urgent-title" data-reveal>
  <div class="inner">
    <div class="lead">
      <Eyebrow>Urgent and after hours</Eyebrow>
      <h2 id="urgent-title">When you cannot wait for an appointment</h2>
      {variants.map((v) => (
        <div data-market-only={v.id}>
          {emergencyOn && <EmergencyNote clinic={v.clinic} preset={preset} compact />}
          <ul class="times">
            {(hours[v.id] ?? []).map((h) => <li>{h}</li>)}
          </ul>
        </div>
      ))}
    </div>
    <div class="aside">
      <p class="stub" role="note">
        <Icon name="clock" size={20} />
        <span>
          <strong>No live waiting time on this site.</strong>
          <br />
          We do not publish a queue, because nothing here measures one. Call and we will tell you what we know.
        </span>
      </p>
      <p class="stub" role="note">
        <Icon name="video" size={20} />
        <span>
          <strong>No video visits.</strong>
          <br />
          This clinic does not run telehealth, so there is nothing to start.
        </span>
      </p>
      {variants.map((v) => (
        <p class="cta" data-market-only={v.id}>
          <a class="call" href={v.tel}><Icon name="phone" size={20} /> Call {v.clinic.phone}</a>
          <a class="map" href={`https://www.openstreetmap.org/?mlat=${v.clinic.map.lat}&mlon=${v.clinic.map.lng}#map=17/${v.clinic.map.lat}/${v.clinic.map.lng}`}>
            <Icon name="navigation" size={20} /> Directions
          </a>
        </p>
      ))}
    </div>
  </div>
</section>

<style>
  .inner { display: grid; gap: var(--space-5); padding: var(--space-5); background: var(--color-card); border: var(--hairline); border-radius: var(--radius-panel); box-shadow: var(--shadow-1); }
  @media (min-width: 1024px) { .inner { grid-template-columns: 3fr 2fr; align-items: center; gap: var(--space-7); padding: var(--space-6); } }
  .lead { display: grid; gap: var(--space-3); }
  .times { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--space-1); color: var(--color-ink-muted); }
  .aside { display: grid; gap: var(--space-3); }
  .stub { display: flex; align-items: flex-start; gap: var(--space-3); margin: 0; padding: var(--space-4); background: var(--color-surface); border-radius: var(--radius-card); font-size: var(--text-14); }
  .cta { display: flex; flex-wrap: wrap; gap: var(--space-2); margin: 0; }
  .call, .map { display: inline-flex; align-items: center; gap: var(--space-2); min-height: var(--target); padding: 0 var(--space-4); border-radius: var(--radius-control); font-weight: 600; text-decoration: none; }
  .call { background: var(--color-primary); color: var(--color-on-ink); }
  .map { background: var(--color-surface); color: var(--color-ink); }
</style>
```

`EmergencyNote` takes a `preset` for its copy. Check its signature before wiring: if `preset` is required, pass the real preset down from `index.astro` instead of `null`.

- [ ] **Step 3: Create `src/sections/CoverageBand.astro`**

```astro
---
/** Fees, which are real, beside the insurer list, which is not published yet. */
import Eyebrow from '@/core/ui/Eyebrow.astro';
import Icon from '@/core/ui/Icon.astro';

interface Props {
  feesOn: boolean;
  priceListOn: boolean;
}
const { feesOn, priceListOn } = Astro.props;
const selfPayHref = priceListOn ? '/prices/' : '/fees/';

const CARRIERS = ['Not yet listed', 'Not yet listed', 'Not yet listed', 'Not yet listed', 'Not yet listed', 'Not yet listed'];
---

{(feesOn || priceListOn) && (
  <section id="coverage" aria-labelledby="coverage-title" data-reveal>
    <div class="inner">
      <div class="lead">
        <Eyebrow>Fees and cover</Eyebrow>
        <h2 id="coverage-title">We publish what things cost before you book</h2>
        <p>Every fee for every service is on this site, so there is nothing to ask for at reception and nothing to be surprised by later.</p>
        <ul class="links">
          <li>
            <a href={selfPayHref}>
              See our {priceListOn ? 'price list' : 'fees'}
              <Icon name="chevron-right" size={18} />
            </a>
          </li>
          <li>
            <span class="stub" role="note">Which insurers we work with is not published yet. Call us and we will check your cover.</span>
          </li>
        </ul>
      </div>
      <ul class="carriers" aria-label="Insurer list, not yet published">
        {CARRIERS.map((c) => <li>{c}</li>)}
      </ul>
    </div>
  </section>
)}

<style>
  .inner { display: grid; gap: var(--space-6); padding: var(--space-6); background: var(--color-card); border: var(--hairline); border-radius: var(--radius-panel); box-shadow: var(--shadow-1); }
  @media (min-width: 1024px) { .inner { grid-template-columns: 3fr 2fr; align-items: center; gap: var(--space-7); } }
  .lead { display: grid; gap: var(--space-3); }
  .lead p { color: var(--color-ink-muted); }
  .links { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--space-2); }
  .links a { display: inline-flex; align-items: center; gap: var(--space-1); min-height: var(--target); color: var(--color-primary-text); font-weight: 600; }
  .stub { display: block; color: var(--color-ink-muted); font-size: var(--text-14); }
  .carriers { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--space-2); grid-template-columns: repeat(2, 1fr); }
  .carriers li { display: grid; place-items: center; min-height: 48px; padding: var(--space-2); background: var(--color-surface); border-radius: var(--radius-control); color: var(--color-ink-muted); font-size: var(--text-14); font-weight: 600; text-align: center; }
</style>
```

- [ ] **Step 4: Wire all three into `src/pages/index.astro`**

Add the imports, then inside `<div class="stack">`:

```astro
    {on('emergency') && <UrgentBand variants={variants} preset={preset} emergencyOn={on('emergency')} hours={Object.fromEntries(variants.map((v) => [v.id, v.hours]))} />}
```

place it after `FirstVisit`, and:

```astro
    {roomPhoto && <FeaturesBand photo={roomPhoto} />}
```

after `Location`, and:

```astro
    <CoverageBand feesOn={on('fees')} priceListOn={on('price-list')} />
```

after `FeesTeaser`.

`FirstVisit` already renders `photo('firstVisit')`, so `FeaturesBand` takes the exterior slot instead. Add one line next to the other `photo` calls in `index.astro`:

```astro
const roomPhoto = on('services') ? photo('exterior') : undefined;
```

and drop `photo('exterior')` from the `Location` call so only one component claims that slot:

```astro
    <Location variants={variants} />
```

- [ ] **Step 5: Build every site and the fixtures**

Run: `npm run build:all`, then `SITE=fixture-minimal npx astro build --outDir dist/fixture-minimal` and `SITE=fixture-no-booking npx astro build --outDir dist/fixture-no-booking`.
Expected: four successful builds. The fixtures switch `emergency`, `fees` and `price-list` off, so `UrgentBand` and `CoverageBand` must disappear there rather than render empty.

- [ ] **Step 6: Commit**

```bash
git add src/sections/FeaturesBand.astro src/sections/UrgentBand.astro src/sections/CoverageBand.astro src/pages/index.astro
git commit -m "feat: facilities, urgent care and coverage bands with honest stubs"
```

---

### Task 12: Reviews as cards

**Files:**
- Modify: `src/modules/reviews/Reviews.astro`
- Modify: `src/sections/ReviewsBand.astro`

- [ ] **Step 1: Restyle `src/modules/reviews/Reviews.astro` as cards**

Keep the `link-only` branch exactly as it is. Replace the `display` branch and the styles:

```astro
) : (
  <ul class="list">
    {latestReviews(items).map((r) => (
      <li data-review>
        <p class="stars" role="img" aria-label={`${r.rating} out of 5`}>
          <Icon name="star" size={18} label={`${r.rating} out of 5`} />
          <span>{r.rating} out of 5</span>
        </p>
        <blockquote>{r.text}</blockquote>
        <p class="by">{r.name}, <time datetime={r.date}>{day(r.date)}</time>. {r.source}.</p>
      </li>
    ))}
  </ul>
)}
```

```css
  .list { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--space-4); }
  @media (min-width: 768px) { .list { grid-template-columns: repeat(3, 1fr); } }
  li { display: grid; gap: var(--space-3); align-content: start; padding: var(--space-5); background: var(--color-card); border: var(--hairline); border-radius: var(--radius-card); box-shadow: var(--shadow-1); }
  .stars { display: flex; align-items: center; gap: var(--space-2); margin: 0; color: var(--color-primary-text); font-size: var(--text-14); font-weight: 600; }
  blockquote { margin: 0; }
  .by { margin: 0; color: var(--color-ink-muted); font-size: var(--text-14); }
  .link { display: inline-flex; align-items: center; min-height: var(--target); text-decoration: underline; }
```

Add `import Icon from '@/core/ui/Icon.astro';` at the top. Two nodes describing the same rating is redundant for a screen reader, so the `<p>` keeps the text and the icon is decorative:

```astro
        <p class="stars">
          <Icon name="star" size={18} />
          <span>{r.rating} out of 5</span>
        </p>
```

- [ ] **Step 2: Add the floating average rating to `src/sections/ReviewsBand.astro`**

This is where the Stitch hero's floating 4.9/5.0 card belongs, because `ReviewsBand` already knows which market may show quotes. Add the import:

```astro
import { formatRating } from '@/modules/stats/metrics';
```

`items` is already a prop of `ReviewsBand`. Add one derived value before the template:

```astro
const rated = variants.filter((v) => v.market.reviews === 'display' && items.length > 0).map((v) => v.id);
```

Add an eyebrow above the heading:

```astro
    <Eyebrow>Patient experience</Eyebrow>
    <h2 id="reviews-title">What patients say</h2>
```

Add the floating card, hidden in any market that shows no quotes:

```astro
    {rated.length > 0 && (
      <p class="float" data-float-rating>
        <span class="float__value">{formatRating(items.map((r) => r.rating))} out of 5</span>
        <span class="float__note">From {items.length} published reviews</span>
      </p>
    )}
```

Add to the same file's `<style>` block:

```css
  .float { display: flex; flex-wrap: wrap; align-items: baseline; gap: var(--space-2); justify-self: start; padding: var(--space-3) var(--space-5); background: var(--color-card); border: var(--hairline); border-radius: var(--radius-card); box-shadow: var(--shadow-1); }
  .float__value { font-size: var(--text-20); font-weight: 700; color: var(--color-primary-text); }
  .float__note { color: var(--color-ink-muted); font-size: var(--text-14); }
  html[data-market='AU'] [data-float-rating], html[data-market='CA'] [data-float-rating] { display: none; }
```

The `html[data-market]` rule hides the card in AU, matching the existing `data-empty` pattern in this file. Leave the `data-empty` mechanism and its `is:global` block untouched: that is what hides the whole band in a market with nothing to show, and `tests/e2e/home.e2e.mjs` depends on AU showing no quotes.

- [ ] **Step 3: Build and run the home e2e for both Fernway markets**

Run: `npm run build:all`, preview `fernway-au` on 4321, then
`SITE_ID=fernway-au SITE_URL=http://localhost:4321 node tests/e2e/home.e2e.mjs`
Expected: all steps `ok`, in particular `AU home shows no review quotes` and `services band has from prices only where allowed`.

- [ ] **Step 4: Commit**

```bash
git add src/modules/reviews/Reviews.astro src/sections/ReviewsBand.astro
git commit -m "feat: reviews as cards"
```

---

### Task 13: Team page with a working query filter

**Files:**
- Create: `src/core/provider-filter.ts`
- Modify: `src/modules/providers/ProviderList.astro`
- Modify: `src/sections/TeamRow.astro`
- Modify: `src/pages/team/[...slug].astro`
- Modify: `src/sections/PageHeader.astro`
- Modify: `tests/unit/search.test.ts`

`/team/?q=` has to work on a statically generated page, so the filter is client-side: the markup for every provider is in the HTML and the script only toggles `hidden`. It reuses `matchesQuery` from Task 7.

- [ ] **Step 1: Create `src/core/provider-filter.ts`**

It goes in `core` because both `modules/providers/ProviderList.astro` and any layout may import it, and `modules` must not import from `layouts`. `core` imports nothing outside `core`, and this file imports nothing at all.

```ts
/** Client: filter the team list from a ?q= in the URL. Markup for every clinician is in the page. */

/** Visible count for the status line beside the filter. */
export function filterSummary(shown: number, total: number): string {
  return shown === total ? `${total} listed` : `Showing ${shown} of ${total}`;
}

export function initProviderFilter(doc: Document = document): void {
  const list = doc.querySelector<HTMLElement>('[data-provider-list]');
  const input = doc.querySelector<HTMLInputElement>('[data-provider-filter]');
  const count = doc.querySelector<HTMLElement>('[data-provider-count]');
  if (!list || !input) return;
  const rows = [...list.querySelectorAll<HTMLElement>('[data-provider]')];

  const apply = () => {
    const query = input.value.trim().toLocaleLowerCase();
    let shown = 0;
    for (const row of rows) {
      // data-search is already lowercased and accent-stripped at build time by normalise().
      const match = query === '' || (row.dataset.search ?? '').includes(query);
      row.hidden = !match;
      if (match) shown += 1;
    }
    if (count) count.textContent = filterSummary(shown, rows.length);
  };

  input.addEventListener('input', apply);
  const initial = new URLSearchParams(doc.defaultView?.location.search ?? '').get('q');
  if (initial) input.value = initial;
  apply();
}
```

Whole-phrase matching against one pre-lowercased string, not the every-term rule from `matchesQuery`. That is deliberate: the hero search box sends one phrase typed by a visitor, and this keeps a second implementation of the matching rule out of the page bundle. Add a unit test for `filterSummary` in `tests/unit/search.test.ts`:

```ts
describe('filterSummary', () => {
  it.each([
    [6, 6, '6 listed'],
    [3, 6, 'Showing 3 of 6'],
    [0, 6, 'Showing 0 of 6'],
  ])('%i of %i reads %j', (shown, total, expected) => {
    expect(filterSummary(shown as number, total as number)).toBe(expected);
  });
});
```

with `import { filterSummary } from '@/core/provider-filter';` added to that file.

- [ ] **Step 2: Restyle `src/modules/providers/ProviderList.astro` as cards with filter hooks**

```astro
---
/** Team as cards. Markup for every clinician is rendered; `?q=` filters client-side. */
import Photo from '@/core/ui/Photo.astro';
import Icon from '@/core/ui/Icon.astro';
import { normalise } from './search';
import { initials } from './registration';

interface Props {
  providers: { slug: string; name: string; role: string; languages: string[]; services: string[]; acceptingNew: boolean; photoSlot: string }[];
  /** Plural noun for the count line, from the preset, so a vet clinic does not read "clinicians". */
  clinicianNoun: string;
}
const { providers, clinicianNoun } = Astro.props;
const terms = (p: Props['providers'][number]) => normalise([p.name, p.role, ...p.languages, ...p.services].join(' '));
---

<label class="filter" for="provider-filter">
  <span class="filter__label">Search the team</span>
  <span class="filter__control">
    <Icon name="search" size={20} />
    <input id="provider-filter" type="search" data-provider-filter placeholder="Name, specialty or language" />
  </span>
</label>
<p class="count" role="status" data-provider-count>{providers.length} listed</p>

<ul class="grid" data-provider-list data-reveal-group>
  {providers.map((p) => (
    <li data-provider data-search={terms(p)}>
      <Photo slot={p.photoSlot} alt={`${p.name}, ${p.role}`} initials={initials(p.name)} ratio="1 / 1" sizes="(min-width: 1024px) 280px, 100vw" class="pic" />
      <h2><a href={`/team/${p.slug}/`}>{p.name}</a></h2>
      <p class="role">{p.role}</p>
      <p class="lang">Speaks {p.languages.join(', ')}</p>
      {p.acceptingNew ? (
        <p class="open"><Icon name="badge-check" size={18} /> Taking new patients</p>
      ) : (
        <p class="shut">Not accepting new patients</p>
      )}
    </li>
  ))}
</ul>

<script>
  import { initProviderFilter } from '@/core/provider-filter';
  initProviderFilter();
</script>
```

Styles:

```css
  .filter { display: grid; gap: var(--space-2); margin-bottom: var(--space-3); }
  .filter__label { font-weight: 600; }
  .filter__control { display: flex; align-items: center; gap: var(--space-2); padding: 0 var(--space-3); background: var(--color-card); border: var(--hairline); border-radius: var(--radius-control); box-shadow: var(--shadow-1); color: var(--color-ink-muted); }
  .filter__control input { flex: 1; min-height: var(--target-field); background: transparent; border: 1px solid transparent; }
  .count { margin: 0 0 var(--space-4); color: var(--color-ink-muted); }
  .grid { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--space-4); }
  @media (min-width: 640px) { .grid { grid-template-columns: repeat(2, 1fr); } }
  @media (min-width: 1024px) { .grid { grid-template-columns: repeat(3, 1fr); } }
  li { display: grid; gap: var(--space-2); align-content: start; padding: var(--space-5); background: var(--color-card); border: var(--hairline); border-radius: var(--radius-card); box-shadow: var(--shadow-1); }
  :global(li[data-provider][hidden]) { display: none; }
  h2 { font-size: var(--text-20); }
  h2 a { display: inline-flex; align-items: center; min-height: var(--target); text-decoration: none; }
  .pic { border-radius: var(--radius-card); }
  .role, .lang { margin: 0; color: var(--color-ink-muted); }
  .open { display: flex; align-items: center; gap: var(--space-2); margin: 0; color: var(--color-success); font-weight: 600; font-size: var(--text-14); }
  .shut { margin: 0; color: var(--color-warning); font-weight: 600; font-size: var(--text-14); }
  @media (hover: hover) { :global(html:not([data-motion='off'])) li:hover :global(.photo img) { transform: scale(1.03); } }
```

- [ ] **Step 3: Restyle `src/sections/TeamRow.astro` to match**

Same card treatment as the home page team band, without the filter controls. Keep `initials` and `registrationFor`. Keep the `id="team"` and `aria-labelledby="team-title"` wiring, and keep the registration lines, since `tests/e2e/shell.e2e.mjs` and the market tests read them.

- [ ] **Step 4: Update `src/pages/team/[...slug].astro`**

Give the page header a Stitch eyebrow, pass the preset noun, and keep the services list in scope so the filter can match a specialty:

```astro
import { site } from '@/config';
...
<BaseLayout title="Our team" description={`The clinicians at ${site.clinic.name}.`}>
  <PageHeader eyebrow="Clinical directory" title="Our team" lede="Registered clinicians, with their registration numbers and languages." />
  <div class="wrap"><ProviderList providers={providers} clinicianNoun={site.preset.copy.nouns.clinician} /></div>
</BaseLayout>
```

`ProviderList` already takes `services` on each provider, so the filter's specialty matching works with no change to `getStaticPaths`.

Add an `eyebrow` prop to `src/sections/PageHeader.astro`:

```astro
---
import Eyebrow from '@/core/ui/Eyebrow.astro';
interface Props {
  title: string;
  lede?: string;
  eyebrow?: string;
}
const { title, lede, eyebrow } = Astro.props;
---

<section class="page-header">
  {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
  <h1>{title}</h1>
  {lede && <p>{lede}</p>}
</section>
```

- [ ] **Step 5: Build and check the filter by hand**

Run: `SITE=fernway-au npx astro build --outDir dist/fernway-au`, preview, open `http://localhost:4321/team/?q=physio`. Expected: only clinicians whose services include physiotherapy stay visible, and the status line reads "Showing N of 6". Open with an empty query and confirm all six show.

- [ ] **Step 6: Run the unit suite and boundaries**

Run: `npm test`
Expected: all pass. The new `core/provider-filter.ts` must not import anything outside `core`.

- [ ] **Step 7: Commit**

```bash
git add src/core/provider-filter.ts src/modules/providers/ProviderList.astro src/sections/TeamRow.astro src/pages/team tests/unit/search.test.ts src/sections/PageHeader.astro
git commit -m "feat: team cards with a working ?q= filter"
```

---

### Task 14: Services page header and CTA band

**Files:**
- Modify: `src/pages/services/[...slug].astro`
- Modify: `src/sections/CtaBand.astro`

- [ ] **Step 1: Add the eyebrow to the services page header**

```astro
  <PageHeader eyebrow="What we treat" title="Services" lede="What we offer, how long it takes and who will see you." />
```

- [ ] **Step 2: Give `CtaBand` the Stitch treatment**

Keep the `id`, `aria-labelledby`, `data-reveal` and the `variants`/`bookLabel`/`bookingOn` props. Replace the template and styles:

```astro
<section class="cta" aria-labelledby="cta-title" data-reveal>
  <div class="inner">
    <Eyebrow>Ready when you are</Eyebrow>
    <h2 id="cta-title">Book a visit, or call us</h2>
    {variants.map((v) => (
      <div class="actions" data-market-only={v.id}>
        {bookingOn && <Button href="/book/" size="lg">{bookLabel}</Button>}
        <a class="phone" href={v.tel}>
          <Icon name="phone" size={20} />
          Call {v.clinic.phone}
        </a>
      </div>
    ))}
  </div>
</section>
```

```css
  .cta { display: grid; }
  .inner { display: grid; gap: var(--space-3); justify-items: start; padding: var(--space-7) var(--space-6); background: var(--color-primary); border-radius: var(--radius-panel); box-shadow: var(--shadow-2); }
  @media (min-width: 768px) { .inner { padding: var(--space-8) var(--space-7); } }
  .inner :global(.eyebrow) { color: var(--color-on-ink); opacity: 0.85; }
  h2 { color: var(--color-on-ink); font-size: var(--text-36); }
  .actions { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-3) var(--space-5); }
  .actions :global(.btn) { background: var(--color-card); border-color: var(--color-card); color: var(--color-primary-text); }
  .phone { display: inline-flex; align-items: center; gap: var(--space-2); min-height: var(--target); color: var(--color-on-ink); font-weight: 600; }
  @media (min-width: 768px) { .inner { justify-items: start; } }
```

Add the `Eyebrow` and `Icon` imports. White on `#0d7a73` is 5.19:1, so the eyebrow at 0.85 opacity over that fill is checked by axe in Task 16; if axe flags it, drop the opacity and use full white.

- [ ] **Step 3: Build and run the home and pages e2e**

Run: `npm run build:all`, preview, then
`SITE_ID=fernway-au SITE_URL=http://localhost:4321 node tests/e2e/home.e2e.mjs` and
`SITE_ID=fernway-au SITE_URL=http://localhost:4321 node tests/e2e/pages.e2e.mjs`
Expected: all steps `ok`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/services/[...slug].astro src/sections/CtaBand.astro
git commit -m "feat: Stitch services page header and closing call to action"
```

---

### Task 15: Docs

**Files:**
- Modify: `docs/design-system.md`
- Modify: `docs/customising.md`
- Modify: `docs/build-ledger.md`
- Modify: `README.md`

- [ ] **Step 1: Rewrite `docs/design-system.md`**

The new document covers: the token table with the Stitch values and the reason `--color-primary-text` exists separately from `--color-primary`; the type scale with the Atkinson-plus-Stitch-tracking decision; radii, the 44px target floor and the 48px field height; the three elevation levels; the card, eyebrow, stat and chip primitives; the Stitch layout vocabulary now that it is the house style; the rules that survive from the old standard; and how each Stitch element resolves to real content or a labelled stub.

Write it so no heading contains two or more capitals in a row outside `ABN BN GST VAT AHPRA RCVS SMS CASL PECR AODA WCAG GP`, and no heading contains an arrow or a middle dot. Do not use "→" anywhere in a heading. Body text may use a plain "to".

- [ ] **Step 2: Update `docs/customising.md`**

Add a section on the new tokens: how to re-skin a clinic by changing the two theme blocks, why `--color-primary` and `--color-primary-text` are separate, and how to add a new photo slot (drop the file in `src/assets/photos/`, then add the slot to `photoSlots` for that content folder and to `photoAlt` with its alt text). Note that adding a slot to `photoAlt` without the file fails `tests/unit/photos.test.ts`.

- [ ] **Step 3: Append to `docs/build-ledger.md`**

A dated entry recording: the Stitch design integration, the palette and scale changes, the four new primitives, the five new sections, the two new logic modules, the sections whose data is stubbed and why, and the test files that were updated rather than weakened.

- [ ] **Step 4: Update `README.md`**

Change any line that describes the visual design so it matches the new one. Do not restate the whole design system there.

- [ ] **Step 5: Run the docs test**

Run: `npx vitest run tests/unit/docs-copy.test.ts`
Expected: PASS. If it fails on a heading, fix the heading rather than the test.

- [ ] **Step 6: Commit**

```bash
git add docs README.md
git commit -m "docs: Stitch design system, customising notes and build ledger"
```

---

### Task 16: Full verification

**Files:** none created. Fix whatever this surfaces.

- [ ] **Step 1: Unit tests and boundaries**

Run: `npm test`
Expected: `node tools/check-boundaries.mjs` silent, then all vitest suites pass.

- [ ] **Step 2: Type check**

Run: `npm run check`
Expected: no errors.

- [ ] **Step 3: Build every site, including the fixtures**

Run: `npm run build:all`
then `SITE=fixture-minimal npx astro build --outDir dist/fixture-minimal`, `SITE=fixture-no-booking npx astro build --outDir dist/fixture-no-booking`, `SITE=fixture-live npx astro build --outDir dist/fixture-live`.
Expected: six successful builds.

- [ ] **Step 4: JavaScript budget**

Run: `npm run budget`
Expected: every page under 30,720 gzipped bytes.

- [ ] **Step 5: Third-party origins**

Run: `node tools/third-party.mjs dist/fernway-au`, and the same for `fernway-ca` and `hollybank`.
Expected: no third-party script or style origins anywhere.

- [ ] **Step 6: The whole e2e suite**

Run: `npm run e2e`
Expected: all 12 suites pass for all three demo sites and all three fixtures.

- [ ] **Step 7: Fix what failed, then repeat steps 1 to 6**

When a test fails because the structure moved, update the selector or expectation to the new markup and re-point it at the equivalent element. Never delete an assertion to make a suite green. When a failure is a real accessibility or budget regression, fix the code.

The suites most likely to need updating, and what to change in each:

- `tests/e2e/home.e2e.mjs` — the section id list gains `metrics`, `urgent`, `facilities` and `coverage`. The order assertion filters to the six known ids, so it should keep passing; add the new ids to the `order` array if their placement is worth asserting.
- `tests/e2e/shell.e2e.mjs` — the mobile check expects exactly one visible `a[aria-label^="Call"]` in the header. The utility bar adds a second. Scope the selector to `header .bar a[aria-label^="Call"]`, or give the utility bar link a different label.
- `tests/e2e/quality.e2e.mjs` — scans home in both themes; the new cards, the teal CTA and the uppercase eyebrows are all newly axe-visible.
- `tests/unit/docs-copy.test.ts` — only if a doc heading was left with a capital run.

- [ ] **Step 8: Responsive pass in a real browser**

Run: `SITE=fernway-au npx astro dev`. Check `/`, `/services/`, `/team/` and `/book/` at 1440, 1024, 768 and 390 wide. Confirm: no horizontal scrollbar at any width; the hero art stacks below the copy under 1024px; the metrics grid goes 4 to 2 to 1 columns; the utility bar collapses to just the book link under 768px; the mobile bar never covers the last footer link; the provider filter remains usable at 375px.

- [ ] **Step 9: Console and network check**

In the same dev server, walk `/`, `/services/`, `/team/` and `/book/`. Confirm: no console errors or warnings; no request to any third-party origin; no 404 for a font, icon or image.

- [ ] **Step 10: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve Stitch integration test failures"
```

---

## What this plan does not cover

- **The booking flow.** Task 7 of the spec. Separate plan, sharing only Tasks 1 and 2.
- **New photo files.** No image is added. Nine slots exist in `src/assets/photos/`; run `npm run photos:status` for the list of what a real deployment still needs.
- **A patient portal, a newsletter, a live waiting time, an insurer list, telehealth or on-site pathology.** All stubbed, none built. Each would need a backend this project does not have.
- **Tailwind.** Not adopted. It would break `raw-colour-outside-tokens`, the third-party origin check and the JS budget.