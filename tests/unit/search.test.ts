import { describe, expect, it } from 'vitest';
import { normalise, matchesQuery } from '@/modules/providers/search';
import { providerNamesFor, providersBySlug } from '@/modules/providers/lookup';

const PROVIDERS = [
  { slug: 'elena-marsh', name: 'Dr Elena Marsh', role: 'Physiotherapist', languages: ['English', 'Spanish'] },
  { slug: 'priya-nair', name: 'Dr Priya Nair', role: 'Psychologist', languages: ['English', 'Hindi'] },
];

describe('normalise', () => {
  it('lowercases and collapses whitespace', () => {
    expect(normalise('  Dr   Elena   MARSH ')).toBe('dr elena marsh');
  });

  it('strips accents so a search for Zoe finds Zoë', () => {
    expect(normalise('Zoë Müller-Lang')).toBe('zoe muller-lang');
  });
});

describe('matchesQuery', () => {
  const clinician = ['Dr Elena Marsh', 'Physiotherapist', 'English Spanish'];

  it('matches everything for an empty query', () => {
    expect(matchesQuery(clinician, '')).toBe(true);
    expect(matchesQuery(clinician, '   ')).toBe(true);
  });

  it('matches a single term anywhere, ignoring case', () => {
    expect(matchesQuery(clinician, 'elena')).toBe(true);
    expect(matchesQuery(clinician, 'SPANISH')).toBe(true);
  });

  it('needs every term to match somewhere', () => {
    expect(matchesQuery(clinician, 'elena physiotherapist')).toBe(true);
    expect(matchesQuery(clinician, 'elena dentist')).toBe(false);
  });

  it('is not fooled by a term in the wrong place', () => {
    expect(matchesQuery(['Dental check-up'], 'check')).toBe(true);
    expect(matchesQuery(['Dental check-up'], 'check dentist')).toBe(false);
  });

  it('never matches on an empty haystack', () => {
    expect(matchesQuery([], 'elena')).toBe(false);
    expect(matchesQuery([], '')).toBe(true);
  });
});

describe('provider lookup', () => {
  it('indexes providers by slug', () => {
    const index = providersBySlug(PROVIDERS);
    expect(index.get('priya-nair')?.name).toBe('Dr Priya Nair');
    expect(index.has('nobody')).toBe(false);
  });

  it('names the clinicians on a service, skipping slugs it cannot find', () => {
    expect(providerNamesFor(PROVIDERS, ['elena-marsh', 'priya-nair'])).toEqual(['Dr Elena Marsh', 'Dr Priya Nair']);
    expect(providerNamesFor(PROVIDERS, ['elena-marsh', 'ghost'])).toEqual(['Dr Elena Marsh']);
    expect(providerNamesFor(PROVIDERS, [])).toEqual([]);
  });
});