import { describe, expect, it } from 'vitest';
import { articleSchema } from '@/core/schema';
import { postCards } from '@/modules/blog/posts';

const entry = (id: string, date: string, photoSlot = 'a') => ({
  id,
  data: { title: id, date: new Date(date), author: 'x', summary: '', photoSlot, minutes: 3, category: 'Physiotherapy' },
});

describe('postCards', () => {
  it('sorts newest first, flattens the date and leaves a missing photo out', () => {
    const cards = postCards([entry('old', '2026-07-28'), entry('new', '2026-09-22', 'b')], (slot) => (slot === 'b' ? { slot, alt: 'B' } : undefined));
    expect(cards.map((c) => c.id)).toEqual(['new', 'old']);
    expect(cards[0].date).toBe('2026-09-22');
    expect(cards[0].photo).toEqual({ slot: 'b', alt: 'B' });
    expect(cards[1].photo).toBeUndefined();
  });
});

describe('articleSchema', () => {
  it('names the author as a person with a profile url', () => {
    const s = articleSchema({ headline: 'H', description: 'D', url: 'https://example.test/blog/h/', datePublished: '2026-09-22', author: { name: 'Priya Nair', jobTitle: 'Physiotherapist', url: 'https://example.test/team/priya-nair/' }, publisher: 'Fernway Health' }) as { '@type': string; author: Record<string, string> };
    expect(s['@type']).toBe('Article');
    expect(s.author).toMatchObject({ '@type': 'Person', name: 'Priya Nair', url: 'https://example.test/team/priya-nair/' });
  });
});
