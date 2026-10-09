/**
 * Photo lightbox on the native dialog: the browser supplies the focus trap, Escape and focus
 * return. This picks the slide, steps with the buttons or arrow keys, and closes on a backdrop click.
 */
export function initLightboxes(doc: Document = document): void {
  for (const root of doc.querySelectorAll<HTMLElement>('[data-lightbox]')) {
    const dialog = root.querySelector('dialog');
    const slides = [...root.querySelectorAll<HTMLElement>('[data-lightbox-slide]')];
    const count = root.querySelector('[data-lightbox-count]');
    if (!dialog || slides.length === 0) continue;
    let current = 0;
    const show = (i: number) => {
      current = (i + slides.length) % slides.length;
      slides.forEach((slide, n) => { slide.hidden = n !== current; });
      if (count) count.textContent = `${current + 1} of ${slides.length}`;
    };
    root.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const opener = target.closest<HTMLElement>('[data-lightbox-open]');
      if (opener) {
        show(Number(opener.dataset.lightboxOpen));
        dialog.showModal();
      } else if (target.closest('[data-lightbox-prev]')) show(current - 1);
      else if (target.closest('[data-lightbox-next]')) show(current + 1);
      else if (target === dialog) dialog.close();
    });
    dialog.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') show(current - 1);
      if (event.key === 'ArrowRight') show(current + 1);
    });
  }
}
