/** Lead domain types shared by every form, the repository and the console. */

export const LEAD_KINDS = ['appointment', 'referral', 'estimate', 'enquiry'] as const;
export type LeadKind = (typeof LEAD_KINDS)[number];

export const KIND_LABELS: Record<LeadKind, string> = {
  appointment: 'Appointment',
  referral: 'Referral',
  estimate: 'Estimate',
  enquiry: 'Enquiry',
};

export const LEAD_STATUSES = ['new', 'confirmed', 'declined', 'done'] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'New',
  confirmed: 'Confirmed',
  declined: 'Declined',
  done: 'Done',
};

export interface Contact {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}

export interface Consent {
  terms: boolean;
  remindersSms: boolean;
  marketingSms: boolean;
  marketingEmail: boolean;
  /** ISO time consent was given, or null when none was asked. */
  at: string | null;
}

/** What a public form submits. `payload` carries the kind-specific fields. */
export interface LeadInput<P = Record<string, unknown>> {
  kind: LeadKind;
  contact: Contact;
  postcode: string;
  consent: Consent;
  payload: P;
  /** Client-generated id so a double submit never creates two leads. */
  clientRef: string;
}

export interface LeadEvent {
  at: string;
  type: 'status' | 'note';
  value: string;
}

export interface Lead<P = Record<string, unknown>> extends LeadInput<P> {
  id: string;
  status: LeadStatus;
  createdAt: string;
  history: LeadEvent[];
}
