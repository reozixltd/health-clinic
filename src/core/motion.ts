/**
 * Scroll reveals. [data-reveal] fades and rises once; [data-reveal-group] staggers its children.
 * Only elements below the fold when this runs are hidden first, so a page whose script never
 * loads shows everything. Reduced motion: does nothing.
 */
import { inView } from 'motion';
import { animate } from 'motion/mini';

const EASE = [0.22, 1, 0.36, 1] as const;
const STAGGER = 0.04;
const LAST_STAGGERED = 7; // the first eight children stagger; the rest arrive with the eighth
// Trigger once any part crosses a line 10% above the viewport bottom. A share-of-element threshold
// would never fire for a section several viewports tall.
const VIEW = { margin: '0px 0px -10% 0px' } as const;

const belowFold = (el: Element) => el.getBoundingClientRect().top >= innerHeight;

function hide(el: HTMLElement): void {
  el.style.opacity = '0';
}

function reveal(el: HTMLElement, index = 0): void {
  animate(
    el,
    { opacity: [0, 1], transform: ['translateY(12px)', 'none'] },
    { duration: 0.4, delay: Math.min(index, LAST_STAGGERED) * STAGGER, ease: EASE },
  ).then(() => {
    el.style.opacity = '';
    el.style.transform = '';
  });
}

if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  for (const el of document.querySelectorAll<HTMLElement>('[data-reveal]')) {
    if (!belowFold(el)) continue;
    hide(el);
    inView(el, () => { reveal(el); }, VIEW);
  }
  for (const group of document.querySelectorAll<HTMLElement>('[data-reveal-group]')) {
    if (!belowFold(group)) continue;
    const children = [...group.children] as HTMLElement[];
    children.forEach(hide);
    inView(group, () => { children.forEach(reveal); }, VIEW);
  }
}

/**
 * Count-up. A [data-count-to] number runs from zero to its value once, as it scrolls into view.
 * The finished number is already in the markup (Counter.astro), so a number on screen at load, or
 * one in a hidden market variant, is simply left alone.
 */
const COUNT_MS = 1400;

function countUp(el: HTMLElement): void {
  const to = Number(el.dataset.countTo);
  const digits = Number(el.dataset.decimals ?? 0);
  const format = (n: number) => n.toLocaleString('en', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  let start = 0;
  const tick = (now: number) => {
    start ||= now;
    const t = Math.min((now - start) / COUNT_MS, 1);
    el.textContent = format(to * (1 - (1 - t) ** 4));
    if (t < 1) requestAnimationFrame(tick);
  };
  el.textContent = format(0);
  inView(el, () => { requestAnimationFrame(tick); }, VIEW);
}

if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  for (const el of document.querySelectorAll<HTMLElement>('[data-count-to]')) {
    if (belowFold(el)) countUp(el);
  }
}
