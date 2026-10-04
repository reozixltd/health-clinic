# Design system

All styling is plain CSS on tokens. There is no UI framework and no Tailwind.

## Tokens

`src/styles/tokens.css` is the only file that holds raw colour values (`#hex`, `rgb(`, `hsl(`). The boundary test fails on any other file that does. Components use `var(--...)` only.

| Role | Token | Use |
|---|---|---|
| Page | `--color-paper` | Page background |
| Text | `--color-ink`, `--color-ink-muted` | Body text, secondary text |
| Surfaces | `--color-card`, `--color-surface` | Cards, quiet panels |
| Accent | `--color-accent` | Appointment card fills and selected states only, always with ink text |
| Lines | `--color-line` | Hairlines and dividers |
| Fields | `--color-field-border` | Input borders, at least 3:1 against the page |
| Text on ink | `--color-on-ink` | Text on ink-filled buttons |
| Status | `--color-success`, `--color-warning`, `--color-danger` and their `-soft` pairs | Messages and badges |
| Focus | `--color-focus` | Visible focus ring |

## Themes

| Theme | Accent | Notes |
|---|---|---|
| `fernway` | Sage | Default, defined on `:root` |
| `harbour` | Blue | Defined on `[data-theme='harbour']` |

`site.theme` is the default and `site.themes` is the list a demo visitor can switch between with `?theme=`. Outside demo mode only the configured theme applies. `tests/unit/contrast.test.ts` checks every token pair in both themes against AA. To re-skin a clinic, change the colour tokens and run `npm test`.

## Type and spacing

| Item | Value |
|---|---|
| Family | Atkinson Hyperlegible Next, variable, self-hosted (`@fontsource-variable`) |
| Body | 17px, line height 1.55, measure 68ch |
| Scale | `--text-14`, `-16`, `-18`, `-20`, `-24`, `-28`, `-36`, plus `--text-hero` (clamped, `2.25rem` to `3.5rem`) |
| Space | `--space-1` (4px) to `--space-8` (64px) |
| Radius | `--radius-control` 8px, `--radius-card` 16px, `--radius-panel` 24px, `--radius-pill` 9999px |
| Touch target | `--target` 44px |

Reading age is about 9 to 11, with sentences under 20 words. Text is sentence case and left-aligned. The grid is 12 columns from 1024px and one column below 768px, with a 16px mobile gutter.

## The appointment card

The booking request is drawn as a paper appointment card. It has the clinic's name at the top and ruled lines for service, clinician, day, time and patient name. Each choice fills a line, with a 160 ms colour fade (`--dur-fill`). The vet preset uses a pet record card with the pet's name and species line.

Rules for the card:

- It is the one bold element on the site. Elsewhere use hairlines and white space.
- It is a real `<dl>` with a text equivalent, not an image.
- It sits beside the steps on desktop and above them on mobile.
- It is also the review step, so what the patient sees is what is sent.
- `--color-accent` is used on the card fills and selected states and nowhere else.

The logic lives in `src/modules/booking/card.ts` (`cardFields`). The component is `src/modules/booking/AppointmentCard.astro`.

## Icons

Icons are inline SVG in `src/core/ui/icons.ts`, drawn on a 24x24 grid and rendered by `Icon.astro`. Inlining costs no request and lets one component own the whole contract.

| Rule | Value |
|---|---|
| Grid | 24x24, geometry centred on (12, 12) |
| Stroke | 1.75, round cap and join, `currentColor` |
| Fill | `none` |
| Corner radius on rects | `rx="2"` |
| Default size | 20, overridable per call |

`Icon.astro` sets `fill`, `stroke`, `stroke-width`, `stroke-linecap` and `stroke-linejoin` on the wrapping `<svg>`. An icon entry carries geometry attributes only — `cx`, `cy`, `d`, `height`, `r`, `rx`, `width`, `x`, `y` — and nothing else. Setting `stroke-width` or `fill` on one path would break that inheritance and theme the icon differently from its neighbours, and `opacity` or `class` would leave an icon that occupies space and reads aloud while invisible.

Geometry is Lucide's, under ISC. The header of `icons.ts` classifies all thirty-three entries into unchanged, re-serialised, adapted (thirteen) and ours (`heart-pulse`).

`size` defaults to 20. Pass it explicitly where an icon needs to be bigger or smaller; there is no named size scale.

To add one, put a single stroke-only string in the `icons` object, keyed in kebab-case. Five tests in `tests/unit/icons.test.ts` then hold it to the contract, and a name that resolves is already enforced by the type — `Icon.astro` types `name` as `keyof typeof icons`:

1. the name is in the required-names list, if a composition needs it
2. it carries geometry attributes only
3. every authored position lands in `STROKE / 2` .. `24 - STROKE / 2` — 0.875 to 23.125 — so no stroke is half-clipped by the viewBox edge
4. its exact bounding box is centred within 1.5 of (12, 12)
5. no two shapes come within a stroke width of each other, so their strokes do not merge

Test 5 is the one to expect a new icon to trip: it carries the exemptions. Shapes that are *meant* to touch — a handle rooted on a lens rim, a divider reaching both walls of a capsule — are listed in `SELF_TOUCHING`, and a test asserts each entry still genuinely touches, so an exemption cannot outlive its reason. `RESCALED` does the same job for arcs whose radius a renderer has to enlarge, and is currently empty. Test 4 has no exemptions at all.

One limit worth knowing: test 5 compares across shape elements, so two subpaths inside a single `<path>` are never checked against each other. Several icons join their own subpaths deliberately, and no distance test can tell an authored join from an accident.

## Motion

Motion is calm and brief. Movement uses only opacity and transform. Colour fades stay short.

| Where | What moves |
|---|---|
| Home hero | Photo settles from 1.04 scale, 600 ms. Text rises 12 px, 60 ms apart. |
| Sections and lists | Fade in and rise 12 px over 400 ms on entering view, once. Rows 40 ms apart, first eight. |
| Page change | 200 ms cross-fade, where supported. |
| Booking steps | Slide in 16 px from the side of travel, 250 ms. |
| Appointment card | Line fill, 160 ms colour fade. |
| Portrait rows | Portrait zooms to 1.03 on hover. |
| Buttons | Press feedback. |

To reveal an element on scroll, add `data-reveal` to it. To stagger a list, add `data-reveal-group` to the list. Do not nest one inside the other. A nested element fades in twice. The script is `src/core/motion.ts`.

`prefers-reduced-motion` removes movement and keeps short colour fades. Set `motion: false` in `src/config/sites/<id>/site.ts` to turn motion off for a clinic. Button press and the card fill stay. The staff console has no motion. Do not add parallax, pinned sections or scroll-linked effects.

## Anti-template rules

Do not add any of these:

- Carousels or popups.
- Eyebrow labels or all-caps text, including in docs headings.
- Arrow symbols on buttons, or dot separators in copy.
- Grids of identical cards. Services are a list.
- Stock photos presented as clinicians. A clinician without a portrait shows a tile with their initials. A room slot without a photo shows a labelled placeholder.
- Numbered markers anywhere except "How your first visit works" and the `/book/` steps.
- Buttons that say "Submit". Say what happens, for example "Send appointment request".

## Accessibility

WCAG 2.2 AA. Visible focus, 44px targets, a label on every control, and an error summary that takes focus on submit. The built `/book/`, `/estimates/` and `/referrers/` pages contain no third-party script origins. Page JavaScript stays under 30 KB gzipped.
