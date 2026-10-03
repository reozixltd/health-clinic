// Page JavaScript budget: node tools/js-budget.mjs [dist/<site> ...]. Exits 1 when any page loads more than 30,720 gzipped bytes of JS.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';

const LIMIT = 30720;
const dirs = process.argv.slice(2);
if (dirs.length === 0) dirs.push(...['fernway-au', 'fernway-ca', 'hollybank'].map((id) => join('dist', id)));

const gz = (buf) => gzipSync(buf).length;

/** Gzipped size of a JS file and the static imports it pulls in, each counted once. */
function chunkBytes(root, urlPath, seen) {
  const file = join(root, urlPath.replace(/^\//, ''));
  if (seen.has(file) || !existsSync(file)) return 0;
  seen.add(file);
  const src = readFileSync(file);
  let total = gz(src);
  for (const m of src.toString().matchAll(/(?:\bfrom\s*|\bimport\s*)["'](\.{1,2}\/[^"']+\.js)["']/g)) {
    total += chunkBytes(root, resolve('/', dirname(urlPath), m[1]), seen);
  }
  return total;
}

let failed = false;
for (const dir of dirs) {
  const root = resolve(dir);
  if (!existsSync(root)) { console.error(`missing ${dir}. Run npm run build:all first.`); failed = true; continue; }
  let worst = { bytes: 0, page: '' };
  const files = readdirSync(root, { recursive: true }).map(String).filter((f) => f.endsWith('.html'));
  for (const f of files) {
    const html = readFileSync(join(root, f), 'utf8');
    const seen = new Set();
    let bytes = 0;
    for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
      const src = /\bsrc=["']([^"']+)["']/.exec(m[1]);
      if (src) bytes += src[1].startsWith('/') ? chunkBytes(root, src[1], seen) : 0;
      else if (!/type=["']application\/(ld\+)?json["']/.test(m[1])) bytes += gz(Buffer.from(m[2]));
    }
    for (const m of html.matchAll(/import\(?\s*["'](\/[^"']+\.js)["']/g)) bytes += chunkBytes(root, m[1], seen);
    if (bytes > worst.bytes) worst = { bytes, page: f };
    if (bytes > LIMIT) { console.error(`FAIL ${dir}/${f}: ${bytes} gzipped bytes (limit ${LIMIT})`); failed = true; }
  }
  console.log(`${dir}: ${files.length} pages, largest ${worst.bytes} gzipped bytes (${worst.page || 'no scripts'}), limit ${LIMIT}`);
}
process.exit(failed ? 1 : 0);
