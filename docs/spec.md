# Health Clinic Modular Site: Spec

Status: v0.1, draft for review (3 October 2026).
Owner: Reozix. Reviewers: Roby (technical scope), Rownak (delivery and cost), final approver (positioning and pricing).
Inputs: *Health & Medical Services: Agency Opportunity Guide* (scopes S1-S12, packages P1-P6, build standards), the full *Health & Medical Services Digital Opportunity Report*, the Clearday cleaning demo spec and plan (conventions), and the brainstorming decisions in §2.

---

## 1. Goal

Build one modular healthcare website product that:

1. runs as the Health & Medical Services sales-kit demo with fictional clinics, and
2. is deployed for each paying clinic by editing config, content, tokens and photos only.

v1 proves two presets: **allied health** (physio, dental, psychology, GP-style single clinic) in **Australia and Canada**, and **UK veterinary**.

Done means:

1. A partner shows a working clinic site on a phone in about 3 minutes, then switches it live to the other market (`?market=CA`) or opens the vet preset.
2. A patient can request an appointment, or be handed to the clinic's practice system, without phoning, and the site never asks for symptoms or medical history.
3. The clinic console shows each request and the messages it would trigger (confirmation, reminder, recall, review request), marked "Preview, not sent".
4. A developer sets up a real clinic by editing `src/config/`, `src/content/`, `src/styles/tokens.css` and photos. No component edits.
5. Switching a module off leaves no route, link, sitemap entry or JavaScript for it.
6. Every page meets the guide's build standards: WCAG 2.2 AA, Core Web Vitals, no third-party tracking on request pages, market-correct consent and review rules.
7. The code is modular and tested: dependency direction is enforced by a test; all business logic is pure and unit-tested.

Non-goals for v1: real availability sync with a practice system, sending real SMS or email, payments and deposits, patient portal or records, real authentication, multi-location, fertility and aesthetics presets, multilingual pages, blog (§12).

## 2. Decisions

| # | Decision | Why |
|---|---|---|
| D1 | **Demo that ships** | One codebase is both the sales-kit demo (fictional brands, `demoMode: true`) and the product deployed per clinic. |
| D2 | **One repo, switchable modules (option 1)** | Shared `core/`, healthcare `domain/`, self-contained `modules/`. A `site.ts` config picks preset, market and modules. Chosen over forking Clearday per preset (drift) and extracting a shared package first (up-front cost to two finished repos). `core/` stays import-clean so it can move into a shared package later. |
| D3 | **Two presets in v1: allied health and UK vet** | Allied health is the broadest owner-operated market (guide Wave 1). UK vet has a live sales hook (CMA price-list, estimate and ownership remedies) and exercises the transparency modules, proving modules really switch. |
| D4 | **Allied health in two markets: Australia and Canada** | Requested. One brand with two market variants proves the market rule packs. Canada was the thinnest market in the research, so the CA pack is marked "verify before sale" (§9, §13). |
| D5 | **Market rule packs are data** | AU, CA and UK packs hold currency, tax wording, testimonial rule, consent wording, price-display rule, formats and required legal pages. Modules read the pack; no module checks a country itself. |
| D6 | **Pluggable booking** | Built-in appointment request flow (works on static hosting) plus a provider slot: `none`, `embed` or `link` to the clinic's practice system (Cliniko, Jane, etc.). Live API sync is later. |
| D7 | **PHI-free public site** | Forms collect contact details, service, clinician preference, time window and consents only. No symptoms, history, diagnoses or pet medical details. Clinical intake happens in the clinic's practice system. (Guide S10.) |
| D8 | **Clinic console with automation previews** | Inbox of requests, referrals and estimate requests; confirm or decline; message timeline previews labelled "not sent". Same pattern as Clearday. |
| D9 | **Visual direction: "Appointment card"** | The booking request is drawn as a paper appointment card that fills in as the patient chooses; it doubles as the review step. Vet preset uses a pet record card with the same mechanics. Chosen over "Clinic map" and "Plain NHS-style" (§8). |
| D10 | **Stack: Astro 5 + TypeScript strict + plain CSS on tokens** | Same as Trades and Clearday; static output; near-zero JS by default. |
| D11 | **Sample data is visibly sample** | `demoMode: true` shows a ribbon and labels reviews, prices and messages as samples. Prices are drafts for approval. |
| D12 | **Two themes ship** | `fernway` (sage) and `harbour` (blue) prove re-skinning; `?theme=` switches live in demo mode only. |

## 3. Demo brands

| Preset | Brand | Market | Location | Identifiers (all fictional) |
|---|---|---|---|---|
| Allied health | Fernway Health (physio, dental, psychology) | AU | Melbourne, VIC | Phone `03 5550 1200`, mobile `0491 570 120` (ACMA fictional ranges), ABN `00 000 000 000` |
| Allied health | Fernway Health | CA | Ottawa, ON | Phone `613-555-0123` (NANP 555-01xx fictional range), BN `000000000` |
| Vet | Hollybank Vets | UK | Leeds | Phone `0113 496 0123` (Ofcom drama range), company number `00000000`, RCVS-registered vets named as samples |

In demo mode `?market=AU|CA` switches Fernway's market for the session; `?preset=vet` is not used (the vet demo is a separate build of the same repo, §5.4).

## 4. Information architecture

### 4.1 Allied health

```
/                     Home (§7.1)
/book/                Appointment request or practice-system hand-off (§7.2)
/services/            All services
/services/[slug]      physiotherapy, dental-check-up, psychology, ...
/team/                Clinicians
/team/[slug]          Clinician profile
/fees/                Fees, funding and cover (market-specific, §7.5)
/new-patients/        First visit, what to bring, forms in the practice system
/contact/             Address, hours, parking, transport, accessibility of the building, after-hours route
/referrers/           For GPs and other referrers (module `referrals`)
/faq/  /privacy/  /accessibility/  /terms/
/console/             Clinic console (noindex)
/404
```

### 4.2 UK vet

```
/                     Home
/book/                Appointment request
/services/  /services/[slug]   vaccinations, dental, neutering, consultations
/prices/              Price list with "last reviewed" date (module `price-list`)
/estimates/           Written-estimate request (module `estimates`)
/team/  /team/[slug]
/out-of-hours/        Emergency routing (module `emergency`)
/ownership/           Who owns the practice (module `ownership`)
/pet-health-plans/    Plan summary (content page)
/contact/  /faq/  /privacy/  /accessibility/  /terms/
/console/
/404
```

Header: logo, up to six nav items from the preset, phone (tap to call), **Book an appointment**.
Footer: legal name and identifier, address, phone, hours, emergency line, policy links, accessibility statement.
Mobile: header shows logo, call icon, menu; a sticky bar with **Book** and a call icon on every page except `/book/` and `/console/`.

## 5. Architecture

### 5.1 File structure

```
health-clinic/
├─ src/
│  ├─ core/            Industry-neutral (ported from Clearday). Imports nothing outside src/core.
│  │  ├─ leads/         types, repository, local-repository, validation, csv, index
│  │  ├─ console/       shell, inbox, dom
│  │  ├─ ui/            Button, Field, ErrorSummary, Icon, Badge, Photo, Placeholder
│  │  └─ storage.ts format.ts geo.ts schema.ts theme.ts photos.ts forms.ts paths.ts
│  ├─ domain/          Healthcare logic shared by modules
│  │  ├─ markets/       au.ts, ca.ts, uk.ts, index.ts (MarketPack)
│  │  ├─ modules.ts     ModuleId, registry, isOn(), routesFor()
│  │  ├─ presets.ts     resolveSite(): merges preset defaults with config
│  │  ├─ types.ts       Provider, Service, Fee, PriceItem, Clinic
│  │  └─ events.ts      typed DOM events between modules
│  ├─ modules/         Each folder: pure logic, components, thin DOM wiring
│  │  ├─ booking/       state.ts, card.ts (appointment card), providers.ts, lead.ts, steps/*.astro, AppointmentCard.astro, booking.ts
│  │  ├─ providers/     ProviderList.astro, ProviderProfile.astro
│  │  ├─ services/      ServiceList.astro, ServicePage.astro, from-price.ts
│  │  ├─ fees/          FeesTable.astro, funding.ts
│  │  ├─ price-list/    PriceList.astro, price-list.ts
│  │  ├─ estimates/     EstimateForm.astro, estimate.ts
│  │  ├─ ownership/     OwnershipStatement.astro
│  │  ├─ reviews/       Reviews.astro, reviews.ts
│  │  ├─ reminders/     schedule.ts, render.ts, timeline.ts
│  │  ├─ referrals/     ReferralForm.astro, referral.ts
│  │  └─ emergency/     EmergencyNote.astro
│  ├─ config/          The per-client surface (§6)
│  ├─ presets/         allied-health.ts, vet.ts
│  ├─ content/         Schema-checked Markdown and JSON
│  ├─ sections/        Page bands composed from modules and core/ui
│  ├─ layouts/         BaseLayout, ThemeBoot, Seo, Header, Footer, MobileBar, DemoRibbon
│  ├─ pages/           Route files; each module-owned route exits early via getStaticPaths when its module is off
│  └─ styles/          tokens.css (only raw values), global.css, console.css
├─ tests/  unit/  e2e/  fixtures/
├─ tools/  check-boundaries.mjs, js-budget.mjs, shot.mjs, photo-brief.mjs
└─ docs/   spec.md, customising.md, design-system.md, modules.md
```

### 5.2 Dependency rules

`pages → layouts | sections → modules → domain → core`. `config/`, `presets/` and `content/` are read by everything except `core/`.

| Rule | Enforced by |
|---|---|
| `core/**` imports only `core/**`, npm packages and `astro:*` | `check-boundaries.mjs` in `npm test` |
| A module never imports another module; cross-module needs go through `domain/` or `domain/events.ts` | same |
| `domain/` never imports `modules/`, `sections/`, `layouts/` or `pages/` | same |
| No raw colours outside `styles/tokens.css` | same |
| Only `core/storage.ts` and `layouts/ThemeBoot.astro` touch `localStorage`/`sessionStorage` | same |
| No module reads `market` directly; it receives a `MarketPack` | grep rule in `check-boundaries.mjs` (`site.market` allowed only in `domain/presets.ts` and `layouts/`) |
| No third-party script tags in `/book/`, `/estimates/`, `/referrers/` output | e2e check on built HTML |

### 5.3 Module registry

```ts
// domain/modules.ts
type ModuleId = 'providers' | 'services' | 'booking' | 'fees' | 'price-list'
  | 'estimates' | 'ownership' | 'reviews' | 'reminders' | 'referrals' | 'emergency';

interface ModuleDef {
  id: ModuleId;
  routes: string[];          // e.g. ['/prices/'] ; [] for modules that only add sections
  nav?: { label: string; href: string; order: number };
  leadKinds?: LeadKind[];    // kinds this module creates, shown as console filters
  requires?: ModuleId[];     // e.g. estimates requires price-list
}

isOn(id, site): boolean
routesFor(site): string[]    // drives getStaticPaths, sitemap and nav
validateModules(site): string[]  // missing requirements, unknown ids; build fails if non-empty
```

Default modules by preset:

| Module | Allied health | UK vet |
|---|---|---|
| providers, services, booking, reviews, reminders, emergency | On | On |
| fees | On | Off |
| referrals | On | Off |
| price-list, estimates, ownership | Off | On |

### 5.4 Presets and site resolution

`resolveSite(config, preset, markets) → Site` merges: preset defaults (modules, nav, wording, lead kinds, message templates, schema type) ← client overrides in `config/site.ts`. The result is the single object pages and modules read. The vet demo and Fernway demo are two builds of the same repo with different `config/` folders (`config/` is swapped by an env var `SITE=fernway-au|fernway-ca|hollybank` in demo builds; a client build has one `config/`).

In demo mode only, `?market=` overrides the market for the session (allowed values from `site.markets`), resolved by the same rule as Clearday's theme override.

### 5.5 Market rule packs

```ts
// domain/markets/index.ts
interface MarketPack {
  id: 'AU' | 'CA' | 'UK';
  locale: 'en-AU' | 'en-CA' | 'en-GB';
  currency: 'AUD' | 'CAD' | 'GBP';
  taxNote: string;                     // 'GST included where it applies' | 'Taxes extra where they apply' | 'Prices include VAT'
  testimonials: 'banned' | 'allowed';  // AU: banned on clinic-controlled pages (AHPRA)
  reviews: 'link-only' | 'display';    // AU: link to third-party reviews only
  priceDisplay: 'from-allowed' | 'list-required'; // UK vet: list-required when price-list module is on
  consent: { sms: string; email: string; law: string };  // Spam Act / CASL / PECR wording
  identifiers: { label: string; pattern: RegExp };       // ABN / BN / company number
  phone: { pattern: RegExp; href: (p: string) => string };
  postcode: { label: 'Postcode' | 'Postal code'; pattern: RegExp };
  requiredPages: string[];             // '/privacy/', '/accessibility/', '/terms/'
  verified: boolean;                   // CA: false until counsel confirms (§13)
}
```

When `verified` is false and `demoMode` is false, the build prints a warning listing the pack's unverified fields.

### 5.6 Logic and DOM

Every behaviour = a pure module (unit-tested) + a thin wiring script.

| Pure function | Shape |
|---|---|
| `domain/presets.resolveSite` | `(config, presets, markets) → Site` |
| `domain/modules.routesFor` | `(site) → string[]` |
| `modules/booking/state` | `availableDays(today, cfg)`, `nextStep`, `fromParams/toParams` |
| `modules/booking/card` | `cardFields(selection, site) → CardField[]` (what the appointment card shows) |
| `modules/booking/providers` | `handoffUrl(provider, selection) → string \| null` |
| `modules/services/from-price` | `fromPriceLabel(service, market) → string \| null` |
| `modules/fees/funding` | `fundingRows(fees, market) → Row[]` |
| `modules/price-list/price-list` | `groupPrices(items) → Group[]`, `isStale(reviewedAt, today, maxDays)` |
| `modules/estimates/estimate` | `needsWrittenEstimate(amount, threshold) → boolean` |
| `modules/reviews/reviews` | `reviewMode(market) → 'link-only' \| 'display'` |
| `modules/reminders/schedule` | `schedule(lead, templates, ctx) → ScheduledMessage[]` |
| `core/leads/validation` | `validate(input, rules) → { ok, errors }` |

Files aim for under about 150 lines.

### 5.7 Data types

```ts
// domain/types.ts
interface Provider { slug: string; name: string; role: string; registration: { body: string; number: string };
  languages: string[]; services: string[]; acceptingNew: boolean; bio: string; photoSlot: string }
interface Service { slug: string; title: string; summary: string; duration: string;
  fromPrice?: number; whatToExpect: string[]; providers: string[]; faqs: { q: string; a: string }[] }
interface Fee { service: string; label: string; amount: number; funding: string[] }   // allied health
interface PriceItem { group: string; label: string; amount: number; unit?: string }   // vet price list

// core/leads (Clearday shape, new kinds)
type LeadKind = 'appointment' | 'referral' | 'estimate' | 'enquiry';
type LeadStatus = 'new' | 'confirmed' | 'declined' | 'done';
// Lead, Consent, LeadEvent, LeadRepository as Clearday.

// modules/booking
interface AppointmentPayload {
  service: string; provider: string | 'first-available'; patientType: 'new' | 'returning';
  day: string; windowId: string;
  forWhom: 'me' | 'someone-else';        // allied health
  pet?: { name: string; species: 'dog' | 'cat' | 'rabbit' | 'other' };  // vet: name and species only
}
```

### 5.8 Storage

`LeadRepository` from Clearday; demo uses `LocalLeadRepository`, namespaced `health:v1:<site>:*`. Production swaps in `HttpLeadRepository` via `getLeadRepository()`. Messages are sent server-side from the same templates in production; the site never sends.

## 6. Configuration surface

| You want to change… | Edit |
|---|---|
| Preset, market(s), modules on, demo mode, theme | `config/site.ts` |
| Clinic name, legal name, identifier, phones, email, address, hours, emergency wording, map point | `config/clinic.ts` |
| Booking provider (`none` / `embed` / `link`), practice-system URL, request windows, lead time, horizon | `config/booking.ts` |
| Reminder, recall and review templates and timings | `config/messages.ts` (falls back to preset defaults) |
| Services, clinicians, fees or price list, FAQs, policies | `content/` |
| Navigation order and labels | preset defaults; override in `config/site.ts` |
| Colours, type, spacing | `styles/tokens.css` |
| Photos | `src/assets/photos/<slot>.jpg`; `npm run photos:status` lists gaps |

Sample `config/site.ts` (Fernway AU):

```ts
export const site = {
  preset: 'allied-health',
  market: 'AU',
  markets: ['AU', 'CA'],            // demo only: allowed ?market= values
  modules: { referrals: true },     // overrides on top of preset defaults
  demoMode: true,
  theme: 'fernway',
};
```

## 7. Key behaviours

### 7.1 Home page (both presets)

1. Header (§4).
2. Hero: clinic name and what it treats in plain words; **Book an appointment** beside the phone; one-line after-hours note from `emergency`.
3. Trust row from preset and clinic config. Allied health AU: registered with AHPRA, funds accepted, accessible entrance. Allied health CA: registered with the relevant Ontario regulatory college, direct billing where offered. Vet: RCVS-registered vets, price list published, ownership statement.
4. Services list (not a card grid) with "from" prices only when `fromPriceLabel` returns one.
5. Team row: photo slot, name, role, registration body and number.
6. "How your first visit works": numbered steps (request, confirmation, what to bring, after the visit).
7. Fees teaser (allied health) or price-list teaser with "last reviewed" date (vet).
8. Reviews per `reviewMode`: AU shows a "Read our reviews on Google" link and no quotes; CA and UK show named, dated reviews from `content/reviews.json` with the source named.
9. Location, hours, map; building accessibility notes.
10. FAQ (five tagged `home`).
11. Footer.

### 7.2 Booking (`/book/`)

Six steps on one page, progressive, URL keeps state (never contact details):

1. **Service** (from `content/services`).
2. **Clinician** or "First available" (filtered to clinicians offering the service and accepting new patients when step 3 is "new").
3. **New or returning**; allied health also asks "for me / for someone else"; vet asks pet name and species.
4. **When**: preferred day from `availableDays()` and a morning or afternoon window. Copy says it is a request.
5. **You**: first and last name, mobile, email, postcode, consents (terms required; reminders by SMS transactional; marketing SMS and email optional, unticked; wording from the market pack).
6. **Check and send**: the appointment card summary and **Send appointment request**.

The appointment card sits beside the steps on desktop and above them on mobile; each choice fills a line on the card. It is a real `<dl>` with a text equivalent.

If `booking.provider` is `embed` or `link`, step 1 shows the practice system (iframe with title, or a button to `handoffUrl()` with the service preselected) and the request flow remains as a "Can't find a time? Send a request" fallback.

No field asks for symptoms, history, medications or the pet's medical condition. A short note says: "Please don't include medical details here. We'll ask what we need when we confirm."

Success: "Appointment request sent. We'll confirm by SMS within 1 business day." plus (demo mode) a preview of the confirmation SMS.

### 7.3 Clinic console (`/console/`)

Demo sign-in shown on the page. Inbox (filter by kind and status), detail (contact, request summary, consent record with timestamps), Confirm / Decline / Mark done, notes, CSV export, "Clear" and "Load samples". Message timeline per lead from `schedule()`:

| Preset | Message | Fires | Consent |
|---|---|---|---|
| Both | Confirmation (SMS) | On confirm | Transactional |
| Both | Reminder (SMS) | 24 h before the window | Transactional |
| Allied health | Review request (SMS) | 4 h after the window opens | Treated as marketing (consent needed) in every market until counsel confirms otherwise; in AU it links to the Google profile and never asks for a testimonial |
| Allied health | Recall (email) | 6 months after the visit | Marketing email |
| Vet | Vaccination recall (SMS) | 12 months after a vaccination visit | Treated as a service reminder; configurable to require consent |
| Vet | Parasite treatment reminder (SMS) | Every 3 months, configurable | Same |
| Referral | Acknowledgement (email) | On create | Transactional |
| Estimate | Estimate follow-up (email) | 2 days after create if still `new` | Transactional |

Each row: channel, send time or "Waits for confirmation", rendered text, skip reason in words, and "Preview, not sent" in demo mode. Every SMS ends with the clinic name; marketing messages include the market pack's opt-out line. Seven sample leads seed the console so it never opens empty.

### 7.4 Providers and services

Profile: photo slot, name, role, registration body and number (linking to the public register when `registerUrl` is set), languages, services, accepting new patients, short bio, **Book with <first name>** (opens `/book/` with provider preselected). Service page: summary, duration, what to expect, clinicians who offer it, "from" price where allowed, three FAQs, **Book this**.

### 7.5 Fees (allied health)

Table of fees by service with funding columns from the market pack labels: AU (private health fund rebates may apply; Medicare only where a GP plan applies, wording from content), CA (extended health benefits; direct billing where offered). Cancellation policy and payment methods from content. All wording sits in content, not code; the module only lays it out.

### 7.6 Vet transparency modules (UK)

- `price-list`: grouped price table, "Last reviewed <date>", warning in the console when `isStale()` (default 180 days). Prices include VAT wording from the pack.
- `estimates`: request form (pet name and species, what the estimate is for in a short choice list, contact, consent); copy explains written estimates are given before treatment above the practice's threshold (config, default GBP 500).
- `ownership`: statement page from `config/clinic.ts` (`owner`, `group`, `independent: boolean`).
- These modules are labelled in `docs/modules.md` as "built for the CMA remedies; confirm the final Order wording before sale", because whether the Order was made by 23 September 2026 was not verified.

### 7.7 Referrals (allied health)

`/referrers/`: what the clinic treats, how to refer, a referral form (referrer name, practice, contact, patient first name and contact only, service wanted, urgency choice), and a note that clinical details go through the referrer's secure channel or fax, not this form. Creates a `referral` lead.

### 7.8 Errors and empty states

As Clearday: validate on blur, focusable error summary on submit, storage-failure fallback with the phone number and fields kept, too-fast submit held once, honeypot dropped, no available days message, empty console message.

## 8. Design system

### 8.1 Signature element

The appointment card: a paper card with the clinic's name printed at the top, ruled lines for service, clinician, day and time, and patient name. Lines fill as the patient chooses (160 ms colour fade, user-triggered). Vet preset: a pet record card with the pet's name and species line. It is the one bold element; elsewhere hairlines and white space.

### 8.2 Tokens and themes

Raw values only in `tokens.css`. Roles: `--color-paper`, `--color-ink`, `--color-ink-muted`, `--color-card`, `--color-accent` (card fills and selected states only, always with ink text), `--color-line`, `--color-field-border` (3:1), `--color-surface`, semantic success, warning, danger, `--color-focus`. Themes `fernway` (sage accent) and `harbour` (blue accent); exact hex values chosen in the build and checked by the contrast test (§11).

### 8.3 Type and layout

One self-hosted variable family; body 17px, line height 1.6, measure 68ch; scale 14-36 plus a clamped hero. Reading age about 9-11, sentences under 20 words. Sentence case, left-aligned. 12-column grid at 1024px+, single column below 768px, 16px mobile gutter.

### 8.4 Anti-template and trust rules

No carousels, popups, eyebrow labels, all-caps, "→" on buttons, identical card grids or stock photos presented as clinicians. Photo slots show labelled placeholders until real staff photos exist. Buttons say what happens ("Send appointment request").

### 8.5 Motion

Card line fill and button press feedback only; `prefers-reduced-motion` removes movement and keeps short colour fades.

## 9. SEO, compliance, performance

- JSON-LD: `MedicalClinic` (or `Dentist`, `Physiotherapy` where the clinic is single-discipline) for allied health; `VeterinaryCare` for vet; `Physician`-style `Person` on profiles with `hasCredential`; `Service` on service pages. No `aggregateRating` in demo mode or when the market pack bans testimonials.
- Sitemap from `routesFor()`; canonical URLs; console and dev pages excluded.
- Consent: separate, unticked, timestamped marketing boxes; wording from the pack (AU Spam Act, CA CASL, UK PECR). Unsubscribe line on marketing messages.
- Reviews: AU no testimonials on clinic-controlled pages (AHPRA); CA and UK display named, dated third-party reviews with source.
- No third-party pixels, session replay or ad tags on `/book/`, `/estimates/`, `/referrers/`; analytics, if configured, is privacy-safe and off those routes.
- Accessibility statement page (WCAG 2.2 AA target, contact route); CA build notes AODA (WCAG 2.0 AA minimum) is met by the 2.2 AA target.
- Performance: page JS ≤ 30 KB gzipped; mobile Lighthouse 90+ on home and `/book/`; fonts self-hosted; images via `astro:assets`.
- Compliance content is research, not legal advice; each market pack lists what counsel must confirm.

## 10. Checklist traceability (guide → site)

| Guide item | Where |
|---|---|
| S1 website and CMS-style content models, one page per service and clinician | `modules/services`, `modules/providers`, `content/` |
| S2 booking and intake front-end, practice-system hand-off | `modules/booking` (§7.2) |
| S4 reminders, recall and follow-up | `modules/reminders`, console timeline |
| S8 price and transparency pages (UK vet) | `price-list`, `estimates`, `ownership` |
| S9 accessibility | §8, §9, axe in e2e, `/accessibility/` |
| S10 privacy and tracking | D7, §9, built-HTML script check |
| S11 local SEO foundations | JSON-LD, contact page, sitemap |
| S7 referrer door (light) | `modules/referrals` |
| Build standards: one action cluster, phone visible, no account to book | Header, MobileBar, `/book/` |

## 11. Testing

| Layer | What | Tool |
|---|---|---|
| Unit | `resolveSite`: preset defaults, overrides, unknown modules rejected, `requires` enforced | Vitest |
| Unit | `routesFor`: switched-off modules produce no routes; nav and sitemap match | Vitest |
| Unit | Market packs: AU `testimonials: 'banned'`; CA `verified: false`; every pack has consent wording and required pages | Vitest |
| Unit | Booking state, URL round-trip, `availableDays` in the clinic's time zone, `handoffUrl`, `cardFields` | Vitest |
| Unit | `schedule()`: timings per preset, consent skips, AU review request has no testimonial wording | Vitest |
| Unit | `isStale`, `needsWrittenEstimate`, `fundingRows`, `fromPriceLabel`, validation, CSV | Vitest |
| Structure | Dependency rules (§5.2) | `check-boundaries.mjs` |
| Types | Strict TS, content schemas | `astro check` |
| End to end | Fernway AU: book a physio appointment → success → console confirm → previews. `?market=CA` changes fees labels, consent wording and shows displayed reviews. Hollybank: price list, estimate request, out-of-hours page. Module off (fixture config) → route returns 404 and nav has no link. | Playwright |
| Privacy | Built HTML of `/book/`, `/estimates/`, `/referrers/` has no third-party script origins | Playwright or a build script |
| Layout and accessibility | No horizontal overflow at 375 and 1280; axe with no serious or critical issues in both presets and both themes | Playwright + axe |
| Contrast | Token pairs meet AA in both themes | Vitest |

## 12. Out of scope (later)

Live practice-system availability (Cliniko API first), real SMS and email sending, deposits and payments, patient portal and records, real authentication, multi-location platform (P3), fertility and aesthetics presets (P4), specialist and imaging referrer front door (P5) beyond the light referrals module, multilingual pages, blog, AI assistant.

## 13. Open questions

1. Repository name and hosting domain (working name `health-clinic`; e.g. `reozixltd/health-clinic`, `health.reozix.com`).
2. Canada pack: provincial privacy and health-information rules, advertising and testimonial rules for Ontario regulatory colleges, and CASL wording need confirming before the CA variant is sold (`verified: false` until then).
3. UK vet: confirm whether the CMA Order was made and its final wording before Hollybank is used in pitches; the estimate threshold (GBP 500) and price-list rules follow the final report.
4. Demo prices and fees for Fernway (AUD, CAD) and Hollybank (GBP) need the approver's sign-off.
5. Whether Fernway's demo should show all three disciplines (physio, dental, psychology) or one, to keep the pitch focused.
6. Demo photos: licence-free stock of rooms and equipment only, or a small shoot; never stock people presented as clinicians.

## 14. Setting up a real clinic

1. Copy a preset's sample config into `config/`; set `site.ts` (preset, market, modules, `demoMode: false`, theme).
2. Fill `clinic.ts`, `booking.ts` (choose `none`, `embed` or `link`), and adjust `messages.ts` if needed.
3. Replace `content/` with real services, clinicians, fees or price list, FAQs and policies.
4. Drop real photos into `src/assets/photos/`; run `npm run photos:status`.
5. Production storage and messaging: implement `HttpLeadRepository`; send messages server-side from `messages.ts`.
6. Confirm the market pack with local counsel; run `npm test`, `npm run check`, `npm run build`, `npm run e2e` before deploying.
