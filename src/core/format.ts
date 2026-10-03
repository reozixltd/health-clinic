/** Display and date helpers. Dates are always computed in the clinic's time zone, never the device's. */

export type Currency = 'AUD' | 'CAD' | 'GBP';

/** Whole amounts have no decimals, fractions have two: 120 → "$120" or "£120", 12.5 → "£12.50". */
export function formatMoney(n: number, currency: Currency, locale: string): string {
  const digits = Number.isInteger(n) ? 0 : 2;
  return new Intl.NumberFormat(locale, { style: 'currency', currency, currencyDisplay: 'narrowSymbol', minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);
}

/** "2026-10-09" → "Fri 9 Oct" (en-AU). A plain date has no zone, so it is formatted in UTC. */
export function formatDay(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
    .format(new Date(`${iso}T00:00:00Z`))
    .replace(',', '');
}

function parts(date: Date, timeZone: string): Record<string, string> {
  const out: Record<string, string> = {};
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  for (const p of fmt.formatToParts(date)) out[p.type] = p.value;
  return out;
}

/** Today's date ("YYYY-MM-DD") in the given time zone. */
export function todayIn(timeZone: string, now: Date): string {
  const p = parts(now, timeZone);
  return `${p.year}-${p.month}-${p.day}`;
}

function wallTime(date: Date, timeZone: string): string {
  const p = parts(date, timeZone);
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}`;
}

/** "+11:00" style offset of `timeZone` at the given instant. */
function offsetAt(date: Date, timeZone: string): string {
  const minutes = Math.round((new Date(`${wallTime(date, timeZone)}Z`).getTime() - date.getTime()) / 60_000);
  const abs = Math.abs(minutes);
  return `${minutes < 0 ? '-' : '+'}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`;
}

/** The instant a zone-less "YYYY-MM-DDTHH:mm" wall time falls on in `timeZone`. */
function instantFromWall(iso: string, timeZone: string): Date {
  const asUtc = new Date(`${iso}:00Z`);
  let guess = asUtc;
  for (let i = 0; i < 2; i++) {
    const shown = new Date(`${wallTime(guess, timeZone)}Z`);
    guess = new Date(guess.getTime() + (asUtc.getTime() - shown.getTime()));
  }
  return guess;
}

/**
 * Adds real elapsed hours and returns an offset ISO time ("YYYY-MM-DDTHH:mm:ss+HH:MM") in `timeZone`,
 * using the zone's offset at the resulting instant. `iso` is either a wall time in that zone
 * ("2026-10-09T09:00") or an instant with Z/offset.
 */
export function addHoursIso(iso: string, hours: number, timeZone: string): string {
  const start = /(Z|[+-]\d{2}:?\d{2})$/.test(iso) ? new Date(iso) : instantFromWall(iso.slice(0, 16), timeZone);
  const end = new Date(start.getTime() + hours * 3_600_000);
  return `${wallTime(end, timeZone)}${offsetAt(end, timeZone)}`;
}
