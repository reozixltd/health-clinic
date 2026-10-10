# Modules

A module is a switchable feature. Turn one on or off in `modules` in `src/config/sites/<id>/site.ts`. A module that is off leaves no route, nav link, sitemap entry or script. The registry is `src/domain/modules.ts`. Nav items that name a module follow the same switch, whether they come from the preset or from a `nav` override in `site.ts`.

## Defaults by preset

| Module | Allied health | Vet |
|---|---|---|
| providers, services, booking, reviews, reminders, emergency | On | On |
| fees, referrals | On (referrals is also set on explicitly in the Fernway sites) | Off |
| price-list, estimates, ownership | Off | On |
| about, blog | Off (set on in the Fernway sites) | Off |

`estimates` requires `price-list`. Turning on a module whose requirement is off fails the build.

## Summary

| Module | Routes | Lead kinds | Requires |
|---|---|---|---|
| providers | `/team/`, `/team/<slug>/` | none | none |
| services | `/services/`, `/services/<slug>/` | none | none |
| booking | `/book/` | `appointment` | none |
| fees | `/fees/` | none | none |
| price-list | `/prices/` | none | none |
| estimates | `/estimates/` | `estimate` | price-list |
| ownership | `/ownership/` | none | none |
| reviews | none (home band) | none | none |
| reminders | none (console timeline) | none | none |
| referrals | `/referrers/` | `referral` | none |
| emergency | `/out-of-hours/` when the preset has `emergencyPage` | none | none |
| about | `/about/` | none | none |
| blog | `/blog/`, `/blog/<slug>/` | none | none |

The `enquiry` lead kind belongs to the preset, not to a module.

## Motion

Motion is a site setting, not a module. `motion: false` in a site's `site.ts` removes the reveal and count-up script, the hero entrance, the page transitions, the marquee and the carousel's auto-advance. It also removes the booking step slide and the hover zoom. Button press feedback and the card line fill stay. It is on when not set. See `docs/design-system.md` for the motion tokens.

## providers

Lists clinicians as photo cards and gives each a profile: portrait, name, role, registration body and number, qualifications, special interests, languages, the days they work, services, whether they are accepting new patients, a bio and a **Book with** link that opens `/book/` with the clinician chosen. The registration links to the public register when `clinic.registerUrl` is set.

- Content: `src/content/<dir>/providers/*.md`.
- Config: `clinic.registerUrl`.
- Notes: `registration.byMarket.CA` replaces the register body and number when the visitor's market is CA. Photo slots are named in `photoSlot` and listed in `src/config/photo-slots.ts`.

## services

One page per service: a photo header, an "At a glance" panel (appointment length, fee, who you will see), the long read, what it can help with, what to expect, a care timeline, the clinicians who offer it, questions as accordions and a **Book this** link. A "from" price shows only when `fromPrice` is set and the market allows it. The conditions chips on the home page come from `conditions.json` and link to the service that treats each one.

- Content: `src/content/<dir>/services/*.md`.
- Notes: `fromPrice` is one number or a number per market. `fromPriceLabel` returns nothing for the UK vet pack, where the full price list is required. `treats` and `timeline` are optional; the sections show only for services that list them. The timeline carries a note that it is a common pattern, not a promise.

## booking

The six-step request on `/book/`: service, clinician, new or returning (plus "for me or someone else", or the pet's name and species for vets), when, you, check and send. The appointment card fills as the patient chooses. The URL keeps the choices, never contact details.

- Config: `booking.ts` (`provider`, `url`, `serviceParam`, `windows`, `leadDays`, `horizonDays`, `daysOff`, `confirmPromise`).
- Provider modes: `none` uses the built-in form. `link` shows a **Book online** link built by `handoffUrl`. `embed` shows the practice system in an iframe. The request form stays as a fallback.
- Days are computed in the clinic's `timeZone`, never the device's.
- Notes: the form never asks for symptoms, history, medications or a pet's condition. Marketing consents are separate, unticked and timestamped, with wording from the market pack. A short note on the page asks people not to add medical details. A pet's name and species may appear in the URL.

## fees

A table of fees by service with funding notes from the market pack (`fundingLabels`). Amounts are whole units unless they have pence or cents.

- Content: `src/content/<dir>/fees.json` (one file for every market) and `policies/fees-notes.md`.
- Notes: AU shows fund rebates and Medicare wording. CA shows extended health and direct billing wording. All wording sits in content and the pack, not in the module.

## price-list

A grouped price table with "Last reviewed" date. The console warns when the review date is more than 180 days old (`isStale`). Prices show with the pack's tax note.

- Content: `src/content/<dir>/prices.json` (`reviewedAt` and `items`).
- Notes: whole amounts show without decimals, fractions with two. A zero amount shows "Included".
- Legal: built for the CMA remedies, which is a vet rule. See the confirmation note below.

## estimates

A request form for a written estimate: pet name and species, what the estimate is for from a short list, contact details and consent. The page says a written estimate is given before treatment likely to cost the threshold or more.

- Config: `clinic.estimateThreshold` (default 500, shown in the pack's currency).
- Notes: no free-text medical field. The console schedules an estimate follow-up email two days after the request.
- Legal: built for the CMA remedies. See the confirmation note below.

## ownership

A statement page built from `clinic.owner` (`name`, optional `group`, `independent`). It names the owner, the group if there is one, and the registered company with its number. With no `owner` it says to ask the practice.

- Config: `clinic.owner`, `clinic.legalName`, `clinic.legalId`.
- Legal: built for the CMA remedies. See the confirmation note below.

## reviews

Shows reviews on the home page according to the market pack.

| Pack | Mode | What shows |
|---|---|---|
| AU | `link-only` | A "Read our reviews on Google" panel from `clinic.reviewsUrl`. No quotes and no rating number anywhere on the site. |
| CA, UK | `display` | Named, dated reviews in a carousel that advances by itself and can be paused, with a rating badge when `about.json` has a `rating` |

- Content: `src/content/<dir>/reviews.json` (`name`, `date`, `rating`, `source`, `text`).
- Notes: AU bans testimonials on clinic-controlled pages (AHPRA). In demo mode the sample reviews are labelled as samples and JSON-LD carries no `aggregateRating`.

## reminders

Pure scheduling that drives the console's message timeline. Nothing is sent. In demo mode each message is marked "Preview, not sent". With the module off the console shows "Message previews are off" instead of timelines, and `/book/` shows no sample confirmation text and loads none of the reminders code.

| Message | Channel | Fires | Preset |
|---|---|---|---|
| Confirmation | SMS | On confirm | Both |
| Reminder | SMS | 24 hours before the visit | Both |
| Review request | SMS | 4 hours after the visit | Allied health |
| Recall | Email | About 6 months after the visit | Allied health |
| Vaccination recall | SMS | About 12 months after a vaccination visit | Vet |
| Parasite reminder | SMS | About every 3 months | Vet |
| Referral acknowledgement | Email | On create | Allied health |
| Estimate follow-up | Email | 2 days after create | Vet |

- Config: `messages.ts`. Set an array to replace the preset defaults.
- Notes: every SMS ends with the clinic name. Marketing messages carry the pack's opt-out line and wait for consent. Review requests count as marketing in every market until counsel says otherwise. Times are computed in the clinic's time zone.

## referrals

`/referrers/` for GPs and other referrers: what the clinic treats, how to refer, and a form with the referrer's name, practice and contact, the patient's first name and contact only, the service wanted and an urgency choice. A note says clinical details go through the referrer's secure channel, not this form.

- Notes: the form collects no clinical information. No third-party scripts load on this page.

## emergency

The after-hours note shown in the hero and footer, from `clinic.emergency`. When the preset has `emergencyPage: true` (vet), it also builds `/out-of-hours/`. Allied health has no emergency page and says so on the contact page.

- Config: `clinic.emergency` (`text`, `phone`, `href`).

## about

The clinic story on `/about/` and the bands on the home page that draw on it: the hero copy and floating cards, the stats strip, "Why choose us", the story band with the founder, payment options, the gallery, the newsletter signup and the careers teaser. The page itself adds the milestones timeline, awards and accreditations, and the open roles.

- Content: `about.json` (founded year, founder slug, mission, hero, story, milestones, rating, stats, features, payments, careers, newsletter), `awards.json`, `funds.json`, `conditions.json` and `gallery.json`, all in `src/content/<dir>/`.
- Notes: a site with the module off, or with no `about.json`, gets the shorter home page. The rating shows only where the market displays reviews. Fund marks are drawn placeholders (`FundLogo.astro`) and each fund names its market. The newsletter form is front-end only: it validates the address and confirms, and sends nothing. The careers link is a `mailto:` to the clinic.

## blog

Health tips on `/blog/`, one article per file, with a category, an author from the team, a reading time and a photo. The home page shows the latest three. An article page ends with related articles, same category first.

- Content: `src/content/<dir>/blog/*.md` (`title`, `date`, `author` as a provider slug, `summary`, `photoSlot`, `minutes`, `category`).
- Notes: articles are general information, not advice for one person, and each says so. `postCards()` in `src/modules/blog/posts.ts` sorts and shapes them.

## Vet modules and the competition remedies

`price-list`, `estimates` and `ownership` were built for the CMA remedies in the final report (24 March 2026): a published price list, written estimates above a threshold, and an ownership statement.

Order status to confirm: whether the Order was made, and its exact wording, was not verified when these modules were built. Confirm the final Order wording before sale. The 180-day review limit and the GBP 500 estimate threshold are defaults in config, not legal advice.
