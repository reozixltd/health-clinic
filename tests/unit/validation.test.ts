import { describe, expect, it } from 'vitest';
import { checked, email, isLikelySpam, maxLength, minLength, oneOf, phone, postcode, required, validate } from '@/core/leads/validation';

describe('rules', () => {
  it('required rejects blank and whitespace', () => {
    expect(required('Enter a name')('  ')).toBe('Enter a name');
    expect(required('x')('Sam')).toBeNull();
  });

  it('min and max length trim, and skip empty optional values', () => {
    expect(minLength(3, 'short')('ab ')).toBe('short');
    expect(minLength(3, 'short')('')).toBeNull();
    expect(maxLength(3, 'long')('abcd')).toBe('long');
    expect(maxLength(3, 'long')('abc')).toBeNull();
  });

  it('email is optional unless required, and checks shape', () => {
    expect(email('bad')('')).toBeNull();
    expect(email('bad')('sam@')).toBe('bad');
    expect(email('bad')('sam@example.com')).toBeNull();
  });

  it('phone rule uses the given pattern', () => {
    const au = phone(/^(?:0[2-478]\d{8})$/, 'AU number');
    const uk = phone(/^0\d{10}$/, 'UK number');
    expect(au('0491 570 120')).toBeNull();
    expect(au('0113 496 0123')).toBe('AU number');
    expect(uk('0113 496 0123')).toBeNull();
    expect(au('(03) 5550 1200')).toBeNull();
  });

  it('postcode rule uses the given pattern', () => {
    const au = postcode(/^\d{4}$/, 'AU postcode');
    const ca = postcode(/^[A-Z]\d[A-Z] ?\d[A-Z]\d$/i, 'CA postcode');
    expect(au('3000')).toBeNull();
    expect(au('K1A 0B1')).toBe('AU postcode');
    expect(ca('k1a 0b1')).toBeNull();
    expect(ca('3000')).toBe('CA postcode');
  });

  it('checked needs a true value', () => {
    expect(checked('Agree')(false)).toBe('Agree');
    expect(checked('Agree')(true)).toBeNull();
  });

  it('oneOf accepts listed values and blank', () => {
    expect(oneOf(['a', 'b'], 'pick')('c')).toBe('pick');
    expect(oneOf(['a', 'b'], 'pick')('a')).toBeNull();
  });
});

describe('validate', () => {
  const rules = { name: [required('Enter your name'), minLength(2, 'Too short')], email: [email('Bad email')] };

  it('returns ok with no errors', () => {
    expect(validate({ name: 'Sam', email: '' }, rules)).toEqual({ ok: true, errors: {} });
  });

  it('keeps the first message per field', () => {
    expect(validate({ name: '', email: 'x' }, rules)).toEqual({ ok: false, errors: { name: 'Enter your name', email: 'Bad email' } });
  });

  it('treats missing fields as empty', () => {
    expect(validate({}, rules).errors.name).toBe('Enter your name');
  });
});

describe('isLikelySpam', () => {
  it('flags a filled honeypot', () => {
    expect(isLikelySpam({ honeypot: 'http://x', startedAt: 0, now: 10_000 })).toBe(true);
  });
  it('flags submissions faster than 3 seconds', () => {
    expect(isLikelySpam({ honeypot: '', startedAt: 1000, now: 2500 })).toBe(true);
  });
  it('lets a normal submission through', () => {
    expect(isLikelySpam({ honeypot: '', startedAt: 0, now: 20_000 })).toBe(false);
  });
});
