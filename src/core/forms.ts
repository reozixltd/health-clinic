/** DOM wiring for public forms. No business rules here: rules and the repository are passed in. */
import { RateLimitError, type LeadRepository } from './leads/repository';
import { isLikelySpam, validate, type FieldErrors, type FieldValue, type Rules } from './leads/validation';
import type { LeadInput } from './leads/types';

export type FormValues = Record<string, string | boolean>;

export function formValues(form: HTMLFormElement): FormValues {
  const out: FormValues = {};
  for (const el of Array.from(form.elements)) {
    if (!(el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) || !el.name) continue;
    if (el instanceof HTMLInputElement && el.type === 'file') continue;
    if (el instanceof HTMLInputElement && el.type === 'radio') {
      if (el.checked) out[el.name] = el.value;
      else out[el.name] ??= '';
    } else out[el.name] = el instanceof HTMLInputElement && el.type === 'checkbox' ? el.checked : el.value;
  }
  return out;
}

function field(form: HTMLFormElement, name: string): HTMLElement | null {
  const el = form.elements.namedItem(name);
  if (el instanceof HTMLElement) return el;
  const first = (el as RadioNodeList | null)?.[0];
  return first instanceof HTMLElement ? first : null;
}

function setError(form: HTMLFormElement, name: string, message: string | null): void {
  const note = form.querySelector<HTMLElement>(`[data-error-for="${name}"]`);
  if (note) note.textContent = message ?? '';
  field(form, name)?.setAttribute('aria-invalid', String(Boolean(message)));
}

/** Marks each field invalid and lists the messages as links in the summary, which takes focus. */
export function showErrors(form: HTMLFormElement, errors: FieldErrors, summary: HTMLElement): void {
  const list = summary.querySelector('[data-error-list]') ?? summary;
  const entries = Object.entries(errors);
  for (const el of Array.from(form.elements)) if (el instanceof HTMLElement && el.getAttribute('name')) setError(form, el.getAttribute('name')!, errors[el.getAttribute('name')!] ?? null);
  list.replaceChildren(
    ...entries.map(([name, message]) => {
      const target = field(form, name);
      const a = Object.assign(document.createElement('a'), { href: `#${target?.id ?? name}`, textContent: message });
      a.addEventListener('click', (e) => {
        e.preventDefault();
        target?.focus();
      });
      const li = document.createElement('li');
      li.append(a);
      return li;
    }),
  );
  summary.hidden = entries.length === 0;
  if (entries.length) {
    if (!summary.hasAttribute('tabindex')) summary.setAttribute('tabindex', '-1');
    summary.focus();
  }
}

export function clearErrors(form: HTMLFormElement, summary: HTMLElement): void {
  showErrors(form, {}, summary);
  summary.querySelector('[data-error-list]')?.replaceChildren();
}

/** What to show when a request could not be saved: a rate-limit message, or the generic one, each with a phone link. */
export function failureNotice(error: unknown, contact: { phone: string; href: string }, answersKept = false): (string | HTMLAnchorElement)[] {
  const tel = Object.assign(document.createElement('a'), { href: contact.href, textContent: contact.phone });
  if (error instanceof RateLimitError) return ["You've sent several requests from this device. Please call us on ", tel, '.'];
  return [`We couldn't save your request. ${answersKept ? 'Your answers are kept. ' : ''}Call us on `, tel, '.'];
}

export interface SimpleFormOptions {
  rules: Rules;
  toInput: (values: FormValues) => LeadInput<object>;
  repo: LeadRepository;
  /** Panel shown in place of the form after a successful save. */
  success: HTMLElement;
  /** Shown when saving fails, e.g. "03 5550 1200", with its tel: link. */
  fallbackPhone: string;
  fallbackHref: string;
  now?: () => number;
  startedAt?: number;
}

/** Validate on blur, disable while sending, success replaces the form, failure keeps the fields. */
export function bindSimpleForm(form: HTMLFormElement, opts: SimpleFormOptions): void {
  const now = opts.now ?? Date.now;
  const startedAt = opts.startedAt ?? now();
  const summary = form.querySelector<HTMLElement>('[data-error-summary]') ?? document.createElement('div');
  const status = form.querySelector<HTMLElement>('[data-form-status]') ?? form.appendChild(Object.assign(document.createElement('p'), { role: 'alert' }));
  const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');

  let held = false;
  for (const name of Object.keys(opts.rules)) {
    const el = field(form, name);
    let touched = false;
    for (const type of ['input', 'change']) el?.addEventListener(type, () => (touched = true));
    el?.addEventListener('blur', () => {
      if (!touched) return;
      setError(form, name, validate(formValues(form) as Record<string, FieldValue>, { [name]: opts.rules[name]! }).errors[name] ?? null);
    });
  }

  const showSuccess = () => {
    form.hidden = true;
    opts.success.hidden = false;
    if (!opts.success.hasAttribute('tabindex')) opts.success.setAttribute('tabindex', '-1');
    opts.success.focus();
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.replaceChildren();
    const values = formValues(form);
    const { ok, errors } = validate(values, opts.rules);
    showErrors(form, errors, summary);
    if (!ok) return;
    const spam = isLikelySpam({ honeypot: String(values.website ?? ''), startedAt, now: now() });
    if (spam && String(values.website ?? '').trim() !== '') return showSuccess(); // bot: drop silently
    if (spam && !held) {
      held = true; // too fast: hold once, the next submit goes through
      status.textContent = 'Not sent yet. Check your details, then send again.';
      return;
    }
    const label = submit?.querySelector('span') ?? submit;
    const idle = label?.textContent ?? '';
    if (submit) {
      submit.disabled = true;
      submit.setAttribute('aria-busy', 'true');
    }
    if (label) label.textContent = 'Sending...';
    try {
      await opts.repo.create(opts.toInput(values));
      showSuccess();
    } catch (error) {
      status.replaceChildren(...failureNotice(error, { phone: opts.fallbackPhone, href: opts.fallbackHref }));
    } finally {
      if (submit) {
        submit.disabled = false;
        submit.removeAttribute('aria-busy');
      }
      if (label) label.textContent = idle;
    }
  });
}
