import type { FormValues } from '@/core/forms';
import type { LeadInput } from '@/core/leads/types';
import { email, maxLength, oneOf, phone, required, type Rules } from '@/core/leads/validation';
import type { MarketPack } from '@/domain/markets';

export const URGENCIES = ['Routine', 'Soon', 'Urgent'] as const;

interface RuleOptions {
  /** Service slugs a referral can ask for. */
  services?: readonly string[];
  /** A sample local number for the phone message, like "03 5550 1200". */
  phoneExample?: string;
}

export function referralRules(market: Pick<MarketPack, 'phone'>, opts: RuleOptions = {}): Rules {
  const phoneMsg = `Enter a phone number${opts.phoneExample ? `, like ${opts.phoneExample}` : ''}.`;
  return {
    referrerName: [required('Enter your name.'), maxLength(80, 'Use 80 characters or fewer.')],
    practice: [required('Enter your practice name.'), maxLength(80, 'Use 80 characters or fewer.')],
    referrerPhone: [phone(market.phone.pattern, phoneMsg)],
    referrerEmail: [required('Enter your email address.'), email('Enter an email address, like name@example.com.')],
    patientFirstName: [required("Enter the patient's first name."), maxLength(40, 'Use 40 characters or fewer.')],
    patientPhone: [required("Enter the patient's phone number."), phone(market.phone.pattern, phoneMsg)],
    service: [required('Choose the service wanted.'), ...(opts.services ? [oneOf(opts.services, 'Choose the service from the list.')] : [])],
    urgency: [required('Choose how soon.'), oneOf(URGENCIES, 'Choose how soon from the list.')],
  };
}

/** Referrer is the contact. Patient first name and phone only: no clinical details are collected (spec D7). */
export function buildReferralInput(
  form: FormValues,
  ctx: { clientRef: string; now: string },
): LeadInput<{ practice: string; patientFirstName: string; patientPhone: string; service: string; urgency: string }> {
  const s = (k: string) => String(form[k] ?? '').trim();
  const [firstName = '', ...rest] = s('referrerName').split(/\s+/);
  return {
    kind: 'referral',
    contact: { firstName, lastName: rest.join(' '), phone: s('referrerPhone'), email: s('referrerEmail') },
    postcode: '',
    consent: { terms: false, remindersSms: false, marketingSms: false, marketingEmail: false, at: null },
    payload: { practice: s('practice'), patientFirstName: s('patientFirstName'), patientPhone: s('patientPhone'), service: s('service'), urgency: s('urgency') },
    clientRef: ctx.clientRef,
  };
}
