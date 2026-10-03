import { KIND_LABELS, STATUS_LABELS, type Lead, type LeadKind, type LeadStatus } from '../leads/types';
import { el, fill } from './dom';

export interface InboxFilter { kind?: LeadKind | ''; status?: LeadStatus | '' }

export function filterLeads(leads: readonly Lead[], filter: InboxFilter): Lead[] {
  return leads.filter((l) => (!filter.kind || l.kind === filter.kind) && (!filter.status || l.status === filter.status));
}

export interface InboxOptions {
  selectedId: string | null;
  /** One line summarising the request, e.g. "Physiotherapy, Fri 9 Oct, Morning". */
  describe: (lead: Lead) => string;
  onSelect: (id: string) => void;
}

/** One button per lead inside `list` (a ul). The selected row carries aria-current. */
export function renderInbox(list: HTMLElement, leads: readonly Lead[], opts: InboxOptions): void {
  if (leads.length === 0) {
    fill(list, el('li', { class: 'inbox__empty' }, 'No requests here yet. Requests sent from the booking page appear in this list, or use Load samples.'));
    return;
  }
  fill(list, ...leads.map((lead) => {
    const selected = lead.id === opts.selectedId;
    const button = el('button', { type: 'button', class: 'inbox__row', 'data-lead': lead.id, 'aria-current': selected ? 'true' : undefined },
      el('span', { class: 'inbox__name' }, `${lead.contact.firstName} ${lead.contact.lastName}`),
      el('span', { class: 'inbox__meta' }, `${KIND_LABELS[lead.kind]}, ${opts.describe(lead)}`),
      el('span', { class: `inbox__status inbox__status--${lead.status}` }, STATUS_LABELS[lead.status]));
    button.addEventListener('click', () => opts.onSelect(lead.id));
    return el('li', {}, button);
  }));
}
