/**
 * Which lead store this build uses. `local` is the browser-only demo store. When you implement
 * HttpLeadRepository (see docs/customising.md), set this to `http` and return it from getLeadRepository().
 * Plain data with no imports, so astro.config.mjs can read it for the build warning.
 */
export const LEAD_STORE: 'local' | 'http' = 'local';
