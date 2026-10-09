/**
 * Resolves a photo slot to a file in src/assets/images/<slot>.<ext>.
 * Adding a photo needs no code change; slots without a file render a Placeholder.
 */
const files = import.meta.glob<{ default: ImageMetadata }>('/src/assets/images/*.{jpg,jpeg,png,webp,avif}', { eager: true });

const bySlot = new Map<string, ImageMetadata>();
for (const [path, mod] of Object.entries(files)) {
  bySlot.set(path.split('/').pop()!.replace(/\.[a-z]+$/i, ''), mod.default);
}

export function getPhoto(slot: string): ImageMetadata | undefined {
  return bySlot.get(slot);
}

export function hasPhoto(slot: string): boolean {
  return bySlot.has(slot);
}
