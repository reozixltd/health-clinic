import { el, fill } from '@/core/console/dom';
import { formatDay } from '@/core/format';
import { KIND_LABELS, STATUS_LABELS, type Lead, type LeadStatus } from '@/core/leads/types';
import type { BookingConfig, Provider, Service } from '@/domain/types';
import { renderTimeline, type TimelineItem } from '@/modules/reminders/timeline';

export interface DetailCtx {
  locale: string;
  timeZone: string;
  preset: 'allied-health' | 'vet';
  services: Pick<Service, 'slug' | 'title'>[];
  providers: Pick<Provider, 'slug' | 'name'>[];
  windows: BookingConfig['windows'];
}

type Appointment = { service: string; provider: string; patientType: string; day: string; windowId: string; forWhom: string; pet?: { name: string; species: string } };
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Label and value rows summarising the request. */
export function requestLines(lead: Lead, ctx: DetailCtx): [string, string][] {
  const vet = ctx.preset === 'vet';
  if (lead.kind === 'appointment') {
    const p = lead.payload as unknown as Appointment;
    const who = vet
      ? p.pet ? `${p.pet.name}, ${p.pet.species}` : 'Not given'
      : `${cap(p.patientType)} patient${p.forWhom === 'someone-else' ? ', booking for someone else' : ''}`;
    return [
      ['Service', ctx.services.find((s) => s.slug === p.service)?.title ?? p.service],
      [vet ? 'Vet' : 'Clinician', p.provider === 'first-available' ? 'First available' : ctx.providers.find((x) => x.slug === p.provider)?.name ?? p.provider],
      [vet ? 'Pet' : 'Patient', who],
      ['Day', formatDay(p.day, ctx.locale)],
      ['Time', ctx.windows.find((w) => w.id === p.windowId)?.label ?? p.windowId],
    ];
  }
  return Object.entries(lead.payload).map(([k, v]) => [cap(k.replace(/([A-Z])/g, ' $1').toLowerCase()), String(v)]);
}

/** Short inbox summary line. */
export function describeLead(lead: Lead, ctx: DetailCtx): string {
  const lines = requestLines(lead, ctx);
  if (lead.kind === 'appointment') return [lines[0], lines[3], lines[4]].map((l) => l[1]).join(', ');
  return lines[0] ? lines[0][1] : 'No details';
}

const stamp = (iso: string, ctx: DetailCtx) =>
  new Intl.DateTimeFormat(ctx.locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: ctx.timeZone }).format(new Date(iso));
const rows = (pairs: [string, string][]) => el('dl', { class: 'detail__list' }, ...pairs.flatMap(([k, v]) => [el('dt', {}, k), el('dd', {}, v)]));
const yes = (b: boolean) => (b ? 'Yes' : 'No');

export interface DetailOptions {
  ctx: DetailCtx;
  demoMode: boolean;
  /** Scheduled message previews, or null when the reminders module is off. */
  messages: TimelineItem[] | null;
  onStatus: (status: LeadStatus) => void;
  onNote: (note: string) => void;
}

const ACTIONS: Record<LeadStatus, { label: string; to: LeadStatus; variant: string }[]> = {
  new: [{ label: 'Confirm', to: 'confirmed', variant: 'primary' }, { label: 'Decline', to: 'declined', variant: 'secondary' }],
  confirmed: [{ label: 'Mark done', to: 'done', variant: 'primary' }, { label: 'Decline', to: 'declined', variant: 'secondary' }],
  declined: [],
  done: [],
};

export function renderDetail(container: HTMLElement, lead: Lead, opts: DetailOptions): void {
  const { ctx } = opts;
  const c = lead.consent;
  const note = el('textarea', { id: 'note-text', rows: '3' });
  const noteForm = el('form', { class: 'detail__note' },
    el('label', { for: 'note-text' }, 'Add a note'), note, el('button', { type: 'submit', class: 'console-btn console-btn--secondary' }, 'Save note'));
  noteForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (note.value.trim()) opts.onNote(note.value);
  });
  const timeline = el('div', { 'data-timeline': '' });
  if (opts.messages) renderTimeline(timeline, opts.messages, { demoMode: opts.demoMode, locale: ctx.locale });
  else timeline.append(el('p', { 'data-timeline-off': '' }, 'Message previews are off.'));
  const actions = ACTIONS[lead.status].map((a) => {
    const b = el('button', { type: 'button', class: `console-btn console-btn--${a.variant}` }, a.label);
    b.addEventListener('click', () => opts.onStatus(a.to));
    return b;
  });
  fill(container,
    el('h2', { id: 'detail-title', tabindex: '-1' }, `${lead.contact.firstName} ${lead.contact.lastName}`),
    el('p', { class: 'detail__status' }, `${KIND_LABELS[lead.kind]}, ${STATUS_LABELS[lead.status]}. Received ${stamp(lead.createdAt, ctx)}.`),
    actions.length > 0 && el('div', { class: 'detail__actions' }, ...actions),
    el('h3', {}, 'Contact'),
    rows([['Phone', lead.contact.phone], ['Email', lead.contact.email], ['Postcode', lead.postcode]]),
    el('h3', {}, 'Request'),
    rows(requestLines(lead, ctx)),
    el('h3', {}, 'Consent record'),
    rows([
      ['Terms agreed', yes(c.terms)], ['Reminders by SMS', yes(c.remindersSms)],
      ['Marketing by SMS', yes(c.marketingSms)], ['Marketing by email', yes(c.marketingEmail)],
      ['Recorded', c.at ? stamp(c.at, ctx) : 'No consent was asked'],
    ]),
    el('h3', {}, 'History and notes'),
    lead.history.length === 0 ? el('p', {}, 'Nothing yet.') : el('ul', { class: 'detail__history' },
      ...lead.history.map((h) => el('li', {}, `${stamp(h.at, ctx)}: ${h.type === 'status' ? `Marked ${STATUS_LABELS[h.value as LeadStatus]?.toLowerCase() ?? h.value}` : h.value}`))),
    noteForm,
    el('h3', {}, 'Message timeline'),
    timeline,
  );
}
