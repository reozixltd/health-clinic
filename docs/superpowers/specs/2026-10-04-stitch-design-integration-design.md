# Stitch design integration

Replace the visual design of `health-clinic` with the Google Stitch design for
"Lumina Health Clinic", ported into the existing Astro architecture and driven by real
site config and content. Behaviour, routing, boundaries and tests stay intact.

Source Stitch files: `stitch_health_clinic_website/{home,services_specialties,doctors_team,book_appointment,book_appointment_mobile_flow}/code.html`
and `lumina_health_clinic/DESIGN.md`.

## 1. Architecture

Nothing from Stitch is copied verbatim. The Stitch HTML is a static Tailwind Play CDN
artifact. Copying it would break three enforced rules in this repo:

- `tools/boundaries.mjs` `raw-colour-outside-tokens` — hex and `rgb()` may only appear in
  `src/styles/tokens.css`. Stitch's `tailwind.config` block and inline styles are full of
  both.
- `tests/unit/third-party.test.ts` — `/book/`, `/estimates/` and `/referrers/` must contain
  no third-party script origins. Stitch loads `cdn.tailwindcss.com` and two Google Fonts
  stylesheets.
- `npm run budget` — page JS under 30 KB gzipped. The Tailwind Play CDN alone exceeds it.

`tools/boundaries.mjs` also defines the only legal layer list, so a `StitchProject/` tree
is not available without inventing a second frontend architecture. The integration is
therefore a **port of the design language and section compositions into the existing
layers**, driven by real config and content.

### Construct mapping

| Stitch artefact | Destination |
| --- | --- |
| `tailwind.config` colour map, `DESIGN.md` colours | `src/styles/tokens.css` |
| `DESIGN.md` typography | `tokens.css` type scale, `global.css` heading rules |
| `DESIGN.md` rounded / spacing | `tokens.css` `--radius-*`, `--space-*` |
| `DESIGN.md` elevation levels 0–3 | new `--shadow-1/2/3`, `.card` in `global.css` |
| home hero | `src/sections/Hero.astro` |
| home metrics strip | new `src/sections/MetricsBand.astro` |
| home urgent-care banner | new `src/sections/UrgentBand.astro` |
| home specialties bento | `src/sections/ServicesBand.astro` |
| home "why Lumina" split + feature cards | new `src/sections/FeaturesBand.astro` |
| home testimonials | `src/sections/ReviewsBand.astro`, `src/modules/reviews/Reviews.astro` |
| home insurance banner | new `src/sections/CoverageBand.astro` |
| home CTA banner | `src/sections/CtaBand.astro` |
| header / utility bar / footer | `src/layouts/Header.astro`, new `src/layouts/UtilityBar.astro`, `src/layouts/Footer.astro` |
| `services_specialties` | `src/pages/services/[...slug].astro`, `src/modules/services/ServiceList.astro` |
| `doctors_team` | `src/pages/team/[...slug].astro`, `src/modules/providers/ProviderList.astro` |
| `book_appointment`, `book_appointment_mobile_flow` | `src/pages/book/[...slug].astro` (phase 2) |
| `lumina_health_clinic_logo` | text wordmark. This project has no logo asset and gains none. |

`Card.astro` lands in `core/ui/`, not `sections/`, because `modules/services` and
`modules/providers` need it too and `modules` may not import from `sections`.

## 2. Tokens

Same token *roles*, Stitch values, so components that already exist keep working.
All raw colour stays in `tokens.css`.

| Token | Value | Stitch source | Contrast |
| --- | --- | --- | --- |
| `--color-paper` | `#f7f9ff` | `surface` | — |
| `--color-ink` | `#121d26` | `on-surface` | 16.1:1 on paper |
| `--color-ink-muted` | `#3e4947` | `on-surface-variant` | 9.0:1 on paper |
| `--color-card` | `#ffffff` | `surface-container-lowest` | — |
| `--color-surface` | `#e4effc` | `surface-container` | — |
| `--color-accent` | `#99f2e9` | `primary-fixed` | keeps "accent = light fill behind ink text" |
| `--color-primary` (new) | `#0d7a73` | `primary-container` | 5.19:1 with white text |
| `--color-primary-text` (new) | `#005f5a` | `primary` | 6.6:1 on surface, 7.6:1 on card |
| `--color-line` | `#d8e4f1` | `surface-variant` | — |
| `--color-field-border` | `#6e7977` | `outline` | 4.29:1 on paper, over the 3:1 field-border floor |
| `--color-on-ink` | `#ffffff` | unchanged | — |
| `--color-success` | `#345c49` | `tertiary` | 7.5:1 on card |
| `--color-warning` | `#8a5300` | unchanged | — |
| `--color-danger` | `#ba1a1a` | `error` | 6.5:1 on card |
| `--color-focus` | `#0d7a73` | `primary-container` | — |

**Deviation from Stitch, deliberate.** Stitch uses `#0d7a73` for both solid fills and
teal text on tinted surfaces. On its own `--color-surface` `#e4effc` that is 4.46:1 and
fails AA for normal text. So teal text uses `--color-primary-text` `#005f5a` and solid
fills use `--color-primary` `#0d7a73`. `tests/unit/contrast.test.ts` checks every pair
and must pass for both themes.

`--color-accent` stays a *light* fill because `docs/design-system.md` fixes its meaning:
accent is used on the appointment card and selected states only, always under ink text.
Stitch's `primary` `#005f5a` cannot serve there.

Radii: `--radius-control` 6px → 8px, `--radius-card` 2px → 16px, new `--radius-panel`
24px, new `--radius-pill` 9999px.

`--target` stays 44px as the general minimum for links, rows and buttons. Stitch asks for
48px; 44px is this project's tested floor and no WCAG 2.2 AA rule requires more than
24×24. Interactive controls are therefore *not* shrunk. Form controls take the larger
Stitch value through a new `--target-field: 48px`, which is an increase and so cannot
regress anything.

New shadow tokens, all in `tokens.css`: `--shadow-1` `0 4px 20px -2px rgba(18,38,58,.04)`,
`--shadow-2` `0 12px 32px -4px rgba(18,38,58,.08)`, `--shadow-3`
`0 24px 48px -8px rgba(18,38,58,.14)`, plus `--hairline` `1px solid rgba(18,38,58,.08)`.

Type: Atkinson stays. Scale and tracking follow Stitch.

| Token | Value | Stitch role |
| --- | --- | --- |
| `--text-14` | 0.875rem | `body-sm` |
| `--text-16` | 1rem | `body-md` |
| `--text-18` | 1.125rem | `body-lg` |
| `--text-20` (new) | 1.25rem | `headline-sm` |
| `--text-22` | 1.5rem | `headline-md` |
| `--text-28` | 1.75rem | — |
| `--text-36` | 2.25rem | `headline-lg` |
| `--text-hero` | `clamp(2.25rem, 4.5vw, 3.5rem)` | `display-hero` 36 → 56px |

`--leading-body` 1.6 → 1.55. Heading `letter-spacing: -0.02em`, hero `-0.03em`, label
`+0.04em`. Add `--space-xl: 40px` for Stitch's `space-xl`; the existing `--space-1..8`
values are unchanged so nothing existing shifts.

`harbour` theme keeps its role as the alternate demo theme and takes the same structure on
Stitch's slate-navy secondary family (`secondary` `#4d6076`, `secondary-container`
`#d0e4ff`) with an accessible focus ring.

## 3. Shared UI

New in `src/core/ui/`:

- `Card.astro` — white surface, `--radius-card`, `--hairline`, `--shadow-1`, padding
  `--space-6`; hover lifts to `--shadow-2` with a `--color-primary` border. Slots:
  default, `icon` (48px tinted rounded square), `title`, `body`, `meta`, `action`.
- `Eyebrow.astro` — Stitch's uppercase tracked label.
- `Stat.astro` — one metric tile. Used by `MetricsBand` and the team page header.
- `Chip.astro` — Stitch's pill filter chip, `href` or `button`.

`src/core/ui/icons.ts` gains Lucide paths for `search`, `chevron-right`, `arrow-right`,
`badge-check`, `filter`, `flask`, `pill`, `scan-line`, `smartphone`, `mail`, `lock`,
`globe`, `award`, `heart-pulse`, `navigation`, `video`, `sliders`. Existing 14 reused.
Material Symbols is not adopted: the font is ~300 KB and would break the origin and
budget rules.

## 4. Data

Stitch ships fabricated data throughout. Every slot resolves to a real source or renders
a labelled stub. Stubs reuse the existing `Placeholder.astro` convention (`role="img"`,
`aria-label` naming what is missing) extended to text and data slots, so a stub is never
mistaken for content.

| Stitch slot | Resolution |
| --- | --- |
| hero pill "Accepting New Patients" | `providers.filter(acceptingNew).length`, real |
| hero headline and lede | `clinic.name`, `preset.copy.heroLine`, `treats`, real |
| hero search input | client filter over `providers` + `services`, submit → `/team/?q=`. Matching logic in `src/modules/providers/search.ts` as a pure function; the DOM wiring lives in the section that owns the input, because `modules` may not import `sections` |
| hero insurance `<select>` | stub, disabled, labelled |
| "Popular Searches" chips | first 4 `services` sorted by `order`, linking to `/services/<slug>/`, real |
| hero photo | `Photo` slot `reception` via existing `photoRoles`, real |
| floating "N clinicians on duty" | `providers.length` and `acceptingNew` count, real |
| floating 4.9/5.0 card | `reviews.json` average and count, real |
| metrics strip 98% / 45+ / 15m / 24/7 | all four replaced: services count, providers count, average review rating, accepting-new count. Real |
| urgent band headline and copy | `emergency` / `out-of-hours` module, `clinic.emergency.text`, real |
| "Est. wait 8 mins", "Walk-ins accepted now", map embed | stub |
| "Directions" | clinic address and phone from config, real |
| "Start Virtual Visit" | stub. No telehealth exists in this project |
| specialties bento, "Explore All N" | `services` collection and `services.length`, real. Each card links its real `providers` |
| why-Lumina four feature cards | stub |
| lab photo | `Photo` slot `treatment-room-physio`, real |
| "92% of results in 4 hours" | stub |
| testimonials | `reviews` collection, real |
| carrier badge grid | stub |
| "View Self-Pay Rates" | `/fees/` or `/prices/` per active module, real |
| "Check My Specific Insurance Plan" | stub |
| CTA banner | `CtaBand` + `clinic.phone`, real |
| footer newsletter field | stub, disabled, labelled |
| patient portal links and login card | stub, disabled, labelled. Deliberately **not** a login form: this project has no auth system and a fake credential field would be a false affordance |
| HIPAA and ADA badges | stub, labelled. No compliance claim is asserted |

Photos: Stitch's `lh3.googleusercontent.com` AI images are dropped. No remote image is
added anywhere. Room slots continue through `Photo.astro`; clinicians without a portrait
keep initials tiles; new slots get labelled placeholders. `npm run photos:status` then
reports which files to drop into `src/assets/photos/`.

## 5. Phase 2, booking

`src/modules/booking/booking.ts`, `state.ts` and `lead.ts` are not touched. The existing
six steps and the `AppointmentCard` review card are the behaviour and stay.

Stitch contributes presentation only: a four-segment progress header above the steps,
`--color-primary` time-slot chips with white active text, `Card`-style choice tiles, the
Stitch focus ring `0 0 0 3px rgba(13,122,115,.18)`, `--target-field` inputs, and the
sticky summary rail that `AppointmentCard.astro` already is.

`/team/?q=` is read from `location.search` by a client script on the team page and filters
the already-rendered cards. The page is statically generated, so there is no server to
filter on; `search.ts` decides what matches and the script only toggles `hidden`.

`book_appointment_mobile_flow` maps to the existing `MobileBar.astro` plus a
single-column step layout with the summary card above the steps.

## 6. Standards and docs

`docs/design-system.md` is rewritten around the Stitch look. Removed, because the user
chose Stitch as the source of truth for the UI: the ban on eyebrow labels and all-caps
text, the ban on arrow symbols on buttons, the ban on dot separators in copy, and
"services are a list".

Kept, because Stitch does not violate them: no carousels or popups, no stock photos
presented as clinicians, numbered markers only in "how your first visit works" and the
`/book/` steps, and no button labelled "Submit".

`docs/spec.md`, `docs/build-ledger.md` and `docs/customising.md` are updated to match.

## 7. Verification

- `npm test` — `tools/check-boundaries.mjs` then 25 vitest suites, including AA contrast on
  both themes.
- `npm run check` — `astro check`, TypeScript.
- `npm run e2e` — 12 Playwright suites including axe on home, motion, photo slots and the
  shell.
- `npm run budget` — JS budget.
- `npm run build`, then `npm run build:all` for `fernway-au`, `fernway-ca` and `hollybank`.
- Responsive pass at 1440, 1024, 768 and 390 in a real browser, plus a console and network
  error check.

### Expected test churn

`tests/e2e/home.e2e.mjs`, `shell.e2e.mjs` and `quality.e2e.mjs`, and
`tests/unit/docs-copy.test.ts` assert the old structure and copy. Selectors and
expectations are updated to the new markup. Assertions are not weakened to make them pass
— where a check encodes an accessibility or budget rule it is kept and re-pointed at the
new element.

## 8. Phases

1. Tokens and global CSS, both themes; `contrast.test.ts` green.
2. `core/ui`: `Card`, `Eyebrow`, `Stat`, `Chip`, new icons.
3. Chrome: `UtilityBar`, `Header`, `Footer`, `Button` variants.
4. Home: hero, metrics, urgent band, services, features, reviews, coverage, CTA.
5. `/services/` and `/team/`.
6. Docs and tests.
7. Phase 2: `/book/` desktop and mobile.

## 9. Open risks

- Stitch's uppercase eyebrows and `chevron_right` links are now the house style. The axe
  suite and `quality.e2e.mjs` must be checked for anything that treated them as failures.
- `--text-hero` grows from 3.25rem to 3.5rem. The `home.e2e.mjs` heading assertions and any
  layout that assumed the old clamp may need adjustment.
- `MetricsBand` and `CoverageBand` render for sites whose modules are off. Both must
  respect `isOn()` exactly as `ServicesBand` and `ReviewsBand` do, or `fixture-minimal`
  and `fixture-no-booking` builds break.
- Hollybank is a vet site. Copy is written for human medicine. Preset copy stays in
  `presets/`, so vet wording must be preserved where the Stitch composition has a heading.