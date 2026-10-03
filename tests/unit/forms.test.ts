// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { bindSimpleForm, clearErrors, formValues, showErrors } from '@/core/forms';
import { RateLimitError } from '@/core/leads/repository';
import { LocalLeadRepository } from '@/core/leads/local-repository';
import { createMemoryStorage } from '@/core/storage';
import { email, required } from '@/core/leads/validation';
import type { LeadInput } from '@/core/leads/types';

const HTML = `
<div id="wrap">
  <form novalidate>
    <div data-error-summary hidden tabindex="-1"><ul data-error-list></ul></div>
    <label for="f-name">Name</label><input id="f-name" name="name">
    <p data-error-for="name"></p>
    <label for="f-email">Email</label><input id="f-email" name="email">
    <p data-error-for="email"></p>
    <input name="website" tabindex="-1" autocomplete="off">
    <input type="checkbox" name="terms" id="f-terms"><label for="f-terms">Agree</label>
    <button type="submit"><span>Send</span></button>
    <p data-form-status role="alert"></p>
  </form>
  <section id="done" hidden tabindex="-1">Thanks</section>
</div>`;

const el = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!;

describe('formValues', () => {
  beforeEach(() => void (document.body.innerHTML = HTML));
  it('reads text trimmed-as-is and checkboxes as booleans', () => {
    el<HTMLInputElement>('[name=name]').value = 'Sam';
    el<HTMLInputElement>('[name=terms]').checked = true;
    expect(formValues(el<HTMLFormElement>('form'))).toMatchObject({ name: 'Sam', email: '', terms: true });
  });
});

describe('showErrors', () => {
  beforeEach(() => void (document.body.innerHTML = HTML));

  it('links each message to its field and focuses the summary', () => {
    const form = el<HTMLFormElement>('form');
    const summary = el('[data-error-summary]');
    showErrors(form, { name: 'Enter your name', email: 'Bad email' }, summary);
    const links = [...summary.querySelectorAll('a')];
    expect(links.map((a) => a.textContent)).toEqual(['Enter your name', 'Bad email']);
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['#f-name', '#f-email']);
    expect(summary.hidden).toBe(false);
    expect(document.activeElement).toBe(summary);
    expect(el('[name=name]').getAttribute('aria-invalid')).toBe('true');
    expect(el('[data-error-for=name]').textContent).toBe('Enter your name');
    links[0]!.click();
    expect(document.activeElement).toBe(el('[name=name]'));
  });

  it('clearErrors resets everything', () => {
    const form = el<HTMLFormElement>('form');
    const summary = el('[data-error-summary]');
    showErrors(form, { name: 'Enter your name' }, summary);
    clearErrors(form, summary);
    expect(summary.hidden).toBe(true);
    expect(el('[data-error-for=name]').textContent).toBe('');
    expect(el('[name=name]').getAttribute('aria-invalid')).toBe('false');
  });
});

describe('bindSimpleForm', () => {
  let repo: LocalLeadRepository;
  const toInput = (v: Record<string, string | boolean>): LeadInput<Record<string, unknown>> => ({
    kind: 'enquiry',
    contact: { firstName: String(v.name), lastName: '', phone: '', email: String(v.email) },
    postcode: '',
    consent: { terms: Boolean(v.terms), remindersSms: false, marketingSms: false, marketingEmail: false, at: null },
    payload: {},
    clientRef: 'ref-1',
  });
  const bind = (over: { now?: () => number; startedAt?: number } = {}) =>
    bindSimpleForm(el<HTMLFormElement>('form'), {
      rules: { name: [required('Enter your name')], email: [email('Bad email')] },
      toInput,
      repo,
      success: el('#done'),
      fallbackPhone: '03 5550 1200',
      fallbackHref: 'tel:+61355501200',
      now: () => 100_000,
      startedAt: 0,
      ...over,
    });
  const submit = () => el<HTMLFormElement>('form').dispatchEvent(new Event('submit', { cancelable: true }));
  const flush = () => new Promise((r) => setTimeout(r, 0));

  beforeEach(() => {
    document.body.innerHTML = HTML;
    repo = new LocalLeadRepository(createMemoryStorage(), 'health:v1:t');
    bind();
  });

  const type = (name: string, value: string) => {
    const input = el<HTMLInputElement>(`[name=${name}]`);
    input.value = value;
    input.dispatchEvent(new Event('input'));
    return input;
  };
  const err = (name: string) => el(`[data-error-for=${name}]`).textContent;

  it('does not complain when a field is blurred untouched', () => {
    el<HTMLInputElement>('[name=name]').dispatchEvent(new Event('blur'));
    expect(err('name')).toBe('');
  });

  it('validates on blur whenever the field was touched, including after clearing it', () => {
    const name = type('name', 'Sam');
    name.dispatchEvent(new Event('blur'));
    expect(err('name')).toBe('');
    type('name', '');
    name.dispatchEvent(new Event('blur'));
    expect(err('name')).toBe('Enter your name');
    type('name', 'Sam');
    name.dispatchEvent(new Event('blur'));
    expect(err('name')).toBe('');
  });

  it('errors on a required field cleared before the first blur', () => {
    const name = type('name', 'x');
    type('name', '');
    name.dispatchEvent(new Event('blur'));
    expect(err('name')).toBe('Enter your name');
  });

  it('shows the summary and saves nothing when invalid', async () => {
    submit();
    await flush();
    expect(el('[data-error-summary]').hidden).toBe(false);
    expect(await repo.list()).toEqual([]);
  });

  it('saves, then replaces the form with the success panel', async () => {
    el<HTMLInputElement>('[name=name]').value = 'Sam';
    submit();
    expect(el<HTMLButtonElement>('button').disabled).toBe(true);
    await flush();
    expect(await repo.list()).toHaveLength(1);
    expect(el<HTMLFormElement>('form').hidden).toBe(true);
    expect(el('#done').hidden).toBe(false);
    expect(document.activeElement).toBe(el('#done'));
  });

  it('on failure keeps the fields and offers the phone number', async () => {
    vi.spyOn(repo, 'create').mockRejectedValue(new Error('boom'));
    el<HTMLInputElement>('[name=name]').value = 'Sam';
    submit();
    await flush();
    expect(el('[data-form-status]').textContent).toBe("We couldn't save your request. Call us on 03 5550 1200.");
    expect(el<HTMLInputElement>('[name=name]').value).toBe('Sam');
    expect(el<HTMLFormElement>('form').hidden).toBe(false);
    expect(el<HTMLButtonElement>('button').disabled).toBe(false);
    expect(el('[data-form-status] a').getAttribute('href')).toBe('tel:+61355501200');
  });

  it('on a rate limit says so and offers the phone number', async () => {
    vi.spyOn(repo, 'create').mockRejectedValue(new RateLimitError());
    el<HTMLInputElement>('[name=name]').value = 'Sam';
    submit();
    await flush();
    expect(el('[data-form-status]').textContent).toBe("You've sent several requests from this device. Please call us on 03 5550 1200.");
    expect(el('[data-form-status] a').getAttribute('href')).toBe('tel:+61355501200');
  });

  it('holds a too-fast submit once, then saves on the next', async () => {
    document.body.innerHTML = HTML;
    bind({ startedAt: 99_000 });
    type('name', 'Sam');
    submit();
    await flush();
    expect(el('[data-form-status]').textContent).toBe('Not sent yet. Check your details, then send again.');
    expect(await repo.list()).toEqual([]);
    expect(el<HTMLFormElement>('form').hidden).toBe(false);
    submit();
    await flush();
    expect(await repo.list()).toHaveLength(1);
    expect(el('#done').hidden).toBe(false);
  });

  it('drops a filled honeypot silently and shows the success panel', async () => {
    type('name', 'Sam');
    type('website', 'http://spam');
    submit();
    await flush();
    expect(await repo.list()).toEqual([]);
    expect(el('#done').hidden).toBe(false);
    expect(el<HTMLFormElement>('form').hidden).toBe(true);
  });
});
