import { defineCollection, z } from 'astro:content';
import { existsSync } from 'node:fs';
import { file, glob } from 'astro/loaders';
import type { Loader } from 'astro/loaders';
import { selectedSite } from './config';
import { photoAlt } from './config/photo-slots';
import { icons } from './core/ui/icons';

const dir = `./src/content/${selectedSite().contentDir}`;

/** Only fees (Fernway) and prices (Hollybank) may be absent; anything else missing must fail the build. */
const empty: Loader = { name: 'empty', load: async () => {} };
const when = (path: string, loader: () => Loader): Loader => (existsSync(path) ? loader() : empty);

/** JSON arrays have no ids, so number the entries. */
const list = (name: string, optional = false) => {
  const loader = () =>
    file(`${dir}/${name}.json`, {
      parser: (text) => (JSON.parse(text) as object[]).map((item, i) => ({ id: String(i), ...item })),
    });
  return optional ? when(`${dir}/${name}.json`, loader) : loader();
};

/** One JSON object as a one-entry collection. */
const single = (name: string) =>
  when(`${dir}/${name}.json`, () =>
    file(`${dir}/${name}.json`, { parser: (text) => [{ id: name, ...(JSON.parse(text) as object) }] }),
  );

const faqPair = z.object({ q: z.string(), a: z.string() });
const photoSlot = z
  .string()
  .refine((slot) => Object.hasOwn(photoAlt, slot), { message: 'photoSlot needs an entry in photoAlt (src/config/photo-slots.ts)' });
const icon = z.string().refine((name) => Object.hasOwn(icons, name), { message: 'icon is not in src/core/ui/icons.ts' });
const iconCard = z.object({ icon, title: z.string(), text: z.string() });
const registration = z.object({ body: z.string(), number: z.string() });

const services = defineCollection({
  loader: glob({ pattern: '*.md', base: `${dir}/services` }),
  schema: z.object({
    slug: z.string(),
    title: z.string(),
    order: z.number(),
    summary: z.string().max(200),
    duration: z.string(),
    whatToExpect: z.array(z.string()).min(1),
    providers: z.array(z.string()).min(1),
    fromPrice: z.union([z.number(), z.object({ AU: z.number().optional(), CA: z.number().optional(), UK: z.number().optional() })]).optional(),
    photoSlot: photoSlot.optional(),
    icon: icon.optional(),
    /** Conditions and problems this service helps with. */
    treats: z.array(z.string()).optional(),
    /** A typical care timeline, in order. */
    timeline: z.array(z.object({ when: z.string(), title: z.string(), text: z.string() })).optional(),
    faqs: z.array(faqPair).min(3),
    seoDescription: z.string().max(160),
  }),
});

const providers = defineCollection({
  loader: glob({ pattern: '*.md', base: `${dir}/providers` }),
  schema: z.object({
    slug: z.string(),
    name: z.string(),
    role: z.string(),
    registration: registration.extend({ byMarket: z.object({ CA: registration }).optional() }),
    languages: z.array(z.string()).min(1),
    services: z.array(z.string()).min(1),
    acceptingNew: z.boolean(),
    bio: z.string(),
    photoSlot: z.string(),
    qualifications: z.array(z.string()).optional(),
    interests: z.array(z.string()).optional(),
    /** Weekday names, as in the clinic hours. */
    availability: z.array(z.string()).optional(),
    /** Year they joined the clinic. */
    joined: z.number().optional(),
  }),
});

const policies = defineCollection({
  loader: glob({ pattern: '*.md', base: `${dir}/policies` }),
  schema: z.object({ title: z.string(), updated: z.coerce.date() }),
});

const reviews = defineCollection({
  loader: list('reviews'),
  schema: z.object({
    name: z.string(),
    date: z.string(),
    rating: z.number().min(1).max(5),
    source: z.string(),
    text: z.string().max(400),
    /** Where the reviewer lives, per market. */
    suburb: z.object({ AU: z.string().optional(), CA: z.string().optional(), UK: z.string().optional() }).optional(),
    /** Service slug. */
    service: z.string().optional(),
    avatarSlot: z.string().optional(),
  }),
});

const faqs = defineCollection({
  loader: list('faqs'),
  schema: z.object({ q: z.string(), a: z.string(), tags: z.array(z.string()) }),
});

const fees = defineCollection({
  loader: list('fees', true),
  schema: z.object({
    service: z.string(),
    label: z.string(),
    amount: z.object({ AU: z.number().optional(), CA: z.number().optional(), UK: z.number().optional() }),
    funding: z.array(z.enum(['fund', 'medicare', 'extended', 'direct'])),
  }),
});

const prices = defineCollection({
  loader: when(`${dir}/prices.json`, () =>
    file(`${dir}/prices.json`, { parser: (text) => [{ id: 'prices', ...(JSON.parse(text) as object) }] }),
  ),
  schema: z.object({
    reviewedAt: z.string(),
    items: z.array(z.object({ group: z.string(), label: z.string(), amount: z.number(), unit: z.string().optional() })),
  }),
});

const about = defineCollection({
  loader: single('about'),
  schema: z.object({
    founded: z.number(),
    /** Provider slug. */
    founder: z.string(),
    founderRole: z.string(),
    mission: z.string(),
    hero: z.object({ eyebrow: z.string(), headline: z.string(), lead: z.string(), cards: z.array(iconCard).default([]) }),
    story: z.object({ heading: z.string(), paragraphs: z.array(z.string()).min(1), photoSlot: photoSlot.optional() }),
    milestones: z.array(z.object({ year: z.number(), text: z.string() })),
    /** Shown only where the market displays reviews. */
    rating: z.object({ value: z.number().min(1).max(5), count: z.number() }).optional(),
    stats: z.array(z.object({ value: z.number(), suffix: z.string().optional(), label: z.string() })),
    features: z.array(iconCard),
    payments: z.array(iconCard),
    careers: z.object({
      heading: z.string(),
      text: z.string(),
      roles: z.array(z.object({ title: z.string(), hours: z.string(), text: z.string() })),
    }),
    newsletter: z.object({ heading: z.string(), text: z.string() }),
  }),
});

const awards = defineCollection({
  loader: list('awards', true),
  schema: z.object({ name: z.string(), issuer: z.string(), year: z.number(), icon, kind: z.enum(['award', 'accreditation']) }),
});

/** Health funds and insurers. Invented names with a drawn mark, never a real logo. */
const funds = defineCollection({
  loader: list('funds', true),
  schema: z.object({ name: z.string(), market: z.enum(['AU', 'CA', 'UK']), mark: z.number().int().min(1).max(6) }),
});

const conditions = defineCollection({
  loader: list('conditions', true),
  schema: z.object({ name: z.string(), service: z.string() }),
});

const gallery = defineCollection({
  loader: list('gallery', true),
  schema: z.object({ photoSlot, caption: z.string() }),
});

const blog = defineCollection({
  loader: when(`${dir}/blog`, () => glob({ pattern: '*.md', base: `${dir}/blog` })),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    /** Provider slug. */
    author: z.string(),
    summary: z.string().max(200),
    photoSlot,
    minutes: z.number(),
    category: z.string(),
  }),
});

export const collections = { services, providers, policies, reviews, faqs, fees, prices, about, awards, funds, conditions, gallery, blog };
