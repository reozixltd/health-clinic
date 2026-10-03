import { describe, expect, it } from 'vitest';
import { validate } from '@/core/leads/validation';
import { AU } from '@/domain/markets/au';
import { CA } from '@/domain/markets/ca';
import { buildReferralInput, referralRules, URGENCIES } from '@/modules/referrals/referral';

const SERVICES = ['physiotherapy', 'psychology'];
const good = {
  referrerName: 'Dr Alex Moss', practice: 'Moss Family Clinic', referrerPhone: '03 5550 1999', referrerEmail: 'alex@example.com',
  patientFirstName: 'Jo', patientPhone: '0491 570 120', service: 'physiotherapy', urgency: 'Routine',
};

describe('referrals', () => {
  it('rules accept a complete referral', () => {
    expect(validate(good, referralRules(AU, { services: SERVICES })).ok).toBe(true);
  });

  it('rejects unknown choices and long patient names', () => {
    const r = validate({ ...good, service: 'surgery', urgency: 'Whenever', patientFirstName: 'x'.repeat(41) }, referralRules(AU, { services: SERVICES }));
    expect(Object.keys(r.errors).sort()).toEqual(['patientFirstName', 'service', 'urgency']);
    expect(URGENCIES).toEqual(['Routine', 'Soon', 'Urgent']);
  });

  it('phone validation follows the market', () => {
    const ca = { ...good, referrerPhone: '613-555-0123', patientPhone: '613-555-0123' };
    expect(validate(ca, referralRules(CA, { services: SERVICES })).ok).toBe(true);
    expect(validate(ca, referralRules(AU, { services: SERVICES })).ok).toBe(false);
  });

  it('referral payload has no clinical fields', () => {
    const input = buildReferralInput(good, { clientRef: 'c1', now: '2026-10-03T10:00:00+10:00' });
    expect(input.kind).toBe('referral');
    expect(Object.keys(input.payload)).toEqual(['practice', 'patientFirstName', 'patientPhone', 'service', 'urgency']);
    expect(input.contact).toEqual({ firstName: 'Dr', lastName: 'Alex Moss', phone: '03 5550 1999', email: 'alex@example.com' });
  });
});
