import { el, fill } from '@/core/console/dom';
import { formatDay } from '@/core/format';
import type { ScheduledMessage } from './schedule';

export type TimelineItem = ScheduledMessage & { marketing?: boolean };

const LABELS: Record<ScheduledMessage['templateId'], string> = {
  confirmation: 'Confirmation',
  reminder: 'Reminder',
  'review-request': 'Review request',
  recall: 'Recall',
  'vaccination-recall': 'Vaccination recall',
  'parasite-reminder': 'Parasite treatment reminder',
  'referral-ack': 'Referral acknowledgement',
  'estimate-follow-up': 'Estimate follow-up',
};

function reason(item: TimelineItem): string {
  switch (item.skippedReason) {
    case 'no-consent': return item.marketing === false ? 'No consent for reminders' : 'No marketing consent';
    case 'not-confirmed': return 'Waits for confirmation';
    case 'status-changed': return "Stopped: you've already replied";
    case 'not-applicable': return 'Not for this service';
    default: return '';
  }
}

/** "2026-10-09T08:00:00+11:00" → "Fri 9 Oct, 8:00 am", read as the clinic's wall time. */
function when(iso: string, locale: string): string {
  const h = Number(iso.slice(11, 13));
  return `${formatDay(iso.slice(0, 10), locale)}, ${h % 12 || 12}:${iso.slice(14, 16)} ${h < 12 ? 'am' : 'pm'}`;
}

export function renderTimeline(container: HTMLElement, items: readonly TimelineItem[], opts: { demoMode: boolean; locale?: string }): void {
  if (items.length === 0) {
    fill(container, el('p', {}, 'No messages will be sent for this request.'));
    return;
  }
  fill(container, el('ol', { class: 'timeline' }, ...items.map((item) => {
    const why = reason(item);
    return el('li', { class: 'timeline__item', 'data-message': item.templateId, 'data-skipped': item.skippedReason },
      el('h4', {}, LABELS[item.templateId]),
      el('p', { class: 'timeline__meta' }, `${item.channel === 'sms' ? 'SMS' : 'Email'}, ${item.sendAt ? when(item.sendAt, opts.locale ?? 'en-AU') : 'not scheduled'}`),
      why && el('p', { class: 'timeline__reason' }, why),
      el('p', { class: 'timeline__text' }, item.text),
      opts.demoMode && el('p', { class: 'timeline__preview' }, 'Preview, not sent'));
  })));
}
