import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { allSites } from '@/config';
import { photoSlots } from '@/config/photo-slots';
import { routesFor } from '@/domain/modules';

const ROOT = join(process.cwd(), 'src/content');
const FIXED = ['/', '/contact/', '/new-patients/', '/faq/', '/privacy/', '/accessibility/', '/terms/', '/pet-health-plans/'];
const ALLOWED_CAPS = new Set(['ABN', 'BN', 'GST', 'VAT', 'AHPRA', 'RCVS', 'SMS', 'CASL', 'PECR', 'AODA', 'WCAG', 'GP']);

function mdFiles(dir: string): { slug: string; data: any; body: string; raw: string }[] {
  const path = join(ROOT, dir);
  if (!existsSync(path)) return [];
  return readdirSync(path).filter((f) => f.endsWith('.md')).map((f) => {
    const raw = readFileSync(join(path, f), 'utf8');
    const m = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(raw)!;
    return { slug: f.replace(/\.md$/, ''), data: parse(m[1]), body: m[2], raw };
  });
}
const json = (dir: string, file: string) => JSON.parse(readFileSync(join(ROOT, dir, file), 'utf8'));
const brands = ['fernway', 'hollybank'];

describe('demo site configs', () => {
  it('all three demo sites resolve', () => {
    const sites = allSites();
    expect(Object.keys(sites)).toEqual(['fernway-au', 'fernway-ca', 'hollybank']);
    for (const s of Object.values(sites)) expect(s.demoMode).toBe(true);
  });

  it('fernway CA uses the CA pack and AU uses AU', () => {
    const s = allSites();
    expect(s['fernway-ca'].market.id).toBe('CA');
    expect(s['fernway-au'].market.id).toBe('AU');
    expect(s.hollybank.market.id).toBe('UK');
    expect(s['fernway-ca'].booking.provider).toBe('link');
    expect(s['fernway-au'].booking.provider).toBe('none');
  });

  it('clinic identities pass their market pack patterns', () => {
    for (const s of Object.values(allSites())) {
      const c = s.clinic;
      expect(c.legalId).toMatch(s.market.identifiers.pattern);
      expect(c.phone.replace(/[\s-]/g, '')).toMatch(s.market.phone.pattern);
      expect(c.address.postcode).toMatch(s.market.postcode.pattern);
    }
    expect(allSites().hollybank.clinic.owner?.independent).toBe(true);
  });

  it('every provider service slug exists in services and vice versa', () => {
    for (const b of brands) {
      const services = mdFiles(`${b}/services`);
      const providers = mdFiles(`${b}/providers`);
      const serviceSlugs = new Set(services.map((s) => s.data.slug));
      const used = new Set(providers.flatMap((p) => p.data.services));
      for (const slug of used) expect(serviceSlugs.has(slug), `${b}: ${slug}`).toBe(true);
      for (const slug of serviceSlugs) expect(used.has(slug), `${b}: ${slug}`).toBe(true);
      for (const s of services) {
        const offering = providers.filter((p) => p.data.services.includes(s.data.slug)).map((p) => p.data.slug).sort();
        expect([...s.data.providers].sort(), `${b}/${s.data.slug}`).toEqual(offering);
        expect(s.data.faqs.length).toBeGreaterThanOrEqual(3);
        expect(s.data.summary.length).toBeLessThanOrEqual(200);
        expect(s.data.seoDescription.length).toBeLessThanOrEqual(160);
      }
    }
  });

  it('providers: two per discipline, one not accepting, photo slots listed', () => {
    const fern = mdFiles('fernway/providers');
    expect(fern).toHaveLength(6);
    expect(fern.filter((p) => !p.data.acceptingNew)).toHaveLength(1);
    expect(fern.find((p) => !p.data.acceptingNew)!.data.role).toMatch(/psychologist/i);
    for (const p of fern) {
      expect(p.data.registration.body).toBe('AHPRA');
      expect(p.data.registration.byMarket.CA.body).toMatch(/College/);
    }
    const holly = mdFiles('hollybank/providers');
    expect(holly).toHaveLength(4);
    for (const p of holly) expect(p.data.registration.body).toBe('RCVS');
    for (const b of brands) {
      for (const p of mdFiles(`${b}/providers`)) expect(photoSlots[b], p.data.photoSlot).toContain(p.data.photoSlot);
    }
  });

  it('fees follow the Fee shape and prices carry the prescription rule', () => {
    const fees = json('fernway', 'fees.json');
    for (const f of fees) {
      expect(typeof f.amount.AU).toBe('number');
      expect(typeof f.amount.CA).toBe('number');
      for (const k of f.funding) expect(['fund', 'medicare', 'extended', 'direct']).toContain(k);
    }
    const prices = json('hollybank', 'prices.json');
    expect(prices.items.length).toBeGreaterThanOrEqual(28);
    const rx = prices.items.filter((i: any) => i.group === 'Prescriptions');
    expect(rx[0].amount).toBe(21);
    expect(rx[1].amount).toBe(12.5);
    expect(['Consultations', 'Vaccinations', 'Dental', 'Neutering', 'Prescriptions']).toEqual([...new Set(prices.items.map((i: any) => i.group))]);
    expect(prices.reviewedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('faqs and reviews are well formed; policies name the consent law', () => {
    for (const b of brands) {
      const faqs = json(b, 'faqs.json');
      expect(faqs).toHaveLength(10);
      for (const f of faqs) for (const t of f.tags) expect(['home', 'booking', 'fees', 'prices', 'emergency']).toContain(t);
      expect(faqs.filter((f: any) => f.tags.includes('home')).length).toBeGreaterThanOrEqual(5);
      for (const r of json(b, 'reviews.json')) {
        expect(r.text.length).toBeLessThanOrEqual(400);
        expect(r.rating).toBeGreaterThanOrEqual(1);
      }
    }
    const fp = mdFiles('fernway/policies').find((p) => p.slug === 'privacy')!.raw;
    expect(fp).toContain('Spam Act 2003');
    expect(fp).toContain('CASL');
    expect(mdFiles('hollybank/policies').find((p) => p.slug === 'privacy')!.raw).toContain('PECR');
    expect(mdFiles('fernway/policies').find((p) => p.slug === 'accessibility')!.raw).toContain('AODA');
    expect(mdFiles('hollybank/policies').map((p) => p.slug)).toContain('pet-health-plans');
  });

  it('content links only to generated routes', () => {
    const sites = allSites();
    for (const [id, s] of Object.entries(sites)) {
      const b = s.contentDir;
      const dyn = [
        ...mdFiles(`${b}/services`).map((x) => `/services/${x.data.slug}/`),
        ...mdFiles(`${b}/providers`).map((x) => `/team/${x.data.slug}/`),
      ];
      const ok = new Set([...routesFor(s), ...FIXED, ...dyn]);
      const text = [
        ...['services', 'providers', 'policies'].flatMap((d) => mdFiles(`${b}/${d}`).map((x) => x.raw)),
        readFileSync(join(ROOT, b, 'faqs.json'), 'utf8'),
        readFileSync(join(ROOT, b, 'reviews.json'), 'utf8'),
      ].join('\n');
      const links = [...text.matchAll(/\]\((\/[^)\s]*)\)|href=\\?"(\/[^"\\]*)/g)].map((m) => (m[1] ?? m[2]).split(/[?#]/)[0]);
      for (const l of links) expect(ok.has(l), `${id}: ${l}`).toBe(true);
    }
  });

  it('copy rules', () => {
    const strings: string[] = [];
    const walk = (v: unknown) => {
      if (typeof v === 'string') strings.push(v);
      else if (Array.isArray(v)) v.forEach(walk);
      else if (v && typeof v === 'object' && !(v instanceof RegExp)) Object.values(v).forEach(walk);
    };
    for (const s of Object.values(allSites())) {
      // Address region codes such as VIC and ON are real abbreviations, not copy.
      walk({ ...s, market: undefined, clinic: { ...s.clinic, address: undefined } });
      walk(s.preset.copy);
      walk(s.preset.nav);
    }
    for (const str of strings) {
      expect(str, str).not.toMatch(/[·→]/);
      for (const run of str.match(/\b[A-Z]{3,}\b/g) ?? []) expect(ALLOWED_CAPS.has(run), `${str}: ${run}`).toBe(true);
    }
  });
});
