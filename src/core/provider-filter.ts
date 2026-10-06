/** Client: filter the team list from a ?q= in the URL. Markup for every clinician is in the page. */

/** Visible count for the status line beside the filter. */
export function filterSummary(shown: number, total: number): string {
  return shown === total ? `${total} listed` : `Showing ${shown} of ${total}`;
}

export function initProviderFilter(doc: Document = document): void {
  const list = doc.querySelector<HTMLElement>('[data-provider-list]');
  const input = doc.querySelector<HTMLInputElement>('[data-provider-filter]');
  const count = doc.querySelector<HTMLElement>('[data-provider-count]');
  if (!list || !input) return;
  const rows = [...list.querySelectorAll<HTMLElement>('[data-provider]')];

  const apply = () => {
    const query = input.value.trim().toLocaleLowerCase();
    let shown = 0;
    for (const row of rows) {
      // data-search is already lowercased and accent-stripped at build time by normalise().
      const match = query === '' || (row.dataset.search ?? '').includes(query);
      row.hidden = !match;
      if (match) shown += 1;
    }
    if (count) count.textContent = filterSummary(shown, rows.length);
  };

  input.addEventListener('input', apply);
  const initial = new URLSearchParams(doc.defaultView?.location.search ?? '').get('q');
  if (initial) input.value = initial;
  apply();
}