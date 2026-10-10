/**
 * Inline style that names a card photo and the photo on its detail page alike, so a browser with
 * cross-document view transitions morphs one into the other. A name must be unique on a page.
 */
export const morph = (kind: 'service' | 'provider' | 'post', slug: string) => `view-transition-name: ${kind}-${slug}; view-transition-class: morph`;
