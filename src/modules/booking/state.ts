/** Booking wizard state: URL round-trip, step order and day/clinician availability. Pure; no contact fields. */
import { formatDay } from '@/core/format';
import type { BookingConfig, Provider } from '@/domain/types';

export const STEP_IDS = ['service', 'clinician', 'patient', 'when', 'you', 'check'] as const;
export type StepId = (typeof STEP_IDS)[number];
export type Species = 'dog' | 'cat' | 'rabbit' | 'other';
const SPECIES: readonly Species[] = ['dog', 'cat', 'rabbit', 'other'];

export interface BookingState {
  service: string | null;
  provider: string | 'first-available';
  patientType: 'new' | 'returning' | null;
  forWhom: 'me' | 'someone-else';
  pet: { name: string; species: Species } | null;
  day: string | null;
  windowId: string | null;
  step: StepId;
}

export interface ParamsCtx { services: string[]; providers: string[]; windows: string[] }

/** True for a real calendar date "YYYY-MM-DD" (rejects 2026-99-99 and 2026-02-30). */
function isRealDate(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const d = new Date(`${iso}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === iso;
}

export function fromParams(search: string, ctx: ParamsCtx): BookingState {
  const q = new URLSearchParams(search);
  const pick = (key: string, allowed: string[]) => {
    const v = q.get(key);
    return v !== null && allowed.includes(v) ? v : null;
  };
  const type = pick('patient', ['new', 'returning']) as BookingState['patientType'];
  const name = (q.get('pet') ?? '').trim().slice(0, 40);
  const species = (pick('species', [...SPECIES]) ?? 'other') as Species;
  const day = q.get('day') ?? '';
  const step = (pick('step', [...STEP_IDS]) ?? 'service') as StepId;
  return {
    service: pick('service', ctx.services),
    provider: pick('provider', ctx.providers) ?? 'first-available',
    patientType: type,
    forWhom: q.get('for') === 'someone-else' ? 'someone-else' : 'me',
    pet: name ? { name, species } : null,
    day: isRealDate(day) ? day : null,
    windowId: pick('window', ctx.windows),
    step,
  };
}

export function toParams(s: BookingState): string {
  const q = new URLSearchParams();
  if (s.service) q.set('service', s.service);
  if (s.provider !== 'first-available') q.set('provider', s.provider);
  if (s.patientType) q.set('patient', s.patientType);
  if (s.forWhom !== 'me') q.set('for', s.forWhom);
  if (s.pet) { q.set('pet', s.pet.name); q.set('species', s.pet.species); }
  if (s.day) q.set('day', s.day);
  if (s.windowId) q.set('window', s.windowId);
  q.set('step', s.step);
  return `?${q.toString()}`;
}

export const nextStep = (s: StepId): StepId => STEP_IDS[Math.min(STEP_IDS.indexOf(s) + 1, STEP_IDS.length - 1)]!;
export const prevStep = (s: StepId): StepId => STEP_IDS[Math.max(STEP_IDS.indexOf(s) - 1, 0)]!;

/** Earliest step that still needs an answer (clinician has a default, so it is never unfinished). */
export function firstUnfinished(s: BookingState): StepId {
  if (!s.service) return 'service';
  if (!s.patientType) return 'patient';
  if (!s.day || !s.windowId) return 'when';
  return 'you';
}

const addDays = (iso: string, n: number): string => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/** Dates from today + leadDays to today + horizonDays, skipping days off (0 = Sunday). `today` is a clinic-zone date. */
export function availableDays(today: string, cfg: BookingConfig, locale = 'en-AU'): { date: string; label: string }[] {
  const out: { date: string; label: string }[] = [];
  for (let n = cfg.leadDays; n <= cfg.horizonDays; n++) {
    const date = addDays(today, n);
    if (cfg.daysOff.includes(new Date(`${date}T00:00:00Z`).getUTCDay())) continue;
    out.push({ date, label: formatDay(date, locale) });
  }
  return out;
}

export function providersFor(serviceSlug: string, patientType: BookingState['patientType'], providers: Provider[]): Provider[] {
  return providers.filter((p) => p.services.includes(serviceSlug) && (patientType !== 'new' || p.acceptingNew));
}
