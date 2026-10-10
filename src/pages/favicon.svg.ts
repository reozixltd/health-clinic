/** The tab icon: the clinic's initial on its theme's brand colour, read from the tokens so no colour lives here. */
import type { APIRoute } from 'astro';
import { site } from '@/config';
import tokens from '@/styles/tokens.css?raw';

const token = (name: string) =>
  tokens.match(new RegExp(`\\[data-theme='${site.theme}'\\]\\s*\\{[^}]*--color-${name}:\\s*([^;]+);`))?.[1] ?? 'currentColor';

export const GET: APIRoute = () =>
  new Response(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="${token('primary')}"/>` +
      `<text x="16" y="23" text-anchor="middle" font-family="Georgia, serif" font-size="20" font-weight="700" fill="${token('on-ink')}">${site.clinic.name.charAt(0)}</text></svg>`,
    { headers: { 'content-type': 'image/svg+xml' } },
  );
