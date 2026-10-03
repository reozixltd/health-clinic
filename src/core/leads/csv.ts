import { KIND_LABELS, STATUS_LABELS, type Lead } from './types';

export interface CsvColumn {
  header: string;
  value: (lead: Lead<unknown>) => string;
}

export const DEFAULT_COLUMNS: CsvColumn[] = [
  { header: 'ID', value: (l) => l.id },
  { header: 'Received', value: (l) => l.createdAt },
  { header: 'Kind', value: (l) => KIND_LABELS[l.kind] },
  { header: 'Status', value: (l) => STATUS_LABELS[l.status] },
  { header: 'First name', value: (l) => l.contact.firstName },
  { header: 'Last name', value: (l) => l.contact.lastName },
  { header: 'Phone', value: (l) => l.contact.phone },
  { header: 'Email', value: (l) => l.contact.email },
  { header: 'Postcode', value: (l) => l.postcode },
  { header: 'Notes', value: (l) => l.history.filter((h) => h.type === 'note').map((h) => h.value).join(' | ') },
];

/** Quotes every cell, doubles inner quotes, and prefixes formula-like values so spreadsheets don't execute them. */
function cell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function leadsToCsv(leads: readonly Lead<unknown>[], columns: CsvColumn[] = DEFAULT_COLUMNS): string {
  const rows = [columns.map((c) => cell(c.header)).join(',')];
  for (const lead of leads) rows.push(columns.map((c) => cell(c.value(lead))).join(','));
  return rows.join('\r\n');
}
