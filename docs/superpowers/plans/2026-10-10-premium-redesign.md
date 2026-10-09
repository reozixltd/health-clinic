# Premium Clinic Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the Fernway Health demo into a complete premium clinic site with real photography, invented consistent content, a warm token system and a calm motion system.

**Architecture:** Content-driven. New optional content collections in `src/content/fernway/` feed redesigned sections; a folder without them keeps today's composition, so Hollybank and the fixtures only inherit the new shell and tokens. Two new modules (`about`, `blog`) gate the new routes. Motion is CSS first, with three small vanilla scripts.

**Tech Stack:** Astro 7 static, TypeScript strict, plain CSS on tokens, `motion` (already installed), `@fontsource-variable/fraunces` (new, font only), vitest, Playwright with axe.

**Spec:** `docs/superpowers/specs/2026-10-10-premium-redesign-design.md`

**Execution:** Native, in this session, straight through (owner's choice). Photo sourcing and content writing run as background agents because they touch no code. One commit per task. Nothing is pushed.

## Global Constraints

- Raw colours (`#hex`, `rgb(`, `hsl(`) only in `src/styles/tokens.css`. Every `--color-*` is 6-digit hex inside a theme block.
- Layer rule: `pages → layouts | sections → modules → domain → core`. Sections never import layouts; pages pass market variants as props. A module never imports another module.
- No `=== 'AU'` style branching outside `domain/` and `layouts/`. Gate on market-pack fields (`market.reviews === 'display'`).
- AU never shows a rating number or a review quote.
- Animate `transform` and `opacity` only. The one exception is accordion height, which the brief lists.
- Every animation is off under `prefers-reduced-motion: reduce` and under `html[data-motion='off']`.
- Hover effects sit behind `@media (hover: hover) and (pointer: fine)`.
- Page JavaScript stays at or under 30,720 gzipped bytes (`npm run budget`).
- Tap targets 44px. Every `<img>` has non-empty alt text.
- Home `main` holds exactly one `<ol>` (first visit). Breadcrumbs and carousels use `<ul>`.
- `reveal` attributes never nest.
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- After every task: `npm run build && npm test && npm run check`.

## Review Focus

1. A visitor in another time zone must see "Open now" for the clinic's time zone, not their own. Pinned in `tests/unit/hours.test.ts` (Task 2).
2. With JavaScript off, counters show final numbers, the carousel is a scrollable list, the accordion opens, and nothing is hidden. Pinned in `motion.e2e` "JavaScript off" (Task 6).
3. Under reduced motion the carousel does not auto-advance and the marquee does not move. Pinned in `motion.e2e` (Task 6).
4. Switching an AU build to `?market=CA` and back must never leave a rating visible in AU: hero card, stats, badge. Pinned in `home.e2e` (Task 3).
5. A content folder with no `about.json` (Hollybank, fixtures) must render no empty section and no About or Health tips link. Pinned by `shell.e2e` sitemap check and `vet.e2e` (Task 3).

---

## Parallel work (background agents, no code)

### P1: Photos

- [ ] Search Pexels (search pages answer `curl` with a browser user agent; image CDN is `images.pexels.com/photos/<id>/pexels-photo-<id>.jpeg?auto=compress&cs=tinysrgb&w=1600`) and Unsplash CDN.
- [ ] Download each candidate into its own new empty folder under the scratchpad, view it, and accept only warm, natural-light, non-watermarked photos.
- [ ] Save accepted files as `src/assets/images/<slot>.jpg`, long edge 1600px for rooms and 1000px for portraits, 320px for avatars.
- [ ] Write `CREDITS.md` at the repo root: slot, what it shows, photographer, source page URL, licence.
- [ ] Portraits match each clinician's name and role; the six share a plain light background style. `founder-priya` is from the same shoot as `provider-priya-nair` or does not show an identifiable face.

Slots: see the spec, "Photos".

### P2: Content

Starts after Task 0, because it needs the schemas.

- [ ] Write `about.json`, `awards.json`, `funds.json`, `conditions.json`, `gallery.json`, six `blog/*.md`.
- [ ] Extend the six `providers/*.md`, five `services/*.md` and `reviews.json` (nine reviews).
- [ ] Check every invented award, accreditation and fund name against a web search and rename any that matches a real organisation.
- [ ] Validate each JSON file parses.

---

### Task 0: Content model and modules

**Files:**
- Modify: `src/content.config.ts`, `src/domain/modules.ts`, `src/domain/types.ts`, `src/presets/allied-health.ts`, `src/config/sites/fernway-au/site.ts`, `src/config/sites/fernway-ca/site.ts`
- Test: `tests/unit/presets.test.ts` and any test that lists `MODULE_IDS`

**Interfaces produced:**
- Collections `about`, `awards`, `funds`, `conditions`, `gallery`, `blog`, shaped as in the spec table. All optional per content folder.
- `MODULE_IDS` gains `'about'` and `'blog'`; `MODULES.about.routes = ['/about/']`, `MODULES.blog.routes = ['/blog/']`.
- Preset nav gains `{ label: 'About', href: '/about/', module: 'about' }` and `{ label: 'Health tips', href: '/blog/', module: 'blog' }`.

- [x] Add the schemas. `services.faqs` goes from `.length(3)` to `.min(3)`. Every new field on `providers`, `services` and `reviews` is `.optional()`.
- [x] Add the two modules, off in the preset list, on in both Fernway site files.
- [x] Update module tests for the two new ids.
- [x] `npm run build && npm test && npm run check`. Expected: all pass, no new routes yet.
- [x] Commit `feat: content model and modules for the redesign`.

### Task 1: Tokens and typography

**Files:**
- Modify: `src/styles/tokens.css`, `src/styles/global.css`, `package.json`
- Test: `tests/unit/tokens.test.ts`, `tests/unit/contrast.test.ts`

- [x] `npm install @fontsource-variable/fraunces`.
- [x] Update `contrast.test.ts` first: add pairs `on-ink/cta`, `on-ink/cta-strong`, `ink-subtle/paper|card|surface`, `ink/sand`, `ink-muted/sand`, `primary-text/sand`, `on-deep/deep`, `star/card` and `star/paper` at 3, `primary/surface` for both themes; add `fernway-dark` to the theme loops; re-pin the exception values. Run it: expected FAIL on missing tokens.
- [x] Write the `fernway` block from the spec table, `harbour` with the new names (`cta` = its ink), and `fernway-dark`.
- [x] Add to the plain `:root` block: `--font-display`, `--text-display`, `--text-title`, `--text-lead`, new `--text-hero`, `--dur-1: 150ms`, `--dur-2: 300ms`, `--dur-3: 600ms`, `--ease-out: cubic-bezier(0.22, 1, 0.36, 1)`, `--space-9: 96px`, `--space-10: 128px`, `--wrap: 75rem`, layered shadows.
- [x] Update the pins in `tokens.test.ts` for hero clamp and shadows; add pins for the motion tokens.
- [x] `global.css`: headings in `--font-display`, fluid sizes, `.wrap`, `.grid-12`, `.section` rhythm, animated link underline, selection colour.
- [x] Build, test, check. Commit `feat: warm token system and display type`.

### Task 2: Layout shell and primitives

**Files:**
- Create: `src/core/hours.ts`, `tests/unit/hours.test.ts`, `src/core/ui/SectionHeading.astro`, `src/core/ui/Breadcrumb.astro`, `src/core/ui/Stars.astro`, `src/core/ui/Accordion.astro`
- Modify: `src/layouts/Header.astro`, `UtilityBar.astro`, `Footer.astro`, `MobileBar.astro`, `BaseLayout.astro`, `site.ts`, `src/core/ui/Button.astro`, `Card.astro`, `Placeholder.astro`, `icons.ts`, `src/sections/PageHeader.astro`, `src/pages/dev/ui.astro`
- Test: `tests/unit/icons.test.ts`, `tests/e2e/shell.e2e.mjs`

**Interfaces produced:**
- `openStatus(hours: Clinic['hours'], now: Date, timeZone: string): { open: boolean; label: string }`. Labels: `Open now, closes 6 pm`; `Closed, opens 8 am`; `Closed, opens Monday 8 am`.
- `SectionHeading` props `eyebrow?, title, lead?, align?: 'start' | 'center', as?: 'h2' | 'h3', id?`.
- `Breadcrumb` props `items: { label: string; href?: string }[]`, renders `nav[aria-label=Breadcrumb] > ul`.
- `Accordion` props `items: { q: string; a: string }[], name?: string`, renders `details.acc > summary + div`.
- `Stars` props `rating: number`, renders five icons and a visually hidden "Rated N out of 5".
- `PageHeader` props add `crumbs?`, `photo?: SlotPhoto`, `transitionName?`.

- [x] Write `tests/unit/hours.test.ts`: open mid-morning Tuesday; closed at 19:00 opens next day 8 am; Saturday 13:30 closed, opens Monday; Sunday; and a `now` that is Tuesday morning in Melbourne but Monday evening in UTC. Run: FAIL.
- [x] Implement `hours.ts` with `Intl.DateTimeFormat(…, { timeZone, weekday, hour, minute, hourCycle: 'h23' })`. Run: PASS.
- [x] Header: sticky with `top: calc(-1 * var(--utility-h))`; background layer fades and scales on `[data-scrolled]`, set from an `IntersectionObserver` sentinel; slide-in mobile menu (`transform: translateX`), focus kept inside while open, Escape closes; open-now text per market variant.
- [x] Footer: brand and mission, Services, Clinic, Patients, Visit columns, legal row per market.
- [x] MobileBar: labelled Call and Book.
- [x] Button: primary uses `--color-cta`; press scale kept; optional trailing arrow that slides 2px on hover.
- [x] Placeholder: branded gradient tile with an icon, same `role="img"` label.
- [x] Add the icons the new sections need (tooth, brain, activity, dumbbell, quote, leaf, pause, play, chevron-left, chevron-down, arrow-up-right, instagram is not used). Each passes the five icon tests.
- [x] `shell.e2e`: check nav and footer links against the sitemap; mobile bar has visible "Call" and "Book" text.
- [x] Build, test, check. Commit `feat: sticky header, rich footer and shared primitives`.

### Task 3: Homepage

**Files:**
- Create: `src/sections/TrustStrip.astro`, `WhyBand.astro`, `StoryBand.astro`, `GalleryBand.astro`, `TipsBand.astro`, `Newsletter.astro`, `InsuranceBand.astro`, `src/core/ui/Counter.astro`, `Carousel.astro`, `Lightbox.astro`, `Marquee.astro`, `FundLogo.astro`, `src/core/carousel.ts`, `src/core/lightbox.ts`
- Modify: `src/pages/index.astro`, `src/sections/Hero.astro`, `ServicesBand.astro`, `TeamRow.astro`, `FirstVisit.astro`, `FeesTeaser.astro`, `ReviewsBand.astro`, `Location.astro`, `Faq.astro`, `CtaBand.astro`, `src/modules/reviews/Reviews.astro`, `src/modules/stats/metrics.ts`
- Test: `tests/e2e/home.e2e.mjs`, `tests/unit/metrics.test.ts`

**Interfaces produced:**
- `Counter` props `value: number, suffix?: string, decimals?: number`; renders the final number as text and `data-count-to`.
- `Carousel` props `label: string, auto?: boolean`; default slot is `<li>` items; renders `[data-carousel]` with `[data-carousel-track]`, prev, next and pause buttons.
- `Lightbox` props `items: { slot: string; alt: string; caption: string }[]`; renders a thumbnail grid of buttons and one `<dialog data-lightbox>`.
- `Marquee` props `label: string`; default slot is the item list, duplicated with `aria-hidden` for the loop; pause button.
- `FundLogo` props `name: string, mark: number`; inline SVG using `currentColor` only.
- `index.astro`: `const about = (await getCollection('about'))[0]?.data`; when present it renders the sixteen-section order from the spec, otherwise today's composition.

- [x] `home.e2e`: FAQ selector to `#faq details`; add "AU never shows a rating" (no `[data-rating]:visible` at load and after `?market=CA` then `?market=AU`); add "CA shows the carousel with a pause button".
- [x] Build each section against its content shape. Sections take plain props; the page loads collections.
- [x] The rating gate is one helper, `showsRatings(market)` in `modules/reviews/reviews.ts`, used by hero card, stats and badge.
- [x] Build, test, check, then `E2E_SITES=fernway-au,fernway-ca,hollybank node tests/e2e/run.mjs` for `home` and `shell`. Commit `feat: sixteen-section homepage`.

### Task 4: Inner pages and blog

**Files:**
- Create: `src/pages/about/[...slug].astro`, `src/pages/blog/[...slug].astro`, `src/pages/blog/[slug].astro`, `src/modules/blog/PostCard.astro`, `src/modules/blog/posts.ts`
- Modify: `src/pages/services/[slug].astro`, `services/[...slug].astro`, `team/[slug].astro`, `team/[...slug].astro`, `fees/[...slug].astro`, `contact.astro`, `faq.astro`, `new-patients.astro`, `404.astro`, `book/[...slug].astro`, `src/modules/services/ServiceBody.astro`, `ServiceList.astro`, `src/modules/providers/ProviderProfile.astro`, `ProviderList.astro`, `src/modules/booking/BookingForm.astro`, `src/layouts/PolicyPage.astro`, `src/core/schema.ts`
- Test: `tests/e2e/pages.e2e.mjs`, `tests/e2e/content.e2e.mjs`

**Interfaces produced:**
- `posts.ts`: `sortPosts(posts)`, newest first; `postDate(date, locale)`.
- `articleSchema(post, author, site)` in `core/schema.ts`.

- [ ] Add e2e steps: `/blog/` lists six posts; an article has one h1, an author link to `/team/<slug>/`, Article JSON-LD and the general-information note; `/about/` has the story and awards; neither route exists on Hollybank.
- [ ] Service detail gains treats, timeline (`ol`), price facts, accordion FAQ, clinician cards. Team detail gains qualifications, interests, availability.
- [ ] Booking form: restyle progress, choices, validation states. No logic change.
- [ ] Build, test, check. Commit `feat: rich inner pages, about and blog`.

### Task 5: Imagery

**Files:**
- Move: `src/assets/photos/` to `src/assets/images/`
- Modify: `src/core/photos.ts`, `src/config/photo-slots.ts`, `tools/photo-brief.mjs`, service and review content `photoSlot` values
- Create: `CREDITS.md`; delete `docs/photo-credits.md`
- Test: `tests/unit/photos.test.ts`, `tests/e2e/photos.e2e.mjs`

- [ ] View every delivered photo. Replace any that is off-tone, watermarked or mismatched.
- [ ] Register slots and alt text. `photoRoles.fernway` becomes `{ hero: 'hero-consult', exterior: 'clinic-exterior', firstVisit: 'treatment-room-physio' }`.
- [ ] `photos.e2e`: initials-tile steps run on Hollybank only; Fernway asserts every team card holds a loaded `<img>`; exterior photo is asserted in `#location`.
- [ ] Build, test, check. Commit `feat: photography, credits and branded placeholder`.

### Task 6: Motion

**Files:**
- Modify: `src/core/motion.ts`, `src/styles/global.css`, sections that need `data-reveal`
- Test: `tests/e2e/motion.e2e.mjs`

- [ ] `motion.e2e`: FAQ selector; add "reduced motion: carousel does not advance and marquee has no animation"; add "JavaScript off: counters show their final value".
- [ ] Reveal: 20px rise, 70 ms stagger, 600 ms, once. Count-up on `[data-count-to]`.
- [ ] CSS: timeline line-draw and hero parallax under `@supports (animation-timeline: view())` and `prefers-reduced-motion: no-preference`; marquee; card lift and image zoom; underline; accordion height.
- [ ] Build, test, check, `npm run budget`. Commit `feat: motion system`.

### Task 7: View transitions

**Files:**
- Modify: `src/layouts/BaseLayout.astro`, card and detail components for services, team and blog

- [ ] Card photo and detail photo share `view-transition-name` (`service-<slug>`, `provider-<slug>`, `post-<slug>`). Names are unique per page.
- [ ] Root cross-fade uses `--dur-2`; morph groups use `--dur-3` and `--ease-out`.
- [ ] Add a `motion.e2e` step: on `/services/`, every `view-transition-name` on the page is unique.
- [ ] Build, test, check. Commit `feat: card to detail view transitions`.

### Task 8: Docs and verification

**Files:**
- Modify: `docs/design-system.md`, `docs/customising.md`, `docs/modules.md`, `docs/photo-brief.md`, `README.md`, `docs/build-ledger.md`

- [ ] Rewrite the design-system doc to match: tokens, type, primitives, motion, and the rules that changed.
- [ ] `npm test && npm run check && npm run build:all && npm run budget && npm run e2e`. All green.
- [ ] Lighthouse mobile on `/`, `/services/physiotherapy/`, `/blog/` against `astro preview`. Fix anything under 90.
- [ ] Commit `docs: design system and customising notes for the redesign`.
- [ ] Report scores, every invented fact, and every judgement call.
