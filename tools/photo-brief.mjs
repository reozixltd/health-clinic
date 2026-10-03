// Writes docs/photo-brief.md from src/config/photo-slots.ts and lists which slots have files.
//   node tools/photo-brief.mjs         (also: npm run photos:status)
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';

const src = readFileSync('src/config/photo-slots.ts', 'utf8');
const brands = [...src.matchAll(/^\s{2}'?([a-z0-9-]+)'?: \[([^\]]*)\]/gm)].map(([, brand, body]) => ({
  brand,
  slots: [...body.matchAll(/'([a-z0-9-]+)'/g)].map((m) => m[1]),
}));
const dir = 'src/assets/photos';
const have = new Set(existsSync(dir) ? readdirSync(dir).map((f) => f.replace(/\.[a-z]+$/i, '')) : []);

const title = (slug) => slug.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');

/** What each kind of slot should show. Rooms and equipment only; never stock people as clinicians. */
function describe(slot) {
  if (slot.startsWith('provider-')) {
    const name = title(slot.replace('provider-', ''));
    return {
      shows: `Head and shoulders portrait of ${name}, taken with their consent, plain background, natural light.`,
      search: 'Not for stock. Book a short shoot with the real clinician.',
      orientation: 'portrait',
    };
  }
  const rooms = {
    'clinic-exterior': ['Front of the building and the entrance, daylight, no people, door and any step or ramp visible.', 'clinic building entrance daylight'],
    reception: ['Reception desk and waiting area, empty, tidy, natural light.', 'empty clinic reception waiting area'],
    'treatment-room-physio': ['Physiotherapy treatment room with plinth and exercise equipment, empty.', 'physiotherapy treatment room empty'],
    'treatment-room-dental': ['Dental surgery with chair and instruments set out, empty.', 'dental surgery empty chair'],
    'consulting-room-psychology': ['Quiet consulting room with two chairs, soft light, empty.', 'counselling room two chairs empty'],
    'consult-room': ['Vet consult room with exam table and scales, empty, clean.', 'veterinary consulting room empty exam table'],
    'prep-and-theatre': ['Prep area and theatre with table and monitoring equipment, empty.', 'veterinary surgery theatre empty'],
  };
  const [shows, search] = rooms[slot] ?? ['Describe this slot.', slot.replace(/-/g, ' ')];
  return { shows, search, orientation: 'landscape' };
}

let total = 0;
let filled = 0;
const missing = [];
const sections = brands.map(({ brand, slots }) => {
  const rows = slots.map((slot) => {
    const d = describe(slot);
    const has = have.has(slot);
    total += 1;
    if (has) filled += 1;
    else missing.push(`${brand}/${slot}`);
    return `| \`${slot}\` | ${has ? 'yes' : 'no'} | ${d.orientation} | ${d.shows} | ${d.search} |`;
  });
  return `## ${title(brand)}\n\n| Slot | Have | Orientation | What it should show | Search terms |\n|---|---|---|---|---|\n${rows.join('\n')}\n`;
});

const md = `# Photo brief

Save each photo as \`src/assets/photos/<slot>.jpg\`. It is optimised and cropped automatically. An empty slot shows a labelled placeholder.
Slot names are shared by every brand, so one file fills the slot on any site that lists it.

Generated from \`src/config/photo-slots.ts\` by \`npm run photos:status\`. Do not edit by hand.

## Rules

- Rooms and equipment only. Never use stock photos of people as clinicians.
- Clinician portraits come from the real clinician, with their consent.
- No patients, no pets in distress, no screens showing records.
- Landscape slots: at least 1600 px wide. Portrait slots: at least 800 px wide.
- Provider slots are the only ones pages render today. Room slots are listed so a shoot can cover them.

${sections.join('\n')}`;
writeFileSync('docs/photo-brief.md', md);
console.log(`${filled} of ${total} slots filled. Brief written to docs/photo-brief.md`);
if (missing.length) console.log(`Missing: ${missing.join(', ')}`);
