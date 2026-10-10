/** Blog entries as the cards the tips band shows. */

interface Entry {
  id: string;
  data: { title: string; date: Date; author: string; summary: string; photoSlot: string; minutes: number; category: string };
}
type Photo = { slot: string; alt: string };

/** Newest first, with `date` as YYYY-MM-DD and the photo resolved by the caller (undefined when the file is missing). */
export function postCards(entries: Entry[], photo: (slot: string) => Photo | undefined) {
  return [...entries]
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime())
    .map((p) => ({ ...p.data, id: p.id, date: p.data.date.toISOString().slice(0, 10), photo: photo(p.data.photoSlot) }));
}
