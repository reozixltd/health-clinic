import { describe, expect, it } from 'vitest';
import { validate } from '@/core/leads/validation';
import { getMarket } from '@/domain/markets';
import { appointmentRules, buildAppointmentInput, stepRules } from '@/modules/booking/lead';
import type { BookingState } from '@/modules/booking/state';

const state: BookingState = { service: 'physiotherapy', provider: 'first-available', patientType: 'new', forWhom: 'me', pet: null, day: '2026-10-09', windowId: 'morning', step: 'check' };
const ok = { firstName: 'Sam', lastName: 'Lee', phone: '613-555-0123', email: 'sam@example.com', postcode: 'K1P 1J1', terms: true };

describe('booking lead', () => {
  it('buildAppointmentInput maps consents and timestamp', () => {
    const lead = buildAppointmentInput({ ...ok, remindersSms: 'on' }, { state, consentAt: '2026-10-03T10:00:00+11:00', clientRef: 'r1' });
    expect(lead.kind).toBe('appointment');
    expect(lead.consent).toEqual({ terms: true, remindersSms: true, marketingSms: false, marketingEmail: false, at: '2026-10-03T10:00:00+11:00' });
    expect(lead.payload).toEqual({ service: 'physiotherapy', provider: 'first-available', patientType: 'new', day: '2026-10-09', windowId: 'morning', forWhom: 'me' });
    expect(lead.clientRef).toBe('r1');
  });

  it('vet payload carries pet name and species only', () => {
    const vet = { ...state, pet: { name: 'Biscuit', species: 'dog' as const } };
    const lead = buildAppointmentInput({ ...ok, petName: ' Biscuit ' }, { state: vet, consentAt: 'x', clientRef: 'r' });
    expect(lead.payload.pet).toEqual({ name: 'Biscuit', species: 'dog' });
  });

  it('CA postcode rule', () => {
    const rules = appointmentRules(getMarket('CA'));
    expect(validate({ ...ok, postcode: 'K1P 1J1' }, rules).ok).toBe(true);
    const bad = validate({ ...ok, postcode: '3000' }, rules);
    expect(bad.ok).toBe(false);
    expect(bad.errors.postcode).toBe('Enter a valid postal code');
  });

  it('required messages and vet pet name', () => {
    const r = validate({}, appointmentRules(getMarket('AU'), 'vet'));
    expect(r.errors.firstName).toBe('Enter your first name');
    expect(r.errors.phone).toBe('Enter a phone number, like 0491 570 120');
    expect(r.errors.terms).toBe('Agree to the terms to send your request');
    expect(r.errors.petName).toBe("Enter your pet's name");
    expect(validate({ ...ok, petName: 'x'.repeat(41) }, appointmentRules(getMarket('CA'), 'vet')).errors.petName).toBeDefined();
  });

  it('stepRules', () => {
    expect(validate({}, stepRules('service')).ok).toBe(false);
    expect(validate({ patientType: 'new' }, stepRules('patient')).ok).toBe(true);
    expect(Object.keys(validate({ day: '2026-10-09' }, stepRules('when')).errors)).toEqual(['windowId']);
    expect(validate({}, stepRules('check')).ok).toBe(true);
  });
});
