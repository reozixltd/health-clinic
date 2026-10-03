import { formatDay } from '@/core/format';
import type { BookingConfig, Provider, Service } from '@/domain/types';
import type { BookingState } from './state';

export interface CardField { label: string; value: string | null }
export interface CardCtx {
  services: Service[];
  providers: Provider[];
  windows: BookingConfig['windows'];
  preset: 'allied-health' | 'vet';
  locale: string;
}

/** Fields of the appointment card; a null value renders as an empty ruled line. */
export function cardFields(s: BookingState, ctx: CardCtx): CardField[] {
  const vet = ctx.preset === 'vet';
  const service = ctx.services.find((x) => x.slug === s.service)?.title ?? null;
  const clinician = s.provider === 'first-available'
    ? 'First available'
    : ctx.providers.find((p) => p.slug === s.provider)?.name ?? null;
  let who: string | null = null;
  if (vet) who = s.pet ? `${s.pet.name}, ${s.pet.species}` : null;
  else if (s.patientType) {
    who = `${s.patientType === 'new' ? 'New' : 'Returning'} patient`;
    if (s.forWhom === 'someone-else') who += ', booking for someone else';
  }
  return [
    { label: 'Service', value: service },
    { label: vet ? 'Vet' : 'Clinician', value: s.service ? clinician : null },
    { label: vet ? 'Pet' : 'Patient', value: who },
    { label: 'Day', value: s.day ? formatDay(s.day, ctx.locale) : null },
    { label: 'Time', value: ctx.windows.find((w) => w.id === s.windowId)?.label ?? null },
  ];
}
