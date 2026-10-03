import type { Lead } from '@/core/leads/types';
import { addHoursIso } from '@/core/format';
import type { MessageTemplate } from '@/domain/types';
import { render } from './render';

export interface ScheduleContext {
  now: string;
  clinicName: string;
  reviewLink: string;
  optOut: { sms: string; email: string };
  timeZone: string;
  visit?: { startIso: string; windowLabel: string; dayLabel: string; service: string };
}

export interface ScheduledMessage {
  templateId: MessageTemplate['id'];
  channel: 'sms' | 'email';
  sendAt: string | null;
  text: string;
  skippedReason?: 'no-consent' | 'not-confirmed' | 'status-changed' | 'not-applicable';
}

function confirmedAt(lead: Lead, ctx: ScheduleContext): string {
  const event = [...lead.history].reverse().find((e) => e.type === 'status' && e.value === 'confirmed');
  return event?.at ?? ctx.now;
}

function hasConsent(lead: Lead, t: MessageTemplate): boolean {
  const c = lead.consent;
  if (t.channel === 'sms') return t.marketing ? c.marketingSms : c.remindersSms;
  return t.marketing ? c.marketingEmail : true;
}

/** The message timeline for one lead: what sends when, and why anything is held back. */
export function schedule(lead: Lead, templates: MessageTemplate[], ctx: ScheduleContext): ScheduledMessage[] {
  if (lead.status === 'declined') return [];
  const vars = {
    firstName: lead.contact.firstName,
    clinicName: ctx.clinicName,
    reviewLink: ctx.reviewLink,
    dayLabel: ctx.visit?.dayLabel ?? '',
    windowLabel: ctx.visit?.windowLabel ?? '',
    service: ctx.visit?.service ?? '',
  };
  const out: ScheduledMessage[] = [];
  for (const t of templates) {
    if (t.appliesTo !== lead.kind) continue;
    const text = render(t.body, { ...vars, optOut: ctx.optOut[t.channel] });
    const held = (skippedReason: ScheduledMessage['skippedReason']): void => {
      out.push({ templateId: t.id, channel: t.channel, sendAt: null, text, skippedReason });
    };
    const { on, offsetHours } = t.trigger;
    if (t.whenService && (!ctx.visit || !t.whenService.includes(ctx.visit.service))) { held('not-applicable'); continue; }
    if (t.id === 'estimate-follow-up' && lead.status !== 'new') { held('status-changed'); continue; }
    const needsConfirm = on !== 'created';
    if (needsConfirm && lead.status !== 'confirmed' && lead.status !== 'done') { held('not-confirmed'); continue; }
    if (on === 'visit' && !ctx.visit) { held('not-applicable'); continue; }
    if (!hasConsent(lead, t)) { held('no-consent'); continue; }
    const base = on === 'created' ? lead.createdAt : on === 'confirmed' ? confirmedAt(lead, ctx) : ctx.visit!.startIso;
    out.push({ templateId: t.id, channel: t.channel, sendAt: addHoursIso(base, offsetHours, ctx.timeZone), text });
  }
  return out;
}
