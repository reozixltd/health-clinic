# Photos and Motion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the three demo clinic sites look finished: real room photos on the main pages, an initials tile for clinicians, and calm motion (scroll reveals, stagger, hero entrance, page cross-fade, booking step slide, hover).

**Architecture:** Photos reuse the existing slot pipeline (`src/core/photos.ts`, `Photo.astro`); a small role map in `src/config/photo-slots.ts` tells pages which slot fills the hero, exterior and first-visit positions, and pages pass `{ slot, alt }` down to sections as props. Scroll reveals come from one script, `src/core/motion.ts`, built on the Motion library and driven by `data-reveal` / `data-reveal-group` attributes. Everything else that moves is plain CSS, switched off by `html[data-motion='off']` and by the existing global reduced-motion rule.

**Tech Stack:** Astro 5, plain CSS on tokens, TypeScript, `motion` (new dependency), vitest + jsdom, Playwright e2e with axe.

**Spec:** `docs/superpowers/specs/2026-10-03-photos-and-motion-design.md`. Read it with this plan. It extends `docs/spec.md`.

## Global Constraints

- Page JS at or under 30,720 gzipped bytes on every page (`npm run budget`). The budget is not raised.
- Only `opacity` and `transform` animate.
- No raw colour values outside `src/styles/tokens.css`; components use `var(--...)` only (boundary test fails otherwise).
- `src/core/**` may import only from `src/core/**` and npm packages. Modules may not import other modules. Sections may not import pages or layouts.
- Sections and components never name a brand or branch on a market id.
- Never use stock photos of people. Rooms, buildings and equipment only.
- No carousels, galleries, card grids, eyebrow labels, all-caps text, or arrow symbols on buttons.
- `--color-accent` is used only on the appointment card fills and selected states.
- WCAG 2.2 AA; every image has alt text; 44 px touch targets.
- Headings in `docs/*.md` (top level, except `spec.md`) contain no all-caps runs other than the allowed list in `tests/unit/docs-copy.test.ts`, no `→`, no `·`.
- Motion values, verbatim from the spec: reveal `opacity 0 → 1`, `y 12px → 0`, 400 ms, `cubic-bezier(0.22, 1, 0.36, 1)`, once; stagger 40 ms, applied to the first 8 children; hero photo `scale 1.04 → 1`, 600 ms; hero text 60 ms apart; page cross-fade 200 ms; booking step `x ±16px`, 250 ms; hover zoom `1.03`, 300 ms.
- `/console/` and `/dev/` get no motion.
- Commit trailer on every commit: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Two deliberate departures from the spec

Both stay inside what the spec allows; they are recorded here so a reviewer does not flag them.

1. **Reveal trigger.** The spec says "at 15% visible". A section taller than about 6.6 viewports can never be 15% visible, so it would stay hidden on a phone. The script instead triggers when any part of the element crosses a line 10% above the bottom of the viewport (`margin: '0px 0px -10% 0px'`). Same feel, no stuck sections.
2. **Booking step slide is CSS.** Spec 4.2 lists Motion `animate` in `booking.ts`, and 4.5 allows a CSS fallback. The plan uses the CSS version from the start: with `motion: false` a site must load no Motion code, and `/book/` is the heaviest page for the JS budget. `booking.ts` only sets a `data-dir` attribute.

## Review Focus

1. A section taller than the viewport on a 375 px phone, or reached by an `#anchor` link, must still become visible. (Task 5, e2e at 375 and `/#faq`.)
2. Printing or saving a page as PDF before scrolling must print every section, not blank space. (Task 5, e2e with print media.)
3. JavaScript blocked or the motion script failing to load must leave every section and the hero visible. (Task 5, e2e with JavaScript disabled.)
4. Clinician names with a title, one word, accents, hyphens, extra spaces or an empty string must give sensible initials and never the text "undefined". (Task 2, unit.)
5. A site whose content folder has no photo roles, or a service with no `photoSlot`, must render its sections with no photo and no broken layout. (Task 2 unit for the lookup; Task 4 keeps the three fixture e2e suites passing.)

## File structure

| File | Change | Responsibility |
|---|---|---|
| `tests/e2e/harness.mjs`, `tests/e2e/run.mjs` | Modify | Run on Windows as well as Linux |
| `docs/build-ledger.md` | Modify | Heading fix so the docs test passes |
| `src/config/photo-slots.ts` | Modify | Slot lists, role map, alt text, lookups |
| `src/modules/providers/registration.ts` | Modify | `initials(name)` |
| `src/core/ui/Photo.astro` | Modify | Initials tile fallback; image transition |
| `src/sections/TeamRow.astro`, `src/modules/providers/ProviderList.astro`, `src/modules/providers/ProviderProfile.astro` | Modify | Pass initials; hover zoom; reveal group |
| `src/assets/photos/*.jpg` | Create | Nine stock photos |
| `docs/photo-credits.md` | Create | Source and licence per photo |
| `tools/photo-brief.mjs` | Modify | Descriptions for the two new slots; corrected rules text |
| `src/content.config.ts`, `src/content/*/services/*.md` | Modify | Optional service `photoSlot` |
| `src/sections/Hero.astro`, `FirstVisit.astro`, `Location.astro`, `src/pages/index.astro`, `src/pages/contact.astro`, `src/pages/services/[slug].astro` | Modify | Photo placements |
| `src/domain/presets.ts`, `src/config/sites/fixture-minimal/site.ts` | Modify | `motion` site setting |
| `src/core/motion.ts` | Create | Scroll reveals and stagger |
| `src/layouts/Motion.astro` | Create | Loads `motion.ts` |
| `src/layouts/BaseLayout.astro`, `src/layouts/Header.astro` | Modify | `data-motion`, script, header transition name |
| `src/styles/global.css` | Modify | Print rule, page cross-fade |
| `src/modules/booking/booking.ts`, `BookingForm.astro` | Modify | Step direction attribute and slide keyframes |
| `tests/unit/photos.test.ts`, `tests/e2e/photos.e2e.mjs`, `tests/e2e/motion.e2e.mjs` | Create | New tests |
| `tests/unit/presets.test.ts`, `tests/e2e/modules.e2e.mjs` | Modify | Motion setting tests |
| `docs/spec.md`, `docs/design-system.md`, `docs/modules.md`, `docs/customising.md` | Modify | Rule changes |

---

### Task 1: Gates run on this machine

The project was built in a Linux sandbox. On this Windows machine the e2e runner cannot start (`npx` needs a shell, the Chromium path is a Linux path, process-group kill is POSIX only), Playwright's Chromium is not downloaded, and one unit test already fails. Fix that first so every later task can be verified.

**Files:**
- Modify: `tests/e2e/harness.mjs` (the `chromium.launch` line)
- Modify: `tests/e2e/run.mjs` (`stopAll`, the three `spawn`/`spawnSync` calls)
- Modify: `docs/build-ledger.md:1`

**Interfaces:**
- Consumes: nothing.
- Produces: `npm test`, `npm run check`, `npm run e2e`, `npm run budget` all runnable from Git Bash or PowerShell. Later tasks rely on these four commands.

- [ ] **Step 1: See the failing baseline**

Run: `npm test`
Expected: 1 failed, `docs\build-ledger.md headings have no all-caps runs` (the heading contains "SDD").

- [ ] **Step 2: Fix the ledger heading**

In `docs/build-ledger.md` line 1, replace

```markdown
# SDD ledger — plan: docs/plans/2026-10-03-health-clinic-site.md
```

with

```markdown
# Build ledger — plan: docs/plans/2026-10-03-health-clinic-site.md
```

- [ ] **Step 3: Run unit tests**

Run: `npm test`
Expected: `boundaries ok`, then all test files pass, 0 failed.

- [ ] **Step 4: Install the browser**

Run: `npx playwright install chromium`
Expected: Chromium downloads to `%LOCALAPPDATA%\ms-playwright\`.

- [ ] **Step 5: Make the harness find Chromium on any platform**

In `tests/e2e/harness.mjs`, add the import and change the launch line:

```js
import { existsSync } from 'node:fs';
import { chromium } from 'playwright';
```

```js
// CHROMIUM_PATH wins; the sandbox path is used when it exists; otherwise Playwright's own download.
const SANDBOX_CHROMIUM = '/opt/pw-browsers/chromium';
const executablePath = process.env.CHROMIUM_PATH ?? (existsSync(SANDBOX_CHROMIUM) ? SANDBOX_CHROMIUM : undefined);
```

```js
  browser ??= await chromium.launch({ executablePath });
```

- [ ] **Step 6: Make the runner work on Windows**

In `tests/e2e/run.mjs`:

Add below `const root = ...`:

```js
const WIN = process.platform === 'win32';
```

Replace `stopAll`:

```js
function stopAll() {
  for (const s of servers) {
    try {
      if (WIN) spawnSync('taskkill', ['/pid', String(s.pid), '/T', '/F'], { stdio: 'ignore' });
      else process.kill(-s.pid, 'SIGTERM');
    } catch {}
  }
}
```

Add `shell: WIN` to the build call, and `shell: WIN, detached: !WIN` to the preview call:

```js
    const b = spawnSync('npx', ['astro', 'build', '--outDir', `dist/${id}`], { cwd: root, env: { ...process.env, SITE: id }, stdio: 'inherit', shell: WIN });
```

```js
    servers.push(spawn('npx', ['astro', 'preview', '--outDir', `dist/${id}`, '--port', String(port)], { cwd: root, env: { ...process.env, SITE: id }, stdio: 'ignore', detached: !WIN, shell: WIN }));
```

The two `spawnSync('node', ...)` calls need no change.

- [ ] **Step 7: Run the full e2e suite**

Run: `npm run e2e`
Expected: six builds, then every step prints `ok` or `skip`, exit code 0. If a step fails for a Windows-only reason (path separators, line endings), fix that test helper, not the product code, and say what you changed in the commit message. If a step fails for a product reason, stop and report it; it is a pre-existing bug outside this plan.

- [ ] **Step 8: Record the JS budget baseline**

Run: `npm run budget`
Expected: exit 0. Write down the reported worst page and its bytes for each site; Task 5 compares against it.

- [ ] **Step 9: Type check**

Run: `npm run check`
Expected: 0 errors.

- [ ] **Step 10: Commit**

```bash
git add tests/e2e/harness.mjs tests/e2e/run.mjs docs/build-ledger.md
git commit -m "test: e2e runner and harness work on Windows, ledger heading passes copy rules"
```

Leave the already-modified `package-lock.json` alone here; Task 5 changes it when `motion` is installed.

---

### Task 2: Photo roles, alt text and the clinician initials tile

**Files:**
- Modify: `src/config/photo-slots.ts`
- Modify: `src/modules/providers/registration.ts`
- Modify: `src/core/ui/Photo.astro`
- Modify: `src/sections/TeamRow.astro`, `src/modules/providers/ProviderList.astro`, `src/modules/providers/ProviderProfile.astro`
- Test: `tests/unit/photos.test.ts` (new)

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces, from `@/config/photo-slots`:
  - `type PhotoRole = 'hero' | 'exterior' | 'firstVisit'`
  - `interface SlotPhoto { slot: string; alt: string }`
  - `photoRoles: Record<string, Record<PhotoRole, string>>`
  - `photoAlt: Record<string, string>`
  - `slotPhoto(slot: string | undefined): SlotPhoto | undefined`
  - `rolePhoto(contentDir: string, role: PhotoRole): SlotPhoto | undefined`
- Produces, from `@/modules/providers/registration`: `initials(name: string): string`
- Produces: `Photo.astro` prop `initials?: string`; the tile has classes `photo initials`.

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/photos.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { photoAlt, photoRoles, photoSlots, rolePhoto, slotPhoto } from '@/config/photo-slots';
import { initials } from '@/modules/providers/registration';

describe('photo roles', () => {
  it('every role names a slot listed for that content folder, with alt text', () => {
    for (const [dir, roles] of Object.entries(photoRoles)) {
      for (const slot of Object.values(roles)) {
        expect(photoSlots[dir], dir).toContain(slot);
        expect(photoAlt[slot], slot).toBeTruthy();
      }
    }
  });

  it('every room slot has alt text and no provider slot does', () => {
    for (const slot of Object.values(photoSlots).flat()) {
      if (slot.startsWith('provider-')) expect(photoAlt[slot]).toBeUndefined();
      else expect(photoAlt[slot], slot).toBeTruthy();
    }
  });

  it('each brand has its own building', () => {
    expect(photoRoles.fernway!.exterior).not.toBe(photoRoles.hollybank!.exterior);
    expect(photoRoles.fernway!.hero).not.toBe(photoRoles.hollybank!.hero);
  });

  it('rolePhoto returns the slot and alt, or nothing for a folder with no roles', () => {
    expect(rolePhoto('fernway', 'hero')).toEqual({ slot: 'reception', alt: photoAlt.reception });
    expect(rolePhoto('fixture-minimal', 'hero')).toBeUndefined();
    expect(rolePhoto('', 'exterior')).toBeUndefined();
  });

  it('slotPhoto returns nothing for a missing or unknown slot', () => {
    expect(slotPhoto(undefined)).toBeUndefined();
    expect(slotPhoto('no-such-slot')).toBeUndefined();
    expect(slotPhoto('consult-room')).toEqual({ slot: 'consult-room', alt: photoAlt['consult-room'] });
  });
});

describe('initials', () => {
  it.each([
    ['Priya Nair', 'PN'],
    ['Dr Elena Marsh', 'EM'],
    ['Dr. Tom Hargreave', 'TH'],
    ['Prof Sam Lee Whitlock', 'SW'],
    ['Cher', 'C'],
    ['  Hannah   Reyes  ', 'HR'],
    ['Zoë Müller-Lang', 'ZM'],
    ['élodie durand', 'ÉD'],
    ['', ''],
    ['   ', ''],
  ])('%j gives %j', (name, expected) => {
    expect(initials(name)).toBe(expected);
  });

  it('never contains the text undefined', () => {
    for (const name of ['', 'Dr', 'A', 'Dr  ']) expect(initials(name)).not.toContain('undefined');
  });
});
```

- [ ] **Step 2: Run the tests to see them fail**

Run: `npx vitest run tests/unit/photos.test.ts`
Expected: FAIL, `photoRoles`, `rolePhoto`, `slotPhoto`, `photoAlt` and `initials` are not exported.

- [ ] **Step 3: Replace `src/config/photo-slots.ts`**

```ts
/** Photo slot names per content folder. Names only: drop <slot>.jpg into src/assets/photos/. */
export const photoSlots: Record<string, string[]> = {
  fernway: [
    'clinic-exterior',
    'reception',
    'treatment-room-physio',
    'treatment-room-dental',
    'consulting-room-psychology',
    'provider-priya-nair',
    'provider-tom-hargreave',
    'provider-elena-marsh',
    'provider-sam-whitlock',
    'provider-hannah-reyes',
    'provider-lucas-brandt',
  ],
  hollybank: [
    'vet-exterior',
    'vet-reception',
    'consult-room',
    'prep-and-theatre',
    'provider-amelia-thornton',
    'provider-callum-reid',
    'provider-hannah-pickles',
    'provider-jess-moorcroft',
  ],
};

export type PhotoRole = 'hero' | 'exterior' | 'firstVisit';

/** Which slot fills each fixed position on a page. A content folder with no entry shows no photo there. */
export const photoRoles: Record<string, Record<PhotoRole, string>> = {
  fernway: { hero: 'reception', exterior: 'clinic-exterior', firstVisit: 'treatment-room-physio' },
  hollybank: { hero: 'vet-reception', exterior: 'vet-exterior', firstVisit: 'consult-room' },
};

/** Alt text for room slots. Provider photos take their alt from the clinician's name and role. */
export const photoAlt: Record<string, string> = {
  'clinic-exterior': 'Front entrance of the clinic',
  reception: 'Reception desk and waiting area',
  'treatment-room-physio': 'Physiotherapy treatment room with a treatment table',
  'treatment-room-dental': 'Dental surgery with the chair set up',
  'consulting-room-psychology': 'Quiet consulting room with two chairs',
  'vet-exterior': 'Front entrance of the veterinary clinic',
  'vet-reception': 'Reception desk and waiting area',
  'consult-room': 'Veterinary consulting room with an exam table',
  'prep-and-theatre': 'Veterinary theatre with the operating table',
};

export interface SlotPhoto {
  slot: string;
  alt: string;
}

export function slotPhoto(slot: string | undefined): SlotPhoto | undefined {
  const alt = slot ? photoAlt[slot] : undefined;
  return slot && alt ? { slot, alt } : undefined;
}

export function rolePhoto(contentDir: string, role: PhotoRole): SlotPhoto | undefined {
  return slotPhoto(photoRoles[contentDir]?.[role]);
}
```

After Task 3 has chosen the real photos, come back and adjust any alt text that does not match what the photo shows (for example, if the physio room has no visible treatment table).

- [ ] **Step 4: Add `initials` to `src/modules/providers/registration.ts`**

Append:

```ts
/** "Dr Elena Marsh" → "EM"; a one-word name gives one letter; an empty name gives "". */
export function initials(name: string): string {
  const words = name.trim().replace(/^(dr|mr|mrs|ms|prof)\.?\s+/i, '').split(/\s+/).filter(Boolean);
  const picked = words.length > 1 ? [words[0]!, words[words.length - 1]!] : words;
  return picked.map((w) => [...w][0]!.toLocaleUpperCase()).join('');
}
```

`[...w][0]` takes a whole character, so an accented or non-Latin first letter is not cut in half.

- [ ] **Step 5: Run the unit tests**

Run: `npx vitest run tests/unit/photos.test.ts`
Expected: PASS, all cases.

- [ ] **Step 6: Add the initials tile to `src/core/ui/Photo.astro`**

Add to `Props` and the destructuring:

```ts
  /** Shown instead of the placeholder when the slot has no file (clinician portraits). */
  initials?: string;
```

```ts
const { slot, alt, ratio = '4 / 3', sizes = '(min-width: 1024px) 33vw, 100vw', priority = false, initials, class: className } = Astro.props;
```

Replace the fallback branch `) : ( <Placeholder ... /> )` with:

```astro
  ) : initials ? (
    <figure class:list={['photo', 'initials', className]} style={`aspect-ratio: ${ratio}`} role="img" aria-label={alt}>
      <span aria-hidden="true">{initials}</span>
    </figure>
  ) : (
    <Placeholder label={alt} ratio={ratio} class={className} />
  )
```

Add to the `<style>` block:

```css
  .initials { display: grid; place-items: center; container-type: inline-size; border: 1px solid var(--color-line); color: var(--color-ink); }
  .initials span { font-size: min(36cqw, 4rem); font-weight: 700; line-height: 1; }
```

- [ ] **Step 7: Pass initials from the three provider components**

`src/sections/TeamRow.astro`: change the import and the `Photo` line.

```ts
import { initials, registrationFor } from '@/modules/providers/registration';
```

```astro
        <Photo slot={p.photoSlot} alt={`${p.name}, ${p.role}`} initials={initials(p.name)} ratio="1 / 1" sizes="72px" class="pic" />
```

`src/modules/providers/ProviderList.astro`: add the import and change the `Photo` line.

```ts
import { initials } from './registration';
```

```astro
      <Photo slot={p.photoSlot} alt={`${p.name}, ${p.role}`} initials={initials(p.name)} ratio="1 / 1" sizes="96px" class="pic" />
```

`src/modules/providers/ProviderProfile.astro`: change the import and the `Photo` line.

```ts
import { firstName, initials, registrationFor } from './registration';
```

```astro
  <Photo slot={provider.photoSlot} alt={`${provider.name}, ${provider.role}`} initials={initials(provider.name)} ratio="4 / 5" sizes="(min-width: 768px) 320px, 100vw" class="pic" />
```

- [ ] **Step 8: Run the gates**

Run: `npm test && npm run check`
Expected: boundaries ok, all unit tests pass (including the contrast test), 0 type errors. If `tests/unit/config.test.ts` fails on the renamed Hollybank slots, read the failing assertion: it compares `photoSlots` with provider content, so only a typo in a `provider-*` name can break it.

- [ ] **Step 9: Commit**

```bash
git add src/config/photo-slots.ts src/modules/providers/registration.ts src/core/ui/Photo.astro src/sections/TeamRow.astro src/modules/providers/ProviderList.astro src/modules/providers/ProviderProfile.astro tests/unit/photos.test.ts
git commit -m "feat: photo roles and alt text, initials tile for clinicians without a portrait"
```

---

### Task 3: Stock photos, credits and the photo brief

This task needs judgement about images, so the controller does it rather than a subagent.

**Files:**
- Create: `src/assets/photos/clinic-exterior.jpg`, `reception.jpg`, `treatment-room-physio.jpg`, `treatment-room-dental.jpg`, `consulting-room-psychology.jpg`, `vet-exterior.jpg`, `vet-reception.jpg`, `consult-room.jpg`, `prep-and-theatre.jpg`
- Create: `docs/photo-credits.md`
- Modify: `tools/photo-brief.mjs`
- Regenerate: `docs/photo-brief.md`

**Interfaces:**
- Consumes: slot names from Task 2.
- Produces: a file for each of the nine room slots, so `getPhoto(slot)` returns an image for every slot in `photoAlt`.

- [ ] **Step 1: Find and download each photo**

For each slot, search Unsplash (`https://unsplash.com/s/photos/<terms>`) or Pexels with these terms, and pick a landscape photo:

| Slot | Search terms |
|---|---|
| `clinic-exterior` | clinic building entrance daylight |
| `reception` | empty clinic reception waiting area |
| `treatment-room-physio` | physiotherapy treatment room empty |
| `treatment-room-dental` | dental surgery empty chair |
| `consulting-room-psychology` | counselling room two chairs empty |
| `vet-exterior` | small clinic shopfront entrance daylight |
| `vet-reception` | veterinary reception waiting room empty |
| `consult-room` | veterinary consulting room empty exam table |
| `prep-and-theatre` | veterinary surgery theatre empty |

Each photo must meet all of these:

- No people, no faces, no hands, and no animals in distress.
- No readable brand names, logos, signage or screens showing records.
- Landscape, at least 1600 px wide at source.
- Published under the Unsplash Licence or the Pexels Licence (free for commercial use, no attribution required). Skip "Unsplash+" and any image marked as licensed or sponsored.
- The Fernway five look like one calm, modern clinic; the Hollybank four look like one vet practice. Similar light and colour temperature within a brand.

Download at 1600 px wide as JPEG. For Unsplash, from the photo's page take the image id and run:

```bash
curl -L "https://images.unsplash.com/photo-<id>?w=1600&q=80&fm=jpg&fit=max" -o src/assets/photos/<slot>.jpg
```

For Pexels:

```bash
curl -L "https://images.pexels.com/photos/<id>/pexels-photo-<id>.jpeg?auto=compress&cs=tinysrgb&w=1600" -o src/assets/photos/<slot>.jpg
```

- [ ] **Step 2: Look at every file**

Open each of the nine files with the Read tool and confirm it meets the list above and is a real JPEG, not an HTML error page. Replace any that fail. Each file should be between about 100 KB and 600 KB.

Run: `ls -la src/assets/photos/`
Expected: nine `.jpg` files.

- [ ] **Step 3: Write `docs/photo-credits.md`**

Use this exact structure, one row per file, with the real values from the pages you downloaded from:

```markdown
# Photo credits

The demo photos are licence-free stock of rooms and buildings. None shows a person. A clinic replaces them by saving its own photo over the file with the same slot name.

| Slot | Photographer | Source page | Licence |
|---|---|---|---|
| `clinic-exterior` | (name on the source page) | (full source page link) | Unsplash Licence |
```

Fill all nine rows. Every row has a real photographer name and a full `https://` link to the photo's page. The licence cell is "Unsplash Licence" or "Pexels Licence".

- [ ] **Step 4: Update `tools/photo-brief.mjs`**

In the `rooms` map inside `describe()`, add two entries:

```js
    'vet-exterior': ['Front of the building and the entrance, daylight, no people, door and any step or ramp visible.', 'veterinary clinic entrance daylight'],
    'vet-reception': ['Reception desk and waiting area, empty, tidy, natural light.', 'veterinary reception waiting room empty'],
```

In the `md` template, replace the line

```
Slot names are shared by every brand, so one file fills the slot on any site that lists it.
```

with

```
A slot name listed under two brands is one file, shown on both. Demo photo sources are in \`docs/photo-credits.md\`.
```

and replace the rule

```
- Provider slots are the only ones pages render today. Room slots are listed so a shoot can cover them.
```

with

```
- Pages show the room slots named in \`photoRoles\` (home, contact) and each service's \`photoSlot\`. A clinician slot with no file shows an initials tile.
```

- [ ] **Step 5: Regenerate the brief**

Run: `npm run photos:status`
Expected: `9 of 19 slots filled`, no "no description for slot" warning, and the missing list contains only `provider-*` slots.

- [ ] **Step 6: Run the unit tests**

Run: `npm test`
Expected: all pass, including `docs-copy` for the new `docs/photo-credits.md`.

- [ ] **Step 7: Commit**

```bash
git add src/assets/photos docs/photo-credits.md docs/photo-brief.md tools/photo-brief.mjs
git commit -m "feat: stock room photos for both demo brands, with credits"
```

If a photo in step 2 changed what an alt text in `src/config/photo-slots.ts` should say, fix the alt in the same commit.

---

### Task 4: Photos on the home, contact and service pages

**Files:**
- Modify: `src/sections/Hero.astro`, `src/sections/FirstVisit.astro`, `src/sections/Location.astro`
- Modify: `src/pages/index.astro`, `src/pages/contact.astro`, `src/pages/services/[slug].astro`
- Modify: `src/content.config.ts`
- Modify: the nine files in `src/content/fernway/services/` and `src/content/hollybank/services/`
- Test: `tests/e2e/photos.e2e.mjs` (new)

**Interfaces:**
- Consumes: `rolePhoto(contentDir, role)`, `slotPhoto(slot)`, `SlotPhoto` from `@/config/photo-slots` (Task 2); photo files (Task 3); `Photo` props `slot`, `alt`, `ratio`, `sizes`, `priority`.
- Produces: `Hero`, `FirstVisit` and `Location` each accept an optional prop `photo?: { slot: string; alt: string }`. The hero's text is wrapped in `<div class="copy">`; Task 6 animates `.copy > *` and the hero image.

- [ ] **Step 1: Write the failing e2e test**

Create `tests/e2e/photos.e2e.mjs`:

```js
import { BASE, SITE_ID, closeBrowser, expect, finish, step, withPage } from './harness.mjs';

const SERVICE = { 'fernway-au': 'physiotherapy', 'fernway-ca': 'physiotherapy', hollybank: 'vaccinations' }[SITE_ID];
const PAGES = ['/', `/services/${SERVICE}/`, '/contact/', '/team/'];

/** Every <img> in main has loaded pixels and alt text. */
async function imagesOk(page, path) {
  const imgs = await page.locator('main img').evaluateAll((els) => els.map((e) => ({ alt: e.alt, ok: e.complete && e.naturalWidth > 0, src: e.currentSrc })));
  for (const i of imgs) {
    expect(i.alt.trim().length > 0, `${path}: image without alt: ${i.src}`);
    expect(i.ok, `${path}: image did not load: ${i.src}`);
  }
  return imgs.length;
}

await step('home hero shows a photo that loads first', async () => {
  await withPage({}, async (page) => {
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
    const img = page.locator('.hero img');
    expect((await img.count()) === 1, 'hero should hold one image');
    expect((await img.getAttribute('loading')) === 'eager', 'hero image should not be lazy');
    expect((await img.getAttribute('alt')).trim().length > 0, 'hero image needs alt text');
    expect(await img.evaluate((e) => e.complete && e.naturalWidth > 0), 'hero image did not load');
  });
});

await step('home, service, contact and team pages show photos and no placeholder', async () => {
  await withPage({}, async (page) => {
    for (const path of PAGES) {
      await page.goto(`${BASE}${path}`);
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += innerHeight) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
      });
      await page.waitForLoadState('networkidle');
      expect((await page.locator('.ph').count()) === 0, `${path} shows a placeholder`);
      const count = await imagesOk(page, path);
      if (path !== '/team/') expect(count >= 1, `${path} has no photo`);
    }
  });
});

await step('home shows the first-visit and exterior photos', async () => {
  await withPage({}, async (page) => {
    await page.goto(`${BASE}/`);
    expect((await page.locator('#first-visit img').count()) === 1, 'first-visit photo missing');
    expect((await page.locator('#location img').count()) === 1, 'location photo missing');
  });
});

await step('clinicians without a portrait show an initials tile with their name as its label', async () => {
  await withPage({}, async (page) => {
    await page.goto(`${BASE}/team/`);
    const tiles = page.locator('.initials');
    expect((await tiles.count()) >= 1, 'no initials tile on /team/');
    const first = tiles.first();
    const label = await first.getAttribute('aria-label');
    const text = (await first.innerText()).trim();
    expect(/^\p{Lu}{1,2}$/u.test(text), `tile text: ${text}`);
    expect(label && label.includes(','), `tile label: ${label}`);
  });
});

await step('hero photo sits beside the text at 1280 and below it at 375', async () => {
  const box = async (page, sel) => page.locator(sel).first().boundingBox();
  await withPage({}, async (page) => {
    await page.goto(`${BASE}/`);
    const [h1, img] = [await box(page, '.hero h1'), await box(page, '.hero img')];
    expect(img.x > h1.x + 200, 'at 1280 the photo should be to the right of the heading');
  });
  await withPage({ viewport: { width: 375, height: 800 } }, async (page) => {
    await page.goto(`${BASE}/`);
    const [h1, img] = [await box(page, '.hero h1'), await box(page, '.hero img')];
    expect(img.y > h1.y + h1.height, 'at 375 the photo should be below the heading');
    expect((await page.evaluate(() => document.documentElement.scrollWidth)) <= 375, 'page scrolls sideways at 375');
  });
});

await closeBrowser();
finish();
```

- [ ] **Step 2: Run it to see it fail**

Run: `E2E_SITES=fernway-au npm run e2e`
(PowerShell: `$env:E2E_SITES='fernway-au'; npm run e2e; Remove-Item Env:E2E_SITES`)
Expected: `photos.e2e.mjs` fails on "hero should hold one image". The initials step passes (Task 2). Other suites pass.

- [ ] **Step 3: Hero**

In `src/sections/Hero.astro` add the import and prop:

```ts
import Photo from '@/core/ui/Photo.astro';
```

```ts
  photo?: { slot: string; alt: string };
```

```ts
const { name, treats, preset, variants, bookingOn, emergencyOn, photo } = Astro.props;
```

Replace the `<section>` markup with:

```astro
<section class:list={['hero', photo && 'has-photo']} aria-labelledby="hero-title">
  <div class="copy">
    <h1 id="hero-title">{name}</h1>
    <p class="line">{preset.copy.heroLine}. {treats}</p>
    {variants.map((v) => (
      <div class="actions" data-market-only={v.id}>
        {bookingOn && <Button href="/book/" size="lg">{preset.copy.bookLabel}</Button>}
        <a class="phone" href={v.tel}>Call {v.clinic.phone}</a>
        {emergencyOn && <EmergencyNote clinic={v.clinic} preset={preset} compact />}
      </div>
    ))}
  </div>
  {photo && <Photo slot={photo.slot} alt={photo.alt} ratio="4 / 3" sizes="(min-width: 1024px) 560px, 100vw" priority />}
</section>
```

In the `<style>` block, change the `.hero` rule's gap and add two rules:

```css
  .hero { max-width: 72rem; margin: 0 auto; padding: var(--space-8) var(--space-4) var(--space-6); display: grid; gap: var(--space-6); }
  .copy { display: grid; gap: var(--space-4); }
  @media (min-width: 1024px) { .has-photo { grid-template-columns: 1fr 1fr; align-items: center; column-gap: var(--space-7); } }
```

- [ ] **Step 4: First visit**

In `src/sections/FirstVisit.astro` add:

```ts
import Photo from '@/core/ui/Photo.astro';
```

```ts
  photo?: { slot: string; alt: string };
```

```ts
const { bookingOn, confirmPromise, items, photo } = Astro.props;
```

Replace the `<ol>...</ol>` with:

```astro
  <div class:list={['cols', photo && 'has-photo']}>
    <ol>
      {steps.map((s) => <li><strong>{s.title}.</strong> {s.text}</li>)}
    </ol>
    {photo && <Photo slot={photo.slot} alt={photo.alt} ratio="4 / 3" sizes="(min-width: 1024px) 480px, 100vw" />}
  </div>
```

Add to `<style>`:

```css
  .cols { display: grid; gap: var(--space-5); }
  @media (min-width: 1024px) { .has-photo { grid-template-columns: 1fr 1fr; align-items: center; column-gap: var(--space-7); } }
```

- [ ] **Step 5: Location**

In `src/sections/Location.astro` add:

```ts
import Photo from '@/core/ui/Photo.astro';
```

```ts
  photo?: { slot: string; alt: string };
```

```ts
const { variants, photo } = Astro.props;
```

Wrap the variants and add the photo:

```astro
<section id="location" aria-labelledby="location-title">
  <h2 id="location-title">Find us</h2>
  <div class:list={['cols', photo && 'has-photo']}>
    <div>
      {variants.map(({ id, clinic: c, tel, hours }) => (
        <div class="where" data-market-only={id}>
          <address>{c.address.street}, {c.address.locality} {c.address.region} {c.address.postcode}</address>
          <a class="link" href={`https://www.openstreetmap.org/?mlat=${c.map.lat}&mlon=${c.map.lng}#map=17/${c.map.lat}/${c.map.lng}`}>Open the map and directions</a>
          <ul>{hours.map((h) => <li>{h}</li>)}</ul>
          <p><a class="link" href={tel}>{c.phone}</a></p>
          <p>{c.accessibility && `${c.accessibility} `}<a class="link" href="/accessibility/">Accessibility details</a></p>
        </div>
      ))}
    </div>
    {photo && <Photo slot={photo.slot} alt={photo.alt} ratio="4 / 3" sizes="(min-width: 768px) 480px, 100vw" />}
  </div>
</section>
```

Add to `<style>`:

```css
  .cols { display: grid; gap: var(--space-5); }
  @media (min-width: 768px) { .has-photo { grid-template-columns: 1fr 1fr; align-items: start; column-gap: var(--space-7); } }
```

- [ ] **Step 6: Home page passes the photos**

In `src/pages/index.astro` add the import:

```ts
import { rolePhoto } from '@/config/photo-slots';
```

Add after the `treats` line:

```ts
const photo = (role: Parameters<typeof rolePhoto>[1]) => rolePhoto(site.contentDir, role);
```

Change three component lines:

```astro
  <Hero name={clinic.name} treats={treats} preset={preset} variants={variants} bookingOn={on('booking')} emergencyOn={on('emergency')} photo={photo('hero')} />
```

```astro
    <FirstVisit bookingOn={on('booking')} confirmPromise={booking.confirmPromise} items={preset.copy.firstVisit} photo={photo('firstVisit')} />
```

```astro
    <Location variants={variants} photo={photo('exterior')} />
```

- [ ] **Step 7: Contact page**

In `src/pages/contact.astro` add:

```ts
import { rolePhoto } from '@/config/photo-slots';
import Photo from '@/core/ui/Photo.astro';
```

```ts
const photo = rolePhoto(site.contentDir, 'exterior');
```

Change the wrapper and add the photo after the variants map:

```astro
  <div slot="before" class:list={['details', photo && 'has-photo']}>
    <div>
      {variants.map((v) => (
        ... unchanged detail block ...
      ))}
    </div>
    {photo && <Photo slot={photo.slot} alt={photo.alt} ratio="4 / 3" sizes="(min-width: 768px) 480px, 100vw" />}
  </div>
```

Keep the existing `.detail` block exactly as it is inside the new inner `<div>`. Replace the `.details` style rule with:

```css
  .details { display: grid; gap: var(--space-5); max-width: var(--measure); }
  @media (min-width: 768px) { .details.has-photo { max-width: none; grid-template-columns: minmax(0, var(--measure)) 1fr; align-items: start; column-gap: var(--space-7); } }
```

- [ ] **Step 8: Service schema and content**

In `src/content.config.ts`, in the `services` schema, add after `fromPrice`:

```ts
    photoSlot: z.string().optional(),
```

Add one line to the frontmatter of each service file, directly under the `order:` line:

| File | Line to add |
|---|---|
| `src/content/fernway/services/physiotherapy.md` | `photoSlot: treatment-room-physio` |
| `src/content/fernway/services/sports-physio.md` | `photoSlot: treatment-room-physio` |
| `src/content/fernway/services/dental-check-up.md` | `photoSlot: treatment-room-dental` |
| `src/content/fernway/services/dental-hygiene.md` | `photoSlot: treatment-room-dental` |
| `src/content/fernway/services/psychology.md` | `photoSlot: consulting-room-psychology` |
| `src/content/hollybank/services/consultations.md` | `photoSlot: consult-room` |
| `src/content/hollybank/services/vaccinations.md` | `photoSlot: consult-room` |
| `src/content/hollybank/services/dental.md` | `photoSlot: prep-and-theatre` |
| `src/content/hollybank/services/neutering.md` | `photoSlot: prep-and-theatre` |

Do not touch the fixture content folders.

- [ ] **Step 9: Service page**

In `src/pages/services/[slug].astro` add:

```ts
import { slotPhoto } from '@/config/photo-slots';
import Photo from '@/core/ui/Photo.astro';
```

```ts
const photo = slotPhoto(service.photoSlot);
```

Add between `<PageHeader ... />` and `<ServiceBody`:

```astro
  {photo && (
    <div class="shot">
      <Photo slot={photo.slot} alt={photo.alt} ratio="16 / 9" sizes="(min-width: 1152px) 1120px, 100vw" priority />
    </div>
  )}
```

Add at the end of the file:

```astro
<style>
  .shot { max-width: 72rem; margin: 0 auto; padding: 0 var(--space-4) var(--space-6); }
</style>
```

- [ ] **Step 10: Run the gates**

Run: `npm test && npm run check && npm run e2e`
Expected: all pass on the three demo sites and the three fixtures. `photos.e2e.mjs` passes every step. `home.e2e.mjs` still reports four first-visit steps and one `<ol>`. The axe checks in `quality.e2e.mjs` report no violations.

- [ ] **Step 11: Look at it**

Read `tools/shot.mjs` to see its arguments, then take screenshots of `/`, one service page and `/contact/` at 375 and 1280 for `fernway-au` and `hollybank`. Open each with the Read tool. Check: no stretched or badly cropped photo, no text overlapping a photo, no sideways scroll at 375, the same vertical rhythm as before. Fix what is wrong before committing.

- [ ] **Step 12: Commit**

```bash
git add src/sections/Hero.astro src/sections/FirstVisit.astro src/sections/Location.astro src/pages/index.astro src/pages/contact.astro "src/pages/services/[slug].astro" src/content.config.ts src/content/fernway/services src/content/hollybank/services tests/e2e/photos.e2e.mjs
git commit -m "feat: room photos on the home, contact and service pages"
```

---

### Task 5: Motion setting and scroll reveals

**Files:**
- Modify: `package.json`, `package-lock.json` (via `npm install motion`)
- Modify: `src/domain/presets.ts`, `src/config/sites/fixture-minimal/site.ts`
- Create: `src/core/motion.ts`, `src/layouts/Motion.astro`
- Modify: `src/layouts/BaseLayout.astro`, `src/styles/global.css`
- Modify (attributes only): `src/sections/ServicesBand.astro`, `TeamRow.astro`, `FirstVisit.astro`, `FeesTeaser.astro`, `ReviewsBand.astro`, `Location.astro`, `Faq.astro`, `CtaBand.astro`, `src/modules/services/ServiceList.astro`, `src/modules/providers/ProviderList.astro`
- Test: `tests/unit/presets.test.ts`, `tests/e2e/motion.e2e.mjs` (new), `tests/e2e/modules.e2e.mjs`

**Interfaces:**
- Consumes: nothing from Tasks 2 to 4 except the `<div>` wrapper around the first-visit photo added here.
- Produces:
  - `SiteConfigInput['site'].motion?: boolean` and `Site.motion: boolean` (default `true`).
  - `<html data-motion="off">` when `site.motion` is false; the attribute is absent otherwise. Task 6 scopes its CSS with `html:not([data-motion='off'])`.
  - Markup contract: `data-reveal` on one element; `data-reveal-group` on a container whose direct children stagger. Never nest one inside the other.

- [ ] **Step 1: Check the Motion API**

Invoke the `motion` skill and use its documentation search for `inView` and for `animate` from `motion/mini`. Confirm these three facts, which the code below relies on: `inView(element, callback, { margin })` stops observing after the first entry when the callback returns nothing; `animate` from `motion/mini` accepts keyframe arrays for `opacity` and `transform` and the options `duration`, `delay`, `ease` (cubic-bezier array); its return value is thenable. If a call signature differs, keep the behaviour described in this task and adjust only the call.

- [ ] **Step 2: Install**

Run: `npm install motion`
Expected: `motion` appears under `dependencies` in `package.json`.

- [ ] **Step 3: Write the failing unit test**

Add this import at the top of `tests/unit/presets.test.ts`:

```ts
import { fixtures, registry } from '@/config/registry';
```

Append to the same file. It uses the `presets` constant and the `resolveSite` import the file already has:

```ts
describe('motion setting', () => {
  it('is on when a site does not set it', () => {
    for (const input of Object.values(registry)) expect(resolveSite(input, presets).motion).toBe(true);
  });

  it('is off for the module-off fixture', () => {
    expect(resolveSite(fixtures['fixture-minimal']!, presets).motion).toBe(false);
  });
});
```

Run: `npx vitest run tests/unit/presets.test.ts`
Expected: FAIL, `motion` is `undefined`.

- [ ] **Step 4: Add the setting**

In `src/domain/presets.ts`:

In `SiteConfigInput['site']`, after `nav?: NavItem[];`:

```ts
    /** Scroll reveals, hero entrance, page cross-fade and hover zoom. On unless set to false. */
    motion?: boolean;
```

In `interface Site`, after `contentDir: string;`:

```ts
  motion: boolean;
```

In the object returned by `resolveSite`, after `contentDir: site.contentDir,`:

```ts
    motion: site.motion ?? true,
```

In `src/config/sites/fixture-minimal/site.ts`, add after `contentDir: 'fixture-minimal',`:

```ts
  motion: false,
```

Run: `npx vitest run tests/unit/presets.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the failing e2e test**

Create `tests/e2e/motion.e2e.mjs`:

```js
import { BASE, closeBrowser, expect, finish, step, withPage } from './harness.mjs';

const ITEMS = '[data-reveal], [data-reveal-group] > *';

/** Opacity and transform of every reveal element that is rendered. */
const states = (page) =>
  page.locator(ITEMS).evaluateAll((els) =>
    els.filter((e) => e.getClientRects().length).map((e) => {
      const s = getComputedStyle(e);
      return { tag: e.tagName, id: e.closest('section')?.id ?? '', opacity: s.opacity, transform: s.transform };
    }),
  );

const scrollToBottom = (page) =>
  page.evaluate(async () => {
    for (let y = 0; y <= document.body.scrollHeight; y += innerHeight * 0.8) {
      scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    scrollTo(0, document.body.scrollHeight);
  });

const allVisible = (list, where) => {
  expect(list.length > 5, `${where}: expected reveal elements, found ${list.length}`);
  for (const s of list) {
    expect(s.opacity === '1', `${where}: ${s.tag} in #${s.id} has opacity ${s.opacity}`);
    expect(s.transform === 'none', `${where}: ${s.tag} in #${s.id} has transform ${s.transform}`);
  }
};

for (const width of [1280, 375]) {
  await step(`home at ${width}: sections below the fold start hidden and all end visible`, async () => {
    await withPage({ viewport: { width, height: 800 } }, async (page) => {
      await page.goto(`${BASE}/`);
      await page.waitForFunction((sel) => [...document.querySelectorAll(sel)].some((e) => getComputedStyle(e).opacity === '0'), ITEMS);
      await scrollToBottom(page);
      await page.waitForTimeout(900);
      allVisible(await states(page), `home ${width}`);
    });
  });
}

await step('nothing on screen at load is hidden', async () => {
  await withPage({}, async (page) => {
    await page.goto(`${BASE}/`);
    await page.waitForTimeout(300);
    const hidden = await page.locator(ITEMS).evaluateAll((els) =>
      els.filter((e) => { const r = e.getBoundingClientRect(); return r.height > 0 && r.top < innerHeight && r.bottom > 0 && getComputedStyle(e).opacity === '0'; }).length,
    );
    expect(hidden === 0, `${hidden} on-screen elements are hidden at load`);
  });
});

await step('an anchor link to a lower section shows that section', async () => {
  await withPage({ viewport: { width: 375, height: 800 } }, async (page) => {
    await page.goto(`${BASE}/#faq`);
    await page.waitForTimeout(900);
    const opacities = await page.locator('#faq dl > *').evaluateAll((els) => els.map((e) => getComputedStyle(e).opacity));
    expect(opacities.length >= 5 && opacities.every((o) => o === '1'), `faq opacities: ${opacities}`);
  });
});

await step('reduced motion: nothing is ever hidden or moved', async () => {
  await withPage({ reducedMotion: 'reduce' }, async (page) => {
    await page.goto(`${BASE}/`);
    await page.waitForTimeout(300);
    allVisible(await states(page), 'reduced motion at load');
    await scrollToBottom(page);
    allVisible(await states(page), 'reduced motion after scroll');
  });
});

await step('JavaScript off: every section is visible', async () => {
  await withPage({ javaScriptEnabled: false }, async (page) => {
    await page.goto(`${BASE}/`);
    await page.waitForTimeout(900);
    allVisible(await states(page), 'no JavaScript');
    expect(await page.locator('.hero h1').evaluate((e) => getComputedStyle(e).opacity === '1'), 'hero heading hidden without JavaScript');
  });
});

await step('print: sections not yet scrolled to still print', async () => {
  await withPage({}, async (page) => {
    await page.goto(`${BASE}/`);
    await page.waitForFunction((sel) => [...document.querySelectorAll(sel)].some((e) => getComputedStyle(e).opacity === '0'), ITEMS);
    await page.emulateMedia({ media: 'print' });
    allVisible(await states(page), 'print');
  });
});

await step('the console has no reveal markup', async () => {
  await withPage({}, async (page) => {
    await page.goto(`${BASE}/console/`);
    expect((await page.locator('[data-reveal], [data-reveal-group]').count()) === 0, 'console has reveal attributes');
  });
});

await closeBrowser();
finish();
```

Append to `tests/e2e/modules.e2e.mjs`, before the final `await closeBrowser();`:

```js
await step('motion off: no page carries reveal code or hides anything', async () => {
  const dist = join('dist', SITE_ID);
  expect(html('index.html').includes('data-motion="off"'), 'html should carry data-motion="off"');
  for (const page of ['index.html', 'book/index.html', 'services/index.html']) {
    expect(!loadedJs(dist, page).includes('data-reveal-group'), `${page} loads the reveal script`);
  }
  const control = join('dist', 'fernway-au');
  if (existsSync(join(control, 'index.html'))) {
    expect(loadedJs(control, 'index.html').includes('data-reveal-group'), 'control: a demo site should load the reveal script');
  }
  await withPage({}, async (page) => {
    await page.goto(`${BASE}/`);
    await page.waitForTimeout(300);
    const hidden = await page.locator('main *').evaluateAll((els) => els.filter((e) => e.getClientRects().length && getComputedStyle(e).opacity === '0').length);
    expect(hidden === 0, `${hidden} hidden elements on a motion-off site`);
  });
});
```

Run: `E2E_SITES=fernway-au,fixture-minimal npm run e2e`
Expected: `motion.e2e.mjs` fails (nothing starts hidden) and the new `modules.e2e.mjs` step fails on `data-motion="off"`.

- [ ] **Step 6: Write `src/core/motion.ts`**

```ts
/**
 * Scroll reveals. [data-reveal] fades and rises once; [data-reveal-group] staggers its children.
 * Only elements below the fold when this runs are hidden first, so a page whose script never
 * loads shows everything. Reduced motion: does nothing.
 */
import { inView } from 'motion';
import { animate } from 'motion/mini';

const EASE = [0.22, 1, 0.36, 1] as const;
const STAGGER = 0.04;
const LAST_STAGGERED = 7; // the first eight children stagger; the rest arrive with the eighth
// Trigger once any part crosses a line 10% above the viewport bottom. A share-of-element threshold
// would never fire for a section several viewports tall.
const VIEW = { margin: '0px 0px -10% 0px' } as const;

const belowFold = (el: Element) => el.getBoundingClientRect().top >= innerHeight;

function hide(el: HTMLElement): void {
  el.style.opacity = '0';
}

function reveal(el: HTMLElement, index = 0): void {
  animate(
    el,
    { opacity: [0, 1], transform: ['translateY(12px)', 'none'] },
    { duration: 0.4, delay: Math.min(index, LAST_STAGGERED) * STAGGER, ease: EASE },
  ).then(() => {
    el.style.opacity = '';
    el.style.transform = '';
  });
}

if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  for (const el of document.querySelectorAll<HTMLElement>('[data-reveal]')) {
    if (!belowFold(el)) continue;
    hide(el);
    inView(el, () => { reveal(el); }, VIEW);
  }
  for (const group of document.querySelectorAll<HTMLElement>('[data-reveal-group]')) {
    if (!belowFold(group)) continue;
    const children = [...group.children] as HTMLElement[];
    children.forEach(hide);
    inView(group, () => { children.forEach(reveal); }, VIEW);
  }
}
```

The callbacks use block bodies on purpose: a callback that returns a value would be treated as a leave handler and keep observing.

- [ ] **Step 7: Create `src/layouts/Motion.astro`**

```astro
---
/** Loads the scroll reveal script. BaseLayout renders this only when site.motion is on. */
---

<script>
  import '@/core/motion';
</script>
```

- [ ] **Step 8: Wire it into `src/layouts/BaseLayout.astro`**

Add the import:

```ts
import Motion from './Motion.astro';
```

Change the `<html>` tag:

```astro
<html lang={site.market.locale} data-theme={site.theme} data-market={site.market.id} data-motion={site.motion ? undefined : 'off'}>
```

Add as the last line inside `<body>`, after the `MobileBar` line:

```astro
    {site.motion && !bare && <Motion />}
```

- [ ] **Step 9: Print rule in `src/styles/global.css`**

Add after the `[hidden]` rule:

```css
/* Sections waiting for a scroll reveal must still print. */
@media print {
  [data-reveal], [data-reveal-group] > * { opacity: 1 !important; transform: none !important; }
}
```

- [ ] **Step 10: Add the attributes**

Add `data-reveal-group` to the list element, or `data-reveal` to the root `<section>`, exactly as below. Change nothing else in these files.

| File | Element | Attribute |
|---|---|---|
| `src/sections/ServicesBand.astro` | `<ul class="rows">` | `data-reveal-group` |
| `src/sections/TeamRow.astro` | `<ul class="rows">` | `data-reveal-group` |
| `src/sections/FirstVisit.astro` | `<ol>` | `data-reveal-group` |
| `src/sections/FirstVisit.astro` | wrap the `Photo` in `<div data-reveal>` | `data-reveal` |
| `src/sections/FeesTeaser.astro` | both `<section id="fees">` and `<section id="prices">` (only one renders) | `data-reveal` |
| `src/sections/ReviewsBand.astro` | root `<section>` | `data-reveal` |
| `src/sections/Location.astro` | root `<section id="location">` | `data-reveal` |
| `src/sections/Faq.astro` | `<dl>` | `data-reveal-group` |
| `src/sections/CtaBand.astro` | root `<section>` | `data-reveal` |
| `src/modules/services/ServiceList.astro` | `<ul class="rows">` | `data-reveal-group` |
| `src/modules/providers/ProviderList.astro` | `<ul class="rows">` | `data-reveal-group` |

For the first-visit photo the line becomes:

```astro
    {photo && <div data-reveal><Photo slot={photo.slot} alt={photo.alt} ratio="4 / 3" sizes="(min-width: 1024px) 480px, 100vw" /></div>}
```

`ReviewsBand` renders its `<section id="reviews">` conditionally; the attribute goes on that section.

- [ ] **Step 11: Run the gates**

Run: `npm test && npm run check && npm run e2e`
Expected: all pass. `motion.e2e.mjs` passes every step on the three demo sites; the new `modules.e2e.mjs` step passes on `fixture-minimal`.

- [ ] **Step 12: Check the budget**

Run: `npm run budget`
Expected: exit 0. Each site's worst page should be about 3 to 6 KB above the Task 1 baseline. If any page exceeds 30,720 bytes, replace the two `motion` imports with `import { animate, inView } from 'motion'` or the reverse, rebuild, and keep whichever is smaller; if it still exceeds, stop and report the numbers.

- [ ] **Step 13: Commit**

```bash
git add package.json package-lock.json src/domain/presets.ts src/config/sites/fixture-minimal/site.ts src/core/motion.ts src/layouts/Motion.astro src/layouts/BaseLayout.astro src/styles/global.css src/sections src/modules/services/ServiceList.astro src/modules/providers/ProviderList.astro tests/unit/presets.test.ts tests/e2e/motion.e2e.mjs tests/e2e/modules.e2e.mjs
git commit -m "feat: scroll reveals with Motion, per-site motion setting"
```

---

### Task 6: Hero entrance, page cross-fade, booking step slide, hover

All CSS, plus one attribute set in `booking.ts`. The existing rule in `global.css` under `prefers-reduced-motion: reduce` already sets `animation: none` and `transform: none` on everything, so reduced motion needs only the cross-fade guard added here.

**Files:**
- Modify: `src/sections/Hero.astro`, `src/core/ui/Photo.astro`, `src/sections/TeamRow.astro`, `src/modules/providers/ProviderList.astro`
- Modify: `src/styles/global.css`, `src/layouts/Header.astro`
- Modify: `src/modules/booking/booking.ts`, `src/modules/booking/BookingForm.astro`
- Test: `tests/e2e/motion.e2e.mjs`

**Interfaces:**
- Consumes: `.hero .copy` wrapper and hero photo (Task 4); `html[data-motion='off']` (Task 5); `STEP_IDS` already imported in `booking.ts`.
- Produces: `form[data-dir="forward" | "back"]` on the booking form after a step change the visitor made; no attribute after a load or a history move.

- [ ] **Step 1: Write the failing e2e steps**

Append to `tests/e2e/motion.e2e.mjs`, before `await closeBrowser();`:

```js
await step('hero text and photo animate in, and end fully visible', async () => {
  await withPage({}, async (page) => {
    await page.goto(`${BASE}/`);
    const names = await page.locator('.hero .copy > *, .hero img').evaluateAll((els) => els.filter((e) => e.getClientRects().length).map((e) => getComputedStyle(e).animationName));
    expect(names.length >= 4 && names.every((n) => n !== 'none'), `hero animation names: ${names}`);
    await page.waitForTimeout(1000);
    const ends = await page.locator('.hero .copy > *, .hero img').evaluateAll((els) => els.filter((e) => e.getClientRects().length).map((e) => getComputedStyle(e).opacity));
    expect(ends.every((o) => o === '1'), `hero end opacities: ${ends}`);
  });
});

await step('reduced motion: the hero does not animate', async () => {
  await withPage({ reducedMotion: 'reduce' }, async (page) => {
    await page.goto(`${BASE}/`);
    const names = await page.locator('.hero .copy > *, .hero img').evaluateAll((els) => els.map((e) => getComputedStyle(e).animationName));
    expect(names.every((n) => n === 'none'), `hero animation names: ${names}`);
  });
});

await step('booking: moving on slides the next step in from the right, going back from the left', async () => {
  await withPage({}, async (page) => {
    await page.goto(`${BASE}/book/`);
    const form = page.locator('#booking-root form');
    expect((await form.getAttribute('data-dir')) === null, 'no direction on first load');
    await page.locator('input[name="service"]').first().check();
    await page.locator('[data-step]:not([hidden]) [data-next]').first().click();
    expect((await form.getAttribute('data-dir')) === 'forward', 'direction after Next');
    const name = await page.locator('[data-step]:not([hidden])').evaluate((e) => getComputedStyle(e).animationName);
    expect(name === 'step-in', `step animation: ${name}`);
    await page.locator('[data-step]:not([hidden]) [data-back]').first().click();
    expect((await form.getAttribute('data-dir')) === 'back', 'direction after Back');
    await page.waitForTimeout(400);
    const end = await page.locator('[data-step]:not([hidden])').evaluate((e) => getComputedStyle(e).opacity);
    expect(end === '1', `step end opacity: ${end}`);
  });
});

await step('booking under reduced motion: steps change with no animation', async () => {
  await withPage({ reducedMotion: 'reduce' }, async (page) => {
    await page.goto(`${BASE}/book/`);
    await page.locator('input[name="service"]').first().check();
    await page.locator('[data-step]:not([hidden]) [data-next]').first().click();
    const s = await page.locator('[data-step]:not([hidden])').evaluate((e) => ({ a: getComputedStyle(e).animationName, t: getComputedStyle(e).transform }));
    expect(s.a === 'none' && s.t === 'none', `step under reduced motion: ${JSON.stringify(s)}`);
  });
});

await step('page changes cross-fade where the browser supports it, and never under reduced motion', async () => {
  const rule = () => [...document.styleSheets].flatMap((s) => { try { return [...s.cssRules]; } catch { return []; } })
    .some((r) => r.cssText.includes('@view-transition') && matchMedia(r.conditionText ?? 'all').matches);
  await withPage({}, async (page) => {
    await page.goto(`${BASE}/`);
    expect(await page.evaluate(rule), 'view transition rule should apply');
  });
  await withPage({ reducedMotion: 'reduce' }, async (page) => {
    await page.goto(`${BASE}/`);
    expect(!(await page.evaluate(rule)), 'view transition rule should not apply under reduced motion');
  });
});
```

Run: `E2E_SITES=fernway-au npm run e2e`
Expected: the five new steps fail; everything else passes.

- [ ] **Step 2: Hero entrance**

Add to the `<style>` block of `src/sections/Hero.astro`:

```css
  @keyframes hero-rise { from { opacity: 0; transform: translateY(12px); } }
  @keyframes hero-settle { from { opacity: 0; transform: scale(1.04); } }
  :global(html:not([data-motion='off'])) .copy > * { animation: hero-rise 400ms cubic-bezier(0.22, 1, 0.36, 1) both; }
  :global(html:not([data-motion='off'])) .copy > :nth-child(2) { animation-delay: 60ms; }
  :global(html:not([data-motion='off'])) .copy > :nth-child(n + 3) { animation-delay: 120ms; }
  :global(html:not([data-motion='off'])) .hero :global(.photo img) { animation: hero-settle 600ms cubic-bezier(0.22, 1, 0.36, 1) both; }
```

The keyframes have no `to` block, so each element ends at its normal style. This is CSS only, so the hero shows whether or not any script runs.

- [ ] **Step 3: Page cross-fade**

Add to `src/styles/global.css`, before the `prefers-reduced-motion` block:

```css
/* Page to page: a short cross-fade in browsers with cross-document view transitions. Others navigate as usual. */
@media (prefers-reduced-motion: no-preference) {
  @view-transition { navigation: auto; }
}
::view-transition-old(root), ::view-transition-new(root) { animation-duration: 200ms; }
html[data-motion='off']::view-transition-group(*),
html[data-motion='off']::view-transition-old(*),
html[data-motion='off']::view-transition-new(*) { animation: none; }
```

In `src/layouts/Header.astro`, find the style rule for the root `<header>` element and add this declaration to it:

```css
  view-transition-name: site-header;
```

- [ ] **Step 4: Booking step direction**

In `src/modules/booking/booking.ts`, inside `show()`, add these lines as the first statements, before `state = { ...state, step: id };`:

```ts
    // The visitor moved (push): the CSS in BookingForm slides the step in from that side. Loads and history moves do not animate.
    if (push) form.dataset.dir = STEP_IDS.indexOf(id) >= STEP_IDS.indexOf(state.step) ? 'forward' : 'back';
    else delete form.dataset.dir;
```

Add to `src/modules/booking/BookingForm.astro`, as a new block at the end of the file:

```astro
<style is:global>
  @keyframes step-in { from { opacity: 0; transform: translateX(var(--step-from, 0)); } }
  html:not([data-motion='off']) #booking-root form[data-dir] .step:not([hidden]) { animation: step-in 250ms cubic-bezier(0.22, 1, 0.36, 1); }
  #booking-root form[data-dir='forward'] { --step-from: 16px; }
  #booking-root form[data-dir='back'] { --step-from: -16px; }
</style>
```

Check that every file in `src/modules/booking/steps/` has `class="step"` on its root `<section data-step=...>`. If one does not, use the selector `[data-step]:not([hidden])` in place of `.step:not([hidden])`.

- [ ] **Step 5: Hover zoom**

Add to the `<style>` block of `src/core/ui/Photo.astro`:

```css
  .photo :global(img) { transition: transform 300ms cubic-bezier(0.22, 1, 0.36, 1); }
```

Add to the `<style>` block of `src/sections/TeamRow.astro`:

```css
  @media (hover: hover) { :global(html:not([data-motion='off'])) li:hover :global(.photo img) { transform: scale(1.03); } }
```

Add to the `<style>` block of `src/modules/providers/ProviderList.astro`:

```css
  @media (hover: hover) { :global(html:not([data-motion='off'])) .row:hover :global(.photo img) { transform: scale(1.03); } }
```

These rows hold the link to the clinician. The zoom applies to a real portrait; an initials tile has no image, so the demo sites show no zoom until a portrait is added.

- [ ] **Step 6: Run the gates**

Run: `npm test && npm run check && npm run e2e && npm run budget`
Expected: all pass. `booking.e2e.mjs` still passes (focus still moves to the step heading). Budget unchanged from Task 5 apart from a few bytes on `/book/`.

- [ ] **Step 7: Watch it**

Run `npm run dev`, open the site in Chrome with the `claude-in-chrome` tools, and record a short GIF of: home load, a scroll to the bottom, a click through to a service page, and two booking steps forward and one back. Confirm with your own eyes: nothing jumps, nothing flashes visible then hidden, the header holds still across the page change, the step slide is small. Stop the dev server.

- [ ] **Step 8: Commit**

```bash
git add src/sections/Hero.astro src/core/ui/Photo.astro src/sections/TeamRow.astro src/modules/providers/ProviderList.astro src/styles/global.css src/layouts/Header.astro src/modules/booking/booking.ts src/modules/booking/BookingForm.astro tests/e2e/motion.e2e.mjs
git commit -m "feat: hero entrance, page cross-fade, booking step slide and portrait hover"
```

---

### Task 7: Docs

**Files:**
- Modify: `docs/spec.md` (§8.5), `docs/design-system.md` (Motion), `docs/modules.md`, `docs/customising.md`

**Interfaces:**
- Consumes: the behaviour built in Tasks 2 to 6.
- Produces: nothing code depends on.

- [ ] **Step 1: `docs/spec.md` §8.5**

Replace the body of `### 8.5 Motion` (the line beginning "Card line fill and button press feedback only") with:

```markdown
Calm and brief. Only opacity and transform animate.

- Home hero on load: the photo fades in and settles from 1.04 scale over 600 ms; heading, line and actions rise 12 px, 60 ms apart.
- Sections and lists below the fold fade in and rise 12 px over 400 ms as they enter view, once. List rows follow 40 ms apart, for the first eight rows.
- Page to page: a 200 ms cross-fade where the browser supports cross-document view transitions.
- Booking: the next step slides in 16 px from the side of travel over 250 ms. The card line fill is unchanged.
- A clinician portrait zooms to 1.03 when its row is hovered. Buttons keep their press feedback.

`prefers-reduced-motion` removes all movement and keeps short colour fades. Nothing is hidden by CSS, so a page shows in full with JavaScript off. `motion: false` in a site's config turns all of the above off and loads no motion script. The staff console has no motion.
```

- [ ] **Step 2: `docs/design-system.md` Motion**

Replace the paragraph under `## Motion` with:

```markdown
Motion is calm and brief, and only opacity and transform animate.

| Where | What moves |
|---|---|
| Home hero | Photo settles from 1.04 scale, 600 ms. Text rises 12 px, 60 ms apart. |
| Sections and lists | Fade in and rise 12 px over 400 ms on entering view, once. Rows 40 ms apart, first eight. |
| Page change | 200 ms cross-fade, where supported. |
| Booking steps | Slide in 16 px from the side of travel, 250 ms. |
| Appointment card | Line fill, 160 ms colour fade. |
| Portrait rows | Portrait zooms to 1.03 on hover. |
| Buttons | Press feedback. |

To reveal an element on scroll, add `data-reveal` to it. To stagger a list, add `data-reveal-group` to the list. Do not nest one inside the other. The script is `src/core/motion.ts`.

`prefers-reduced-motion` removes movement and keeps short colour fades. Set `motion: false` in `src/config/sites/<site>/site.ts` to turn motion off for a clinic. Do not add parallax, pinned sections or scroll-linked effects.
```

- [ ] **Step 3: `docs/modules.md` and `docs/customising.md`**

Read both files first and match their heading style and table format.

In `docs/modules.md`, add a short section after the module table:

```markdown
## Motion

Motion is a site setting, not a module. `motion: false` in a site's `site.ts` removes the reveal script, the hero entrance, the page cross-fade and the hover zoom. It is on when not set.
```

In `docs/customising.md`, in the part that covers photos, add:

```markdown
## Photos on pages

`src/config/photo-slots.ts` holds three things for each content folder:

| Name | Purpose |
|---|---|
| `photoSlots` | Every slot a shoot should cover. |
| `photoRoles` | Which slot shows in the home hero, beside the first-visit steps, and beside the address. |
| `photoAlt` | The alt text for each room slot. |

A service shows a photo when its file has `photoSlot: <slot>` in the frontmatter. A content folder with no `photoRoles` entry shows no photos in those places. A clinician with no portrait file shows a tile with their initials. Demo photo sources are in `docs/photo-credits.md`.
```

- [ ] **Step 4: Run the docs tests**

Run: `npm test`
Expected: all pass, including `docs-copy` (no all-caps runs, arrows or middle dots in headings).

- [ ] **Step 5: Commit**

```bash
git add docs/spec.md docs/design-system.md docs/modules.md docs/customising.md
git commit -m "docs: motion rules, motion setting and photo roles"
```

---

### Task 8: Verification pass

The controller does this task; it uses skills and judgement.

**Files:**
- Modify: whatever the reviews find, within the files this plan already touches.
- Modify: `docs/build-ledger.md` (append the results)

**Interfaces:**
- Consumes: everything above.
- Produces: a results summary for the user.

- [ ] **Step 1: Full gates from clean**

Run: `npm test && npm run check && npm run e2e && npm run budget`
Expected: all four exit 0. Keep the output; it goes in the report.

- [ ] **Step 2: Motion performance audit**

Invoke the `motion` skill and run its performance audit over `src/core/motion.ts`, `src/sections/Hero.astro`, `src/styles/global.css`, `src/modules/booking/BookingForm.astro`, `src/core/ui/Photo.astro`. Fix anything that animates a property other than `opacity` or `transform`, or that it scores below its top tier. Record any finding you decide not to fix, with the reason.

- [ ] **Step 3: Screenshots**

Build and preview `fernway-au` and `hollybank`. Using `tools/shot.mjs`, capture `/`, one service page, `/team/` and `/book/` at 375 and 1280, in both themes for Fernway (`?theme=harbour`). Open every screenshot with the Read tool.

- [ ] **Step 4: Taste review**

Invoke `taste-skill:taste-skill` and review the screenshots and the changed components against it. For each finding decide:

- It agrees with `docs/design-system.md`: fix it.
- It conflicts with `docs/design-system.md` or the Global Constraints (for example it asks for card grids, eyebrow labels, gradients, a second accent use, or a UI framework): do not apply it. List it for the user.

- [ ] **Step 5: Re-run the gates after fixes**

Run: `npm test && npm run check && npm run e2e && npm run budget`
Expected: all four exit 0.

- [ ] **Step 6: Record and commit**

Append to `docs/build-ledger.md`, using plain sentences and no new headings in capitals: the gate results, the budget numbers before and after, the motion audit result, each taste finding with "fixed" or "not applied: conflicts with <rule>".

```bash
git add -A
git commit -m "fix: verification pass findings for photos and motion"
```

- [ ] **Step 7: Report to the user**

State, with the command output: which gates passed, the budget numbers, what the motion audit and the taste review found, what was fixed, and the list of taste findings not applied with the rule each conflicts with. Say plainly if anything failed or was skipped. Lighthouse is not run by any script in this repo; say so.
