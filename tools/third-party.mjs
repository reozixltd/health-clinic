/* Lists third-party <script src> and <link rel=preconnect> origins in the request pages of a build. */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const PAGES = ['book/index.html', 'estimates/index.html', 'referrers/index.html'];

export function thirdParty(html, own = 'https://health.reozix.com') {
  const found = [];
  const tags = html.match(/<(script|link)\b[^>]*>/gi) ?? [];
  for (const tag of tags) {
    const isScript = /^<script/i.test(tag);
    if (!isScript && !/\brel=["']?preconnect/i.test(tag)) continue;
    const url = (isScript ? tag.match(/\bsrc=["']?([^"'\s>]+)/i) : tag.match(/\bhref=["']?([^"'\s>]+)/i))?.[1];
    if (!url) continue;
    if (!/^(https?:)?\/\//i.test(url)) continue;
    const origin = new URL(url.startsWith('//') ? `https:${url}` : url).origin;
    if (origin !== new URL(own).origin) found.push(`${origin} (${isScript ? 'script' : 'preconnect'})`);
  }
  return found;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const dist = process.argv[2];
  if (!dist) {
    console.error('usage: node tools/third-party.mjs <distDir>');
    process.exit(2);
  }
  let bad = 0;
  let checked = 0;
  for (const page of PAGES) {
    const file = join(dist, page);
    if (!existsSync(file)) continue;
    checked += 1;
    for (const f of thirdParty(readFileSync(file, 'utf8'))) {
      console.log(`  FAIL ${page}: ${f}`);
      bad += 1;
    }
  }
  console.log(`third-party check ${dist}: ${checked} page(s), ${bad} third-party origin(s)`);
  process.exit(bad ? 1 : 0);
}
