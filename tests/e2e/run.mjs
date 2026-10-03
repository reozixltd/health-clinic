/* Builds each demo site, serves it with astro preview, runs every *.e2e.mjs against it. */
import { spawn, spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
// Ports run from E2E_PORT_BASE (default 4321) upward, so parallel worktrees can use separate ranges.
const BASE_PORT = Number(process.env.E2E_PORT_BASE ?? 4321);
const SITES = ['fernway-au', 'fernway-ca', 'hollybank'].map((id, i) => ({ id, port: BASE_PORT + i }));
// The module-off fixture is built for modules.e2e.mjs only and is not part of build:all.
const FIXTURES = [
  { id: 'fixture-minimal', port: BASE_PORT + 3, files: ['modules.e2e.mjs'] },
  { id: 'fixture-no-booking', port: BASE_PORT + 4, files: ['booking-off.e2e.mjs'] },
];
const FIXTURE_FILES = FIXTURES.flatMap((f) => f.files);
const only = process.env.E2E_SITES?.split(',');
const demo = only ? SITES.filter((s) => only.includes(s.id)) : SITES;
const sites = only ? [...demo, ...FIXTURES.filter((f) => only.includes(f.id))] : [...demo, ...FIXTURES];
const files = readdirSync(dirname(fileURLToPath(import.meta.url))).filter((f) => f.endsWith('.e2e.mjs')).sort();
const servers = [];
let failed = false;

function stopAll() {
  for (const s of servers) {
    try { process.kill(-s.pid, 'SIGTERM'); } catch {}
  }
}
for (const [sig, code] of [['SIGINT', 130], ['SIGTERM', 143]]) process.on(sig, () => { stopAll(); process.exit(code); });
process.on('exit', stopAll);

async function portFree(port) {
  try {
    await fetch(`http://localhost:${port}/`);
    return false;
  } catch {
    return true;
  }
}

async function waitFor(url) {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

try {
  for (const { port } of sites) {
    if (!(await portFree(port))) throw new Error(`Port ${port} is already in use. Stop whatever is listening there and run again.`);
  }
  for (const { id } of sites) {
    console.log(`build ${id}`);
    const b = spawnSync('npx', ['astro', 'build', '--outDir', `dist/${id}`], { cwd: root, env: { ...process.env, SITE: id }, stdio: 'inherit' });
    if (b.status !== 0) throw new Error(`build failed for ${id}`);
  }
  for (const { id, port } of sites) {
    servers.push(spawn('npx', ['astro', 'preview', '--outDir', `dist/${id}`, '--port', String(port)], { cwd: root, env: { ...process.env, SITE: id }, stdio: 'ignore', detached: true }));
  }
  for (const { port } of sites) await waitFor(`http://localhost:${port}/`);
  for (const { id } of demo) {
    console.log(`third-party ${id}`);
    const t = spawnSync('node', ['tools/third-party.mjs', `dist/${id}`], { cwd: root, stdio: 'inherit' });
    if (t.status !== 0) failed = true;
  }
  for (const { id, port } of sites) {
    for (const file of FIXTURES.find((f) => f.id === id)?.files ?? files.filter((f) => !FIXTURE_FILES.includes(f))) {
      console.log(`${id} ${file}`);
      const r = spawnSync('node', [join('tests/e2e', file)], { cwd: root, env: { ...process.env, SITE_ID: id, SITE_URL: `http://localhost:${port}` }, stdio: 'inherit' });
      if (r.status !== 0) failed = true;
    }
  }
} catch (e) {
  console.error(e.message);
  failed = true;
} finally {
  stopAll();
}
process.exit(failed ? 1 : 0);
