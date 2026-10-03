import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';

// CHROMIUM_PATH wins; the sandbox path is used when it exists; otherwise Playwright's own download.
const SANDBOX_CHROMIUM = '/opt/pw-browsers/chromium';
const executablePath = process.env.CHROMIUM_PATH ?? (existsSync(SANDBOX_CHROMIUM) ? SANDBOX_CHROMIUM : undefined);

export const BASE = process.env.SITE_URL ?? 'http://localhost:4321';
export const SITE_ID = process.env.SITE_ID ?? 'fernway-au';

let failures = 0;
export async function step(name, fn) {
  try {
    await fn();
    console.log(`  ok   ${name}`);
  } catch (e) {
    failures += 1;
    console.log(`  FAIL ${name}\n       ${String(e?.message ?? e).split('\n').join('\n       ')}`);
  }
}

class Finished extends Error {}
// Anything else that escapes a test file still fails the run.
process.on('uncaughtException', (e) => {
  if (e instanceof Finished) return;
  console.error(e);
  process.exitCode = 1;
  closeBrowser().catch(() => {}); // an open Chromium handle would otherwise keep the process alive
});

// Call at module top level, not inside step() or an un-awaited async function: a caught sentinel does not stop the script.
export function finish() {
  // Guards use finish() as an early exit, so it must stop the script. process.exit() cannot be used: on Windows it printed
  // "Assertion failed: !(handle->flags & UV_HANDLE_CLOSING)" (libuv, async.c) and the runner exited non-zero, even when only
  // fetch() had run. So set exitCode and throw a sentinel to unwind the script; the handler above swallows it and the loop drains.
  process.exitCode = failures ? 1 : 0;
  throw new Finished();
}

export function skip(name) {
  console.log(`  skip ${name}`);
}

let browser;
export async function withPage(opts, fn) {
  browser ??= await chromium.launch({ executablePath });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, ...opts });
  const page = await context.newPage();
  try {
    return await fn(page, context);
  } finally {
    await context.close();
  }
}

export async function closeBrowser() {
  await browser?.close();
  browser = undefined;
}

export function expect(cond, message) {
  if (!cond) throw new Error(message);
}

export /** The text of every script a built page loads, following relative imports between chunks. */
function loadedJs(distDir, page) {
  const seen = new Set();
  const read = (file) => {
    if (seen.has(file)) return '';
    seen.add(file);
    let text = '';
    try { text = readFileSync(file, 'utf8'); } catch { return ''; }
    const refs = [...text.matchAll(/(?:from|import)\s*["'](\.[^"']+\.js)["']/g)].map((m) => join(file, '..', m[1]));
    return text + refs.map(read).join('');
  };
  const srcs = [...readFileSync(join(distDir, page), 'utf8').matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/g)].map((m) => m[1]);
  return srcs.map((src) => read(join(distDir, src))).join('');
}
