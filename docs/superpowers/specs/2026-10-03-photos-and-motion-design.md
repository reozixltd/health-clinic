# Photos and motion — design

Date: 2026-10-03. Extends `docs/spec.md` (v1). Branch: `build/health-clinic-v1`.

## 1. Purpose

The demo sites (Fernway AU, Fernway CA, Hollybank) show grey placeholders and almost no movement, so they read as unfinished. This change makes them look like complete clinic websites: real room photography on the main pages and calm, polished motion.

Success means:

1. Home, service, and contact pages on all three demo sites show real photos, with no grey placeholder visible anywhere.
2. Motion from section 4 is present, and absent under `prefers-reduced-motion`.
3. All existing gates stay green: `npm test`, `astro check`, full e2e with axe, `npm run budget` (30 KB gzipped page JS).
4. The motion and taste skill reviews in section 7 have been run and their findings fixed or listed.

## 2. Decisions made with the user

- Photos are licence-free stock of rooms and buildings with no people. The rule "never use stock photos of people as clinicians" stays.
- Clinicians without a portrait show an initials tile, not a stock face.
- Motion level is "calm and polished": reveals, stagger, page cross-fade, step slide, hover. No parallax, pinning, or scroll-linked effects.
- Motion library for scroll reveals, stagger and booking steps; plain CSS for the hero entrance, page cross-fade, hover and press.

## 3. Photos

### 3.1 Files

- Nine stock photos from Unsplash or Pexels, saved as `src/assets/photos/<slot>.jpg`, about 1600 px wide, landscape.
- `docs/photo-credits.md` lists each slot, source URL, photographer and licence.
- Rename Hollybank's shared slots in `src/config/photo-slots.ts` so each brand has its own building: `clinic-exterior` → `vet-exterior`, `reception` → `vet-reception`. Fernway keeps the original names.

| Slot | Brand |
|---|---|
| `clinic-exterior`, `reception`, `treatment-room-physio`, `treatment-room-dental`, `consulting-room-psychology` | Fernway |
| `vet-exterior`, `vet-reception`, `consult-room`, `prep-and-theatre` | Hollybank |

That is nine slots. All nine get a file.

### 3.2 Which slot a page uses

Sections must not name a brand. Each content folder's slot list in `photo-slots.ts` gains named roles so sections ask for a role, not a file:

```ts
export const photoRoles: Record<string, { hero: string; exterior: string; firstVisit: string }> = {
  fernway:   { hero: 'reception',     exterior: 'clinic-exterior', firstVisit: 'treatment-room-physio' },
  hollybank: { hero: 'vet-reception', exterior: 'vet-exterior',    firstVisit: 'consult-room' },
};
```

A content folder with no entry (the fixtures) gets no photos in these sections, and the section renders as it does today.

### 3.3 Placements

| Place | Role or slot | Layout |
|---|---|---|
| Home `Hero` | `hero` | Two columns from 1024 px: text left, photo right, ratio 4 / 3. One column below, photo under the actions. `priority` (eager, high fetch priority). |
| Home `FirstVisit` | `firstVisit` | Photo beside the numbered steps from 1024 px, above them below. |
| Home `Location` and `/contact/` | `exterior` | Photo beside the address from 768 px. |
| Service detail page | service `photoSlot` | Wide photo (ratio 16 / 9) under the page header. |

- Services content schema gains optional `photoSlot: z.string().optional()`. Fernway physio, dental and psychology services map to their rooms; Hollybank services map to `consult-room` or `prep-and-theatre`. A service without the field shows no photo.
- Alt text describes the room plainly ("Reception desk and waiting area"). It comes from a new `photoAlt: Record<string, string>` map in `photo-slots.ts`, one entry per room slot. The shoot instructions in `tools/photo-brief.mjs` are not reused, as they are written for a photographer, not a reader.
- No galleries, carousels or card grids.

### 3.4 Clinician initials tile

- `Photo` gains an optional `initials` prop. When the slot has no file and `initials` is set, it renders an initials tile instead of `Placeholder`: `--color-surface` background, `--color-ink` text, same ratio and radius, `role="img"` with the existing alt as its label.
- `TeamRow`, `ProviderList` and `ProviderProfile` pass initials derived from the provider name by a small pure function in `src/modules/providers/`: first letter of the first and last word, skipping a leading title ("Dr"); a one-word name gives one letter.
- A real portrait in the slot still replaces the tile with no code change.

### 3.5 Docs

- `npm run photos:status` regenerates `docs/photo-brief.md`. The tool's line "Provider slots are the only ones pages render today" is corrected to say which room slots are rendered.

## 4. Motion

### 4.1 Wiring

- Add dependency `motion`. New `src/core/motion.ts` uses `inView`, `animate` and `stagger`; loaded by a `<script>` in `BaseLayout.astro` only when `site.motion` is on.
- Markup opts in:
  - `data-reveal` on an element that fades and rises as a unit.
  - `data-reveal-group` on a container whose direct children stagger.
- On load the script collects opted-in elements, skips any already intersecting the viewport, sets the rest to the start state, and animates each once when it enters view. Nothing is hidden by CSS, so a failed or blocked script leaves all content visible.
- The script exits immediately when `matchMedia('(prefers-reduced-motion: reduce)')` matches.

### 4.2 What moves

| Where | Motion | Built with |
|---|---|---|
| Home hero, on load | Photo: opacity 0 → 1, scale 1.04 → 1, 600 ms. Heading, line, actions: opacity 0 → 1, y 12 px → 0, 400 ms, 60 ms apart. | CSS `@keyframes` |
| `data-reveal` sections and photos | opacity 0 → 1, y 12 px → 0, 400 ms, ease-out `cubic-bezier(0.22, 1, 0.36, 1)`, once, at 15% visible | Motion `inView` + `animate` |
| `data-reveal-group`: service list, team row, FAQ, first-visit steps | Same values per child, 40 ms apart, stagger applied to the first 8 children; the rest appear with the eighth | Motion `stagger` |
| Page to page | 200 ms cross-fade; header given a `view-transition-name` so it holds still | CSS `@view-transition { navigation: auto }` |
| Booking steps | Incoming step: opacity 0 → 1, x ±16 px → 0 by direction of travel, 250 ms. Focus handling unchanged. Card line fill unchanged. | Motion `animate` in `src/modules/booking/booking.ts` |
| Linked photos, hover | scale 1 → 1.03 inside the frame, 300 ms, inside `@media (hover: hover)` | CSS |
| Button press | Unchanged | CSS |

Only `opacity` and `transform` animate. `/console/` and `/dev/` pages get no motion attributes.

### 4.3 Reduced motion

Under `prefers-reduced-motion: reduce`: the script does nothing; hero keyframes, view transition and hover zoom are disabled in CSS. Existing colour fades stay.

### 4.4 Site setting

- `Site.motion?: boolean`, default on. When off, `BaseLayout` omits the script and sets `data-motion="off"` on `<html>`, which disables the CSS hero keyframes, view transition and hover zoom.
- `fixture-minimal` sets `motion: false`, so the "no JavaScript loaded by any page" criterion (spec §1 item 5, ruling R24) and its test still hold.

### 4.5 Budget

- Every page must stay at or under 30,720 gzipped bytes of JS (`npm run budget`).
- If `/book/` goes over with Motion imported into `booking.ts`, the step slide is done with a CSS class transition instead and Motion is used for scroll reveals only. Either way the budget is not raised.

## 5. Rule changes in existing docs

- `docs/spec.md` §8.5 and `docs/design-system.md` "Motion": replace "only the card line fill and button press move" with the list in 4.2, the reduced-motion behaviour, and the `motion` setting.
- `docs/modules.md` and `docs/customising.md`: document `site.motion`, `photoRoles`, and the service `photoSlot` field.
- Unchanged: anti-template rules, accent-colour rule, 30 KB budget, WCAG 2.2 AA.

## 6. Tests

Unit (vitest):

- Initials function: two-word name, one-word name, leading "Dr", extra whitespace.
- `site.motion` resolves to on when unset and off for `fixture-minimal`.
- Every slot named in `photoRoles` exists in that folder's `photoSlots`.

E2E (added to existing suites, run on all three demo sites):

- Home hero contains an `<img>` with non-empty alt; no element with the placeholder label is present on home, a service page, or `/contact/`.
- After scrolling to the bottom of home, every `[data-reveal]` element and every child of `[data-reveal-group]` has computed opacity 1 and no transform.
- With reduced motion emulated, no `[data-reveal]` element ever has opacity below 1, and switching booking steps applies no transform.
- `fixture-minimal` still references no script in any page (existing test, must keep passing).

Gates: `npm test`, `npm run check`, `npm run e2e`, `npm run budget`.

## 7. Verification pass

1. Motion skill performance audit over the new animation code. Fix anything below its top tier or record why not.
2. Taste skill review of screenshots: home, one service page, team, `/book/`, at 375 and 1280, both themes, Fernway and Hollybank. Fix findings. Where its advice conflicts with `docs/design-system.md`, the design system wins and the conflict is listed for the user rather than applied.
3. Report results with command output, including failures and anything skipped.

## 8. Out of scope

Clinician portraits, galleries, video, Open Graph images, console motion, a fourth market, and the deferred minors in `docs/build-ledger.md`.
