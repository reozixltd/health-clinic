import { afterEach, describe, expect, it, vi } from 'vitest';

describe('storage fallback', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('falls back to memory and reports non-persistent when localStorage throws', async () => {
    vi.stubGlobal('localStorage', {
      setItem: () => {
        throw new Error('blocked');
      },
      getItem: () => null,
      removeItem: () => undefined,
    });
    const { getStorage, isStoragePersistent } = await import('@/core/storage');
    const s = getStorage();
    s.setItem('k', 'v');
    expect(s.getItem('k')).toBe('v');
    expect(isStoragePersistent()).toBe(false);
  });

  it('reports persistent when localStorage works', async () => {
    const { isStoragePersistent } = await import('@/core/storage');
    expect(isStoragePersistent()).toBe(true);
  });

  it('readJson falls back on corrupt data and writeJson reports failure', async () => {
    const { createMemoryStorage, readJson, writeJson } = await import('@/core/storage');
    const s = createMemoryStorage();
    s.setItem('k', '{bad');
    expect(readJson(s, 'k', [1])).toEqual([1]);
    expect(writeJson(s, 'k', { a: 1 })).toBe(true);
    expect(readJson(s, 'k', null)).toEqual({ a: 1 });
    expect(writeJson({ ...s, setItem: () => { throw new Error('full'); } }, 'k', 1)).toBe(false);
  });

  it('getSessionStorage falls back to memory when sessionStorage throws', async () => {
    vi.stubGlobal('sessionStorage', {
      setItem: () => {
        throw new Error('blocked');
      },
      getItem: () => null,
      removeItem: () => undefined,
    });
    const { getSessionStorage } = await import('@/core/storage');
    const s = getSessionStorage();
    s.setItem('k', 'v');
    expect(s.getItem('k')).toBe('v');
  });
});
