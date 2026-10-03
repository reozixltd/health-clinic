import { describe, expect, it } from 'vitest';
import type { Lead } from '@/core/leads/types';
import { alliedHealth } from '@/presets/allied-health';
import { vet } from '@/presets/vet';
import { render, TEMPLATE_VARS, varsIn } from '@/modules/reminders/render';
import { schedule, type ScheduleContext } from '@/modules/reminders/schedule';

function lead(over: Partial<Lead> = {}, consent: Partial<Lead['consent']> = {}): Lead {
  return {
    id: 'l1', kind: 'appointment', status: 'confirmed', createdAt: '2026-10-01T10:00:00+10:00', history: [],
    contact: { firstName: 'Sam', lastName: 'Lee', phone: '0400', email: 's@x.y' }, postcode: '3000', clientRef: 'c', payload: {},
    consent: { terms: true, remindersSms: true, marketingSms: false, marketingEmail: false, at: null, ...consent },
    ...over,
  };
}
const ctx = (service = 'consultations'): ScheduleContext => ({
  now: '2026-10-02T09:00:00+10:00', clinicName: 'Fernway', reviewLink: 'https://r.example/f',
  optOut: { sms: 'Reply STOP to opt out.', email: 'Unsubscribe any time.' }, timeZone: 'Australia/Melbourne',
  visit: { startIso: '2026-10-09T08:00:00+11:00', windowLabel: 'Morning', dayLabel: 'Fri 9 Oct', service },
});
const by = (m: ReturnType<typeof schedule>, id: string) => m.find((x) => x.templateId === id)!;
const allied = alliedHealth.messages;

describe('reminders schedule', () => {
  it('confirmed allied appointment without marketing consent', () => {
    const m = schedule(lead(), allied, ctx());
    expect(by(m, 'confirmation').skippedReason).toBeUndefined();
    expect(by(m, 'reminder').sendAt).not.toBeNull();
    expect(by(m, 'review-request').skippedReason).toBe('no-consent');
    expect(by(m, 'recall').skippedReason).toBe('no-consent');
  });
  it('with marketing consent review-request is scheduled 4h after window start with link and opt-out', () => {
    const m = by(schedule(lead({}, { marketingSms: true }), allied, ctx()), 'review-request');
    expect(m.sendAt).toBe('2026-10-09T12:00:00+11:00');
    expect(m.text).toContain('https://r.example/f');
    expect(m.text).toContain('Reply STOP');
  });
  it('review request never asks for a testimonial', () => {
    const body = allied.find((t) => t.id === 'review-request')!.body;
    expect(body).toContain('{reviewLink}');
    expect(body).not.toMatch(/testimonial|recommend us on our website/i);
  });
  it('new appointment waits for confirmation', () => {
    const c = by(schedule(lead({ status: 'new' }), allied, ctx()), 'confirmation');
    expect(c.sendAt).toBeNull();
    expect(c.skippedReason).toBe('not-confirmed');
  });
  it('vaccination recall only for vaccination visits', () => {
    expect(by(schedule(lead(), vet.messages, ctx('consultations')), 'vaccination-recall').skippedReason).toBe('not-applicable');
    expect(by(schedule(lead(), vet.messages, ctx('vaccinations')), 'vaccination-recall').sendAt).not.toBeNull();
  });
  it('estimate follow-up stops once status changes', () => {
    const est = (status: Lead['status']) => by(schedule(lead({ kind: 'estimate', status }), vet.messages, ctx()), 'estimate-follow-up');
    expect(est('new').sendAt).toBe('2026-10-03T10:00:00+10:00');
    expect(est('confirmed').skippedReason).toBe('status-changed');
  });
  it('declined lead has no messages', () => {
    expect(schedule(lead({ status: 'declined' }), allied, ctx())).toEqual([]);
  });
  it('times are in the clinic zone', () => {
    const m = schedule(lead(), allied, ctx());
    expect(by(m, 'reminder').sendAt).toBe('2026-10-08T08:00:00+11:00');
  });
  it('referral acknowledgement sends on creation', () => {
    expect(by(schedule(lead({ kind: 'referral', status: 'new' }), allied, ctx()), 'referral-ack').sendAt).toBe('2026-10-01T10:00:00+10:00');
  });
  it('skips sms reminders without reminder consent', () => {
    expect(by(schedule(lead({}, { remindersSms: false }), allied, ctx()), 'reminder').skippedReason).toBe('no-consent');
  });
});

describe('reminders templates', () => {
  const all = [...alliedHealth.messages, ...vet.messages];
  it('use only known variables', () => {
    for (const t of all) for (const v of varsIn(t.body)) expect(TEMPLATE_VARS).toContain(v);
  });
  it('sms ends with clinic name; marketing includes opt-out', () => {
    for (const t of all) {
      if (t.channel === 'sms') expect(t.body.endsWith('{clinicName}')).toBe(true);
      if (t.marketing) expect(t.body).toContain('{optOut}');
    }
  });
  it('render leaves unknown placeholders visible', () => {
    expect(render('Hi {a} {b}', { a: 'x' })).toBe('Hi x {b}');
  });
});
