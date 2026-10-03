import { describe, expect, it } from 'vitest';
import { el } from '@/core/console/dom';
import { filterLeads, renderInbox } from '@/core/console/inbox';
import type { Lead } from '@/core/leads/types';
import { renderTimeline } from '@/modules/reminders/timeline';

const lead = (id: string, kind: Lead['kind'], status: Lead['status']): Lead => ({
  id, kind, status, createdAt: '2026-10-01T00:00:00Z', history: [], postcode: '3000', clientRef: id, payload: {},
  contact: { firstName: 'A<b>', lastName: id, phone: '1', email: 'a@b.c' },
  consent: { terms: true, remindersSms: true, marketingSms: false, marketingEmail: false, at: null },
});

describe('console dom', () => {
  it('el sets text, never HTML', () => {
    const p = el('p', { class: 'x' }, '<img src=x onerror=alert(1)>');
    expect(p.textContent).toBe('<img src=x onerror=alert(1)>');
    expect(p.children.length).toBe(0);
    expect(p.className).toBe('x');
  });
  it('skips false attributes and empty children', () => {
    const b = el('button', { disabled: false, hidden: true }, null, false, 'ok');
    expect(b.hasAttribute('disabled')).toBe(false);
    expect(b.hasAttribute('hidden')).toBe(true);
    expect(b.textContent).toBe('ok');
  });
});

describe('inbox', () => {
  const leads = [lead('1', 'appointment', 'new'), lead('2', 'referral', 'new'), lead('3', 'appointment', 'done')];
  it('filters by kind and status', () => {
    expect(filterLeads(leads, { kind: 'appointment' }).map((l) => l.id)).toEqual(['1', '3']);
    expect(filterLeads(leads, { kind: 'appointment', status: 'done' }).map((l) => l.id)).toEqual(['3']);
    expect(filterLeads(leads, { kind: '', status: '' })).toHaveLength(3);
  });
  it('renders rows as text, marks the selection, and reports clicks', () => {
    const list = document.createElement('ul');
    let picked = '';
    renderInbox(list, leads, { selectedId: '2', describe: () => 'x', onSelect: (id) => (picked = id) });
    const rows = list.querySelectorAll('button');
    expect(rows).toHaveLength(3);
    expect(rows[1].getAttribute('aria-current')).toBe('true');
    expect(list.querySelector('b')).toBeNull();
    rows[0].click();
    expect(picked).toBe('1');
  });
  it('shows an empty message', () => {
    const list = document.createElement('ul');
    renderInbox(list, [], { selectedId: null, describe: () => '', onSelect: () => {} });
    expect(list.textContent).toContain('No requests here yet');
  });
});

describe('timeline', () => {
  it('shows reasons in words and the demo label', () => {
    const box = document.createElement('div');
    const base = { channel: 'sms' as const, text: 'Hi' };
    renderTimeline(box, [
      { ...base, templateId: 'confirmation', sendAt: '2026-10-09T08:00:00+11:00' },
      { ...base, templateId: 'review-request', sendAt: null, skippedReason: 'no-consent', marketing: true },
      { ...base, templateId: 'reminder', sendAt: null, skippedReason: 'not-confirmed' },
      { ...base, templateId: 'estimate-follow-up', sendAt: null, skippedReason: 'status-changed' },
      { ...base, templateId: 'recall', sendAt: null, skippedReason: 'not-applicable' },
    ], { demoMode: true });
    const t = box.textContent!;
    for (const w of ['No marketing consent', 'Waits for confirmation', "Stopped: you've already replied", 'Not for this service', 'Fri 9 Oct, 8:00 am']) expect(t).toContain(w);
    expect(box.querySelectorAll('.timeline__preview')).toHaveLength(5);
    renderTimeline(box, [{ ...base, templateId: 'confirmation', sendAt: '2026-10-09T08:00:00+11:00' }], { demoMode: false });
    expect(box.textContent).not.toContain('Preview, not sent');
  });
});
