import { describe, expect, it } from 'vitest';
import { validate } from '@/core/leads/validation';
import { UK } from '@/domain/markets/uk';
import { buildEstimateInput, estimateRules, needsWrittenEstimate, REASONS, SPECIES } from '@/modules/estimates/estimate';

describe('estimates', () => {
  it('needsWrittenEstimate is true at the threshold', () => {
    expect(needsWrittenEstimate(500, 500)).toBe(true);
    expect(needsWrittenEstimate(499.99, 500)).toBe(false);
  });

  const good = {
    petName: 'Biscuit', species: 'Dog', reason: 'Dental treatment', firstName: 'Sam', lastName: 'Lee',
    phone: '0113 496 0123', email: 'sam@example.com', terms: true,
  };

  it('rules accept a complete request and reject unknown choices', () => {
    const rules = estimateRules(UK);
    expect(validate(good, rules).ok).toBe(true);
    const bad = validate({ ...good, species: 'Dragon', reason: 'Because', petName: '', terms: false }, rules);
    expect(Object.keys(bad.errors).sort()).toEqual(['petName', 'reason', 'species', 'terms']);
    expect(REASONS).toContain('Neutering');
    expect(SPECIES).toContain('Rabbit');
  });

  it('requires an email so the follow-up can be sent', () => {
    const r = validate({ ...good, email: '' }, estimateRules(UK));
    expect(r.errors.email).toBeTruthy();
    expect(validate({ ...good, phone: '' }, estimateRules(UK)).ok).toBe(true);
  });

  it('buildEstimateInput makes an estimate lead with pet name and species only', () => {
    const input = buildEstimateInput(good, { clientRef: 'c1', now: '2026-10-03T10:00:00+01:00' });
    expect(input.kind).toBe('estimate');
    expect(input.payload).toEqual({ petName: 'Biscuit', species: 'Dog', reason: 'Dental treatment' });
    expect(input.contact.firstName).toBe('Sam');
    expect(input.consent).toMatchObject({ terms: true, marketingSms: false, at: '2026-10-03T10:00:00+01:00' });
  });
});
