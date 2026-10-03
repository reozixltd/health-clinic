import { describe, expect, it } from 'vitest';
import { cardFields } from '@/modules/booking/card';
import { handoffUrl } from '@/modules/booking/providers';
import type { BookingState } from '@/modules/booking/state';
import type { BookingConfig, Provider, Service } from '@/domain/types';

const base: BookingState = { service: null, provider: 'first-available', patientType: null, forWhom: 'me', pet: null, day: null, windowId: null, step: 'service' };
const ctx = {
  services: [{ slug: 'consult', title: 'Consultation' }] as Service[],
  providers: [{ slug: 'ana', name: 'Dr Ana Li' }] as Provider[],
  windows: [{ id: 'morning', label: 'Morning', start: '09:00', end: '12:00' }],
  locale: 'en-AU',
};
const cfg = (o: Partial<BookingConfig>): BookingConfig => ({ provider: 'none', windows: [], leadDays: 1, horizonDays: 14, daysOff: [], confirmPromise: '', ...o });

describe('booking card', () => {
  it('cardFields vet labels', () => {
    expect(cardFields(base, { ...ctx, preset: 'vet' }).map((f) => f.label)).toEqual(['Service', 'Vet', 'Pet', 'Day', 'Time']);
    expect(cardFields(base, { ...ctx, preset: 'allied-health' }).map((f) => f.label)).toEqual(['Service', 'Clinician', 'Patient', 'Day', 'Time']);
  });

  it('empty state has null values; filled state resolves titles and labels', () => {
    expect(cardFields(base, { ...ctx, preset: 'vet' }).every((f) => f.value === null)).toBe(true);
    const s: BookingState = { ...base, service: 'consult', provider: 'ana', pet: { name: 'Biscuit', species: 'dog' }, day: '2026-10-09', windowId: 'morning' };
    expect(cardFields(s, { ...ctx, preset: 'vet' }).map((f) => f.value)).toEqual(['Consultation', 'Dr Ana Li', 'Biscuit, dog', 'Fri 9 Oct', 'Morning']);
  });

  it('handoffUrl', () => {
    const link = cfg({ provider: 'link', url: 'https://example.cliniko.com/bookings' });
    expect(handoffUrl(link, 'physiotherapy')).toBe('https://example.cliniko.com/bookings?service=physiotherapy');
    expect(handoffUrl(link, null)).toBe('https://example.cliniko.com/bookings');
    expect(handoffUrl({ ...link, serviceParam: 'type' }, 'x')).toBe('https://example.cliniko.com/bookings?type=x');
    expect(handoffUrl(cfg({}), 'x')).toBeNull();
    expect(handoffUrl(cfg({ provider: 'embed', url: 'https://e.com' }), 'x')).toBeNull();
  });
});
