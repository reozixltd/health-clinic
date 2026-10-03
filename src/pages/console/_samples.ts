/** Seven demo leads so the console never opens empty. Only kinds in the preset appear; visits are always ahead. */
import { todayIn } from '@/core/format';
import type { Lead, LeadKind, LeadStatus } from '@/core/leads/types';
import type { Preset } from '@/domain/presets';
import type { Clinic } from '@/domain/types';

export interface SampleSite { preset: Pick<Preset, 'id' | 'leadKinds'>; clinic: Pick<Clinic, 'timeZone'> }

const addDays = (iso: string, n: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
const HOUR = 3_600_000;

type Spec = { kind: LeadKind; name: [string, string]; status?: LeadStatus; marketing?: boolean; hoursAgo: number; payload: Record<string, unknown> };

function specs(vet: boolean, day: (n: number) => string): Spec[] {
  const visit = (service: string, provider: string, n: number, windowId: string, extra: object = {}) =>
    ({ service, provider, patientType: 'new', day: day(n), windowId, forWhom: 'me', ...extra });
  if (vet) return [
    { kind: 'appointment', name: ['Jo', 'Barrett'], status: 'confirmed', hoursAgo: 30, payload: visit('vaccinations', 'first-available', 3, 'morning', { patientType: 'returning', pet: { name: 'Biscuit', species: 'dog' } }) },
    { kind: 'appointment', name: ['Aisha', 'Khan'], hoursAgo: 5, payload: visit('consultations', 'first-available', 4, 'afternoon', { pet: { name: 'Mochi', species: 'cat' } }) },
    { kind: 'appointment', name: ['Tom', 'Wells'], status: 'declined', hoursAgo: 50, payload: visit('neutering', 'first-available', 6, 'morning', { pet: { name: 'Pip', species: 'rabbit' } }) },
    { kind: 'appointment', name: ['Mei', 'Chen'], status: 'done', hoursAgo: 80, payload: visit('dental', 'first-available', 2, 'afternoon', { patientType: 'returning', pet: { name: 'Rolo', species: 'dog' } }) },
    { kind: 'estimate', name: ['Liam', 'Ford'], hoursAgo: 12, payload: { petName: 'Bramble', species: 'Dog', reason: 'Dental treatment' } },
    { kind: 'estimate', name: ['Nia', 'Evans'], hoursAgo: 60, payload: { petName: 'Juno', species: 'Cat', reason: 'Neutering' } },
    { kind: 'enquiry', name: ['Dale', 'Price'], hoursAgo: 20, payload: { message: 'Do you see exotic pets?' } },
  ];
  return [
    { kind: 'appointment', name: ['Sophie', 'Grant'], hoursAgo: 4, payload: visit('physiotherapy', 'first-available', 3, 'morning') },
    { kind: 'appointment', name: ['Priya', 'Shah'], status: 'confirmed', marketing: true, hoursAgo: 28, payload: visit('dental-check-up', 'first-available', 4, 'afternoon', { patientType: 'returning' }) },
    { kind: 'appointment', name: ['Marcus', 'Hill'], status: 'declined', hoursAgo: 52, payload: visit('psychology', 'first-available', 7, 'morning') },
    { kind: 'appointment', name: ['Ella', 'Novak'], status: 'done', hoursAgo: 75, payload: visit('sports-physio', 'first-available', 2, 'afternoon', { patientType: 'returning' }) },
    { kind: 'referral', name: ['Ben', 'Carter'], hoursAgo: 10, payload: { referrer: 'Dr Alma Reid', practice: 'Northside Medical', service: 'physiotherapy', urgency: 'Within a week' } },
    { kind: 'referral', name: ['Zoe', 'Adams'], status: 'confirmed', hoursAgo: 45, payload: { referrer: 'Dr Alma Reid', practice: 'Northside Medical', service: 'psychology', urgency: 'Routine' } },
    { kind: 'enquiry', name: ['Hana', 'Ito'], hoursAgo: 18, payload: { message: 'Do you offer after-hours appointments?' } },
  ];
}

/** Sample requests load on the first sign-in of a demo site only, never on a live one. */
export function shouldAutoSeed(demo: boolean, seededFlag: string | null): boolean {
  return demo && !seededFlag;
}

export function sampleLeads(now: Date, site: SampleSite): Lead[] {
  const today = todayIn(site.clinic.timeZone, now);
  const day = (n: number) => addDays(today, n);
  return specs(site.preset.id === 'vet', day)
    .filter((s) => site.preset.leadKinds.includes(s.kind))
    .map((s, i) => {
      const createdAt = new Date(now.getTime() - s.hoursAgo * HOUR).toISOString();
      const status = s.status ?? 'new';
      const confirmedAt = new Date(now.getTime() - (s.hoursAgo - 1) * HOUR).toISOString();
      return {
        id: `S-${now.getTime().toString(36).toUpperCase()}-${i + 1}`,
        kind: s.kind,
        contact: { firstName: s.name[0], lastName: s.name[1], phone: '0400 000 000', email: `${s.name[0].toLowerCase()}@example.com` },
        postcode: '0000',
        consent: { terms: true, remindersSms: true, marketingSms: !!s.marketing, marketingEmail: !!s.marketing, at: createdAt },
        payload: s.payload,
        clientRef: `sample-${now.getTime()}-${i + 1}`,
        status,
        createdAt,
        history: status === 'new' ? [] : [{ at: confirmedAt, type: 'status', value: status }],
      } satisfies Lead;
    });
}
