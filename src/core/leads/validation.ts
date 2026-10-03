/** Form validation and spam heuristics. Pure functions; messages are supplied by the caller. */

export type FieldValue = string | boolean | undefined;
/** Returns an error message, or null when the value is acceptable. */
export type Rule = (value: FieldValue) => string | null;
export type Rules = Record<string, Rule[]>;
export type FieldErrors = Record<string, string>;

const MIN_FILL_MS = 3000;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const text = (v: FieldValue): string => (typeof v === 'string' ? v.trim() : '');
/** Optional-field rules ignore blank values; use `required` to demand one. */
const optional = (test: (s: string) => boolean, msg: string): Rule => (v) => (text(v) === '' || test(text(v)) ? null : msg);
const spaced = (s: string) => s.replace(/[\s()-]/g, '');

export const required = (msg: string): Rule => (v) => (text(v) === '' ? msg : null);
export const minLength = (n: number, msg: string): Rule => optional((s) => s.length >= n, msg);
export const maxLength = (n: number, msg: string): Rule => optional((s) => s.length <= n, msg);
export const email = (msg: string): Rule => optional((s) => EMAIL.test(s), msg);
/** Spaces, dashes and brackets are ignored before the pattern is tested. */
export const phone = (pattern: RegExp, msg: string): Rule => optional((s) => pattern.test(spaced(s)), msg);
export const postcode = (pattern: RegExp, msg: string): Rule => optional((s) => pattern.test(s), msg);
export const checked = (msg: string): Rule => (v) => (v === true ? null : msg);
export const oneOf = (values: readonly string[], msg: string): Rule => optional((s) => values.includes(s), msg);

export function validate(input: Record<string, FieldValue>, rules: Rules): { ok: boolean; errors: FieldErrors } {
  const errors: FieldErrors = {};
  for (const [field, list] of Object.entries(rules)) {
    for (const rule of list) {
      const message = rule(input[field]);
      if (message) {
        errors[field] = message;
        break;
      }
    }
  }
  return { ok: Object.keys(errors).length === 0, errors };
}

export function isLikelySpam(opts: { honeypot: string; startedAt: number; now: number }): boolean {
  return opts.honeypot.trim() !== '' || opts.now - opts.startedAt < MIN_FILL_MS;
}
