# Health Clinic Modular Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `health-clinic`, one static Astro site with switchable modules and market rule packs, shipping three demo builds (Fernway Health AU, Fernway Health CA, Hollybank Vets UK) that are re-skinned per clinic by config.

**Architecture:** Static Astro 5 site in the Trades/Clearday conventions. Industry-neutral code in `src/core/` (ported from Trades `src/lib/` and the Clearday plan's core interfaces). Healthcare logic shared by modules in `src/domain/` (module registry, presets, market packs, types). Each `src/modules/*` folder owns one feature. `resolveSite()` merges preset defaults, client config and the market pack into one `Site` object that pages, sections and modules read; module-owned routes are generated only when the module is on. A boundary checker enforces import direction in `npm test`.

**Tech Stack:** Astro ^5.18.2, TypeScript (astro/tsconfigs/strict), @astrojs/sitemap, @astrojs/check, Vitest + jsdom, Playwright (chromium at `/opt/pw-browsers/chromium`), @axe-core/playwright, one Fontsource variable family (Atkinson Hyperlegible Next if available on Fontsource, else Source Sans 3), Node 22.

**Spec:** `docs/spec.md` (copied from `docs/specs/2026-10-03-health-clinic-site-design.md`, v0.1 approved 3 October 2026). Open questions take these defaults: repo `reozixltd/health-clinic`, site `https://health.reozix.com`; Fernway shows physio, dental and psychology; photos are labelled placeholders (licence-free room/equipment stock only if added later); all prices are drafts.

**Port source:** `reozixltd/trades-construction` (public; `GIT_LFS_SKIP_SMUDGE=1 git clone --depth 1 https://github.com/reozixltd/trades-construction /tmp/trades`). "Port" means copy the named file, change only what the step lists, keep its tests passing. Where Trades lacks a piece, the interface in this plan is the source of truth.

## Global Constraints

- Astro `^5.18.2`; TypeScript strict via `"extends": "astro/tsconfigs/strict"`; alias `@/*` → `src/*`; no UI framework, no Tailwind, plain CSS on tokens.
- Import direction: `pages → layouts | sections → modules → domain → core`. `config/`, `presets/`, `content/` readable by everything except `core/`. A module never imports another module.
- Raw colours (`#hex`, `rgb(`, `hsl(`) only in `src/styles/tokens.css`.
- Only `src/core/storage.ts` and `src/layouts/ThemeBoot.astro` reference `localStorage`/`sessionStorage`. Keys: `health:v1:<siteId>:<name>`.
- Only `src/domain/presets.ts` and `src/layouts/*` read `site.market`; modules receive a `MarketPack`.
- Public forms never ask for symptoms, history, medications or a pet's condition (spec D7).
- No third-party `<script src>` origins in built `/book/`, `/estimates/`, `/referrers/`.
- Dates computed in the clinic's `timeZone` from `config/clinic.ts` (Fernway AU `Australia/Melbourne`, Fernway CA `America/Toronto`, Hollybank `Europe/London`), never device time.
- Money: whole units, displayed by `formatMoney(n, pack)` (`$120` AUD/CAD, `£120` GBP).
- Demo identities (spec §3): Fernway AU `03 5550 1200`, `0491 570 120`, ABN `00 000 000 000`; Fernway CA `613-555-0123`, BN `000000000`; Hollybank `0113 496 0123`, company number `00000000`. Console login `clinic@demo.reozix` / `demo1234`.
- UI copy: sentence case; no all-caps; no eyebrow labels; no `→` on buttons; no `·` strings; numbered markers only on "How your first visit works" and `/book/` steps.
- WCAG 2.2 AA, visible focus, 44px targets, every control labelled, `prefers-reduced-motion` respected.
- Page JS ≤ 30 KB gzipped; fonts self-hosted.
- Source files aim for ≤ 150 lines.
- Commit messages end with:
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01C5vw6898Juc71TKbYQGpXX
  ```

## Review Focus

1. **Module switched off but linked from content** (a service Markdown links `/prices/` while `price-list` is off): the build fails with a clear message rather than shipping a dead link. Test in Task 6 (`content links only to generated routes`).
2. **Stale or hand-edited demo params** (`?market=US`, `?theme=neon`, `?step=you&service=unknown`): unknown values fall back to config defaults; nothing throws. Tests in Task 4 (`resolveMarketOverride rejects unknown`) and Task 10 (`fromParams defaults unknown service`).
3. **Patient types medical details into a free-text field** (notes): there is no free-text notes field on `/book/`; referral and estimate forms use choice lists, and the only free text (`patientFirstName`, names) is length-limited. Test in Task 10 and Task 15 (`no textarea in public request forms`).
4. **Clinician filtered out of every slot** (new patient, no clinician accepting new patients for a service): step 2 shows "First available" only, with a note, and the request still sends. Test in Task 10 (`providersFor returns empty when none accept new`).
5. **Visitor near midnight or in another time zone**: day picker counts from today in the clinic's zone. Test in Task 10 (`availableDays uses clinic date`).

---

## File map

```
src/core/            storage.ts format.ts paths.ts theme.ts schema.ts photos.ts forms.ts
                     leads/{types,repository,local-repository,validation,csv,index}.ts
                     console/{shell,inbox,dom}.ts
                     ui/{Button,Field,ErrorSummary,Icon,Badge,Photo,Placeholder}.astro ui/icons.ts
src/domain/          types.ts modules.ts presets.ts events.ts markets/{au,ca,uk,index}.ts
src/presets/         allied-health.ts vet.ts
src/config/          index.ts  sites/{fernway-au,fernway-ca,hollybank}/{site,clinic,booking,messages}.ts
src/content/         {fernway,hollybank}/{services,providers,policies}/*.md + reviews.json faqs.json fees.json prices.json
src/content.config.ts
src/modules/booking/      state.ts card.ts providers.ts lead.ts steps/*.astro AppointmentCard.astro BookingForm.astro booking.ts
src/modules/providers/    ProviderList.astro ProviderProfile.astro
src/modules/services/     from-price.ts ServiceList.astro ServiceBody.astro
src/modules/fees/         funding.ts FeesTable.astro
src/modules/price-list/   price-list.ts PriceList.astro
src/modules/estimates/    estimate.ts EstimateForm.astro
src/modules/ownership/    OwnershipStatement.astro
src/modules/reviews/      reviews.ts Reviews.astro
src/modules/reminders/    render.ts schedule.ts timeline.ts
src/modules/referrals/    referral.ts ReferralForm.astro
src/modules/emergency/    EmergencyNote.astro
src/sections/        Hero TrustRow ServicesBand TeamRow FirstVisit FeesTeaser ReviewsBand Location Faq CtaBand PageHeader
src/layouts/         BaseLayout ThemeBoot Seo Header Footer MobileBar DemoRibbon site.ts
src/pages/           index book services/{index,[slug]} team/{index,[slug]} fees new-patients contact referrers
                     prices estimates out-of-hours ownership pet-health-plans faq privacy accessibility terms 404
                     console/{index.astro,_app.ts,_samples.ts,_detail.ts}
src/styles/          tokens.css global.css console.css
tests/unit/ tests/e2e/ tests/fixtures/
tools/               boundaries.mjs check-boundaries.mjs js-budget.mjs shot.mjs photo-brief.mjs third-party.mjs
docs/                spec.md customising.md design-system.md modules.md photo-brief.md
```

**Site selection:** `src/config/index.ts` exports `config` by reading `import.meta.env.SITE` (`fernway-au` default, `fernway-ca`, `hollybank`) and returning that folder's four files. Content collections load from `src/content/<brand>/` where `brand = config.site.contentDir`. A client build deletes the unused folders and points `SITE` at its own.

---

### Task 1: Scaffold, boundary checker and spec copy

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `.gitignore`, `README.md`, `docs/spec.md`, `src/pages/index.astro` (temporary heading), `tools/boundaries.mjs`, `tools/check-boundaries.mjs`, `tests/unit/boundaries.test.ts`, `tests/fixtures/boundaries/{ok,bad}/src/**`

**Interfaces:**
- Produces: npm scripts `dev`, `build`, `preview`, `check`, `test` (`node tools/check-boundaries.mjs && vitest run`), `e2e` (`node tests/e2e/run.mjs`), `build:all` (`SITE=fernway-au astro build --outDir dist/fernway-au && SITE=fernway-ca … && SITE=hollybank …`), `budget`, `photos:status`.
- `findViolations(rootDir: string): Violation[]`, `Violation = { file; rule: RuleId; detail }`, `RuleId = 'core-imports-outside' | 'domain-imports-module' | 'module-imports-module' | 'section-imports-page' | 'storage-outside-core' | 'raw-colour-outside-tokens' | 'market-read-outside-presets'`.

- [ ] **Step 1:** Write `package.json` (name `health-clinic`, `"type": "module"`, scripts above, deps `astro@^5.18.2`, `@astrojs/sitemap`, the Fontsource family; devDeps `@astrojs/check`, `typescript@^5.9`, `vitest`, `jsdom`, `playwright`, `@axe-core/playwright`). Port `tsconfig.json` and `vitest.config.ts` from Trades (`include: ['tests/unit/**/*.test.ts']`). `astro.config.mjs`: `site: 'https://health.reozix.com'`, `trailingSlash: 'always'`, sitemap filter excludes `/console/` and `/dev/`. Copy the spec to `docs/spec.md`.
- [ ] **Step 2: Write the failing tests** in `tests/unit/boundaries.test.ts`:
  - `ok fixture has no violations` → `findViolations('tests/fixtures/boundaries/ok')` equals `[]` (fixture includes `src/domain/presets.ts` reading `site.market` and `src/domain/x.ts` with `import type { Site } from '@/config'`).
  - `flags each rule once` → sorted `rule` values of the `bad` fixture equal all seven `RuleId`s. Bad fixture: `src/core/a.ts` imports `@/config`; `src/domain/x.ts` imports `@/modules/booking/state`; `src/modules/fees/f.ts` imports `../booking/state`; `src/sections/S.astro` imports `@/pages/index.astro`; `src/modules/booking/b.ts` contains `localStorage.getItem`; `src/sections/T.astro` contains `color: #ff0000`; `src/modules/reviews/r.ts` contains `site.market`.
- [ ] **Step 3:** Run `npx vitest run tests/unit/boundaries.test.ts`. Expected: FAIL (module not found).
- [ ] **Step 4:** Implement `tools/boundaries.mjs` (port Trades/Clearday checker shape: walk `src/` `.ts .mjs .astro .css`, resolve `@/` and relative specifiers to top-level folder `core | domain | modules/<name> | sections | layouts | pages | config | presets | content | styles`) with the seven rules and exemptions (`core/storage.ts`, `layouts/ThemeBoot.astro` for storage; `styles/tokens.css` for colours; `domain/presets.ts` and `layouts/**` for `site.market`). CLI prints one line per violation, exits 1 if any.
- [ ] **Step 5:** Run `npm install && npm test && npm run build`. Expected: tests PASS, `dist/index.html` exists.
- [ ] **Step 6:** Commit: `chore: scaffold health-clinic with boundary checker`.

---

### Task 2: Core storage, format, leads, validation, forms

**Files:**
- Create (port from Trades `src/lib/`, adapt): `src/core/{storage,format,paths,forms}.ts`, `src/core/leads/{types,repository,local-repository,validation,csv,index}.ts`
- Test: `tests/unit/{storage,format,repository,validation,csv,forms}.test.ts`

**Interfaces:**
- Produces:
  - `storage.ts`: `KeyValueStorage`, `createMemoryStorage()`, `getStorage()`, `getSessionStorage()`, `isStoragePersistent()`, `readJson(storage, key, fallback)`, `writeJson(storage, key, value)`.
  - `format.ts`: `formatMoney(n: number, currency: 'AUD' | 'CAD' | 'GBP', locale: string): string` (`120,'AUD','en-AU'` → `"$120"`; `'GBP','en-GB'` → `"£120"`); `formatDay(iso: string, locale: string): string` (`'2026-10-09','en-AU'` → `"Fri 9 Oct"`); `todayIn(timeZone: string, now: Date): string`; `addHoursIso(iso: string, hours: number, timeZone: string): string`.
  - `leads/types.ts`: `LeadKind = 'appointment' | 'referral' | 'estimate' | 'enquiry'`; `LeadStatus = 'new' | 'confirmed' | 'declined' | 'done'`; `Contact { firstName; lastName; phone; email }`; `Consent { terms: boolean; remindersSms: boolean; marketingSms: boolean; marketingEmail: boolean; at: string | null }`; `LeadInput<P> { kind; contact; postcode; consent; payload: P; clientRef }`; `LeadEvent { at; type: 'status' | 'note'; value }`; `Lead<P> extends LeadInput<P> { id; status; createdAt; history: LeadEvent[] }`; `KIND_LABELS`, `STATUS_LABELS`.
  - `repository.ts` / `local-repository.ts`: `LeadRepository { create; list(filter?: { kind?; status? }); get; updateStatus; addNote; clear; seed }`; `LocalLeadRepository(storage, namespace: string, now?)` storing at `<namespace>:leads`.
  - `validation.ts`: `Rule`, `Rules`, `FieldErrors`, `validate(input, rules) → { ok; errors }`; builders `required`, `minLength`, `maxLength`, `email`, `phone(pattern: RegExp, msg)`, `postcode(pattern: RegExp, msg)`, `checked`, `oneOf`; `isLikelySpam({ honeypot, startedAt, now })`.
  - `csv.ts`: `leadsToCsv(leads, columns?)` with formula-injection guard.
  - `forms.ts`: `formValues(form)`, `showErrors(form, errors, summary)`, `clearErrors(form, summary)`, `bindSimpleForm(form, { rules, toInput, repo, success, fallbackPhone })` (Clearday behaviour: validate on blur, disable while sending, success replaces form, failure shows `We couldn't save your request. Call us on <phone>.` with fields kept).
- [ ] **Step 1: Write the failing tests** (plus the ported Trades tests adapted to these shapes):
  - `create with the same clientRef returns the existing lead` → two creates with `clientRef 'r1'` give one lead.
  - `create throws when the write fails` → storage whose `setItem` throws: rejects `/Could not save/`.
  - `list filters by kind and status, newest first`.
  - `formatMoney per currency` → `'$120'` (AUD en-AU), `'$120'` (CAD en-CA), `'£120'` (GBP en-GB).
  - `todayIn` → `todayIn('Australia/Melbourne', new Date('2026-10-08T14:30:00Z')) === '2026-10-09'`; `todayIn('America/Toronto', new Date('2026-10-09T03:30:00Z')) === '2026-10-08'`.
  - `phone rule uses the given pattern` and `postcode rule uses the given pattern`.
  - `showErrors links each message to its field and focuses the summary` (jsdom).
- [ ] **Step 2:** Run `npx vitest run tests/unit`. Expected: FAIL.
- [ ] **Step 3:** Port and adapt the files to the interfaces above.
- [ ] **Step 4:** Run `npm test`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(core): storage, formatting, leads, validation and forms`.

---

### Task 3: Core schema, theme, photos, UI primitives and tokens

**Files:**
- Create: `src/core/{schema,theme,photos}.ts`, `src/core/ui/{Button,Field,ErrorSummary,Icon,Badge,Photo,Placeholder}.astro`, `src/core/ui/icons.ts`, `src/styles/{tokens,global}.css`, `src/pages/dev/ui.astro` (noindex)
- Test: `tests/unit/{schema,theme,contrast}.test.ts`

**Interfaces:**
- Produces:
  - `schema.ts`: `organizationSchema(o: { type: string; name; legalName; url; phone; email; address: { street; locality; region; postcode; country }; hours: { days: string[]; opens; closes }[]; rating?: { value; count } }): object`; `personSchema({ name, jobTitle, credential: { body, number }, worksFor })` (uses `hasCredential`); `serviceSchema({ name, description, provider, priceFrom?, currency })`; `faqSchema(items)`.
  - `theme.ts`: `resolveOverride({ param, stored, configured, allowed, demoMode }): string` (param if demo and allowed, else stored if demo and allowed, else configured).
  - `photos.ts`: `getPhoto(slot)`, `hasPhoto(slot)` via `import.meta.glob('/src/assets/photos/*.{jpg,jpeg,png,webp,avif}')`.
  - Tokens on `[data-theme]` for `fernway` and `harbour`: `--color-paper --color-ink --color-ink-muted --color-card --color-accent --color-line --color-field-border --color-surface --color-on-ink --color-success(-soft) --color-warning(-soft) --color-danger(-soft) --color-focus`; type `--text-14 --text-16 --text-18 --text-22 --text-28 --text-36 --text-hero` (`clamp(2.25rem, 4.5vw, 3.25rem)`); `--body-size: 17px; --leading-body: 1.6; --measure: 68ch`; space `--space-1…8` (4,8,12,16,24,32,48,64px); `--radius-control: 6px; --radius-card: 2px; --target: 44px; --dur-fill: 160ms`. Accents: `fernway` sage, `harbour` blue; ink dark enough for AA on accent.
  - UI components: props as in Clearday plan Task 6 (Button `href? variant? type? size?`; Field `name label type? required? autocomplete? hint? inputmode?`; ErrorSummary; Icon `name size?` with icons `phone menu close check plus minus calendar clock user map-pin shield star paw stethoscope alert`; Photo `slot alt ratio? sizes? priority?`; Placeholder `label ratio?`).
- [ ] **Step 1: Write the failing tests:**
  - `organizationSchema omits rating when not given`; `includes aggregateRating when given` (`4.8`, `96`).
  - `personSchema carries the credential` → `hasCredential.recognizedBy.name === 'AHPRA'` for `{ body: 'AHPRA', number: 'PHY0000000000' }`.
  - `resolveOverride` → param wins in demo; ignored outside demo; unknown param falls back.
  - `tokens meet AA in both themes` → parse `tokens.css`; `contrast(ink, paper) ≥ 4.5`, `(ink-muted, paper) ≥ 4.5`, `(ink, card) ≥ 4.5`, `(ink, accent) ≥ 4.5`, `(on-ink, ink) ≥ 4.5`, `(field-border, surface) ≥ 3`, `(focus, paper) ≥ 3`.
- [ ] **Step 2:** Run the three tests. Expected: FAIL.
- [ ] **Step 3:** Implement modules, tokens, `global.css` (reset, focus ring 3px/2px offset, `.visually-hidden`, `.skip-link`, reduced-motion rule removing transforms and keeping colour fades), and the components using tokens only. Build `/dev/ui/` showing all components in both themes.
- [ ] **Step 4:** Run `npm test && npm run check && npm run build`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(core): schema builders, theme override, tokens and UI primitives`.

---

### Task 4: Market rule packs

**Files:**
- Create: `src/domain/markets/{au,ca,uk,index}.ts`
- Test: `tests/unit/markets.test.ts`

**Interfaces:**
- Produces: `MarketId = 'AU' | 'CA' | 'UK'`; `MarketPack` exactly as spec §5.5 plus `fundingLabels: string[]` (AU `['Private health fund rebate may apply', 'Medicare rebate with an eligible GP referral']`, CA `['Extended health benefits may apply', 'Direct billing where offered']`, UK `[]`) and `legalIdLabel` (`'ABN' | 'BN' | 'Company number'`); `getMarket(id): MarketPack`; `resolveMarketOverride({ param, stored, configured, allowed, demoMode }): MarketId` (wraps `resolveOverride`).
- Pack values: AU `{ locale 'en-AU', currency 'AUD', taxNote 'GST included where it applies', testimonials 'banned', reviews 'link-only', priceDisplay 'from-allowed', consent.law 'Spam Act 2003', postcode label 'Postcode' /^\d{4}$/, phone /^(\+61|0)[2-478]\d{8}$/ after stripping spaces, verified true }`; CA `{ 'en-CA', 'CAD', 'Taxes extra where they apply', 'allowed', 'display', 'from-allowed', consent.law 'CASL', 'Postal code' /^[A-Z]\d[A-Z] ?\d[A-Z]\d$/i, phone /^(\+1)?\d{10}$/ after stripping spaces and dashes, verified false }`; UK `{ 'en-GB', 'GBP', 'Prices include VAT', 'allowed', 'display', 'list-required', consent.law 'PECR', 'Postcode' UK pattern, phone /^(\+44|0)\d{9,10}$/, verified true }`. Consent wording: SMS `"Send me reminders and occasional offers by SMS. Reply STOP to opt out."`, email `"Send me occasional news and offers by email. Unsubscribe any time."` (same text in all three; law name shown in `/privacy/`). `requiredPages ['/privacy/', '/accessibility/', '/terms/']`.
- [ ] **Step 1: Write the failing tests:**
  - `AU bans testimonials and links reviews only`.
  - `CA is marked unverified`.
  - `every pack has consent wording, required pages and a legal id label`.
  - `phone and postcode patterns` → AU `'03 5550 1200'` ok, CA `'613-555-0123'` ok, UK `'0113 496 0123'` ok; CA postcode `'K1P 1J1'` ok, `'1234'` fails.
  - `resolveMarketOverride rejects unknown` → `param 'US'` with allowed `['AU','CA']` returns configured `'AU'`.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement the packs.
- [ ] **Step 4:** Run `npm test`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(domain): AU, CA and UK market rule packs`.

---

### Task 5: Domain types, module registry, presets and site resolution

**Files:**
- Create: `src/domain/{types,modules,presets,events}.ts`, `src/presets/{allied-health,vet}.ts`
- Test: `tests/unit/{modules,presets}.test.ts`

**Interfaces:**
- Consumes: `MarketPack`, `getMarket` (Task 4).
- Produces:
  - `types.ts`: `Provider`, `Service`, `Fee`, `PriceItem` (spec §5.7); `Clinic { name; legalName; legalId; phone; mobile?; email; address: {...}; timeZone; hours; emergency: { text; phone?; href? }; owner?: { name; group?: string; independent: boolean }; map: { lat; lng }; registerUrl?: string }`; `BookingConfig { provider: 'none' | 'embed' | 'link'; url?: string; serviceParam?: string; windows: { id; label; start; end }[]; leadDays; horizonDays; daysOff: number[]; confirmPromise: string }`.
  - `modules.ts`: `ModuleId` (spec §5.3, 11 ids); `ModuleDef`; `MODULES: Record<ModuleId, ModuleDef>` with routes: providers `['/team/']`, services `['/services/']`, booking `['/book/']`, fees `['/fees/']`, price-list `['/prices/']`, estimates `['/estimates/']` (`requires ['price-list']`), ownership `['/ownership/']`, reviews `[]`, reminders `[]`, referrals `['/referrers/']`, emergency `['/out-of-hours/']` only when preset is vet (route list comes from preset `emergencyPage: boolean`); `isOn(id, site)`; `routesFor(site): string[]`; `validateModules(on: ModuleId[]): string[]`.
  - `presets.ts`: `Preset { id: 'allied-health' | 'vet'; modules: ModuleId[]; nav: { label; href; module?: ModuleId }[]; schemaType: string; leadKinds: LeadKind[]; messages: MessageTemplate[] (type from Task 13, imported as type); copy: { heroLine; bookLabel; trust: string[] } ; emergencyPage: boolean }`; `Site { id; preset: Preset; market: MarketPack; modules: ModuleId[]; demoMode; theme; themes: string[]; markets: MarketId[]; contentDir; clinic: Clinic; booking: BookingConfig; messages: MessageTemplate[] }`; `resolveSite(config: SiteConfigInput, presets: Record<string, Preset>): Site` (modules = preset.modules with `config.site.modules` overrides `{ [id]: boolean }`; throws `Error('Unknown module: x')` or `Error('estimates requires price-list')`; messages = `config.messages ?? preset.messages`; nav filtered to modules that are on).
  - `events.ts`: `BOOKING_EVENT = 'health:booking'`; `emitBooking(state)`, `onBooking(cb)`.
  - Presets: allied-health modules `providers services booking fees reviews reminders referrals emergency`, nav `Services, Team, Fees, New patients, Contact` (+ Referrers in footer), schemaType `MedicalClinic`, leadKinds `appointment referral enquiry`, bookLabel `Book an appointment`, emergencyPage `false`, `messages: []` until Task 13 adds the defaults; vet modules `providers services booking price-list estimates ownership reviews reminders emergency`, nav `Services, Prices, Team, Out of hours, Contact`, schemaType `VeterinaryCare`, leadKinds `appointment estimate enquiry`, emergencyPage `true`.
- [ ] **Step 1: Write the failing tests:**
  - `resolveSite applies preset defaults` → allied-health with no overrides has `fees` and not `price-list`.
  - `overrides switch modules` → `{ referrals: false }` removes `referrals` and `/referrers/` from `routesFor` and the nav.
  - `unknown module throws` and `estimates without price-list throws`.
  - `routesFor vet includes /prices/, /estimates/, /ownership/, /out-of-hours/ and not /fees/`.
  - `messages fall back to preset`.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run `npm test`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(domain): module registry, presets and site resolution`.

---

### Task 6: Demo site configs and content

**Files:**
- Create: `src/config/index.ts`, `src/config/sites/{fernway-au,fernway-ca,hollybank}/{site,clinic,booking,messages}.ts`, `src/content.config.ts`, `src/content/fernway/**`, `src/content/hollybank/**`, `src/config/photo-slots.ts`
- Test: `tests/unit/config.test.ts`

**Interfaces:**
- Consumes: `resolveSite` (Task 5), types.
- Produces: `config/index.ts` exports `site: Site` (resolved for `import.meta.env.SITE`, default `fernway-au`) and `allSites(): Record<string, Site>` for tests. Content collections (loader `glob` over `src/content/${site.contentDir}/…`): `services` (`slug title order summary ≤200 duration whatToExpect[] providers[] fromPrice? faqs {q,a}[3] seoDescription ≤160`), `providers` (`slug name role registration {body number} languages[] services[] acceptingNew bio photoSlot`), `policies` (`title updated`), `reviews` json (`name date rating source text ≤400`), `faqs` json (`q a tags[]`), `fees` json (`Fee[]`, Fernway only; separate AU and CA amounts as `amount: { AU: number; CA: number }`), `prices` json (`PriceItem[]` + `reviewedAt`, Hollybank only).
- Content (drafts, sample-labelled): Fernway services `physiotherapy`, `sports-physio`, `dental-check-up`, `dental-hygiene`, `psychology`; six providers (two per discipline; registration bodies AU `AHPRA`, CA `College of Physiotherapists of Ontario` / `Royal College of Dental Surgeons of Ontario` / `College of Psychologists and Behaviour Analysts of Ontario` chosen by market at render via `registration.byMarket?: { CA: { body; number } }`); one psychologist `acceptingNew: false`. Hollybank services `consultations`, `vaccinations`, `dental`, `neutering`; four vets/nurses with `RCVS`; ~30 price items in groups Consultations, Vaccinations, Dental, Neutering, Prescriptions (prescription fee £21 first item, £12.50 each additional per spec §7.6), `reviewedAt` 30 days before build. Clinic configs per spec §3 identities; Fernway AU Melbourne `Australia/Melbourne`, CA Ottawa `America/Toronto`, Hollybank Leeds `Europe/London`; `owner` on Hollybank (`independent: true`). Booking: windows Morning 8–12, Afternoon 12–5, `leadDays 1`, `horizonDays 21`, `daysOff [0]`, `provider 'none'` (Fernway CA set to `'link'` with `url 'https://example.cliniko.com/bookings'` to demo hand-off), `confirmPromise 'within 1 business day'`. FAQs 10 per brand tagged `home booking fees prices emergency`. Policies terms, privacy (names the market's consent law), accessibility (WCAG 2.2 AA; CA notes AODA).
- [ ] **Step 1: Write the failing tests:**
  - `all three demo sites resolve` → `allSites()` keys equal `['fernway-au','fernway-ca','hollybank']`, each `demoMode true`.
  - `fernway CA uses the CA pack and AU uses AU`.
  - `every provider service slug exists in services and vice versa`.
  - `content links only to generated routes` → every internal `href`/Markdown link in each brand's content resolves to a route in `routesFor(site)` or a fixed page (`/`, `/contact/`, `/new-patients/`, `/faq/`, `/privacy/`, `/accessibility/`, `/terms/`, `/pet-health-plans/`).
  - `copy rules` → no `·`, `→`, or 3+ capital run outside the allow-list (`ABN BN GST VAT AHPRA RCVS SMS CASL PECR AODA WCAG GP`) in config and preset strings.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Write configs and content.
- [ ] **Step 4:** Run `npm test && npm run check && npm run build:all`. Expected: PASS, three `dist/*` folders.
- [ ] **Step 5:** Commit: `feat(config): Fernway AU and CA, Hollybank UK demo configs and content`.

---

### Task 7: Page shell, theme and market override, e2e harness

**Files:**
- Create: `src/layouts/{BaseLayout,ThemeBoot,Seo,Header,Footer,MobileBar,DemoRibbon}.astro`, `src/layouts/site.ts`, `src/sections/PageHeader.astro`, `tests/e2e/{run.mjs,harness.mjs,shell.e2e.mjs}`, `tools/shot.mjs` (port)
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `site` (Task 6), `resolveOverride`, `resolveMarketOverride`, `organizationSchema`, `formatPhoneHref`-style helper from `site.market.phone.href`.
- Produces: `BaseLayout` props `{ title; description; schema?; noindex?; bare?; hideMobileBar? }`, sets `<html lang={market.locale} data-theme data-market>`. `ThemeBoot` inline pre-paint script applies theme and (demo only) market override from `?theme=`/`?market=` storing in session `health:v1:<id>:theme|market`; elements carrying market-specific text render all variants with `data-market-only="AU"` etc. and CSS hides non-matching ones (`[data-market]:not([data-market="AU"]) [data-market-only="AU"] { display: none }`), so the static build can switch market without JS re-rendering. `harness.mjs` exports `step(name, fn)`, `withPage(opts, fn)`, `BASE` per site (`http://localhost:4321` for the site under test; `run.mjs` builds each `SITE`, starts `astro preview --port 4321/4322/4323`, runs every `*.e2e.mjs` with `SITE_URL` and `SITE_ID` env, exits 1 on any failure).
- [ ] **Step 1: Write the failing e2e steps** (`shell.e2e.mjs`):
  - `one h1, tap-to-call and legal id in footer` → Fernway AU: `header a[href="tel:+61355501200"]`, footer matches `/ABN 00 000 000 000/`; Hollybank: footer matches `/Company number 00000000/`.
  - `demo ribbon visible`.
  - `?market=CA switches market for the session` (Fernway AU build) → `html[data-market="CA"]`, footer shows the CA phone and `BN`; persists on `/contact/`; fresh context is `AU`.
  - `?market=US is ignored` → stays `AU`.
  - `?theme=harbour switches theme`.
  - `nav only links generated routes` → Fernway: no link to `/prices/`; Hollybank: no link to `/fees/`.
- [ ] **Step 2:** Run `npm run e2e`. Expected: FAIL.
- [ ] **Step 3:** Implement. Header: wordmark, nav from `site.preset.nav`, phone, primary button `site.preset.copy.bookLabel` (only when `booking` is on); menu toggle under 1024px (`site.ts`, `aria-expanded`). Footer: legal name, `market.legalIdLabel` + id, address, phone, hours, emergency line, policy and accessibility links. MobileBar: Book + call icon, hidden via `hideMobileBar`. DemoRibbon: "Sample clinic. Clinicians, prices, reviews and messages are examples." Seo: title, description, canonical, OG, JSON-LD (`organizationSchema` with `type = preset.schemaType`, no rating when `demoMode` or `market.testimonials === 'banned'`).
- [ ] **Step 4:** Run `npm run e2e`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(layout): page shell, theme and market switching, e2e harness`.

---

### Task 8: Providers and services modules with their pages

**Files:**
- Create: `src/modules/providers/{ProviderList,ProviderProfile}.astro`, `src/modules/services/{from-price.ts,ServiceList.astro,ServiceBody.astro}`, `src/pages/services/{index,[slug]}.astro`, `src/pages/team/{index,[slug]}.astro`
- Test: `tests/unit/from-price.test.ts`, `tests/e2e/content.e2e.mjs`

**Interfaces:**
- Consumes: content collections, `site`, `serviceSchema`, `personSchema`, `formatMoney`, `isOn`.
- Produces: `fromPriceLabel(service: { fromPrice?: number }, market: MarketPack): string | null` → `'From $95'`/`'From £48'` when `fromPrice` set and `market.priceDisplay` allows, else `null`; `registrationFor(provider, marketId): { body; number }` (in `providers/ProviderProfile.astro` frontmatter helper file `providers/registration.ts`). Each page's `getStaticPaths` returns `[]` when its module is off.
- [ ] **Step 1: Write the failing tests:**
  - Unit `fromPriceLabel formats per market and hides when absent`.
  - Unit `registrationFor uses the CA body in CA` → AU `AHPRA`, CA `College of Physiotherapists of Ontario` for a physio.
  - E2E `service page shows clinicians who offer it and a Book this link carrying ?service=`.
  - E2E `profile shows registration body and number and Book with <first name>` → link contains `provider=<slug>`.
  - E2E `CA profile shows the Ontario college` (Fernway with `?market=CA`).
  - E2E `not accepting new patients is stated` on the psychologist profile.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement components (lists and rows, not card grids; `Photo` with labelled placeholder) and pages with JSON-LD. Market-specific registration renders both variants with `data-market-only`.
- [ ] **Step 4:** Run `npm test && npm run e2e`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(modules): providers and services`.

---

### Task 9: Home page sections

**Files:**
- Create: `src/sections/{Hero,TrustRow,ServicesBand,TeamRow,FirstVisit,FeesTeaser,ReviewsBand,Location,Faq,CtaBand}.astro`, `src/modules/reviews/{reviews.ts,Reviews.astro}`, `src/modules/emergency/EmergencyNote.astro`
- Modify: `src/pages/index.astro`
- Test: `tests/unit/reviews.test.ts`, `tests/e2e/home.e2e.mjs`

**Interfaces:**
- Consumes: modules from Task 8, `site`, content.
- Produces: `reviewMode(market: MarketPack): 'link-only' | 'display'`; `Reviews` props `{ items; mode; googleUrl: string }` — `link-only` renders a single "Read our reviews on Google" link and no quote text; `display` renders up to 3 named, dated reviews with `source`. `EmergencyNote` props `{ clinic: Clinic; preset: Preset; compact?: boolean }` (vet links `/out-of-hours/`). `FeesTeaser` renders fees teaser when `fees` is on, price-list teaser with "Last reviewed <date>" when `price-list` is on, else nothing.
- [ ] **Step 1: Write the failing tests:**
  - Unit `reviewMode AU is link-only, CA and UK display`.
  - E2E `home order and primary actions` → h1, a Book link and a `tel:` link inside `.hero`, emergency note visible, `#first-visit ol > li` count 4.
  - E2E `AU home shows no review quotes` → Fernway AU: `[data-review]` count 0 and a link matching `/Read our reviews/`; `?market=CA`: `[data-review]` count ≥ 2 each with `<time datetime>`.
  - E2E `vet home shows price-list teaser with last reviewed date and no fees teaser`.
  - E2E `services band has from prices only where allowed`.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement sections and compose `/` in spec §7.1 order.
- [ ] **Step 4:** Run `npm test && npm run e2e`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(home): hero, trust, services, team, first visit, fees or prices, reviews, location, FAQ`.

---

### Task 10: Booking state, card and hand-off logic

**Files:**
- Create: `src/modules/booking/{state,card,providers,lead}.ts`
- Test: `tests/unit/{booking-state,booking-card,booking-lead}.test.ts`

**Interfaces:**
- Consumes: `Service`, `Provider`, `BookingConfig`, `MarketPack`, `todayIn`, `formatDay`, validation builders.
- Produces:
  - `state.ts`: `STEP_IDS = ['service','clinician','patient','when','you','check'] as const`; `BookingState { service: string | null; provider: string | 'first-available'; patientType: 'new' | 'returning' | null; forWhom: 'me' | 'someone-else'; pet: { name: string; species: 'dog'|'cat'|'rabbit'|'other' } | null; day: string | null; windowId: string | null; step: StepId }`; `fromParams(search, ctx: { services: string[]; providers: string[]; windows: string[] }): BookingState` (unknown values → defaults); `toParams(state): string` (no contact fields); `nextStep`, `prevStep`, `firstUnfinished(state): StepId`; `availableDays(today, cfg): { date; label }[]` (from `today + leadDays` to `today + horizonDays`, skipping `daysOff`); `providersFor(serviceSlug, patientType, providers): Provider[]` (filters by service and, for `new`, `acceptingNew`).
  - `card.ts`: `CardField { label: string; value: string | null }`; `cardFields(state, ctx: { services; providers; windows; preset: 'allied-health' | 'vet'; locale }): CardField[]` → allied health labels `Service, Clinician, Patient, Day, Time`; vet `Service, Vet, Pet, Day, Time`; null values render as an empty ruled line.
  - `providers.ts`: `handoffUrl(cfg: BookingConfig, serviceSlug: string | null): string | null` → `null` for `none`/`embed`; for `link` appends `?<serviceParam ?? 'service'>=<slug>` when a slug is given.
  - `lead.ts`: `AppointmentPayload` (spec §5.7); `appointmentRules(market): Rules` (`firstName` required "Enter your first name", `lastName` required "Enter your last name", `phone` "Enter a phone number, like <example from pack>", `email` "Enter an email address, like sam@example.com", `postcode` "Enter a valid <market.postcode.label.toLowerCase()>", `terms` checked "Agree to the terms to send your request", vet `petName` required "Enter your pet's name" max 40); `stepRules(step)` (`service` required; `patient` requires `patientType`; `when` requires `day` and `windowId`); `buildAppointmentInput(form, ctx: { state; consentAt; clientRef }): LeadInput<AppointmentPayload>`.
- [ ] **Step 1: Write the failing tests:**
  - `fromParams defaults unknown service` → `'?service=surgery&provider=nobody&window=night&step=you'` gives `service null`, `provider 'first-available'`, `windowId null`, and `firstUnfinished` = `'service'`.
  - `toParams never contains contact fields` and round-trips a full state.
  - `availableDays uses clinic date` → `availableDays(todayIn('Australia/Melbourne', new Date('2026-10-03T14:30:00Z')), cfg)[0].date === '2026-10-05'` (00:30 Sunday 4 Oct in Melbourne; lead 1 day → Monday 5th since Sunday is off).
  - `providersFor returns empty when none accept new` → psychology + `new` with the only psychologist `acceptingNew false` gives `[]`.
  - `cardFields vet labels` → `['Service','Vet','Pet','Day','Time']`.
  - `handoffUrl` → `link` with url `https://example.cliniko.com/bookings` and slug `physiotherapy` gives `https://example.cliniko.com/bookings?service=physiotherapy`; `none` gives `null`.
  - `buildAppointmentInput maps consents and timestamp` → `remindersSms 'on'` → true, missing `marketingEmail` → false, `kind 'appointment'`.
  - `CA postcode rule` → `'K1P 1J1'` passes, `'3000'` fails.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run `npm test`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(booking): state, appointment card fields, hand-off and lead mapping`.

---

### Task 11: Booking page and appointment card

**Files:**
- Create: `src/modules/booking/{AppointmentCard.astro,BookingForm.astro,booking.ts}`, `src/modules/booking/steps/{Service,Clinician,Patient,When,You,Check}.astro`, `src/pages/book.astro`
- Test: `tests/e2e/booking.e2e.mjs`

**Interfaces:**
- Consumes: Task 10 functions, `getLeadRepository` (namespace `health:v1:<site.id>`), `showErrors`, `clearErrors`, `isLikelySpam`, `emitBooking`.
- Produces: `initBooking(root: HTMLElement, deps: { repo; data: { services; providers; windows; days; preset; market }; onSent: (lead) => void })` — step navigation with `history.pushState`, restores from URL on load and `popstate`, updates the card on every change, validates the current step on Continue, disables Send while sending, one `clientRef` per page load. `book.astro` passes `onSent` that shows success and (demo) renders the confirmation preview using `render` and the template from `site.messages` (page composes modules).
- Card: `<section aria-labelledby>` containing a `<dl>` of `cardFields`, clinic name printed at top; filled lines transition `background-color var(--dur-fill)`.
- [ ] **Step 1: Write the failing e2e steps:**
  - `book from a service page` (Fernway AU) → from `/services/physiotherapy/` click Book this; step 1 preselected; choose first available, New, first day, Morning; fill contact (postcode `3000`), tick terms; card shows each choice; Send; heading `Appointment request sent` and text `within 1 business day`; demo preview contains `Fernway Health`.
  - `new patient psychology shows first available only with a note` → step 2 has only "First available" and text matching `/not taking new patients/`.
  - `back keeps values` and `refresh returns to the right step`.
  - `step 5 errors are summarised and focused` → focused `[role=alert]` lists 5 errors (vet 6 with pet name).
  - `marketing boxes start unticked; consent text matches the pack` (`Reply STOP to opt out`).
  - `no textarea in public request forms` → `/book/` has 0 `textarea`.
  - `storage failure shows phone fallback with fields kept`.
  - `double click sends one request`.
  - `CA hand-off` (Fernway CA build) → step 1 shows a link to `https://example.cliniko.com/bookings?service=physiotherapy` after choosing physiotherapy and a "Can't find a time? Send a request" button that continues the request flow.
  - `vet booking asks pet name and species, card shows Pet line` (Hollybank).
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement. Copy: step 4 "Choose a day that suits. This is a request: we'll confirm the time." No-days message: "No times are open in the next 21 days. Call us and we'll find one." Medical-details note above step 5: "Please don't include medical details here. We'll ask what we need when we confirm."
- [ ] **Step 4:** Run `npm run e2e`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(booking): six-step request with appointment card and practice-system hand-off`.

---

### Task 12: Fees, contact, new patients, FAQ, policies and 404

**Files:**
- Create: `src/modules/fees/{funding.ts,FeesTable.astro}`, `src/pages/{fees,contact,new-patients,faq,privacy,accessibility,terms,404,pet-health-plans}.astro`
- Test: `tests/unit/funding.test.ts`, extend `tests/e2e/content.e2e.mjs`

**Interfaces:**
- Produces: `fundingRows(fees: Fee[], marketId: MarketId, pack: MarketPack): { service; label; price: string; notes: string[] }[]` (price via `formatMoney` with the market's amount; notes = `pack.fundingLabels` filtered by each fee's `funding` keys `'fund' | 'medicare' | 'extended' | 'direct'`). `/fees/` renders both AU and CA tables with `data-market-only` on Fernway. Preset-only content pages come from `Preset.extraPages: { slug: string; policy: string }[]` (vet: `[{ slug: 'pet-health-plans', policy: 'pet-health-plans' }]`, allied health: `[]`) rendered by `src/pages/[extra].astro`, whose `getStaticPaths` returns one path per entry; replace `pet-health-plans.astro` in the file list with `[extra].astro` and add `extraPages` to the `Preset` type from Task 5.
- [ ] **Step 1: Write the failing tests:**
  - Unit `fundingRows formats per market` → AU `'$95'` with `'Private health fund rebate may apply'`; CA `'$110'` with `'Extended health benefits may apply'`.
  - E2E `every page: one h1, legal id, no horizontal scroll at 375 and 1280` across all generated routes of each site (route list from `dist/<site>/sitemap-0.xml`).
  - E2E `fees switch with market` (Fernway, `?market=CA`) and `/fees/ is 404 on Hollybank`.
  - E2E `faq has FAQPage JSON-LD`; `privacy names the market law` (AU `Spam Act 2003`, CA `CASL`, UK `PECR`).
  - E2E `contact shows after-hours route and building access notes`.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run `npm test && npm run e2e`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(pages): fees, contact, new patients, FAQ, policies`.

---

### Task 13: Reminders schedule and render

**Files:**
- Create: `src/modules/reminders/{render,schedule}.ts`, message template defaults inside `src/presets/{allied-health,vet}.ts`
- Test: `tests/unit/reminders.test.ts`

**Interfaces:**
- Consumes: `Lead`, `addHoursIso`, `formatDay`.
- Produces: `MessageTemplate { id: 'confirmation' | 'reminder' | 'review-request' | 'recall' | 'vaccination-recall' | 'parasite-reminder' | 'referral-ack' | 'estimate-follow-up'; channel: 'sms' | 'email'; marketing: boolean; appliesTo: LeadKind; trigger: { on: 'created' | 'confirmed' | 'visit'; offsetHours: number; repeatEveryHours?: number }; whenService?: string[]; body: string }`; `render(body, vars)`; `ScheduleContext { now; clinicName; reviewLink; optOut: { sms; email }; timeZone; visit?: { startIso; windowLabel; dayLabel; service: string } }`; `ScheduledMessage { templateId; channel; sendAt: string | null; text; skippedReason?: 'no-consent' | 'not-confirmed' | 'status-changed' | 'not-applicable' }`; `schedule(lead, templates, ctx)`.
- Defaults (spec §7.3): allied health `confirmation` (sms, confirmed +0), `reminder` (sms, visit −24), `review-request` (sms, **marketing true**, visit +4, body links `{reviewLink}` and contains no request for a testimonial), `recall` (email, marketing true, visit +4380 ≈ 6 months), `referral-ack` (email, created +0, appliesTo referral); vet `confirmation`, `reminder`, `vaccination-recall` (sms, marketing false, visit +8760, `whenService ['vaccinations']`), `parasite-reminder` (sms, marketing false, visit +2190, repeat 2190, show first occurrence only), `estimate-follow-up` (email, created +48, appliesTo estimate, skipped with `status-changed` once status ≠ new). Every SMS body ends `{clinicName}`; marketing bodies include `{optOut}`.
- [ ] **Step 1: Write the failing tests:**
  - `confirmed allied appointment without marketing consent` → confirmation and reminder scheduled; review-request and recall present with `skippedReason 'no-consent'`.
  - `with marketing consent review-request is scheduled 4h after window start and its text has the review link and opt-out`.
  - `review request never asks for a testimonial` → default body does not match `/testimonial|recommend us on our website/i`.
  - `new appointment waits for confirmation` → confirmation `sendAt null`, `skippedReason 'not-confirmed'`.
  - `vaccination recall only for vaccination visits` → consultations visit gives `not-applicable`.
  - `estimate follow-up stops once status changes`.
  - `declined lead has no messages`.
  - `times are in the clinic zone` → Melbourne visit `2026-10-09T08:00:00+11:00` (AEDT) reminder at `2026-10-08T08:00:00+11:00`.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement; templates live in presets, validated by a unit test that every `{var}` is known.
- [ ] **Step 4:** Run `npm test`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(reminders): templates, rendering and message timeline schedule`.

---

### Task 14: Vet transparency modules

**Files:**
- Create: `src/modules/price-list/{price-list.ts,PriceList.astro}`, `src/modules/estimates/{estimate.ts,EstimateForm.astro}`, `src/modules/ownership/OwnershipStatement.astro`, `src/pages/{prices,estimates,ownership,out-of-hours}.astro`
- Test: `tests/unit/{price-list,estimate}.test.ts`, `tests/e2e/vet.e2e.mjs`

**Interfaces:**
- Produces: `groupPrices(items: PriceItem[]): { group: string; items: PriceItem[] }[]` (preserves content order); `isStale(reviewedAt: string, today: string, maxDays = 180): boolean`; `estimateRules(market): Rules` (pet name, species `oneOf`, `reason oneOf(['Dental treatment','Neutering','Surgery','Ongoing condition care','Other planned treatment'])`, contact, terms); `needsWrittenEstimate(amount: number, threshold: number): boolean` (`>= threshold`); `buildEstimateInput(form, ctx)` → `kind 'estimate'`. Threshold from `config/clinic.ts` `estimateThreshold` (default 500).
- [ ] **Step 1: Write the failing tests:**
  - Unit `groupPrices keeps order`; `isStale at 181 days`; `needsWrittenEstimate(500, 500) === true`, `(499.99, 500) === false`.
  - E2E `prices page shows groups, VAT note and last reviewed date`; `prescription fees £21 and £12.50 shown`.
  - E2E `estimate request submits an estimate lead and has no textarea`.
  - E2E `ownership page states independent ownership and owner name`.
  - E2E `out-of-hours page shows the emergency number as tel link`.
  - E2E `Fernway has none of these routes` (404 for `/prices/`, `/estimates/`, `/ownership/`, `/out-of-hours/`).
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement. `docs/modules.md` gets the "built for the CMA remedies; confirm the final Order wording before sale" note (written in Task 18).
- [ ] **Step 4:** Run `npm test && npm run e2e`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(vet): price list, written estimates, ownership and out-of-hours`.

---

### Task 15: Referrals module

**Files:**
- Create: `src/modules/referrals/{referral.ts,ReferralForm.astro}`, `src/pages/referrers.astro`
- Test: `tests/unit/referral.test.ts`, extend `tests/e2e/content.e2e.mjs`

**Interfaces:**
- Produces: `referralRules(market): Rules` (`referrerName`, `practice`, `referrerPhone`, `referrerEmail`, `patientFirstName` max 40, `patientPhone`, `service oneOf(service slugs)`, `urgency oneOf(['Routine','Soon','Urgent'])`); `buildReferralInput(form, ctx)` → `kind 'referral'`, `contact` = referrer, payload `{ practice; patientFirstName; patientPhone; service; urgency }`. Form uses `bindSimpleForm`.
- [ ] **Step 1: Write the failing tests:**
  - Unit `referral payload has no clinical fields` → payload keys equal exactly `['practice','patientFirstName','patientPhone','service','urgency']`.
  - E2E `referrer form submits and states clinical details go by secure channel` (text match `/secure/`); `no textarea`.
  - E2E `/referrers/ absent on Hollybank`.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run `npm test && npm run e2e`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(referrals): referrer page and form`.

---

### Task 16: Clinic console

**Files:**
- Create: `src/core/console/{shell,inbox,dom}.ts` (port from Clearday plan Task 18 interfaces), `src/modules/reminders/timeline.ts`, `src/pages/console/{index.astro,_app.ts,_samples.ts,_detail.ts}`, `src/styles/console.css`
- Test: `tests/unit/{console,samples}.test.ts`, `tests/e2e/console.e2e.mjs`

**Interfaces:**
- Consumes: repository, CSV, `schedule`, `render`, `site`, `KIND_LABELS`.
- Produces: `el(tag, attrs, ...children)` (text only); `initShell(root, { credentials, sessionKey, onSignedIn })`; `renderInbox(list, leads, { selectedId, describe, onSelect })`; `filterLeads(leads, { kind, status })`; `renderTimeline(container, items, { demoMode })` (reason words: "No marketing consent", "Waits for confirmation", "Stopped: you've already replied", "Not for this service"; "Preview, not sent" in demo); `sampleLeads(now: Date, site: Site): Lead[]` — 7 leads using only `site.preset.leadKinds` (allied: 4 appointments in different statuses incl. one with marketing consent, 2 referrals, 1 enquiry; vet: 4 appointments incl. a vaccinations visit, 2 estimates, 1 enquiry), visits always in the future.
- Console filter chips come from `site.preset.leadKinds`; detail shows contact, request summary (appointment: service, clinician or vet, patient type or pet, day, window), consent record with timestamps, history, notes, valid actions, timeline. Seed once per browser (`health:v1:<id>:seeded`); "Clear" and "Load samples".
- [ ] **Step 1: Write the failing tests:**
  - Unit `el sets text, never HTML`.
  - Unit `sample leads match the preset kinds and are future-dated` for both presets.
  - E2E `sign in, open the appointment sent from /book/, confirm, see previews` → allied: rows for confirmation and reminder scheduled, review-request and recall marked "No marketing consent" (or scheduled when consent ticked), each with "Preview, not sent".
  - E2E `vet console shows vaccination recall for a vaccinations booking`.
  - E2E `filter chips match preset` → Fernway shows Referrals, Hollybank shows Estimates.
  - E2E `CSV export downloads`; `wrong password message`.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement; console uses `BaseLayout bare noindex`.
- [ ] **Step 4:** Run `npm test && npm run e2e`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(console): clinic inbox with message timeline previews`.

---

### Task 17: Module-off fixture and privacy checks

**Files:**
- Create: `src/config/sites/fixture-minimal/{site,clinic,booking,messages}.ts` (allied-health, AU, modules `{ fees: false, referrals: false, reviews: false }`, not part of `build:all`), `tools/third-party.mjs`, `tests/e2e/modules.e2e.mjs`
- Modify: `tests/e2e/run.mjs` (builds the fixture as a fourth site on port 4324 for this file only)

**Interfaces:**
- Produces: `node tools/third-party.mjs <distDir>` → for `book/index.html`, `estimates/index.html`, `referrers/index.html` where present, lists any `<script src>` or `<link rel=preconnect>` whose origin differs from the site origin; exits 1 if any.
- [ ] **Step 1: Write the failing checks:**
  - E2E `switched-off modules leave no trace` (fixture) → `/fees/` and `/referrers/` 404; no `href` to them on any page; sitemap excludes them; home has no reviews band.
  - Script `third-party check passes on all three demo builds` (run inside `npm run e2e`).
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement the fixture and script; wire into `run.mjs`.
- [ ] **Step 4:** Run `npm run e2e`. Expected: PASS.
- [ ] **Step 5:** Commit: `test: module-off fixture and request-page third-party check`.

---

### Task 18: Docs and photo brief

**Files:**
- Create: `docs/{customising,design-system,modules,photo-brief}.md`, `tools/photo-brief.mjs` (port)
- Modify: `README.md`

- [ ] **Step 1:** Write `customising.md` (spec §6 table as steps; new clinic from a preset; adding a market pack; adding a module: `ModuleDef`, routes, nav, `requires`; going live with `demoMode: false`; implementing `HttpLeadRepository`; confirming the market pack with counsel — CA `verified: false`). `modules.md`: one entry per module (what it does, routes, config, lead kinds, legal notes; vet modules carry the CMA confirmation note). `design-system.md`: tokens, type, the appointment-card rule, anti-template list (spec §8.4). `photo-brief.md` from `npm run photos:status` (slots: provider photos, clinic exterior, reception, treatment room per discipline, vet consult room; rooms and equipment only, never stock people as clinicians).
- [ ] **Step 2:** Run `npm test` (copy-rule test also scans `docs/` headings for no all-caps). Expected: PASS.
- [ ] **Step 3:** Commit: `docs: customising, modules, design system and photo brief`.

---

### Task 19: Quality pass

**Files:**
- Create: `tools/js-budget.mjs`, `tests/e2e/quality.e2e.mjs`
- Modify: any component the checks flag

- [ ] **Step 1: Write the failing checks:**
  - `axe finds no serious or critical issues` on `/`, `/book/` (step 1 and step 5 with errors), `/team/<slug>/`, `/fees/` or `/prices/`, `/console/` (signed in), all three sites, both themes, tags `wcag2a wcag2aa wcag21aa wcag22aa`.
  - `tap targets ≥ 44px` in header, hero, mobile bar, booking form.
  - `reduced motion removes button press scale and keeps card fade ≤ 160ms`.
  - `js budget` → `node tools/js-budget.mjs dist/<site>` exits 0 (≤ 30,720 gzipped bytes per page).
- [ ] **Step 2:** Run `npm run build:all && npm run budget && npm run e2e`. Expected: list of failures.
- [ ] **Step 3:** Fix each in its owning component. Screenshot `/`, `/book/`, `/console/` at 375 and 1280 for each site and theme (`tools/shot.mjs`); review against spec §8.4 and fix template tells.
- [ ] **Step 4:** Run `npm test && npm run check && npm run build:all && npm run budget && npm run e2e`. Expected: all pass. Run Lighthouse mobile on `/` and `/book/` for Fernway AU if `npx lighthouse` works; record scores (target 90+).
- [ ] **Step 5:** Add "Build notes" to `docs/spec.md` (differences from spec, measured results); bump status to "v0.2, built". Commit: `chore: accessibility, budget and visual review pass`.
