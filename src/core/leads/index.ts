/**
 * The single place that decides which lead store a site uses. Production:
 * return an HttpLeadRepository (same LeadRepository interface) instead.
 * The namespace is the site's storage prefix, e.g. `health:v1:fernway-au`.
 */
import { getStorage } from '../storage';
import { LocalLeadRepository, RATE_PER_HOUR } from './local-repository';
import type { LeadRepository } from './repository';
import { LEAD_STORE } from './store';

const repos = new Map<string, LeadRepository>();

export function getLeadRepository(namespace: string, opts: { demo?: boolean } = {}): LeadRepository {
  let repo = repos.get(namespace);
  if (!repo) {
    if (LEAD_STORE !== 'local') throw new Error('LEAD_STORE is http but getLeadRepository() does not return an HttpLeadRepository yet.');
    repo = new LocalLeadRepository(getStorage(), namespace, Date.now, opts.demo ? RATE_PER_HOUR.demo : RATE_PER_HOUR.live);
    repos.set(namespace, repo);
  }
  return repo;
}

export * from './types';
export { RateLimitError } from './repository';
export type { LeadRepository, LeadFilter } from './repository';
