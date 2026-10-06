# Design system

The visual design is the Google Stitch "Lumina Health Clinic" composition, ported into this repo's layer architecture and driven by real content. All styling is plain CSS on tokens. There is no UI framework and no Tailwind.

## Tokens

`src/styles/tokens.css` is the only file that holds raw colour values (`#hex`, `rgb(`, `hsl(`). The boundary checker fails on any other file that does. Components use `var(--...)` only.

| Role | Token | Use |
|---|---|---|
| Page | `--color-paper` | Page background |
| Text | `--color-ink`, `--color-ink-muted` | Body text, secondary text |
| Surfaces | `--color-card`, `--color-surface` | Cards, quiet panels |
| Brand fill | `--color-primary` | Button fills, borders, icons, large display text on white |
| Brand text | `--color-primary-text` | Any primary-coloured text on a tinted panel |
| Accent | `--color-accent` | Appointment card fills and selected states only, always with ink text |
| Lines | `--color-line` | Hairlines and dividers |
| Fields | `--color-field-border` | Input borders, at least 3:1 against the page |
| Text on ink | `--color-on-ink` | Text on ink or primary fills |
| Status | `--color-success`, `--color-warning`, `--color-danger` and their `-soft` pairs | Messages and badges |
| Focus | `--color-focus` | Visible focus ring |

### Why primary and primary-text are separate tokens

`--color-primary` is tuned to sit on white: it carries fills, borders and icon strokes, where a fill boundary and a 3:1 non-text rule are what matter. In the fernway theme it measures 4.46:1 against `--color-surface`, just under the 4.5:1 threshold for body text. `--color-primary-text` is the darker step, 6.48:1 on the same surface, and is the only primary-coloured text allowed on a tinted panel. Harbour clears 4.5:1 with both, but the rule is identical across themes so a re-skin cannot reintroduce the failure by changing one value.

`--color-accent` stays a light fill. Its meaning is fixed: the appointment card and selected states only, always under ink text. A dark brand colour cannot serve there.

## Themes

| Theme | Neutrals | Brand | Notes |
|---|---|---|---|
| `fernway` | Cool near-white | Teal `#0d7a73` | Default, defined on `:root` |
| `harbour` | Cool blue-grey | Blue `#1d4f8c` | Defined on `[data-theme='harbour']` |

`site.theme` is the default and `site.themes` is the list a demo visitor can switch between with `?theme=`. Outside demo mode only the configured theme applies. `tests/unit/contrast.test.ts` checks an explicit pair list in both themes against AA, and separately pins the below-AA combinations so they cannot drift unnoticed. It does not judge whether a theme's neutrals, brand and semantic colours are hue-coherent; that stays a human review concern.

## Type, spacing and depth

| Item | Value |
|---|---|
| Family | Atkinson Hyperlegible Next, variable, self-hosted (`@fontsource-variable`) |
| Body | 17px, line height 1.55, measure 68ch |
| Scale | `--text-14`, `-16`, `-18`, `-20`, `-24`, `-28`, `-36`, plus `--text-hero` (clamped, 2.25rem to 3.5rem) |
| Tracking | `--track-hero` -0.03em, `--track-heading` -0.02em, `--track-label` 0.04em |
| Space | `--space-1` (4px) to `--space-8` (64px) |
| Radius | `--radius-control` 8px, `--radius-card` 16px, `--radius-panel` 24px, `--radius-pill` 9999px |
| Touch target | `--target` 44px, `--target-field` 48px for inputs |
| Elevation | `--shadow-1` cards, `--shadow-2` raised surfaces and hover, `--shadow-3` overlays |
| Hairline | `--hairline`, a full `border` shorthand, not a width |

Reading age is about 9 to 11, with sentences under 20 words. Text is sentence case and left-aligned. The layout is one column below 768px, two cards per row from 640px and three from 1024px, with a 16px mobile gutter and a 72rem maximum.

The tracking tokens are the source design's, and they are why Atkinson still works here. Atkinson is drawn for legibility at small sizes and has generous default spacing; the display sizes need tightening to hold a hero line together, so tracking is applied per role rather than baked into the family.

## Primitives

Four components in `src/core/ui/` carry the Stitch surfaces. Both `sections/` and `modules/` need them, which is why they live in `core` rather than in either.

| Component | What it is |
|---|---|
| `Card.astro` | The one card in the system: white fill, hairline, `--shadow-1`, 16px radius. Place your own content inside. |
| `Eyebrow.astro` | Small uppercase tracked label above a heading. `p` by default, `span` when inline. |
| `Stat.astro` | One metric tile: value, label, optional note, icon. |
| `Chip.astro` | Pill link or button, for filters and quick links. |

`Card.astro` raises to `--shadow-2` and takes a brand border on hover only when it holds an `a` or a `button`, so a static card never looks live. That is the whole interactivity rule for a card in this system: a card is interactive because of what is inside it, and the hover is a consequence, not a flag.

`Button.astro` keeps its ink fill, `Field.astro` keeps its 48px height, `Placeholder.astro` keeps the labelled-stub convention, and `Photo.astro` keeps the initials tile and the missing-file placeholder. None of them gained a new token.

## Layout vocabulary

The Stitch compositions the site now uses:

| Composition | Where |
|---|---|
| Hero with search panel and floating badge | Home, `Hero.astro` |
| Stat grid | Home, `MetricsBand.astro` |
| Card grid | Services, team, reviews, `Card.astro` |
| Split band with a photo and a callout | Home, `FeaturesBand.astro` |
| Panel band with a lead and an aside of notes | Home, `UrgentBand.astro`, `CoverageBand.astro` |
| Primary-filled closing panel | Every page, `CtaBand.astro` |
| Utility bar above the header | Every page, `UtilityBar.astro` |

## Real content or a labelled stub

The source design shows numbers, insurers, waiting times, accreditation badges, a newsletter and a patient portal. None of that has a data source in this project, and a plausible fabrication is worse than a gap. Every one of those resolves to one of two things:

- **Real**, counted from content or config. The home page metric tiles come from `clinicMetrics()` in `src/modules/stats/metrics.ts`, and their nouns come from the preset, so a vet clinic never reads "Clinicians".
- **A labelled stub**: a `role="note"` paragraph that says the thing is not published yet and names the question to ask. Used for the insurer field in the hero, the facility cards, the insurer grid, the out-of-hours queue, telehealth, the newsletter, the patient portal and accreditation.

Two rules keep the distinction honest. A rating never appears in a market that shows no review quotes, so `clinicMetrics()` gates it on the market pack and `ReviewsBand` hides its own rating card the same way. And a stub is never a disabled control: a greyed-out select or a locked credential box reads as broken, so the insurance field is text.

Home section ids keep their relative order: `services, team, first-visit, reviews, location, faq`. The bands added by this design carry their own ids (`metrics`, `facilities`, `urgent`, `coverage`) and sit around them.

## The appointment card

The booking request is still drawn as a paper appointment card. It has the clinic's name at the top and ruled lines for service, clinician, day, time and patient name. Each choice fills a line, with a 160 ms colour fade (`--dur-fill`). The vet preset uses a pet record card with the pet's name and species line.

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

`Icon.astro` sets `fill`, `stroke`, `stroke-width`, `stroke-linecap` and `stroke-linejoin` on the wrapping `<svg>`. An icon entry carries geometry attributes only and nothing else. Setting `stroke-width` or `fill` on one path would break that inheritance and theme the icon differently from its neighbours, and `opacity` or `class` would leave an icon that occupies space and reads aloud while invisible.

Geometry is Lucide's, under ISC. The header of `icons.ts` classifies every entry.

Five tests in `tests/unit/icons.test.ts` hold a new icon to the contract, and the type already enforces that a name resolves, because `Icon.astro` types `name` as `keyof typeof icons`:

1. the name is in the required-names list, if a composition needs it
2. it carries geometry attributes only
3. every authored position lands in `STROKE / 2` .. `24 - STROKE / 2`, so no stroke is half-clipped by the viewBox edge
4. its exact bounding box is centred within 1.5 of (12, 12)
5. no two shapes come within a stroke width of each other, so their strokes do not merge

Test 5 is the one to expect a new icon to trip. It carries the exemptions: shapes that are meant to touch are listed in `SELF_TOUCHING`, and a test asserts each entry still genuinely touches, so an exemption cannot outlive its reason. Test 4 has no exemptions at all.

One limit worth knowing: test 5 compares across shape elements, so two subpaths inside a single `<path>` are never checked against each other.

## Motion

Motion is calm and brief. Movement uses only opacity and transform. Colour fades stay short.

| Where | What moves |
|---|---|
| Home hero | Photo settles from 1.04 scale, 600 ms. Text rises 12 px, 60 ms apart. |
| Sections and lists | Fade in and rise 12 px over 400 ms on entering view, once. Rows 40 ms apart, first eight. |
| Page change | 200 ms cross-fade, where supported. |
| Booking steps | Slide in 16 px from the side of travel, 250 ms. |
| Appointment card | Line fill, 160 ms colour fade. |
| Cards and portraits | Lift to `--shadow-2` on hover; portraits zoom to 1.03. |
| Buttons | Press feedback. |

To reveal an element on scroll, add `data-reveal` to it. To stagger a list, add `data-reveal-group` to the list. Do not nest one inside the other; a nested element fades in twice. The script is `src/core/motion.ts`.

`prefers-reduced-motion` removes movement and keeps short colour fades. Set `motion: false` in `src/config/sites/<id>/site.ts` to turn motion off for a clinic. Button press and the card fill stay. Do not add parallax, pinned sections or scroll-linked effects.

Hover effects are gated behind `(hover: hover) and (pointer: fine)`, not `(hover: hover)`. A touch device reports hover support and then fires the hover state on tap, which sticks.

## Rules that survive

Do not add any of these:

- Carousels or popups.
- Arrow symbols on buttons, or dot separators in copy.
- Stock photos presented as clinicians. A clinician without a portrait shows a tile with their initials. A room slot without a photo shows a labelled placeholder.
- Numbered markers anywhere except "How your first visit works" and the `/book/` steps.
- Buttons that say "Submit". Say what happens, for example "Send appointment request".

Eyebrow labels are now part of the design, in `Eyebrow.astro` and nowhere else. All-caps text in body copy is still out; docs headings are checked for capital runs by `tests/unit/docs-copy.test.ts`.

## Accessibility

WCAG 2.2 AA. Visible focus, 44px targets, a label on every control, and an error summary that takes focus on submit. The built `/book/`, `/estimates/` and `/referrers/` pages contain no third-party script origins. Page JavaScript stays under 30 KB gzipped.

Two consequences of the new design are worth naming. The closing panel is a brand fill with white text, so anything on it stays at full strength: a faded eyebrow on 14px text drops under AA and axe catches it. And a card that links is a link with a border, so its boundary has to clear 3:1 against the page, which is why `Card.astro` does not drop to a borderless shadow on hover.