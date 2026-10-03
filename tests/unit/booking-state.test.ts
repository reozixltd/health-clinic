import { describe, expect, it } from 'vitest';
import { cardFields } from '@/modules/booking/card';
import { todayIn } from '@/core/format';
import { availableDays, firstUnfinished, fromParams, nextStep, prevStep, providersFor, toParams, type BookingState } from '@/modules/booking/state';
import type { BookingConfig, Provider } from '@/domain/types';

const ctx = { services: ['physiotherapy', 'psychology'], providers: ['sam', 'ana'], windows: ['morning', 'afternoon'] };
const cfg: BookingConfig = { provider: 'none', windows: [], leadDays: 1, horizonDays: 14, daysOff: [0], confirmPromise: '' };
const prov = (slug: string, services: string[], acceptingNew: boolean) => ({ slug, services, acceptingNew }) as Provider;

describe('booking state', () => {
  it('fromParams defaults unknown service', () => {
    const s = fromParams('?service=surgery&provider=nobody&window=night&step=you', ctx);
    expect(s.service).toBeNull();
    expect(s.provider).toBe('first-available');
    expect(s.windowId).toBeNull();
    expect(firstUnfinished(s)).toBe('service');
  });

  it('toParams never contains contact fields and round-trips a full state', () => {
    const full: BookingState = { service: 'psychology', provider: 'ana', patientType: 'returning', forWhom: 'someone-else', pet: { name: 'Biscuit', species: 'cat' }, day: '2026-10-09', windowId: 'morning', step: 'check' };
    const qs = toParams(full);
    expect(qs).not.toMatch(/phone|email|name=|postcode/);
    expect(fromParams(qs, ctx)).toEqual(full);
    expect(firstUnfinished(full)).toBe('you');
  });

  it('steps clamp at both ends', () => {
    expect(nextStep('check')).toBe('check');
    expect(prevStep('service')).toBe('service');
    expect(nextStep('service')).toBe('clinician');
  });

  it('availableDays uses clinic date', () => {
    const days = availableDays(todayIn('Australia/Melbourne', new Date('2026-10-03T14:30:00Z')), cfg);
    expect(days[0]!.date).toBe('2026-10-05');
    expect(days[0]!.label).toBe('Mon 5 Oct');
    expect(days.some((d) => new Date(`${d.date}T00:00:00Z`).getUTCDay() === 0)).toBe(false);
    expect(days.at(-1)!.date).toBe('2026-10-17');
  });

  it('providersFor returns empty when none accept new', () => {
    const list = [prov('ana', ['psychology'], false), prov('sam', ['physiotherapy'], true)];
    expect(providersFor('psychology', 'new', list)).toEqual([]);
    expect(providersFor('psychology', 'returning', list).map((p) => p.slug)).toEqual(['ana']);
  });

  it('fromParams rejects impossible dates and cardFields does not throw', () => {
    for (const d of ['2026-99-99', '2026-02-30']) {
      const s = fromParams(`?day=${d}`, ctx);
      expect(s.day).toBeNull();
      expect(() => cardFields(s, { services: [], providers: [], windows: [], preset: 'vet', locale: 'en-AU' })).not.toThrow();
    }
    expect(fromParams('?day=2026-10-09', ctx).day).toBe('2026-10-09');
  });
});
