/** Lowercase, collapse whitespace and drop accents, so a search is forgiving of typing. */
export function normalise(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Every whitespace-separated term of the query must appear in one of the searchable strings. */
export function matchesQuery(haystack: string[], query: string): boolean {
  const terms = normalise(query).split(' ').filter(Boolean);
  if (terms.length === 0) return true;
  const text = normalise(haystack.join(' '));
  return terms.every((t) => text.includes(t));
}