# Design system

A calm, warm private-clinic look: sand neutrals, a fern green brand colour, one terracotta call to action, a soft serif for headings and a legible sans for everything else. All styling is plain CSS on tokens. There is no UI framework and no Tailwind.

## Tokens

`src/styles/tokens.css` is the only file that holds raw colour values (`#hex`, `rgb(`, `hsl(`). The boundary checker fails on any other file that does. Components use `var(--...)` only.

| Role | Token | Use |
|---|---|---|
| Page | `--color-paper` | Page background, warm off-white |
| Surfaces | `--color-card`, `--color-surface`, `--color-sand` | Raised card, quiet panel, deeper band |
| Text | `--color-ink`, `--color-ink-muted`, `--color-ink-subtle` | Body text, secondary text, captions |
| Brand fill | `--color-primary` | Fills, borders, icons, and text on card, paper and surface |
| Brand text | `--color-primary-text` | Brand-coloured text on `--color-sand` and `--color-accent` |
| Dark band | `--color-deep`, `--color-on-deep`, `--color-on-deep-muted` | Footer and closing band, and the text on them |
| Call to action | `--color-cta`, `--color-cta-strong` | The one call-to-action fill and its hover |
| Accent | `--color-accent` | A light fill under ink text: selected states, icon discs, the appointment card |
| Stars | `--color-star` | Rating stars |
| Lines | `--color-line` | Hairlines and dividers |
| Fields | `--color-field-border` | Input borders, at least 3:1 against the page |
| Text on dark fills | `--color-on-ink` | Text on primary, call-to-action and ink fills |
| Status | `--color-success`, `--color-warning`, `--color-danger` and their `-soft` pairs | Messages and badges |
| Focus | `--color-focus` | Visible focus ring; it tracks primary |

### Why primary and primary-text are separate tokens

`--color-primary` clears 4.5:1 on card, paper and surface, so it may carry text there. On the two deeper fills, `--color-sand` and `--color-accent`, it does not, and `--color-primary-text` is the darker step that does. The rule is the same in every theme, so a re-skin cannot reintroduce the failure by changing one value.

`--color-cta` is the only warm colour and it is spent on one thing: the button that books. A page has one such button in view at a time. `--color-accent` is never a text colour.

## Themes

| Theme | Neutrals | Brand | Notes |
|---|---|---|---|
| `fernway` | Warm sand | Fern green, terracotta call to action | Default, defined on `:root` |
| `harbour` | Cool blue-grey | Blue, ink call to action | Defined on `[data-theme='harbour']` |
| `fernway-dark` | Dark green-grey | Light fern | Declares every token for a dark surface. No site lists it yet, so it is ready but not switched on. |

`site.theme` is the default and `site.themes` is the list a demo visitor can switch between with `?theme=`. Outside demo mode only the configured theme applies. `tests/unit/contrast.test.ts` checks an explicit pair list in all three themes against AA, and separately pins the below-AA combinations so they cannot drift unnoticed. It does not judge whether a theme's colours sit well together; that stays a human review concern.

## Type, spacing and depth

| Item | Value |
|---|---|
| Display family | Fraunces, variable (weight axis only), self-hosted, with a metric-matched fallback so the swap does not shift the layout |
| Body family | Atkinson Hyperlegible Next, variable, self-hosted (`@fontsource-variable`) |
| Body | 17px, line height 1.55, measure 68ch |
| Fixed scale | `--text-14`, `-16`, `-18`, `-20`, `-24`, `-28`, `-36` |
| Fluid scale | `--text-hero` (2.375rem to 4rem), `--text-display` (1.875rem to 2.75rem), `--text-title` (1.25rem to 1.5rem), `--text-lead` (1.0625rem to 1.25rem), each a `clamp()` |
| Tracking | `--track-hero` -0.025em, `--track-heading` -0.015em, `--track-label` 0.04em |
| Space | `--space-1` (4px) to `--space-10` (128px) |
| Layout | `--wrap` 75rem, `--gutter` fluid from 16px to 48px, a 12-column grid inside the wrap |
| Radius | `--radius-control` 8px, `--radius-card` 16px, `--radius-panel` 24px, `--radius-pill` 9999px |
| Touch target | `--target` 44px, `--target-field` 48px for inputs |
| Elevation | `--shadow-1` cards, `--shadow-2` raised surfaces and hover, `--shadow-3` overlays. Each is two soft layers. |
| Hairline | `--hairline`, a full `border` shorthand, not a width |

Headings use the display family; body copy, labels and controls use the body family. Reading age is about 9 to 11, with sentences under 20 words. Text is sentence case and left-aligned. The layout is one column below 768px, two cards per row from 640px and three from 1024px.

## Primitives

Shared components live in `src/core/ui/`. Both `sections/` and `modules/` need them, which is why they live in `core` rather than in either.

| Component | What it is |
|---|---|
| `Button.astro` | Link or button. Variants `primary` (the call to action), `secondary`, `quiet`, `inverse` (on a dark band). Sizes `md` and `lg`. `arrow` adds an arrow that slides on hover. |
| `Card.astro` | The one card: white fill, hairline, `--shadow-1`, 16px radius. Lifts only when it holds a link or a button. |
| `SectionHeading.astro` | Eyebrow, heading and optional lede for a band, left or centred. |
| `PageHeader.astro` | The hero band on every inner page: breadcrumb, eyebrow, title, lede and an optional photo. |
| `Breadcrumb.astro` | The trail in the page header, with JSON-LD. |
| `Eyebrow.astro` | Small uppercase tracked label above a heading. |
| `Badge.astro`, `Chip.astro` | A status label; a pill link or button for filters and quick links. |
| `Stat.astro`, `Counter.astro` | A metric tile; a number that counts up once when it scrolls into view. |
| `Stars.astro` | A rating drawn as stars with a text equivalent. |
| `Accordion.astro` | A native `details` element with an animated height. Works without JavaScript. |
| `Carousel.astro` | A scroll-snap track with previous, next and, when `auto` is set, a pause button. |
| `Marquee.astro` | A slow looping strip with a pause button. A wrapped static row when motion is off. |
| `Lightbox.astro` | A native `dialog` that shows a gallery photo large, with previous, next and close. |
| `FundLogo.astro` | A drawn placeholder mark and name for a health fund or insurer. Never a real logo. |
| `Photo.astro` | A responsive picture for a photo slot, an initials tile, or a branded gradient placeholder with an icon when the file is missing. |
| `Field.astro`, `ErrorSummary.astro` | A labelled input with its error line; the summary that takes focus on a failed submit. |
| `Icon.astro`, `OpenStatus.astro`, `Placeholder.astro` | Inline icon; open-now status; a labelled stub. |

`Card.astro` raises to `--shadow-2`, lifts 4px and takes a brand border on hover only when it holds an `a` or a `button`, so a static card never looks live. A card is interactive because of what is inside it, and the hover is a consequence, not a flag.

## Layout vocabulary

| Composition | Where |
|---|---|
| Hero with a leaf-masked photo, two floating cards and soft blobs | Home, `Hero.astro` |
| Trust strip: marquee of fund marks, then the awards row | Home, `TrustStrip.astro` |
| Stats strip with count-up numbers | Home, `MetricsBand.astro` |
| Photo card grid | Services, team, health tips: `ServicesBand`, `TeamRow`, `TipsBand` |
| Icon feature grid | Home, `WhyBand.astro` |
| Split band with a photo and a signed quote | Home and about, `StoryBand.astro` |
| Review carousel with a rating badge, or a link-only panel | Home, `ReviewsBand.astro` |
| Gallery grid with a lightbox | Home and about, `GalleryBand.astro` |
| Page header band with breadcrumb and photo | Every inner page, `PageHeader.astro` |
| Sticky side panel beside a long read | Service, team profile and fees pages |
| Deep closing panel | Every page, `CtaBand.astro` |
| Utility bar above the header | Every page, `UtilityBar.astro` |

A site with an `about.json` gets the full home page. One without (the vet demo and the fixtures) keeps the shorter composition: hero, services, metrics, team, first visit, reviews, location and questions.

## Sample content and labelled stubs

The Fernway demo is filled with invented sample content so it reads like a working clinic: a founding story, stats, awards, health funds, reviews, a gallery and six health tips. All of it lives in `src/content/fernway/`, none of it in a component, and the demo ribbon says so on every page. A real clinic replaces every file.

Three rules keep that honest:

- A rating never appears in a market that shows no review quotes. `showsRatings(market)` gates the hero rating card, the stats strip and the rating badge, and `ReviewsBand` shows a link-only panel there instead. AU is that market.
- Fund and insurer marks are drawn placeholders with invented names. Do not add a real company's logo without its permission.
- Where a site has no content for a claim, the section is left out or shows a labelled stub: a `role="note"` paragraph that says the thing is not published yet and names the question to ask. A stub is never a disabled control, because a greyed-out select reads as broken.

Home section ids keep their relative order: `services, team, first-visit, reviews, location, faq`.

## The appointment card

The booking request is drawn as a paper appointment card. It has the clinic's name at the top and ruled lines for service, clinician, day, time and patient name. Each choice fills a line, with a 160 ms colour fade (`--dur-fill`). The vet preset uses a pet record card with the pet's name and species line.

Rules for the card:

- It is a real `<dl>` with a text equivalent, not an image.
- It sits beside the steps on desktop, where it stays in view, and above them on mobile.
- It is also the review step, so what the patient sees is what is sent.

The logic lives in `src/modules/booking/card.ts` (`cardFields`). The component is `src/modules/booking/AppointmentCard.astro`. The steps show a numbered stepper, choice cards with a clear selected state, and field-level errors with a summary that takes focus.

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

Motion is smooth and brief, never bouncy. It moves only `transform` and `opacity`, so nothing shifts the layout. Three durations and one easing cover everything:

| Token | Value | Use |
|---|---|---|
| `--dur-1` | 150ms | Colour and border changes, button press |
| `--dur-2` | 300ms | Hovers, underlines, accordions, the page cross-fade |
| `--dur-3` | 600ms | Reveals, the hero entrance, the card to detail morph |
| `--ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` | Every movement |

| Where | What moves |
|---|---|
| Home hero | Text rises 20px in sequence; the photo settles from 1.06 scale; the floating cards follow. Where scroll-driven animation is supported, the blobs and cards drift slightly as the page scrolls. |
| Sections and lists | Fade in and rise 20px over 600ms on entering view, once. List items 70ms apart, first eight. |
| Numbers | Count up from zero once, when scrolled into view. |
| Timelines | The line draws as the list scrolls through view, where scroll-driven animation is supported. |
| Fund marks | A slow marquee with a pause button. |
| Reviews | The carousel advances every 6 seconds and stops for hover, focus and the pause button. |
| Cards and portraits | Lift 4px to `--shadow-2` on hover; photos zoom slightly inside their frame. |
| Buttons and links | Buttons rise 1px on hover and press to 0.97; the arrow slides; text links draw an underline. |
| Accordions | Height and opacity ease open and closed. |
| Booking steps | Slide in 16px from the side of travel. |
| Page change | A 300ms cross-fade. A service, team or health-tip card photo morphs into the photo on its detail page. |

To reveal an element on scroll, add `data-reveal` to it. To stagger a list, add `data-reveal-group` to the list. Do not nest one inside the other; a nested element fades in twice. Only elements below the fold when the script runs are hidden first, so a page whose script never loads shows everything. The script is `src/core/motion.ts`.

Page changes use the browser's cross-document view transitions, declared in `BaseLayout.astro`. They need no router and no script. To pair a card photo with its detail photo, give both the same style from `morph(kind, slug)` in `src/core/morph.ts`. A name must be unique on a page; `tests/e2e/motion.e2e.mjs` checks that. Browsers without the feature navigate as normal.

`prefers-reduced-motion: reduce` removes all of it: no reveals, no count-up, no marquee, no auto-advance, no page transition. The reduced-motion block in `global.css` forces `transform: none`, so never use `transform` to position something that must stay put. Set `motion: false` in `src/config/sites/<id>/site.ts` to turn motion off for a clinic.

Hover effects are gated behind `(hover: hover) and (pointer: fine)`, not `(hover: hover)`. A touch device reports hover support and then fires the hover state on tap, which sticks.

## Rules

- Anything that moves by itself for more than five seconds has a pause button: the review carousel and the marquee. No popups.
- One call-to-action button in view at a time. No dot separators in copy.
- The demo portraits are stock models, credited in `CREDITS.md`. A live clinic uses photos of its own people. A clinician without a portrait shows a tile with their initials. A slot without a file shows a branded placeholder, never a broken image or a grey box.
- Every image has alt text. `tests/e2e/photos.e2e.mjs` fails on an empty one.
- Numbered markers only where order matters: "What to expect", "How your first visit works" and the `/book/` steps.
- Buttons never say "Submit". Say what happens, for example "Send appointment request".

Eyebrow labels come from `Eyebrow.astro` and nowhere else. All-caps text in body copy is out; docs headings are checked for capital runs by `tests/unit/docs-copy.test.ts`.

## Accessibility

WCAG 2.2 AA. Visible focus, 44px targets, a label on every control, and an error summary that takes focus on submit. The carousel track is keyboard scrollable, the lightbox is a native `dialog` that traps and returns focus, and accordions are native `details`. The built `/book/`, `/estimates/` and `/referrers/` pages contain no third-party script origins. Page JavaScript stays under 30 KB gzipped.

Two consequences of the design are worth naming. The closing panel is a deep fill with white text, so anything on it stays at full strength: a faded eyebrow on 14px text drops under AA and axe catches it. And a card that links is a link with a border, so its boundary has to clear 3:1 against the page, which is why `Card.astro` does not drop to a borderless shadow on hover.
