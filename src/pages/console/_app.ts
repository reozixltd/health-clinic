import { el, fill } from '@/core/console/dom';
import { filterLeads, renderInbox } from '@/core/console/inbox';
import { initShell } from '@/core/console/shell';
import { formatDay } from '@/core/format';
import { getLeadRepository, LEAD_STATUSES, STATUS_LABELS, type Lead, type LeadKind, type LeadStatus } from '@/core/leads';
import { leadsToCsv } from '@/core/leads/csv';
import { getStorage } from '@/core/storage';
import { getMarket, type MarketId } from '@/domain/markets';
import type { BookingConfig, MessageTemplate, Provider, Service } from '@/domain/types';
import { schedule, type ScheduleContext } from '@/modules/reminders/schedule';
import { describeLead, renderDetail, type DetailCtx } from './_detail';
import { sampleLeads, shouldAutoSeed } from './_samples';

interface Data {
  siteId: string; preset: 'allied-health' | 'vet'; leadKinds: LeadKind[]; messages: MessageTemplate[]; clinicName: string; demo: boolean; reminders: boolean;
  marketId: MarketId; timeZones: Record<string, string>; reviewUrls: Record<string, string>;
  windows: BookingConfig['windows']; services: Service[]; providers: Provider[]; pricesStale: boolean;
}

const PLURAL: Record<LeadKind, string> = { appointment: 'Appointments', referral: 'Referrals', estimate: 'Estimates', enquiry: 'Enquiries' };
const lastSentence = (s: string) => s.split(/(?<=\.)\s+/).pop() ?? '';

export function initConsole(): void {
  const data = JSON.parse(document.getElementById('console-data')!.textContent!) as Data;
  const active = (document.documentElement.getAttribute('data-market') as MarketId | null) ?? data.marketId;
  const market = getMarket(active);
  const tz = data.timeZones[active] ?? Object.values(data.timeZones)[0]!;
  const ctx: DetailCtx = { locale: market.locale, timeZone: tz, preset: data.preset, services: data.services, providers: data.providers, windows: data.windows };
  const repo = getLeadRepository(`health:v1:${data.siteId}`, { demo: data.demo });
  const root = document.getElementById('console-root')!;
  const $ = <T extends HTMLElement>(sel: string) => root.querySelector<T>(sel)!;
  const state = { leads: [] as Lead[], kind: '' as LeadKind | '', status: '' as LeadStatus | '', selected: null as string | null };

  const say = (text: string) => { $('[data-message]').textContent = text; };

  function messagesFor(lead: Lead) {
    if (!data.reminders) return null;
    const p = lead.payload as { service?: string; day?: string; windowId?: string };
    const window = data.windows.find((w) => w.id === p.windowId);
    const visit: ScheduleContext['visit'] = lead.kind === 'appointment' && p.day && window
      ? { startIso: `${p.day}T${window.start}`, windowLabel: window.label, dayLabel: formatDay(p.day, market.locale), service: p.service ?? '' }
      : undefined;
    const sched: ScheduleContext = {
      now: new Date().toISOString(), clinicName: data.clinicName, reviewLink: data.reviewUrls[active] ?? '', timeZone: tz, visit,
      optOut: { sms: lastSentence(market.consent.sms), email: lastSentence(market.consent.email) },
    };
    return schedule(lead, data.messages, sched).map((m) => ({ ...m, marketing: data.messages.find((t) => t.id === m.templateId)?.marketing }));
  }

  function renderChips() {
    const chip = (kind: LeadKind | '', label: string) => {
      const b = el('button', { type: 'button', class: 'chip', 'data-kind': kind, 'aria-pressed': String(state.kind === kind) }, label);
      b.addEventListener('click', () => { state.kind = kind; renderChips(); render(); });
      return b;
    };
    fill($('[data-chips]'), chip('', 'All'), ...data.leadKinds.map((k) => chip(k, PLURAL[k])));
  }

  function render() {
    const shown = filterLeads(state.leads, state);
    renderInbox($('[data-inbox]'), shown, { demo: data.demo, selectedId: state.selected, describe: (l) => describeLead(l, ctx), onSelect: (id) => { state.selected = id; render(); $('#detail-title')?.focus(); } });
    const lead = state.leads.find((l) => l.id === state.selected);
    const detail = $('[data-detail]');
    if (!lead) { fill(detail, el('p', {}, 'Choose a request to see its details.')); return; }
    renderDetail(detail, lead, {
      ctx, demoMode: data.demo, messages: messagesFor(lead),
      onStatus: (s) => void change(() => repo.updateStatus(lead.id, s), `Marked ${STATUS_LABELS[s].toLowerCase()}.`),
      onNote: (n) => void change(() => repo.addNote(lead.id, n), 'Note saved.'),
    });
  }

  async function refresh() { state.leads = await repo.list(); render(); }
  async function change(fn: () => Promise<unknown>, done: string) {
    try { await fn(); say(done); } catch (e) { say(e instanceof Error ? e.message : 'That did not save.'); }
    await refresh();
    $('#detail-title')?.focus();
  }

  async function load() {
    try { await repo.seed(sampleLeads(new Date(), { preset: { id: data.preset, leadKinds: data.leadKinds }, clinic: { timeZone: tz } })); say('Sample requests loaded.'); }
    catch (e) { say(e instanceof Error ? e.message : 'Could not load samples.'); }
    await refresh();
  }

  // Sample data and clearing are demo features: a live console never seeds or wipes the store.
  if (data.demo) {
    $('[data-load]').addEventListener('click', () => void load());
    $('[data-clear]').addEventListener('click', async () => {
      if (!window.confirm('Remove every request on this device?')) return;
      await repo.clear(); state.selected = null; say('All requests removed.'); await refresh();
    });
  }
  $('[data-export]').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([leadsToCsv(state.leads)], { type: 'text/csv;charset=utf-8' }));
    const a = el('a', { href: url, download: `${data.siteId}-requests.csv` });
    document.body.append(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    say('Requests exported.');
  });
  const select = $<HTMLSelectElement>('[data-status-filter]');
  select.append(...LEAD_STATUSES.map((s) => el('option', { value: s }, STATUS_LABELS[s])));
  select.addEventListener('change', () => { state.status = select.value as LeadStatus | ''; render(); });

  if (data.pricesStale) {
    const warn = $('[data-stale]'); warn.hidden = false;
    warn.textContent = 'Price list last reviewed over 180 days ago. Check the prices before the next review date.';
  }

  initShell(root, {
    credentials: { email: 'clinic@demo.reozix', password: 'demo1234' },
    sessionKey: `health:v1:${data.siteId}:console-session`,
    onSignedIn() {
      const flag = `health:v1:${data.siteId}:seeded`;
      const store = getStorage();
      renderChips();
      void (async () => {
        if (shouldAutoSeed(data.demo, store.getItem(flag))) { await load(); try { store.setItem(flag, '1'); } catch { /* seeds again next visit */ } }
        else await refresh();
      })();
    },
  });
}
