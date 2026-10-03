/** Layout helpers: per-market identity variants, tel links, hours text and the mobile menu toggle. Pure, no config imports. */
import type { MarketId, MarketPack } from '@/domain/markets';
import type { Site } from '@/domain/presets';
import type { Clinic } from '@/domain/types';

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

const DIAL: Record<MarketId, string> = { AU: '61', CA: '1', UK: '44' };

/** International tel: link from a local number. */
export function telHref(phone: string, id: MarketId): string {
  const digits = phone.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return `tel:${digits}`;
  const national = id === 'CA' ? digits.replace(/^1(?=\d{10}$)/, '') : digits.replace(/^0/, '');
  return `tel:+${DIAL[id]}${national}`;
}

function clock(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const hour = h % 12 || 12;
  return `${hour}${m ? `:${String(m).padStart(2, '0')}` : ''} ${h < 12 ? 'am' : 'pm'}`;
}

export function hoursText(h: Clinic['hours'][number]): string {
  const days = h.days.length > 1 ? `${h.days[0]} to ${h.days[h.days.length - 1]}` : h.days[0];
  return `${days} ${clock(h.opens)} to ${clock(h.closes)}`;
}

const PAGE_LABELS: Record<string, string> = { '/privacy/': 'Privacy policy', '/accessibility/': 'Accessibility', '/terms/': 'Terms' };
export function pageLabel(path: string): string {
  return PAGE_LABELS[path] ?? path.replace(/\//g, '').replace(/-/g, ' ');
}

/** Client: wire the menu button to the nav. */
export function initMenu(doc: Document = document): void {
  const button = doc.querySelector<HTMLButtonElement>('[data-menu-toggle]');
  const nav = doc.getElementById('site-nav');
  if (!button || !nav) return;
  const set = (open: boolean) => {
    button.setAttribute('aria-expanded', String(open));
    nav.toggleAttribute('data-open', open);
  };
  button.addEventListener('click', () => set(button.getAttribute('aria-expanded') !== 'true'));
  doc.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') {
      set(false);
      button.focus();
    }
  });
}

/** The market this build is configured for (pages use this instead of reading site.market). */
export function configuredMarket(site: Site): MarketPack {
  return site.market;
}
