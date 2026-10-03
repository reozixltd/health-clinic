/**
 * The single place that decides which lead store a site uses. Production:
 * return an HttpLeadRepository (same LeadRepository interface) instead.
 * The namespace is the site's storage prefix, e.g. `health:v1:fernway-au`.
 */
import { getStorage } from '../storage';
import { LocalLeadRepository } from './local-repository';
import type { LeadRepository } from './repository';

const repos = new Map<string, LeadRepository>();

export function getLeadRepository(namespace: string): LeadRepository {
  let repo = repos.get(namespace);
  if (!repo) {
    repo = new LocalLeadRepository(getStorage(), namespace);
    repos.set(namespace, repo);
  }
  return repo;
}

export * from './types';
export { RateLimitError } from './repository';
export type { LeadRepository, LeadFilter } from './repository';
