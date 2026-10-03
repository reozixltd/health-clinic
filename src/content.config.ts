import { defineCollection, z } from 'astro:content';
import { existsSync } from 'node:fs';
import { file, glob } from 'astro/loaders';
import type { Loader } from 'astro/loaders';
import { selectedSite } from './config';

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

const faqPair = z.object({ q: z.string(), a: z.string() });
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
    fromPrice: z.number().optional(),
    faqs: z.array(faqPair).length(3),
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

export const collections = { services, providers, policies, reviews, faqs, fees, prices };
