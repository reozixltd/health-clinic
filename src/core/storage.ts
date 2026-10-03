/**
 * Safe key-value storage. Browser storage can be missing or throw
 * (private mode, blocked cookies, previews), so callers get an in-memory
 * fallback instead of an exception and the page keeps working.
 */

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function createMemoryStorage(): KeyValueStorage {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  };
}

function probe(candidate: () => KeyValueStorage): KeyValueStorage | null {
  try {
    const store = candidate();
    store.setItem('__hc_probe__', '1');
    store.removeItem('__hc_probe__');
    return store;
  } catch {
    return null;
  }
}

let shared: KeyValueStorage | null = null;
let persistent = false;
let session: KeyValueStorage | null = null;

/** Browser localStorage when usable, otherwise a per-page memory store. */
export function getStorage(): KeyValueStorage {
  if (shared) return shared;
  const ls = probe(() => globalThis.localStorage);
  persistent = ls !== null;
  shared = ls ?? createMemoryStorage();
  return shared;
}

/** Browser sessionStorage when usable (booking drafts), otherwise a per-page memory store. */
export function getSessionStorage(): KeyValueStorage {
  session ??= probe(() => globalThis.sessionStorage) ?? createMemoryStorage();
  return session;
}

/** False when only the in-memory fallback is available (data is lost when the page closes). */
export function isStoragePersistent(): boolean {
  getStorage();
  return persistent;
}

export function readJson<T>(storage: KeyValueStorage, key: string, fallback: T): T {
  try {
    const raw = storage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

/** Returns false when the write failed (e.g. quota exceeded). */
export function writeJson(storage: KeyValueStorage, key: string, value: unknown): boolean {
  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
