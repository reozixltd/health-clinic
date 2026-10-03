# Modules

A module is a switchable feature. Turn one on or off in `modules` in `src/config/sites/<id>/site.ts`. A module that is off leaves no route, nav link, sitemap entry or script. The registry is `src/domain/modules.ts`. Nav items that name a module follow the same switch, whether they come from the preset or from a `nav` override in `site.ts`.

## Defaults by preset

| Module | Allied health | Vet |
|---|---|---|
| providers, services, booking, reviews, reminders, emergency | On | On |
| fees, referrals | On (referrals is also set on explicitly in the Fernway sites) | Off |
| price-list, estimates, ownership | Off | On |

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

The `enquiry` lead kind belongs to the preset, not to a module.

## Motion

Motion is a site setting, not a module. `motion: false` in a site's `site.ts` removes the reveal script, the hero entrance and the page cross-fade. It also removes the booking step slide and the hover zoom. Button press feedback and the card line fill stay. It is on when not set.

## providers

Lists clinicians and gives each a profile: photo slot, name, role, registration body and number, languages, services, whether they are accepting new patients, a short bio and a **Book with** link that opens `/book/` with the clinician chosen. The registration links to the public register when `clinic.registerUrl` is set.

- Content: `src/content/<dir>/providers/*.md`.
- Config: `clinic.registerUrl`.
- Notes: `registration.byMarket.CA` replaces the register body and number when the visitor's market is CA. Photo slots are named in `photoSlot` and listed in `src/config/photo-slots.ts`.

## services

One page per service with summary, duration, what to expect, the clinicians who offer it, three FAQs and a **Book this** link. A "from" price shows only when `fromPrice` is set and the market allows it.

- Content: `src/content/<dir>/services/*.md`.
- Notes: `fromPriceLabel` returns nothing for the UK vet pack, where the full price list is required.

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
| AU | `link-only` | A "Read our reviews on Google" link from `clinic.reviewsUrl`. No quotes. |
| CA, UK | `display` | Named, dated reviews with the source, newest first |

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

## Vet modules and the competition remedies

`price-list`, `estimates` and `ownership` were built for the CMA remedies in the final report (24 March 2026): a published price list, written estimates above a threshold, and an ownership statement.

Order status to confirm: whether the Order was made, and its exact wording, was not verified when these modules were built. Confirm the final Order wording before sale. The 180-day review limit and the GBP 500 estimate threshold are defaults in config, not legal advice.
