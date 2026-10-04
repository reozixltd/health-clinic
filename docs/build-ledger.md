# Build ledger — plan: docs/plans/2026-10-03-health-clinic-site.md

Spec: docs/spec.md (reachable). Repo: /home/claude/health-clinic, branch build/health-clinic-v1 off main (commit with spec + plan). Port source cloned at /tmp/trades.

## Pre-flight scan

| Tasks | Shared file / interface | Finding |
|---|---|---|
| 1 ↔ all | boundary rules, `market-read-outside-presets` | Consistent; layouts and domain/presets exempt |
| 2 ↔ Global | `formatMoney` | Global says `formatMoney(n, pack)`, Task 2 says `(n, currency, locale)` — conflict |
| 2 ↔ 7,8,12 | `formatMoney`, `todayIn`, `addHoursIso` | Consumers call with pack fields; fine after ruling R1 |
| 3 ↔ 8,9 | `organizationSchema`, `personSchema`, `serviceSchema` | Consistent |
| 4 ↔ 12 | `fundingLabels` (array) vs `fundingRows` keyed by `'fund'|'medicare'|'extended'|'direct'` | Conflict: no key→label map |
| 5 ↔ 13 | `Preset.messages: MessageTemplate[]` typed from Task 13 module | Conflict: domain may not import modules; type must live in domain |
| 5 ↔ 12 | `Preset.extraPages` added in Task 12 | Should exist from Task 5 |
| 5 ↔ 6 ↔ 12 | `Fee` type `amount: number` (spec §5.7) vs content `amount: { AU; CA }` and funding keys | Conflict on shape |
| 6 ↔ 7 | `site`, `allSites()`, `SITE` env, `build:all` | Consistent |
| 7 ↔ 9,12 | `data-market-only` CSS switching | Consistent |
| 10 ↔ 11 | booking state, `cardFields`, `handoffUrl`, rules | Consistent |
| 11 ↔ 13 | confirmation preview uses `render` + `site.messages` | Consistent (page composes) |
| 13 ↔ 16 | `schedule`, `ScheduledMessage`, reasons | Consistent; Task 16 adds "Not for this service" for `not-applicable` |
| 14 ↔ 6 | prices.json `reviewedAt`, prescription fees | Consistent |
| 16 | "port from Clearday plan" — Clearday code not available locally | Write from plan interfaces |
| 17 ↔ 7 | run.mjs fourth site | Consistent |

Per-task self-consistency: Tasks 1-4, 7-11, 13-19 agree internally. Task 5 references a Task 13 type (see R3). Task 12 edits Task 5's type (R4). Task 6 fee shape differs from spec type (R5).

## Rulings

- Ruling R1: `formatMoney(n, currency, locale)` per Task 2; callers pass `pack.currency, pack.locale` — the Global line is shorthand — cost if wrong: trivial rename.
- Ruling R2: `MarketPack.fundingLabels` is `Partial<Record<'fund'|'medicare'|'extended'|'direct', string>>` (AU fund, medicare; CA extended, direct; UK {}); Task 4 test checks keys — Task 12 needs key→label mapping — cost if wrong: small type change.
- Ruling R3: `MessageTemplate` type lives in `src/domain/types.ts` (Task 5); Task 13 imports it from domain and owns defaults + logic — domain may not import modules — cost if wrong: none.
- Ruling R4: `Preset.extraPages: { slug; policy }[]` is defined in Task 5 (vet `pet-health-plans`, allied `[]`); Task 12 builds `src/pages/[extra].astro` — avoids editing a reviewed type later — cost if wrong: none.
- Ruling R5: `Fee = { service: string; label: string; amount: Partial<Record<MarketId, number>>; funding: ('fund'|'medicare'|'extended'|'direct')[] }` in Task 5; content follows — supports both markets from one file — cost if wrong: content reshape.
- Ruling R6: Task 16 core/console written from the plan's interfaces (no Clearday code locally); Trades `src/lib` is the port source where it has a counterpart — cost if wrong: minor divergence from Clearday.

## Progress
Ruling R7: commit trailer model name (Sonnet vs Opus) accepted as-is on Task 1 commit; later dispatches use the plan's trailer — cosmetic — cost if wrong: an amend before push.
Task 1: Ruling: reviewer's upward-import gap is real (spec §5.2 import direction) — add RuleId 'upward-import' via a rank table; extending the brief's 7 ids is justified by the spec — cost if wrong: one extra rule id
Task 1: minor (deferred): comment/string false positives in colour/storage/specifier scans; cwd-relative paths; jsdom env; no doctype in temp index; POSIX build:all
Task 1: fix round 1/5 (2 addressed, 0 open; commits 429fcbf..2463947)
Task 1: complete (commits 4b63a04..2463947, review clean)
Task 2: minor (deferred): RateLimitError shown as generic save failure; rate slot recorded before write; dense line forms.ts:130; aria-invalid only on first radio; DST-gap behaviour unspecified; CSV leading-whitespace formula guard
Ruling R8: user asked for parallel agents — independent tasks run concurrently in git worktrees (../hc-task-N, branch task/N, node_modules symlinked), each reviewed then merged into build/health-clinic-v1; waves: [3,4] → 5 → 6 → 7 → [8,10,13,14] → [9,11,12,15] → [16,17,18] → 19 — cost if wrong: merge conflicts resolved at merge time.
Ruling R9: in parallel waves, Tasks 12 and 15 write their e2e steps to their own files (tests/e2e/pages.e2e.mjs, tests/e2e/referrals.e2e.mjs) instead of extending content.e2e.mjs — avoids merge conflicts — cost if wrong: none.
Task 2: fix round 1/5 (3 addressed, 0 open; commits ef5f52d..5cd7d0c)
Task 2: complete (commits 2463947..5cd7d0c, review clean)
Task 2: minor (deferred): whitespace-only honeypot takes hold path not silent drop
Ruling R10: the committed node_modules symlink in task/3 and task/4 came from controller worktree setup, not task code — removed by the controller at merge (git rm --cached) and .gitignore changed to `node_modules` (no slash) — cost if wrong: none.
Task 4: complete (commits 5cd7d0c..9bed304, review clean apart from setup symlink R10)
Task 4: minor (deferred): legalIdLabel duplicates identifiers.label; phone patterns need pre-stripped input, (613) form fails; no test for unknown stored market
Ruling R11: Task 3 primary Button uses ink fill with on-ink text (spec §8.2 keeps accent for card fills and selected states) and gets :active press scale (spec §8.5); disabled buttons get no hover — reviewer filed as Minor but it contradicts the spec — cost if wrong: one CSS rule.
Task 3: minor (deferred): html font-size 17px overrides user default; reduced-motion transform:none breaks transform positioning; priceFrom as exact Offer.price; semantic contrast pairs untested; /dev/ui lacks error states; ErrorSummary role=alert+focus double announce; Field id collisions
Task 3: fix round 1/5 (3 addressed, 0 open; commits da8f247..895f9e6)
Task 3: complete (commits 5cd7d0c..895f9e6, review clean)
Merged task/4 and task/3 into build at ec22638; controller restored node_modules after the symlink merge
Ruling R12: Task 6 starts in a worktree while Task 5 is under review (Task 6 consumes Task 5 interfaces) — speed, per user's parallel request — cost if wrong: Task 6 adapts to any Task 5 interface fix at merge.
Task 5: complete (commits ec22638..c3375bf, review clean)
Task 5: minor (deferred): validateModules plain-object lookup accepts 'constructor'; unchecked MarketId cast; market not cross-checked against markets; site.messages aliases preset; thin presets test coverage
Ruling R13: site id comes from `import.meta.env.SITE_ID` defined in astro.config from process.env.SITE (Astro reserves import.meta.env.SITE for the site URL); per-site cacheDir under .cache/ — cost if wrong: none.
Ruling R14: formatMoney shows whole amounts without decimals and fractional amounts with two decimals (£12.50, not £13) — spec §7.6 pins £12.50 — Task 14 owns the change in core/format.ts with a test — cost if wrong: display only.
Ruling R15: `Clinic.reviewsUrl?: string` (Google profile link) added in the Task 6 fix round; AU home uses it for "Read our reviews on Google" (spec §7.1 item 8) — cost if wrong: none.
Task 6: minor (deferred): estimate threshold repeated as text in content; static reviewedAt; FIXED list includes /pet-health-plans/ for all sites; config.test 158 lines; per-site booking/messages duplication (plan layout); £0 items need "Included" (Task 14); awkward FAQ sentence; loose date schema; copy-rules test skips content (PIPEDA, GDPR present)
Task 6: fix round 1/5 (5 addressed, 0 open; commits 5f01310..604604a)
Task 6: complete (commits c3375bf..604604a, review clean); merged into build
Ruling R16: `hideMobileBar` is passed by /book/ (Task 11) and /console/ (Task 16); the shell provides the prop only — spec §4 — cost if wrong: none.
Task 7: minor (deferred): marketVariants falls back to current clinic for missing market; ThemeBoot hard-codes locales; og:locale and Seo identity stay on build market after ?market=; footer step lacks hours/emergency asserts; hard-coded chromium default path
Task 13: complete (commits 8bb86f6..ecdc4b9, review clean) — merge after task/7
Task 13: minor (deferred): clinic-zone test can't fail (add Z or DST-crossing case); recall/parasite/vaccination timing untested; status-changed hard-coded to estimate-follow-up; held text renders empty visit vars; render prototype keys; duplicated confirmation/reminder templates; repeatEveryHours unused
Ruling R17: pet name and species may stay in the /book/ URL (spec §7.2 bars contact details only; no health data) — cost if wrong: drop two params.
Task 10: minor (deferred): duplicated message strings in lead.ts; pet maxLength message; pet/forWhom not preset-gated; weak contact-fields URL test; firstUnfinished branches untested
Task 7: fix round 1/5 (6 addressed + port base, 0 open; commits 560d40b..57e6fbe)
Task 7: complete (commits 604604a..57e6fbe, review clean); merged task/7 and task/13 into build at ba23db4
Task 7: minor (deferred): mobile e2e doesn't assert logo visible/nav collapsed; portFree treats any fetch error as free
Task 10: fix round 1/5 (2 addressed, 0 open; commits f87cae3..e59a18b)
Task 10: complete (commits 8bb86f6..e59a18b, review clean); merged at 12860a0
Ruling R18: market-dependent text on pages (from prices, consent wording, register links) renders one variant per market in site.markets with data-market-only (via marketVariants), so ?market= switching works; `configuredMarket(site)` in layouts/site.ts is allowed only for build-market data such as JSON-LD; destructuring `site` to dodge the boundary check is not allowed — spec §5.5 / demo switch — cost if wrong: extra markup.
Ruling R19: Task 11 psychology step — content has one psychologist accepting new patients, so "First available + Hannah" with a note naming Lucas is correct; the brief's "First available only" assumed different content — cost if wrong: none.
Ruling R20: consents belong in step 5 "You" per spec §7.2; the brief's 5-error count becomes 6 (vet 7) with terms unticked — spec wins — cost if wrong: test count.
Task 14: minor (deferred): threshold default duplicated, needsWrittenEstimate unused; weekday + "Sept" ICU-dependent reviewed date; duplicated select blocks and local field styles; local .sr-only; isStale fail-open on NaN; thin estimateRules tests; RegExp flags lost; postcode '' comment
Task 8: minor (deferred): content e2e lacks UK no-from-price and list "not accepting" checks; ".first()" book link assertion; invented "Existing patients are welcome" copy; team sort by full name; unused class="pic"
Task 8: fix round 1/5 (3 addressed, 0 open; commits cd84862..38bbbe4)
Task 8: complete (commits ba23db4..38bbbe4, review clean)
Task 8: minor (deferred): duplicated e2e line; late import in from-price.test; no build-level module-off index check (Task 17 covers); no fromPrice demo content so per-market price has no e2e
Task 14: fix round 1/5 (1 addressed, 0 open; commits e2f14cc..fda02e9)
Task 14: complete (commits ba23db4..fda02e9, review clean); merged 8 and 14 at 503e0b4
Task 11: minor (deferred): clinician silently reset when step 3 = new; booking.ts 225 lines; double emit on change+input; honeypot synthetic L-0 lead; blank state literal duplicated; .choice colour transition; role=alert display:none; test gaps (no-days, hold, honeypot, embed)
Ruling R21: add `formatDate(iso, locale)` → day month year with no weekday (e.g. "3 September 2026") to core/format.ts; Task 9's fix round owns it; reviewed/updated dates use it (PolicyPage in Task 12 switches to it in the quality pass) — fixes weekday + hand-built year + ICU "Sept" fragility — cost if wrong: display only.
Task 12: minor (deferred): PolicyPage date build-market only + weekday (switch to formatDate per R21); PolicyPage repeats PageHeader h1; inline.ts untested; display:grid on tr; hollybank contact.md links /out-of-hours/ unconditionally; invented "no out of hours line" copy; local .sr-only duplicate
Task 9: minor (deferred): TrustRow copy hard-coded instead of preset.copy.trust; fixed building-accessibility claim in Location; unused class="pic"; vet from-price check vacuous; latestReviews untested
Task 15: minor (deferred): duplicated selects/local field styles; unlabelled honeypot; one-word referrer name untested; fixed 3.2s wait; "Dr" split as first name
Task 11: fix round 1/5 (6 addressed, 0 open; commits c5ecfb4..944cf4b); controller ran full e2e on build after merge (all three sites pass)
Task 11: complete (commits 12860a0..944cf4b, review clean); merged at 965111e
Task 11: minor (deferred): CA consent e2e can't discriminate identical pack strings; CA tel link switch untested; hand-rolled postcode field duplicates Field styles
Ruling R22: module-gated pages use route/[...slug].astro + indexPaths/routesFor in getStaticPaths (Response(null,404) still lists the route in the sitemap) — found by Task 12's status check — cost if wrong: none.
Task 9: fix round 1/5 (4 addressed, 0 open; commits 628f832..172eb84)
Task 9: complete (commits 503e0b4..172eb84, review clean)
Task 9: minor (deferred): {confirm} token couples to confirmPromise fragment; Title|text split; empty reviews band when reviewsUrl missing; Reviews.astro local day() duplicates formatDate
Task 12: fix round 1/5 (4 addressed, 0 open; commits 206deca..3da295f)
Task 12: complete (commits 503e0b4..3da295f, review clean)
Task 15: fix round 1/5 (4 addressed, 0 open; commits 9863524..5a74cdc)
Task 15: complete (commits 503e0b4..5a74cdc, review clean)
Merged 9, 12, 15 at e9e7057; controller verified npm test (159), astro check 0 errors, full e2e on 3 sites exit 0
Task 16: complete (commits 965111e..402105c, review clean); merged at e1fe050
Task 16: minor (deferred): seeded flag set when load fails; generic referral payload rows (map service slug); sample phone/postcode not per market, done/declined samples lack confirmed history; demo creds duplicated; extra "No consent for reminders" reason untested; lastSentence opt-out derivation fragile; redundant (vet?4:4) and fixed 3.2s wait; aria-live on whole detail; CA postcode label "Postcode" in console
Ruling R23: Task 17 fixture uses its own trimmed content dir (shared Fernway content links /fees/); customising docs must say content links must match modules on — the content-links test enforces it per site — cost if wrong: none.
Ruling R24: spec §1 criterion 5 "no JavaScript" means no JavaScript loaded by any page; Astro may leave orphan bundles for unrouted components in _astro/, accepted as long as no HTML references them (Task 17 asserts that) — cost if wrong: a few unused files on the host.
Ruling R25: two spec items no task built — the build warning for unverified market packs when demoMode is false (spec §5.5) and nav override in config/site.ts (spec §6) — are added to Task 19's scope — cost if wrong: small extra work.
Task 17: minor (deferred): href filter misses non-slash/absolute variants; hard-coded sitemap-0.xml; main-module guard; own origin hard-coded; fixture content has stale Fernway text
Ruling R26: /book/ must be gated like other module routes (book/[...slug].astro + indexPaths('booking')) — spec §1 criterion 5 — added to Task 19 scope, so modules.md's 'off leaves no route' becomes true — cost if wrong: none.
Task 17: fix round 1/5 (4 addressed, 0 open; commits 930475a..a82502d)
Task 17: complete (commits e9e7057..a82502d, review clean); merged at 7147a94
Task 18: fix round 1/5 (5 addressed, 0 open; commits 9580e61..6ced511)
Task 18: complete (commits e1fe050..6ced511, review clean); merged at f8163ed
Ruling R27: Task 19 also switches remaining reviewed/updated dates (prices page, PolicyPage, vet e2e 'Thu 3 Sept') to formatDate per R21 — cost if wrong: display only.
Task 19: minor (deferred): counsel checklist third copy in warning.ts (prefer pack reviewItems); BookingForm global .book class still leaks; nav override doesn't enforce six items; @ts-ignore in third-party.test; quality e2e hard-codes THEMES and skips 375 axe; console login gap
Task 19: fix round 1/5 (3 addressed, 0 open; commits d714049..fe3e64e)
Task 19: complete (commits f8163ed..fe3e64e, review clean)
All 19 tasks complete at fe3e64e
Final review: Ready with fixes — 4 Important, 2 must-fix deferred, 8 minors put into one fix wave (final-fix-brief.md). Minor 10 (marketing SMS wording mentions reminders) is plan-pinned copy: left for counsel/user.
Final fix wave: 14/14 addressed (commits fe3e64e..0a820a7), re-review clean.
Final: parked — ReviewsBand empty-band CSS hard-codes AU/CA/UK — Ruling: harmless for the three shipped packs; fix when a fourth pack is added (docs line "no component names a country" slightly overstated) — cost if wrong: empty heading in demo switcher for a new market.
Final: parked — price staleness flag computed at build time gives false negatives on sites not rebuilt — Ruling: brief asked for build time; a view-time due-date compare is the better follow-up — cost if wrong: warning missed on a neglected site.
Final: parked — market-id-branch boundary rule catches only ===/!== literals — Ruling: guard rail, not a guarantee — cost if wrong: a future branch slips past review.
Final: parked — console bundle still imports reminders/schedule when reminders is off; live console shows demo credentials pending real auth — Ruling: out of v1 scope (spec §12 real auth) — cost if wrong: small extra JS.

## Photos and motion (2026-10-04)

Plan: `docs/superpowers/plans/2026-10-03-photos-and-motion.md`. Spec: `docs/superpowers/specs/2026-10-03-photos-and-motion-design.md`.

Tasks 1 to 7 complete with task reviews (commits 92c47f1..3b76372, 98e5622). Verification pass at 98e5622:

- `npm test`: 221 passed, 32 files.
- `npm run check`: 0 errors, 4 hints.
- `npm run e2e`: exit 0, 209 ok, 14 skip, 0 fail.
- `npm run budget`: largest page 9,183 gzipped bytes (`/book/`), limit 30,720.
- Lighthouse: not run. No script runs it.
- Motion audit: the tiered MotionScore audit needs a Motion+ sign-in and was not run. A plain performance read found every animation runs on the compositor with no layout cost. Open question: the hero photo fades from opacity 0, which may delay the largest paint.
- Taste review: 32 screenshots (home, a service page, team, `/book/` at 375 and 1280, both themes, Fernway and Hollybank). Fixed in 7cd2a03: raw markdown link in service page answers, service photo capped to the text width, first-visit row top-aligned, 1px line on photo frames.

Ruling P1: photos chosen by an implementer that views each image, with a reviewer that opens them — cost if wrong: a weak photo, replaced by saving over the file.
Ruling P2: the photo and motion e2e files skip on fixture sites — cost if wrong: none; fixtures have no photos and one has motion off.
Ruling P4: `consult-room` is a plain clinical room under a Creative Commons licence — cost if wrong: swap one file and its credits row.
Ruling P5: `reception.jpg` is a retouched copy with signage painted out — cost if wrong: a faint smudge on the Fernway hero; save a different file over it.
Ruling P6: the contact page grid is two equal columns from 768px, not the plan's rule — cost if wrong: a narrower address column on wide screens.
Ruling P7: the page cross-fade rule lives in `BaseLayout`, so `/console/` and `/dev/` get none — cost if wrong: one rule moves back.
Ruling P9: a plain performance read stands in for the tiered motion audit — cost if wrong: sign in to Motion+ and run it.
Ruling P10: the taste fix wave covers only what this change added, plus the broken link text — cost if wrong: small follow-ups.

Taste findings not applied (older content and layout): one price only on the Fernway home service list; thin fees and reviews sections on Fernway home; team intro promises registration numbers the rows do not show; trust strip hairlines overhang the gutter; empty appointment card is quiet; step markers wrap at 375; "What patients say" on the vet site; sample-content note sits mid-page on service pages.

Taste advice that conflicts with the design system, not applied: card grids or carousels for long lists; bento layouts and pinned or perpetual motion; Tailwind and icon libraries; photo avatars for clinicians; dark mode; no hairline between rows.

Photos worth swapping when real ones exist: `vet-exterior`, `vet-reception`, `clinic-exterior`, `treatment-room-physio`, and the retouched `reception`.

Final review (2026-10-04): no critical or important findings. Fixed in d29064a: the axe scan now runs with reduced motion, so home is scanned fully revealed (107 contrast nodes, up from 48); the photo brief says "empty room slot".

Follow-ups after the review: `linkHtml` has a unit test (`tests/unit/inline.test.ts`). A service `photoSlot` with no `photoAlt` entry now fails the build. `npm audit fix` updated `http-cache-semantics`.
