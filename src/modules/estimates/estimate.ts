import type { LeadInput } from '@/core/leads/types';
import { checked, email, maxLength, oneOf, phone, required, type Rules } from '@/core/leads/validation';
import type { FormValues } from '@/core/forms';
import type { MarketPack } from '@/domain/markets';

export const SPECIES = ['Dog', 'Cat', 'Rabbit', 'Small pet', 'Other'] as const;
export const REASONS = ['Dental treatment', 'Neutering', 'Surgery', 'Ongoing condition care', 'Other planned treatment'] as const;

/** A written estimate is needed from the threshold upwards. */
export function needsWrittenEstimate(amount: number, threshold: number): boolean {
  return amount >= threshold;
}

export function estimateRules(market: { phone: Pick<MarketPack['phone'], 'pattern' | 'example'> }): Rules {
  return {
    petName: [required("Enter your pet's name."), maxLength(60, 'Use 60 characters or fewer.')],
    species: [required('Choose the type of pet.'), oneOf(SPECIES, 'Choose the type of pet from the list.')],
    reason: [required('Choose what the estimate is for.'), oneOf(REASONS, 'Choose what the estimate is for from the list.')],
    firstName: [required('Enter your first name.'), maxLength(60, 'Use 60 characters or fewer.')],
    lastName: [required('Enter your last name.'), maxLength(60, 'Use 60 characters or fewer.')],
    phone: [phone(market.phone.pattern, `Enter a phone number, like ${market.phone.example}.`)],
    email: [required('Enter your email address.'), email('Enter an email address, like name@example.com.')],
    terms: [checked('Tick the box to agree to the terms.')],
  };
}

/** Pet name and species only: no health details are collected (spec D7). */
export function buildEstimateInput(form: FormValues, ctx: { clientRef: string; now: string }): LeadInput<{ petName: string; species: string; reason: string }> {
  const s = (k: string) => String(form[k] ?? '').trim();
  return {
    kind: 'estimate',
    contact: { firstName: s('firstName'), lastName: s('lastName'), phone: s('phone'), email: s('email') },
    postcode: '',
    consent: { terms: form.terms === true, remindersSms: false, marketingSms: false, marketingEmail: false, at: ctx.now },
    payload: { petName: s('petName'), species: s('species'), reason: s('reason') },
    clientRef: ctx.clientRef,
  };
}
