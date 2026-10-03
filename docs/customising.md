# Customising

How to turn this repo into a real clinic site. You edit config, content, tokens and photos. You do not edit components.

## What to edit

| You want to change | Edit |
|---|---|
| Preset, market, modules on or off, demo mode, theme | `src/config/sites/<id>/site.ts` |
| Clinic name, legal name, identifier, phones, email, address, hours, emergency wording, map point, owner, review link, estimate threshold | `src/config/sites/<id>/clinic.ts` |
| Booking provider (`none`, `embed`, `link`), practice-system URL, request windows, lead time, horizon, days off, confirmation promise | `src/config/sites/<id>/booking.ts` |
| Reminder, recall and review templates and timings | `src/config/sites/<id>/messages.ts` (undefined uses the preset defaults) |
| Services, clinicians, fees or price list, reviews, FAQs, policies | `src/content/<contentDir>/` |
| Navigation order and labels | `src/presets/*.ts` (`nav`). There is no per-site nav override. |
| Colours, type, spacing | `src/styles/tokens.css` |
| Photos | `src/assets/photos/<slot>.jpg`. Run `npm run photos:status`. |

The demo repo holds three sites under `src/config/sites/`: `fernway-au`, `fernway-ca` and `hollybank`. `SITE` picks one at build time (see the README). A real client build has one site folder and one content folder.

## Set up a new clinic from a preset

1. Copy the closest demo folder, for example `src/config/sites/fernway-au/`, to `src/config/sites/<your-id>/`. Keep the four files: `site.ts`, `clinic.ts`, `booking.ts`, `messages.ts`.
2. Register it in `src/config/index.ts`. Import the four files and add an entry to `inputs`. Add the id to the `SITES` list in `tests/e2e/run.mjs` and to `build:all` in `package.json`.
3. In `site.ts`, set `id`, `preset` (`allied-health` or `vet`), `market`, `modules`, `theme` and `contentDir`. Set `demoMode: false` when you are ready to go live (see below).
4. Fill `clinic.ts`. Use the clinic's real legal name, identifier, hours and time zone. The time zone drives every date the site shows, so use an IANA name such as `Australia/Melbourne`.
5. Copy `src/content/<demo>/` to `src/content/<contentDir>/` and replace every file with real text. The content schemas in `src/content.config.ts` fail the build when a field is missing.
6. Choose the booking provider in `booking.ts`. `none` uses the built-in request form. `link` sends people to the practice system with the service preselected. `embed` shows the practice system in an iframe. The request form stays as a fallback in both cases.
7. Edit `src/styles/tokens.css` if the clinic needs its own colours. Run `npm test`, because the contrast test checks both themes.
8. Add photos and run `npm run photos:status`.

Module switches go in `site.ts`:

```ts
modules: { referrals: true, 'price-list': false }
```

`true` adds a module on top of the preset defaults. `false` removes one. Unknown ids and missing requirements fail the build.

## Content rules

- Links in content must match the modules that are on. If `fees` is off, no page may link to `/fees/`. The demo content links to `/fees/`, `/prices/` and `/estimates/` only on the brand that has them.
- Fees keep one file for every market. Each fee has `amount` keyed by market (`AU`, `CA`), and `funding` keys (`fund`, `medicare`, `extended`, `direct`). A fee with no amount for a market is left out of that market's table.
- Clinicians can carry `registration.byMarket.CA` when the same person shows a different register in Canada.
- Never ask for symptoms, history, medications or a pet's condition anywhere on the site. Clinical intake happens in the practice system.
- Write in sentence case, with short sentences. No eyebrow labels, no all-caps, no arrows on buttons.

## Add a market pack

A market pack is data. Modules read it and never check a country themselves.

1. Create `src/domain/markets/<id>.ts` that exports a `MarketPack`. Copy `au.ts` and change every field: locale, currency, tax note, testimonial and review rules, price display rule, consent law, identifier label and pattern, phone pattern, postcode label and pattern, required pages, `fundingLabels`.
2. Add the id to `MarketId` and to `PACKS` in `src/domain/markets/index.ts`.
3. Add the matching entries to the `DIAL` table in `src/layouts/site.ts` and to the locale and currency unions in `MarketPack`.
4. Set `verified: false` until local counsel has confirmed the pack.
5. Add the id to `fees.json` amounts and to any `byMarket` blocks that need it.
6. Extend `tests/unit/markets.test.ts`.

Only `src/domain/presets.ts` and `src/layouts/*` may read `site.market`. Pages that show market-dependent text render one variant per market in `site.markets`, each wrapped in `data-market-only="<id>"`, using `marketVariants()`. That is what makes `?market=` switching work in demo mode. `configuredMarket(site)` is for build-market data only, such as JSON-LD.

## Add a module

1. Add the id to `MODULE_IDS` in `src/domain/modules.ts`.
2. Add its `ModuleDef` to `MODULES`: `id`, `routes`, optional `leadKinds` and `requires`.
   ```ts
   mymodule: { id: 'mymodule', routes: ['/mypage/'], leadKinds: ['enquiry'], requires: ['services'] }
   ```
3. Create `src/modules/<id>/` with pure logic first, then components. A module never imports another module. Share through `src/domain/` or `src/domain/events.ts`.
4. Create `src/pages/<route>/[...slug].astro` and gate it with `indexPaths`:
   ```ts
   export function getStaticPaths() { return indexPaths('mymodule', site); }
   ```
   With the module off, `indexPaths` returns no paths, so the route is not built, is not in the sitemap and returns 404.
5. Add a nav item to the preset with `module: '<id>'`. Items with a module are removed from the nav when the module is off.
6. Add the id to the `modules` list of each preset that should have it on by default.
7. Add unit tests, then run `npm test`. The boundary checker enforces the import rules.

## Go live

1. Set `demoMode: false` in `site.ts`. This removes the demo ribbon, the `?market=` and `?theme=` switching and the "Preview, not sent" label in the console. It also lets JSON-LD carry `aggregateRating` where the market allows testimonials.
2. Replace every sample line in content. Sample reviews, sample prices and "sample content" notes must go. The console and its demo sign-in text are still demo code until you add real authentication.
3. Choose one `market` and drop `markets`.
4. Confirm the market pack with counsel (below).
5. Run `npm test`, `npm run check`, `npm run build:all` (or `npm run build` for one site) and `npm run e2e`.

## Implement the real lead store

The demo stores requests in the visitor's browser through `LocalLeadRepository`. A live clinic needs a server.

1. Write `HttpLeadRepository` in `src/core/leads/http-repository.ts`. It implements the `LeadRepository` interface in `src/core/leads/repository.ts`: `create`, `list`, `get`, `updateStatus`, `addNote`, `clear`, `seed`. `create` must be idempotent on `clientRef`.
2. Return it from `getLeadRepository()` in `src/core/leads/index.ts`. That function is the only place that picks the store.
3. Send messages from your server, using the templates in `messages.ts`. The site never sends anything. The console only previews.
4. Put real authentication in front of `/console/`. The demo login (`clinic@demo.reozix` and `demo1234`) is not security.

## Confirm the market pack with counsel

Every pack is research, not legal advice. Before a site goes live, a local lawyer should confirm:

| Pack | Status | What to confirm |
|---|---|---|
| AU | `verified: true` | Testimonial rules on clinic pages (AHPRA), Spam Act wording, GST wording |
| UK | `verified: true` | PECR wording, price display rules, the vet module wording (see `docs/modules.md`) |
| CA | `verified: false` | Provincial privacy and health information rules, college advertising and testimonial rules for Ontario, CASL wording, AODA wording |

The build does not print a warning for an unverified pack. Check `verified` yourself before sale. CA stays `false` until counsel signs it off.
