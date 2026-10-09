/**
 * Scroll-snap carousels. The track scrolls natively (touch, wheel, keyboard); this adds the
 * previous and next buttons and an auto-advance that stops for hover, focus, the pause button,
 * a hidden tab and reduced motion.
 */

/** Where the track should scroll to next: one step along, wrapping at either end. */
export function nextLeft(left: number, view: number, total: number, step: number, dir: 1 | -1): number {
  const max = Math.max(total - view, 0);
  if (dir === 1) return left >= max - 2 ? 0 : Math.min(left + step, max);
  return left <= 2 ? max : Math.max(left - step, 0);
}

const AUTO_MS = 6000;

export function initCarousels(doc: Document = document): void {
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches || doc.documentElement.dataset.motion === 'off';
  for (const root of doc.querySelectorAll<HTMLElement>('[data-carousel]')) {
    const track = root.querySelector<HTMLElement>('[data-carousel-track]');
    if (!track) continue;
    const go = (dir: 1 | -1) => {
      const item = track.firstElementChild as HTMLElement | null;
      if (!item) return;
      const step = item.offsetWidth + (parseFloat(getComputedStyle(track).columnGap) || 0);
      track.scrollTo({ left: nextLeft(track.scrollLeft, track.clientWidth, track.scrollWidth, step, dir), behavior: still ? 'auto' : 'smooth' });
    };
    root.querySelector('[data-carousel-prev]')?.addEventListener('click', () => go(-1));
    root.querySelector('[data-carousel-next]')?.addEventListener('click', () => go(1));

    const pause = root.querySelector<HTMLElement>('[data-carousel-pause]');
    if (!pause) continue;
    if (still) {
      pause.hidden = true;
      continue;
    }
    let paused = false;
    let busy = false;
    pause.addEventListener('click', () => {
      paused = !paused;
      pause.setAttribute('aria-pressed', String(paused));
    });
    for (const [on, off] of [['pointerenter', 'pointerleave'], ['focusin', 'focusout']] as const) {
      root.addEventListener(on, () => { busy = true; });
      root.addEventListener(off, () => { busy = false; });
    }
    // offsetParent is null while the carousel sits in a hidden market block.
    setInterval(() => {
      if (!paused && !busy && !doc.hidden && root.offsetParent) go(1);
    }, AUTO_MS);
  }
}
