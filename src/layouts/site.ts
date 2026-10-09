/** Layout helpers: per-market identity variants, tel links, hours text and the mobile menu toggle. Pure, no config imports. */
import { getMarket, type MarketId, type MarketPack } from '@/domain/markets';
import type { Site } from '@/domain/presets';
import type { Clinic } from '@/domain/types';
import { clock, openStatus } from '@/core/hours';

export interface Variant {
  id: MarketId;
  market: MarketPack;
  clinic: Clinic;
}

/** One entry per market the visitor can switch to. Other markets borrow the matching demo site's clinic. */
export function marketVariants(site: Site, all: Record<string, Site>): Variant[] {
  const others = Object.values(all);
  return site.markets.map((id) => {
    if (id === site.market.id) return { id, market: site.market, clinic: site.clinic };
    const match = others.find((s) => s.market.id === id && s.preset.id === site.preset.id);
    return match ? { id, market: match.market, clinic: match.clinic } : { id, market: site.market, clinic: site.clinic };
  });
}

/** International tel: link from a local number. */
export function telHref(phone: string, id: MarketId): string {
  const digits = phone.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return `tel:${digits}`;
  const { dial, trunk } = getMarket(id).phone;
  const national = digits.startsWith(trunk) && (trunk !== '1' || /^1\d{10}$/.test(digits)) ? digits.slice(trunk.length) : digits;
  return `tel:+${dial}${national}`;
}

export function hoursText(h: Clinic['hours'][number]): string {
  const days = h.days.length > 1 ? `${h.days[0]} to ${h.days[h.days.length - 1]}` : h.days[0];
  return `${days} ${clock(h.opens)} to ${clock(h.closes)}`;
}

const PAGE_LABELS: Record<string, string> = { '/privacy/': 'Privacy policy', '/accessibility/': 'Accessibility', '/terms/': 'Terms' };
export function pageLabel(path: string): string {
  return PAGE_LABELS[path] ?? path.replace(/\//g, '').replace(/-/g, ' ');
}

/** Client: wire the menu button to the slide-in nav. Escape, the scrim, the close button and focus leaving all close it. */
export function initMenu(doc: Document = document): void {
  const button = doc.querySelector<HTMLButtonElement>('[data-menu-toggle]');
  const nav = doc.getElementById('site-nav');
  if (!button || !nav) return;
  const isOpen = () => button.getAttribute('aria-expanded') === 'true';
  const set = (open: boolean) => {
    button.setAttribute('aria-expanded', String(open));
    nav.toggleAttribute('data-open', open);
  };
  const close = () => {
    if (!isOpen()) return;
    set(false);
    button.focus();
  };
  button.addEventListener('click', () => {
    set(!isOpen());
    if (isOpen()) nav.querySelector<HTMLElement>('[data-menu-close]')?.focus();
  });
  for (const el of doc.querySelectorAll('[data-menu-close], [data-menu-scrim]')) el.addEventListener('click', close);
  nav.addEventListener('focusout', (e) => {
    const next = e.relatedTarget as Node | null;
    if (isOpen() && next && !nav.contains(next) && next !== button) set(false);
  });
  doc.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
}

/** Client: the header turns solid once the utility row has scrolled away. One observer, no scroll listener. */
export function initHeader(doc: Document = document): void {
  const header = doc.querySelector<HTMLElement>('[data-header]');
  const utility = header?.querySelector('[data-utility]');
  if (!header || !utility || !('IntersectionObserver' in window)) return;
  // The stuck utility row sits exactly above the viewport edge, which still counts as intersecting; one pixel of margin settles it.
  new IntersectionObserver(([e]) => header.toggleAttribute('data-scrolled', !e.isIntersecting), { rootMargin: '-1px 0px 0px 0px' }).observe(utility);
}

/** Client: fill every open-now indicator from the hours and time zone it carries. */
export function initOpenStatus(doc: Document = document, now = new Date()): void {
  for (const el of doc.querySelectorAll<HTMLElement>('[data-open-status]')) {
    // ponytail: worked out once per page load; add a minute timer if a tab left open across closing time matters
    const status = openStatus(JSON.parse(el.dataset.hours ?? '[]'), now, el.dataset.tz ?? 'UTC');
    el.dataset.open = String(status.open);
    const label = el.querySelector('[data-open-label]');
    if (label) label.textContent = status.label;
  }
}

/** The market this build is configured for (pages use this instead of reading site.market). */
export function configuredMarket(site: Site): MarketPack {
  return site.market;
}
