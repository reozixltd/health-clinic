# health-clinic

A modular static website for allied-health and vet clinics, built with Astro 5 and plain CSS on tokens. One codebase serves the sales demo and each paying clinic. A clinic site is set up by editing config, content, tokens and photos. You do not edit components.

Demo sites:

| Site id | Preset | Market | Brand |
|---|---|---|---|
| `fernway-au` | allied-health | AU (switch to CA with `?market=CA`) | Fernway Health, Melbourne |
| `fernway-ca` | allied-health | CA (switch to AU with `?market=AU`) | Fernway Health, Ottawa |
| `hollybank` | vet | UK | Hollybank Vets, Leeds |

All names, numbers and prices are fictional samples.

## Quick start

```sh
npm install                     # once
SITE=fernway-au npm run dev     # or fernway-ca, hollybank (default fernway-au)
npm test                        # boundary checker, then unit tests
npm run check                   # astro check: strict types and content schemas
npm run build:all               # builds all three demo sites into dist/<id>/
npm run budget                  # after build:all: page JavaScript stays at or under 30 KB gzipped
npm run e2e                     # builds, serves and tests every site in a browser
npm run photos:status           # lists photo slots and writes docs/photo-brief.md
```

Notes:

- `SITE` picks the demo site at build and dev time. Astro keeps `import.meta.env.SITE` for the site URL, so the code reads the id from `SITE_ID`, which `astro.config.mjs` fills from `SITE`.
- `npm run build` builds one site. Use `SITE=hollybank npm run build`.
- `npm run e2e` uses ports 4321 to 4323. Set `E2E_PORT_BASE` to move them, and `E2E_SITES=hollybank` to run one site.
- Demo console login: `clinic@demo.reozix` and `demo1234`.

## Where things live

| You want | Look in |
|---|---|
| Pick a preset, market, modules, theme, demo mode | `src/config/sites/<id>/site.ts` |
| Clinic details, booking, message templates | `src/config/sites/<id>/` (`clinic.ts`, `booking.ts`, `messages.ts`) |
| Site registry (add a site here) | `src/config/registry.ts` |
| `SITE_ID` handling | `src/config/index.ts` |
| Services, clinicians, fees, prices, reviews, FAQs, policies | `src/content/<contentDir>/` |
| Content schemas | `src/content.config.ts` |
| Preset defaults (modules, nav, wording, messages) | `src/presets/allied-health.ts`, `src/presets/vet.ts` |
| Module registry, `indexPaths`, `routesFor` | `src/domain/modules.ts` |
| Merging a preset with a site | `src/domain/presets.ts` |
| Market rule packs (AU, CA, UK) | `src/domain/markets/` |
| Feature code (booking, fees, estimates and so on) | `src/modules/<id>/` |
| Pages and routes | `src/pages/` |
| Header, footer, layouts, SEO | `src/layouts/` |
| Page bands used by pages | `src/sections/` |
| Shared UI, leads, storage, formats | `src/core/` |
| Colours, type, spacing | `src/styles/tokens.css` |
| Photo slots and photo files | `src/config/photo-slots.ts`, `src/assets/photos/` |
| Unit tests | `tests/unit/` |
| End-to-end tests | `tests/e2e/` (`run.mjs` builds and serves each site) |
| Dependency rules | `tools/boundaries.mjs`, run by `npm test` |

Imports run one way: `pages` to `layouts` and `sections`, then `modules`, then `domain`, then `core`. A module never imports another module. Only `src/styles/tokens.css` holds raw colours.

## Docs

| Doc | What it covers |
|---|---|
| `docs/spec.md` | The product spec and decisions |
| `docs/customising.md` | Setting up a clinic, adding a market or module, going live |
| `docs/modules.md` | One entry per module |
| `docs/design-system.md` | Tokens, type, the appointment card, what not to do |
| `docs/photo-brief.md` | Photo slots and what each should show (generated) |
| `docs/plans/` | The build plan |

## Before a clinic goes live

- Set `demoMode: false`, replace all sample content and add real photos.
- Implement `HttpLeadRepository` and send messages from your server. The site never sends.
- Have local counsel confirm the market pack. The CA pack is `verified: false`.
- The vet modules (`price-list`, `estimates`, `ownership`) were built for the CMA remedies. Confirm the Order status and wording first.
