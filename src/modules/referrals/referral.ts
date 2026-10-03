import type { FormValues } from '@/core/forms';
import type { LeadInput } from '@/core/leads/types';
import { email, maxLength, oneOf, phone, required, type Rule, type Rules } from '@/core/leads/validation';

export const URGENCIES = ['Routine', 'Soon', 'Urgent'] as const;

type Lazy<T> = T | (() => T);
const resolve = <T,>(v: Lazy<T>): T => (typeof v === 'function' ? (v as () => T)() : v);

interface RuleOptions {
  /** A sample local number for the phone message, like "03 5550 1200". May be a getter. */
  phoneExample?: Lazy<string>;
}

/** Phone rule whose pattern (and example) are read each time it runs, so a market switch applies without rebuilding rules. */
function lazyPhone(pattern: Lazy<RegExp>, example?: Lazy<string>): Rule {
  return (v) => {
    const eg = example && resolve(example);
    return phone(resolve(pattern), `Enter a phone number${eg ? `, like ${eg}` : ''}.`)(v);
  };
}

export function referralRules(
  market: { phone: { pattern: Lazy<RegExp> } },
  services: readonly string[],
  opts: RuleOptions = {},
): Rules {
  const phoneRule = lazyPhone(market.phone.pattern, opts.phoneExample);
  return {
    referrerName: [required('Enter your name.'), maxLength(80, 'Use 80 characters or fewer.')],
    practice: [required('Enter your practice name.'), maxLength(80, 'Use 80 characters or fewer.')],
    referrerPhone: [phoneRule],
    referrerEmail: [required('Enter your email address.'), email('Enter an email address, like name@example.com.')],
    patientFirstName: [required("Enter the patient's first name."), maxLength(40, 'Use 40 characters or fewer.')],
    patientPhone: [required("Enter the patient's phone number."), phoneRule],
    service: [required('Choose the service wanted.'), oneOf(services, 'Choose the service from the list.')],
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
