// Architecture boundary checker. Direction: pages -> layouts|sections -> modules -> domain -> core.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';

const LAYERS = ['core', 'domain', 'modules', 'sections', 'layouts', 'pages', 'config', 'presets', 'content', 'styles'];
const EXT = /\.(ts|mjs|astro|css)$/;
const STORAGE_OK = ['core/storage.ts', 'layouts/ThemeBoot.astro'];
const MARKET_OK = (rel) => rel === 'domain/presets.ts' || rel.startsWith('layouts/');

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : EXT.test(name) ? [p] : [];
  });
}

/** Layer of a path relative to src: 'core', 'modules/booking', ... or null. */
function layerOf(relPath) {
  const [top, name] = relPath.split('/');
  if (!LAYERS.includes(top)) return null;
  return top === 'modules' ? `modules/${name}` : top;
}

const UI = ['sections', 'layouts', 'pages'];
const DATA = ['config', 'presets', 'content'];
/** Upward edges not covered by a named rule. */
function isUpward(from, target) {
  const t = target.startsWith('modules/') ? 'modules' : target;
  const f = from.startsWith('modules/') ? 'modules' : from;
  if (f === 'domain' || f === 'modules') return UI.includes(t);
  if (f === 'layouts') return t === 'sections' || t === 'pages';
  if (f === 'sections') return t === 'layouts';
  if (DATA.includes(f)) return t === 'modules' || UI.includes(t);
  return false;
}

function specifiers(text) {
  const re = /(?:\bfrom\s*|\bimport\s*\(?\s*)['"]([^'"]+)['"]/g;
  return [...text.matchAll(re)].map((m) => m[1]);
}

function resolveSpec(spec, fileRel) {
  if (spec.startsWith('@/')) return spec.slice(2);
  if (!spec.startsWith('.')) return null;
  const rel = relative('src', resolve('src', dirname(fileRel), spec)).split(sep).join('/');
  return rel.startsWith('..') ? null : rel;
}

const HEX = /(?<![\w&])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b/;
const FUNC = /\b(?:rgba?|hsla?)\(/;

export function findViolations(rootDir) {
  const src = join(rootDir, 'src');
  const out = [];
  for (const file of walk(src)) {
    const rel = relative(src, file).split(sep).join('/');
    const text = readFileSync(file, 'utf8');
    const from = layerOf(rel);
    const add = (rule, detail) => out.push({ file: join(rootDir, 'src', rel), rule, detail });

    for (const spec of specifiers(text)) {
      const target = layerOf(resolveSpec(spec, rel) ?? '');
      if (!target || !from) continue;
      if (from === 'core' && target !== 'core') add('core-imports-outside', spec);
      else if (from === 'domain' && target.startsWith('modules')) add('domain-imports-module', spec);
      else if (from.startsWith('modules/') && target.startsWith('modules/') && target !== from) add('module-imports-module', spec);
      else if (from === 'sections' && target === 'pages') add('section-imports-page', spec);
      else if (isUpward(from, target)) add('upward-import', `${from} -> ${target}: ${spec}`);
    }
    if (/\b(?:localStorage|sessionStorage)\b/.test(text) && !STORAGE_OK.includes(rel)) {
      add('storage-outside-core', 'localStorage/sessionStorage');
    }
    const noAnchors = text.replace(/href=["']#[^"']*["']/g, '');
    if (rel !== 'styles/tokens.css' && (HEX.test(noAnchors) || FUNC.test(noAnchors))) {
      add('raw-colour-outside-tokens', 'raw colour value');
    }
    if (/\bsite\.market\b/.test(text) && !MARKET_OK(rel)) add('market-read-outside-presets', 'site.market');
  }
  return out;
}
