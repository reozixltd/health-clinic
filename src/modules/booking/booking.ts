/** Wizard behaviour for /book/: step navigation, URL state, card updates, validation and sending. */
import { clearErrors, failureNotice, formValues, showErrors } from '@/core/forms';
import type { Lead, LeadRepository } from '@/core/leads';
import { isLikelySpam, validate, type FieldErrors, type Rules } from '@/core/leads/validation';
import { emitBooking } from '@/domain/events';
import type { MarketPack } from '@/domain/markets';
import type { BookingConfig, Provider, Service } from '@/domain/types';
import { cardFields } from './card';
import { buildAppointmentInput, appointmentRules, stepRules, type AppointmentPayload } from './lead';
import { handoffUrl } from './providers';
import { STEP_IDS, firstUnfinished, fromParams, nextStep, prevStep, providersFor, toParams, type BookingState, type StepId } from './state';

export interface BookingData {
  services: Service[];
  providers: Provider[];
  windows: BookingConfig['windows'];
  days: { date: string; label: string }[];
  preset: 'allied-health' | 'vet';
  market: MarketPack;
  booking: BookingConfig;
}
export interface BookingDeps { repo: LeadRepository; data: BookingData; onSent: (lead: Lead<AppointmentPayload>) => void; fallbackPhone: string; fallbackHref: string; now?: () => number }

const str = (v: unknown) => (typeof v === 'string' ? v : '');
const names = (list: string[]) => (list.length > 1 ? `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}` : list[0] ?? '');

export function initBooking(root: HTMLElement, deps: BookingDeps): void {
  const { data } = deps;
  const now = deps.now ?? Date.now;
  const startedAt = now();
  const clientRef = globalThis.crypto?.randomUUID?.() ?? `r-${now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  const form = root.querySelector('form')!;
  const summary = form.querySelector<HTMLElement>('[data-error-summary]')!;
  const status = form.querySelector<HTMLElement>('[data-form-status]')!;
  const send = form.querySelector<HTMLButtonElement>('[data-send]')!;
  const steps = [...form.querySelectorAll<HTMLElement>('[data-step]')];
  const ctx = { services: data.services.map((s) => s.slug), providers: data.providers.map((p) => p.slug), windows: data.windows.map((w) => w.id) };
  const all = appointmentRules(data.market, data.preset);
  const pick = (r: Rules, keys: string[]) => Object.fromEntries(keys.filter((k) => r[k]).map((k) => [k, r[k]!])) as Rules;
  const rules: Record<StepId, Rules> = {
    service: stepRules('service'), clinician: {}, when: stepRules('when'), check: {},
    patient: { ...stepRules('patient'), ...pick(all, ['petName']) },
    you: pick(all, ['firstName', 'lastName', 'phone', 'email', 'postcode', 'terms', ...(data.preset === 'vet' ? ['petName'] : [])]),
  };
  const radios = (name: string) => [...form.querySelectorAll<HTMLInputElement>(`input[name="${name}"]`)];
  let state = fromParams(location.search, ctx);
  let sending = false;
  let held = false;

  const daysBox = form.querySelector<HTMLElement>('[data-days]')!;
  if (data.days.length) {
    daysBox.replaceChildren(...data.days.map((d) => {
      const label = document.createElement('label');
      label.className = 'choice';
      label.innerHTML = '<input type="radio" name="day" aria-describedby="day-error"><span class="choice__text"><strong></strong></span>';
      const input = label.querySelector('input')!;
      input.value = d.date;
      input.id = `day-${d.date}`;
      label.querySelector('strong')!.textContent = d.label;
      return label;
    }));
  } else {
    form.querySelector('[data-no-days]')!.removeAttribute('hidden');
    form.querySelector('[data-when-fields]')!.setAttribute('hidden', '');
    form.querySelector('[data-when-next]')!.setAttribute('hidden', '');
  }

  function applyToDom(s: BookingState): void {
    const set = (name: string, value: string | null) => radios(name).forEach((r) => (r.checked = r.value === value));
    set('service', s.service); set('provider', s.provider); set('patientType', s.patientType);
    set('forWhom', s.forWhom); set('day', s.day); set('windowId', s.windowId);
    const pet = form.elements.namedItem('petName');
    if (pet instanceof HTMLInputElement) pet.value = s.pet?.name ?? '';
    const species = form.elements.namedItem('species');
    if (species instanceof HTMLSelectElement && s.pet) species.value = s.pet.species;
  }

  function readDom(): void {
    const v = formValues(form);
    const petName = str(v.petName).trim().slice(0, 40);
    state = {
      ...state,
      service: str(v.service) || null,
      provider: str(v.provider) || 'first-available',
      patientType: (str(v.patientType) || null) as BookingState['patientType'],
      forWhom: v.forWhom === 'someone-else' ? 'someone-else' : 'me',
      pet: petName ? { name: petName, species: (str(v.species) || 'other') as NonNullable<BookingState['pet']>['species'] } : null,
      day: str(v.day) || null,
      windowId: str(v.windowId) || null,
    };
  }

  function filterClinicians(): void {
    const offered = state.service ? providersFor(state.service, null, data.providers) : [];
    const open = new Set(providersFor(state.service ?? '', state.patientType, data.providers).map((p) => p.slug));
    form.querySelectorAll<HTMLElement>('[data-provider]').forEach((el) => (el.hidden = !open.has(el.dataset.provider!)));
    if (state.provider !== 'first-available' && !open.has(state.provider)) radios('provider').forEach((r) => (r.checked = r.value === 'first-available'));
    const closed = offered.filter((p) => !open.has(p.slug)).map((p) => p.name);
    const note = form.querySelector<HTMLElement>('[data-clinician-note]')!;
    note.hidden = closed.length === 0;
    note.textContent = closed.length ? `${names(closed)} ${closed.length > 1 ? 'are' : 'is'} not taking new patients.${open.size ? '' : " We'll match you with the first available."}` : '';
  }

  function updateCard(): void {
    const fields = cardFields(state, { services: data.services, providers: data.providers, windows: data.windows, preset: data.preset, locale: data.market.locale });
    for (const f of fields) {
      const line = root.querySelector<HTMLElement>(`[data-line="${f.label}"]`);
      const dd = line?.querySelector('dd');
      if (!line || !dd) continue;
      if (f.value) dd.textContent = f.value;
      else dd.innerHTML = '<span class="visually-hidden">Not chosen yet</span>';
      line.toggleAttribute('data-filled', Boolean(f.value));
    }
  }

  function updateHandoff(): void {
    const link = form.querySelector<HTMLAnchorElement>('[data-handoff-link]');
    const frame = form.querySelector<HTMLIFrameElement>('[data-embed-frame]');
    const service = data.services.find((s) => s.slug === state.service);
    const url = service ? handoffUrl(data.booking, service.slug) : null;
    if (link) {
      link.hidden = !url;
      if (url && service) { link.href = url; link.textContent = `Book ${service.title.toLowerCase()} online`; }
    }
    if (frame) {
      frame.hidden = !service;
      if (service && data.booking.url && !frame.src) frame.src = data.booking.url;
    }
  }

  function sync(): void {
    readDom();
    filterClinicians();
    readDom();
    updateCard();
    updateHandoff();
    history.replaceState(null, '', toParams(state));
    emitBooking(state);
  }

  function show(id: StepId, push: boolean, focus = true): void {
    state = { ...state, step: id };
    steps.forEach((s) => (s.hidden = s.dataset.step !== id));
    root.querySelectorAll<HTMLElement>('[data-progress]').forEach((li) => (li.dataset.progress === id ? li.setAttribute('aria-current', 'step') : li.removeAttribute('aria-current')));
    clearErrors(form, summary);
    history[push ? 'pushState' : 'replaceState'](null, '', toParams(state));
    if (focus) form.querySelector<HTMLElement>(`#h-${id}`)?.focus();
  }

  const check = (id: StepId): FieldErrors => validate(formValues(form), rules[id]).errors;

  function advance(): void {
    const errors = check(state.step);
    if (Object.keys(errors).length) return showErrors(form, errors, summary);
    show(nextStep(state.step), true);
  }

  function restore(): void {
    state = fromParams(location.search, ctx);
    applyToDom(state);
    sync();
    const limit = STEP_IDS.indexOf(firstUnfinished(state));
    show(STEP_IDS[Math.min(STEP_IDS.indexOf(state.step), limit)]!, false, false);
  }

  /** Run every step in order; jump to the first step that still has errors. */
  function firstFailing(): boolean {
    for (const id of ['service', 'patient', 'when', 'you'] as StepId[]) {
      const errors = check(id);
      if (Object.keys(errors).length) {
        show(id, true, false);
        showErrors(form, errors, summary);
        return true;
      }
    }
    return false;
  }

  async function submit(): Promise<void> {
    if (sending || firstFailing()) return;
    const values = formValues(form);
    const honeypot = str(values.website);
    const input = buildAppointmentInput(values, { state, consentAt: new Date(now()).toISOString(), clientRef });
    if (honeypot.trim()) return deps.onSent({ ...input, id: 'L-0', status: 'new', createdAt: new Date(now()).toISOString(), history: [] }); // bot: drop silently
    if (isLikelySpam({ honeypot, startedAt, now: now() }) && !held) {
      held = true; // too fast: hold once, the next send goes through
      status.textContent = 'Not sent yet. Check your details, then send again.';
      return;
    }
    sending = true;
    const idle = send.textContent;
    send.disabled = true;
    send.setAttribute('aria-busy', 'true');
    send.textContent = 'Sending...';
    try {
      deps.onSent(await deps.repo.create(input));
    } catch (error) {
      status.replaceChildren(...failureNotice(error, { phone: deps.fallbackPhone, href: deps.fallbackHref }, true));
    } finally {
      sending = false;
      send.disabled = false;
      send.removeAttribute('aria-busy');
      send.textContent = idle;
    }
  }

  form.addEventListener('change', sync);
  form.addEventListener('input', sync);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    status.replaceChildren();
    if (state.step === 'check') void submit();
    else advance();
  });
  root.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-next]')) advance();
    else if (target.closest('[data-back]')) show(prevStep(state.step), true);
    else if (target.closest('a[href="#petName"]')) { show('patient', true, false); form.querySelector<HTMLElement>('#petName')?.focus(); }
  });
  window.addEventListener('popstate', restore);
  restore();
}
