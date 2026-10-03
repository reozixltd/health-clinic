import { beforeEach, describe, expect, it } from 'vitest';
import { LocalLeadRepository, RATE_PER_HOUR } from '@/core/leads/local-repository';
import { createMemoryStorage, type KeyValueStorage } from '@/core/storage';
import type { LeadInput } from '@/core/leads/types';

const NS = 'health:v1:fernway-au';
const input: LeadInput<{ service: string }> = {
  kind: 'appointment',
  contact: { firstName: 'Sam', lastName: 'Lee', phone: '0491 570 120', email: '' },
  postcode: '3000',
  consent: { terms: true, remindersSms: true, marketingSms: false, marketingEmail: false, at: '2026-10-03T00:00:00.000Z' },
  payload: { service: 'physio' },
  clientRef: 'r1',
};
let n = 0;
const make = (over: Partial<LeadInput<{ service: string }>> = {}) => ({ ...input, clientRef: `r${++n}`, ...over });

describe('LocalLeadRepository', () => {
  let clock = 1_000_000;
  let storage: KeyValueStorage;
  let repo: LocalLeadRepository;

  beforeEach(() => {
    clock = 1_000_000;
    storage = createMemoryStorage();
    repo = new LocalLeadRepository(storage, NS, () => clock);
  });

  it('creates a lead with id, new status, timestamp and the namespaced key', async () => {
    const lead = await repo.create(input);
    expect(lead.id).toMatch(/^L-/);
    expect(lead.status).toBe('new');
    expect(lead.createdAt).toBe(new Date(clock).toISOString());
    expect(storage.getItem(`${NS}:leads`)).not.toBeNull();
  });

  it('create with the same clientRef returns the existing lead', async () => {
    const a = await repo.create(input);
    const b = await repo.create({ ...input, contact: { ...input.contact, firstName: 'Other' } });
    expect(b.id).toBe(a.id);
    expect(await repo.list()).toHaveLength(1);
  });

  it('create throws when the write fails', async () => {
    const failing: KeyValueStorage = { ...storage, setItem: () => { throw new Error('full'); } };
    const r = new LocalLeadRepository(failing, NS, () => clock);
    await expect(r.create(input)).rejects.toThrow(/Could not save/);
  });

  it('list filters by kind and status, newest first', async () => {
    const a = await repo.create(make());
    clock += 60_000;
    const b = await repo.create(make({ kind: 'referral' }));
    clock += 60_000;
    const c = await repo.create(make());
    await repo.updateStatus(a.id, 'confirmed');
    expect((await repo.list()).map((l) => l.id)).toEqual([c.id, b.id, a.id]);
    expect((await repo.list({ kind: 'appointment' })).map((l) => l.id)).toEqual([c.id, a.id]);
    expect((await repo.list({ status: 'confirmed' })).map((l) => l.id)).toEqual([a.id]);
    expect(await repo.list({ kind: 'referral', status: 'confirmed' })).toEqual([]);
  });

  it('get returns a lead or null', async () => {
    const lead = await repo.create(input);
    expect((await repo.get(lead.id))?.id).toBe(lead.id);
    expect(await repo.get('L-nope')).toBeNull();
  });

  it('updates status and records it in the history', async () => {
    const lead = await repo.create(input);
    clock += 1000;
    const updated = await repo.updateStatus(lead.id, 'declined');
    expect(updated.status).toBe('declined');
    expect(updated.history.at(-1)).toMatchObject({ type: 'status', value: 'declined' });
  });

  it('adds a note', async () => {
    const lead = await repo.create(input);
    const updated = await repo.addNote(lead.id, ' Rang to confirm ');
    expect(updated.history.at(-1)).toMatchObject({ type: 'note', value: 'Rang to confirm' });
  });

  it('throws on an unknown id', async () => {
    await expect(repo.updateStatus('L-nope', 'done')).rejects.toThrow(/not found/i);
  });

  it('rate-limits after 5 submissions in an hour, then recovers', async () => {
    for (let i = 0; i < 5; i++) await repo.create(make());
    await expect(repo.create(make())).rejects.toThrow(/too many/i);
    clock += 61 * 60_000;
    await expect(repo.create(make())).resolves.toBeDefined();
  });

  it('demo sites allow 30 an hour, live sites 5', async () => {
    expect(RATE_PER_HOUR).toEqual({ live: 5, demo: 30 });
    const demo = new LocalLeadRepository(createMemoryStorage(), NS, () => clock, RATE_PER_HOUR.demo);
    for (let i = 0; i < 30; i++) await demo.create(make());
    await expect(demo.create(make())).rejects.toThrow(/too many/i);
  });

  it('keeps working when storage contains corrupt data', async () => {
    storage.setItem(`${NS}:leads`, '{not json');
    expect(await repo.list()).toEqual([]);
  });

  it('keeps two namespaces apart', async () => {
    const other = new LocalLeadRepository(storage, 'health:v1:hollybank', () => clock);
    await repo.create(input);
    expect(await other.list()).toEqual([]);
  });

  it('seed inserts leads past the rate limit and clear removes everything', async () => {
    const seeded = await Promise.all(Array.from({ length: 7 }, (_, i) => new LocalLeadRepository(createMemoryStorage(), NS, () => clock + i).create(make())));
    await repo.seed(seeded);
    expect(await repo.list()).toHaveLength(7);
    await repo.clear();
    expect(await repo.list()).toEqual([]);
  });
});
