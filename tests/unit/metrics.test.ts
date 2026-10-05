import { describe, expect, it } from 'vitest';
import { AU } from '@/domain/markets/au';
import { CA } from '@/domain/markets/ca';
import { clinicMetrics, formatRating } from '@/modules/stats/metrics';
import { alliedHealth } from '@/presets/allied-health';
import { vet } from '@/presets/vet';

const NOUNS = alliedHealth.copy.nouns;
const REVIEWS = [
  { name: 'A', date: '2026-01-01', rating: 5, source: 'Google', text: 'Great' },
  { name: 'B', date: '2026-01-02', rating: 4, source: 'Google', text: 'Good' },
  { name: 'C', date: '2026-01-03', rating: 5, source: 'Google', text: 'Great' },
];

describe('formatRating', () => {
  it.each([
    [[5], '5.0'],
    [[5, 4, 5], '4.7'],
    [[1, 2], '1.5'],
  ])('mean of %j is %j', (ratings, expected) => {
    expect(formatRating(ratings as number[])).toBe(expected);
  });

  it('is empty for no ratings', () => {
    expect(formatRating([])).toBe('');
  });
});

describe('preset nouns', () => {
  it('gives both presets a service and a clinician noun', () => {
    for (const preset of [alliedHealth, vet]) {
      expect(preset.copy.nouns.service, preset.id).toBeTruthy();
      expect(preset.copy.nouns.clinician, preset.id).toBeTruthy();
    }
  });

  it('gives the vet preset vet wording', () => {
    expect(vet.copy.nouns.clinician).toMatch(/vet/i);
  });
});

describe('clinicMetrics', () => {
  const base = { services: 5, providers: 6, acceptingNew: 4, reviews: REVIEWS, nouns: NOUNS };

  it('counts services, clinicians and who is taking new patients', () => {
    expect(clinicMetrics({ ...base, market: AU }).map((m) => m.label)).toEqual(['Services', 'Clinicians', 'Taking new patients']);
  });

  it('uses the preset nouns, so a vet clinic is not labelled Clinicians', () => {
    const labels = clinicMetrics({ ...base, nouns: vet.copy.nouns, market: AU }).map((m) => m.label);
    expect(labels[1]).toBe('Vets and nurses');
    expect(labels).not.toContain('Clinicians');
  });

  it('never shows a rating in a market that hides review quotes', () => {
    expect(clinicMetrics({ ...base, market: AU }).some((m) => m.label.includes('rating'))).toBe(false);
  });

  it('shows the average rating where reviews are displayed', () => {
    const rated = clinicMetrics({ ...base, market: CA });
    expect(rated.map((m) => m.label)).toEqual(['Services', 'Clinicians', 'Taking new patients', 'Average review rating']);
    expect(rated[3]!.value).toBe('4.7');
  });

  it('omits the rating when there are no reviews to average', () => {
    expect(clinicMetrics({ ...base, reviews: [], market: CA }).map((m) => m.label)).not.toContain('Average review rating');
  });

  it('reports zero rather than hiding a count of none', () => {
    const m = clinicMetrics({ services: 0, providers: 0, acceptingNew: 0, reviews: [], nouns: NOUNS, market: CA });
    expect(m.map((x) => x.value)).toEqual(['0', '0', '0']);
  });

  it('gives every tile a note', () => {
    for (const m of clinicMetrics({ ...base, market: CA })) expect(m.note, m.label).toBeTruthy();
  });
});