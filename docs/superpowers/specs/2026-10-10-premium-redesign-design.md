# Premium clinic redesign: design

Date: 2026-10-10. Branch: `redesign/premium-clinic`, off `build/health-clinic-v1`. One commit per build stage, nothing pushed.

## Goal

Turn the Fernway Health demo into a complete, premium private-clinic site: real photography, invented but consistent clinic content, a warm token system, and a calm motion system. It stays Astro, static, multi-site and multi-market, WCAG 2.2 AA, Lighthouse 90+ on mobile.

## Decisions already made by the owner

- **Reviews stay market-gated.** CA shows the testimonial carousel, the rating badge and the hero rating card. AU shows a "Read our reviews on Google" panel and non-rating trust cards. No rating number is ever visible in AU.
- **Straight through.** Spec and plan are committed for the record, then every stage is built without review stops.
- **The brief wins over the old taste rules.** `docs/design-system.md` banned carousels, parallax, stock clinician photos, invented numbers and unlabelled content. Those rules are rewritten, and the tests that pinned them are updated on purpose, never loosened by accident.

## What does not change

- Layer rules in `tools/boundaries.mjs`. Raw colours only in `src/styles/tokens.css`. Storage only in `core/storage.ts` and `ThemeBoot.astro`. No `=== 'AU'` branching outside `domain/` and `layouts/`.
- Market switching by `data-market-only` and `?market=`. Regulator numbers, 000/911, addresses, phones, rebate wording.
- The demo ribbon and its text.
- Booking, referral and console logic. They are restyled by tokens only.
- Hollybank and the three fixtures build and pass. They get the new shell and tokens with their existing content. No vet content is invented.
- JS budget of 30 KB gzipped per page. No new animation library. `motion` is already installed.

## Architecture

### Content model

All invented content lives in `src/content/fernway/`. Every new file is optional per content folder, so a folder without it renders the old band or nothing.

| File | Collection | Shape |
|---|---|---|
| `about.json` | `about` (one entry) | `founded`, `founder` (provider slug), `mission`, `hero {eyebrow, headline, lead}`, `story {heading, paragraphs[], signature}`, `milestones[] {year, text}`, `rating {value, count}`, `stats[] {value, suffix?, label, note?}`, `features[] {icon, title, text}`, `payments[] {icon, title, text}`, `careers {heading, text, roles[] {title, hours, text}}`, `newsletter {heading, text}` |
| `awards.json` | `awards` | `name`, `issuer`, `year`, `icon`, `kind: award \| accreditation` |
| `funds.json` | `funds` | `name`, `market`, `mark` (1 to 6, picks a drawn glyph) |
| `conditions.json` | `conditions` | `name`, `service` (service slug) |
| `gallery.json` | `gallery` | `photoSlot`, `caption` |
| `blog/*.md` | `blog` | `title`, `date`, `author` (provider slug), `summary`, `photoSlot`, `minutes`, `category`; body is the article |
| `reviews.json` | `reviews` (extended) | adds optional `suburb {AU, CA}`, `service` (slug), `avatarSlot` |
| `providers/*.md` | `providers` (extended) | adds optional `qualifications[]`, `interests[]`, `availability[]` (weekday names), `joined` (year); body is the long bio |
| `services/*.md` | `services` (extended) | adds optional `icon`, `treats[]`, `timeline[] {when, title, text}`; `faqs` becomes `min(3)` |

Prices stay in `fees.json` as the single source. Clinician count is counted from content, never authored.

### Modules and routes

Two new modules, off in every preset and switched on in the two Fernway site configs:

- `about`, route `/about/`: story, milestones, awards, gallery, careers.
- `blog`, routes `/blog/` and `/blog/<slug>/`.

Nav gains "About" and "Health tips", gated by module like every other nav item.

### Photos

`src/assets/photos/` moves to `src/assets/images/` (the brief's path). `core/photos.ts` globs the new folder. Slots stay name-based: drop `<slot>.jpg` in and it renders. `CREDITS.md` at the repo root lists every photo with its source URL and licence, and replaces `docs/photo-credits.md`.

New Fernway slots:

- `hero-consult`
- `service-physiotherapy`, `service-sports-physio`, `service-dental-check-up`, `service-dental-hygiene`, `service-psychology`
- `provider-<slug>` for all six clinicians (names already exist)
- `founder-priya`
- `waiting-area`, `rehab-gym`, `clinic-detail`, plus the five existing room slots, for the gallery
- `blog-back-care`, `blog-return-to-running`, `blog-dental-check-up`, `blog-dental-clean`, `blog-first-psychology-session`, `blog-sleep-and-pain`
- `avatar-1` to `avatar-9`

`Placeholder.astro` becomes a branded gradient tile with an icon, still labelled, so a missing file never shows a grey box. `Photo.astro` keeps AVIF and WebP, explicit dimensions and lazy loading.

### Tokens

`fernway` theme, all pairs checked in `tests/unit/contrast.test.ts`:

| Token | Value | Role |
|---|---|---|
| `--color-paper` | `#f8f5ee` | Warm off-white page |
| `--color-card` | `#ffffff` | Cards |
| `--color-surface` | `#efeadf` | Quiet sand panel |
| `--color-sand` | `#e8e0d0` | Deeper sand band |
| `--color-ink` | `#1b2a22` | Text |
| `--color-ink-muted` | `#4a574f` | Secondary text |
| `--color-ink-subtle` | `#5f6b63` | Captions |
| `--color-primary` | `#3d6b4f` | Fern fills, borders, icons |
| `--color-primary-text` | `#2a4f39` | Fern text |
| `--color-deep` | `#1f3b2b` | Dark fern bands and footer |
| `--color-on-deep` | `#ffffff` | Text on deep |
| `--color-accent` | `#d7e8d6` | Appointment card and selected states, unchanged meaning |
| `--color-cta` | `#b4502f` | Terracotta call to action |
| `--color-cta-strong` | `#963f23` | Its hover |
| `--color-star` | amber, at least 3:1 on card and paper | Rating stars |
| `--color-line` | `#e2dccd` | Hairlines |
| `--color-field-border` | `#737b70` | Inputs and live card borders |

`harbour` declares the same names. Its `cta` is its ink, so Hollybank buttons keep their ink fill. A `fernway-dark` block declares the same names and passes the same pair list; it is not in any site's `themes`, so it is ready but not switched on.

Other tokens: `--font-display` Fraunces variable, self-hosted; body stays Atkinson Hyperlegible Next. Fluid `--text-hero`, `--text-display`, `--text-title`, `--text-lead` with `clamp()`; the fixed `--text-N` rem scale stays. `--dur-1/2/3` at 150/300/600 ms and `--ease-out: cubic-bezier(0.22, 1, 0.36, 1)`; `--dur-fill` stays 160 ms. `--space-9` 96px and `--space-10` 128px. Two-layer warm shadows. `--wrap` 75rem and a 12-column `.grid-12` utility.

### Primitives

In `src/core/ui/`: `Button` (primary is now the CTA fill; adds an arrow slide and press), `Card`, `Badge`, `Eyebrow`, `Chip`, `Stat`, `Field`, `Photo`, `Placeholder`, `Icon` stay and are restyled. New: `SectionHeading`, `Counter`, `Carousel`, `Accordion`, `Lightbox`, `Stars`, `Marquee`, `Breadcrumb`, `FundLogo`. Reveal stays attribute-based (`data-reveal`, `data-reveal-group`).

### Scripts

All vanilla, in `src/core/`, each a few lines, loaded only by the component that needs it:

- `motion.ts`: reveal with a 20px rise and 70 ms stagger, plus count-up.
- `carousel.ts`: prev, next, auto-advance with a pause button, paused on hover and focus.
- `lightbox.ts`: native `<dialog>`, arrow keys, Escape from the platform.
- `hours.ts`: `openStatus(hours, now, timeZone)`, unit tested, drives "Open now".
- Header scroll state from one `IntersectionObserver` sentinel. No scroll listeners anywhere.

Pure CSS: accordion height (`::details-content` with `interpolate-size`), marquee, timeline line-draw and hero parallax (`animation-timeline: view()` behind `@supports`), card hovers, underlines.

### View transitions

Native cross-document transitions, already on. Card photos and their detail-page photos share a `view-transition-name` (`service-<slug>`, `provider-<slug>`, `post-<slug>`), so they morph. No client router, so the booking and console scripts are untouched.

## Pages

**Home**, in order, ids in brackets: header; hero; trust strip marquee; services (`services`); why choose us with stats (`why`); founder story (`story`); team (`team`); first visit timeline (`first-visit`); fees and insurance (`fees`); testimonials or the Google panel (`reviews`); gallery (`gallery`); health tips (`tips`); find us (`location`); FAQ accordion (`faq`); CTA band; newsletter; footer; mobile bar. The tested order `services, team, first-visit, reviews, location, faq` holds. A content folder without `about.json` keeps today's composition.

**Inner pages**: every page gets `PageHeader` with breadcrumb and optional photo. Service detail: facts, what it treats, what to expect, recovery timeline, price from `fees.json`, FAQ accordion, related clinicians, booking link. Team detail: portrait, long bio, qualifications, interests, languages, availability, registration, "Book with". `/about/`, `/blog/`, `/blog/<slug>/` with a general-information note on every article. Booking form restyled. Legal pages get a readable measure.

## Accessibility and motion safety

- Every image has alt text. Avatars are named for the reviewer.
- Auto-advancing carousel and marquee each have a visible pause control and stop on hover and focus (WCAG 2.2.2).
- Under `prefers-reduced-motion: reduce` and on `motion: false` sites: no reveal, no count-up, no parallax, no marquee, no auto-advance.
- No JavaScript: everything is visible; counters show final numbers; accordion and carousel still work as plain `<details>` and a scrolling list.
- Tap targets stay 44px. Focus ring stays 3px.

## Tests changed on purpose

| Test | Change |
|---|---|
| `tokens.test.ts` | New hero clamp, shadows, added tokens |
| `contrast.test.ts` | New pairs for `cta`, `deep`, `sand`, `ink-subtle`, `star`; re-pinned exceptions; `fernway-dark` added |
| `home.e2e` and `motion.e2e` | FAQ is `details`, not `dl` |
| `photos.e2e` | Fernway clinicians have portraits, so the initials-tile steps run on Hollybank; exterior photo is in `#location` |
| `shell.e2e` | Footer and nav links are checked against the sitemap; mobile bar holds labelled Call and Book |
| new | `hours.test.ts`, blog and about routes, carousel pause, lightbox open and close, reviews gate on the new components |

## Invented content, fact sheet

Everything here is fiction for a demonstration site and must stay consistent across files.

- Founded 2011 by Priya Nair, physiotherapist, as a two-room physio practice. Dental joined in 2015, psychology in 2018, the rehab gym opened in 2021.
- Mission: unhurried, joined-up care, with the fee known before you walk in.
- Stats: 15 years open, 18,400 patients helped, 92% of new patients seen the same week, rating 4.9 from 1,240 reviews (CA only).
- Six clinicians, unchanged names, roles and registration numbers: Priya Nair, Tom Hargreave, Dr Elena Marsh, Sam Whitlock, Dr Hannah Reyes, Dr Lucas Brandt (not accepting new patients).
- Five services and their fees, unchanged.
- Nine reviews, invented, each tied to a service.
- Awards and accreditations: invented names, checked not to match a real body.
- Six health funds per market: invented names, drawn marks, checked not to match a real insurer.
- Six articles, each by a clinician, general information only.
- Identifiers stay in reserved fictional ranges (`.example` domains, 555 numbers, zeroed ABN and BN).

## Out of scope

- A real newsletter backend. The form validates and confirms on the page only.
- Hero video. A still photo with parallax keeps the mobile score.
- Dark mode switched on.
- New Hollybank content.
