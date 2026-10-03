import { checked, email, maxLength, phone, postcode, required, type FieldValue, type Rules } from '@/core/leads/validation';
import type { LeadInput } from '@/core/leads/types';
import type { MarketPack } from '@/domain/markets';
import type { BookingState, Species, StepId } from './state';

export interface AppointmentPayload {
  service: string;
  provider: string | 'first-available';
  patientType: 'new' | 'returning';
  day: string;
  windowId: string;
  forWhom: 'me' | 'someone-else';
  pet?: { name: string; species: Species };
}

export function appointmentRules(market: MarketPack, preset: 'allied-health' | 'vet' = 'allied-health'): Rules {
  const rules: Rules = {
    firstName: [required('Enter your first name')],
    lastName: [required('Enter your last name')],
    phone: [required(`Enter a phone number, like ${market.phone.example}`), phone(market.phone.pattern, `Enter a phone number, like ${market.phone.example}`)],
    email: [required('Enter an email address, like sam@example.com'), email('Enter an email address, like sam@example.com')],
    postcode: [required(`Enter a valid ${market.postcode.label.toLowerCase()}`), postcode(market.postcode.pattern, `Enter a valid ${market.postcode.label.toLowerCase()}`)],
    terms: [checked('Agree to the terms to send your request')],
  };
  if (preset === 'vet') rules.petName = [required("Enter your pet's name"), maxLength(40, "Enter your pet's name")];
  return rules;
}

/** Rules for the wizard step the visitor is leaving; other steps need no answer. */
export function stepRules(step: StepId): Rules {
  if (step === 'service') return { service: [required('Choose a service')] };
  if (step === 'patient') return { patientType: [required('Choose new or returning patient')] };
  if (step === 'when') return { day: [required('Choose a day')], windowId: [required('Choose a time')] };
  return {};
}

const text = (v: FieldValue) => (typeof v === 'string' ? v.trim() : '');
const on = (v: FieldValue) => v === true || v === 'on';

export function buildAppointmentInput(
  form: Record<string, FieldValue>,
  ctx: { state: BookingState; consentAt: string; clientRef: string },
): LeadInput<AppointmentPayload> {
  const s = ctx.state;
  if (!s.service || !s.day || !s.windowId || !s.patientType) throw new Error('Booking is incomplete');
  const payload: AppointmentPayload = {
    service: s.service,
    provider: s.provider,
    patientType: s.patientType,
    day: s.day,
    windowId: s.windowId,
    forWhom: s.forWhom,
  };
  const petName = text(form.petName) || s.pet?.name;
  if (petName) payload.pet = { name: petName, species: s.pet?.species ?? 'other' };
  return {
    kind: 'appointment',
    contact: { firstName: text(form.firstName), lastName: text(form.lastName), phone: text(form.phone), email: text(form.email) },
    postcode: text(form.postcode),
    consent: { terms: on(form.terms), remindersSms: on(form.remindersSms), marketingSms: on(form.marketingSms), marketingEmail: on(form.marketingEmail), at: ctx.consentAt },
    payload,
    clientRef: ctx.clientRef,
  };
}
