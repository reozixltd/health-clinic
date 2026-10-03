/**
 * DEMO lead store backed by browser storage. Leads only exist in the browser
 * that created them: fine for showing the flow, never for a real client.
 * Keys are `<namespace>:leads` and `<namespace>:submits`.
 */
import { readJson, writeJson, type KeyValueStorage } from '../storage';
import { RateLimitError, type LeadFilter, type LeadRepository } from './repository';
import type { Lead, LeadInput, LeadStatus } from './types';

/** Requests allowed per device per hour. Demo sites allow more, so a sales walkthrough does not hit the limit. */
export const RATE_PER_HOUR = { live: 5, demo: 30 };
const WINDOW_MS = 60 * 60 * 1000;

export class LocalLeadRepository implements LeadRepository {
  private readonly leadsKey: string;
  private readonly submitsKey: string;

  constructor(
    private readonly storage: KeyValueStorage,
    namespace: string,
    private readonly now: () => number = Date.now,
    private readonly maxPerHour: number = RATE_PER_HOUR.live,
  ) {
    this.leadsKey = `${namespace}:leads`;
    this.submitsKey = `${namespace}:submits`;
  }

  async create<P>(input: LeadInput<P>): Promise<Lead<P>> {
    const leads = this.read();
    const existing = leads.find((l) => l.clientRef === input.clientRef);
    if (existing) return existing as Lead<P>;
    this.enforceRateLimit();
    const lead: Lead<P> = {
      ...input,
      id: `L-${this.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
      status: 'new',
      createdAt: new Date(this.now()).toISOString(),
      history: [],
    };
    leads.push(lead as Lead);
    if (!this.write(leads)) throw new Error('Could not save your request on this device. Please call us instead.');
    return lead;
  }

  async list(filter: LeadFilter = {}): Promise<Lead[]> {
    return this.read()
      .filter((l) => (!filter.kind || l.kind === filter.kind) && (!filter.status || l.status === filter.status))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async get(id: string): Promise<Lead | null> {
    return this.read().find((l) => l.id === id) ?? null;
  }

  async updateStatus(id: string, status: LeadStatus): Promise<Lead> {
    return this.mutate(id, (lead, at) => {
      lead.status = status;
      lead.history.push({ at, type: 'status', value: status });
    });
  }

  async addNote(id: string, note: string): Promise<Lead> {
    return this.mutate(id, (lead, at) => lead.history.push({ at, type: 'note', value: note.trim() }));
  }

  async clear(): Promise<void> {
    this.storage.removeItem(this.leadsKey);
    this.storage.removeItem(this.submitsKey);
  }

  async seed(leads: Lead[]): Promise<void> {
    if (!this.write([...this.read(), ...leads])) throw new Error('Could not load sample leads (storage full).');
  }

  private mutate(id: string, change: (lead: Lead, at: string) => void): Lead {
    const leads = this.read();
    const lead = leads.find((l) => l.id === id);
    if (!lead) throw new Error(`Lead ${id} not found`);
    change(lead, new Date(this.now()).toISOString());
    if (!this.write(leads)) throw new Error('Could not save the change on this device (storage full).');
    return lead;
  }

  private enforceRateLimit(): void {
    const cutoff = this.now() - WINDOW_MS;
    const recent = readJson<number[]>(this.storage, this.submitsKey, []).filter((t) => t > cutoff);
    if (recent.length >= this.maxPerHour) throw new RateLimitError();
    recent.push(this.now());
    writeJson(this.storage, this.submitsKey, recent);
  }

  private read(): Lead[] {
    const data = readJson<unknown>(this.storage, this.leadsKey, []);
    return Array.isArray(data) ? (data as Lead[]) : [];
  }

  private write(leads: Lead[]): boolean {
    return writeJson(this.storage, this.leadsKey, leads);
  }
}
