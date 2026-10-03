import type { BookingConfig } from '@/domain/types';

/** Practice-system hand-off link; null when the site takes requests itself (`none`) or embeds the system. */
export function handoffUrl(cfg: BookingConfig, serviceSlug: string | null): string | null {
  if (cfg.provider !== 'link' || !cfg.url) return null;
  if (!serviceSlug) return cfg.url;
  const sep = cfg.url.includes('?') ? '&' : '?';
  return `${cfg.url}${sep}${encodeURIComponent(cfg.serviceParam ?? 'service')}=${encodeURIComponent(serviceSlug)}`;
}
