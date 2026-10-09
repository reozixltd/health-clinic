import { describe, expect, it } from 'vitest';
import { photoAlt, photoRoles, photoSlots, rolePhoto, slotPhoto } from '@/config/photo-slots';
import { hasPhoto } from '@/core/photos';
import { initials } from '@/modules/providers/registration';

describe('photo roles', () => {
  it('every role names a slot listed for that content folder, with alt text', () => {
    for (const [dir, roles] of Object.entries(photoRoles)) {
      for (const slot of Object.values(roles)) {
        expect(photoSlots[dir], dir).toContain(slot);
        expect(photoAlt[slot], slot).toBeTruthy();
      }
    }
  });

  it('every slot has alt text unless it is a portrait named from content', () => {
    for (const slot of Object.values(photoSlots).flat()) {
      if (/^(provider|avatar)-/.test(slot)) expect(photoAlt[slot]).toBeUndefined();
      else expect(photoAlt[slot], slot).toBeTruthy();
    }
  });

  it('every room slot with alt text has a photo file', () => {
    for (const slot of Object.keys(photoAlt)) expect(hasPhoto(slot), slot).toBe(true);
  });

  it('each brand has its own building', () => {
    expect(photoRoles.fernway!.exterior).not.toBe(photoRoles.hollybank!.exterior);
    expect(photoRoles.fernway!.hero).not.toBe(photoRoles.hollybank!.hero);
  });

  it('rolePhoto returns the slot and alt, or nothing for a folder with no roles', () => {
    expect(rolePhoto('fernway', 'hero')).toMatchObject({ slot: 'hero-consult', alt: photoAlt['hero-consult'] });
    expect(rolePhoto('fixture-minimal', 'hero')).toBeUndefined();
    expect(rolePhoto('', 'exterior')).toBeUndefined();
  });

  it('slotPhoto returns nothing for a missing or unknown slot', () => {
    expect(slotPhoto(undefined)).toBeUndefined();
    expect(slotPhoto('no-such-slot')).toBeUndefined();
    expect(slotPhoto('consult-room')).toEqual({ slot: 'consult-room', alt: photoAlt['consult-room'] });
  });
});

describe('initials', () => {
  it.each([
    ['Priya Nair', 'PN'],
    ['Dr Elena Marsh', 'EM'],
    ['Dr. Tom Hargreave', 'TH'],
    ['Prof Sam Lee Whitlock', 'SW'],
    ['Cher', 'C'],
    ['  Hannah   Reyes  ', 'HR'],
    ['Zoë Müller-Lang', 'ZM'],
    ['élodie durand', 'ÉD'],
    ['', ''],
    ['   ', ''],
  ])('%j gives %j', (name, expected) => {
    expect(initials(name)).toBe(expected);
  });

  it('never contains the text undefined', () => {
    for (const name of ['', 'Dr', 'A', 'Dr  ']) expect(initials(name)).not.toContain('undefined');
  });
});
