import type { LeadKind } from '@/core/leads/types';
import type { FundingKey, MarketId } from './markets';

export interface Provider {
  slug: string;
  name: string;
  role: string;
  /** `byMarket` replaces body and number when the visitor's market is CA (Fernway demo). */
  registration: { body: string; number: string; byMarket?: { CA: { body: string; number: string } } };
  languages: string[];
  services: string[];
  acceptingNew: boolean;
  bio: string;
  photoSlot: string;
}

export interface Service {
  slug: string;
  title: string;
  summary: string;
  duration: string;
  fromPrice?: number;
  whatToExpect: string[];
  providers: string[];
  faqs: { q: string; a: string }[];
}

/** Allied health fee; one file serves every market (amount keyed by market). */
export interface Fee {
  service: string;
  label: string;
  amount: Partial<Record<MarketId, number>>;
  funding: FundingKey[];
}

/** Vet price list line. */
export interface PriceItem {
  group: string;
  label: string;
  amount: number;
  unit?: string;
}

export interface Clinic {
  name: string;
  legalName: string;
  legalId: string;
  phone: string;
  mobile?: string;
  email: string;
  address: { street: string; locality: string; region: string; postcode: string; country: string };
  timeZone: string;
  hours: { days: string[]; opens: string; closes: string }[];
  emergency: { text: string; phone?: string; href?: string };
  owner?: { name: string; group?: string; independent: boolean };
  map: { lat: number; lng: number };
  registerUrl?: string;
  /** Public page where patients leave a review (AU shows a link, no quotes). */
  reviewsUrl?: string;
  /** Estimates above this amount need a written estimate (Task 14; default 500). */
  estimateThreshold?: number;
}

export interface BookingConfig {
  provider: 'none' | 'embed' | 'link';
  url?: string;
  serviceParam?: string;
  windows: { id: string; label: string; start: string; end: string }[];
  leadDays: number;
  horizonDays: number;
  daysOff: number[];
  confirmPromise: string;
}

export interface MessageTemplate {
  id:
    | 'confirmation'
    | 'reminder'
    | 'review-request'
    | 'recall'
    | 'vaccination-recall'
    | 'parasite-reminder'
    | 'referral-ack'
    | 'estimate-follow-up';
  channel: 'sms' | 'email';
  marketing: boolean;
  appliesTo: LeadKind;
  trigger: { on: 'created' | 'confirmed' | 'visit'; offsetHours: number; repeatEveryHours?: number };
  whenService?: string[];
  body: string;
}
