/** Photo slot names per content folder. Names only: drop <slot>.jpg into src/assets/photos/. */
export const photoSlots: Record<string, string[]> = {
  fernway: [
    'clinic-exterior',
    'reception',
    'treatment-room-physio',
    'treatment-room-dental',
    'consulting-room-psychology',
    'provider-priya-nair',
    'provider-tom-hargreave',
    'provider-elena-marsh',
    'provider-sam-whitlock',
    'provider-hannah-reyes',
    'provider-lucas-brandt',
  ],
  hollybank: [
    'vet-exterior',
    'vet-reception',
    'consult-room',
    'prep-and-theatre',
    'provider-amelia-thornton',
    'provider-callum-reid',
    'provider-hannah-pickles',
    'provider-jess-moorcroft',
  ],
};

export type PhotoRole = 'hero' | 'exterior' | 'firstVisit';

/** Which slot fills each fixed position on a page. A content folder with no entry shows no photo there. */
export const photoRoles: Record<string, Record<PhotoRole, string>> = {
  fernway: { hero: 'reception', exterior: 'clinic-exterior', firstVisit: 'treatment-room-physio' },
  hollybank: { hero: 'vet-reception', exterior: 'vet-exterior', firstVisit: 'consult-room' },
};

/** Alt text for room slots. Provider photos take their alt from the clinician's name and role. */
export const photoAlt: Record<string, string> = {
  'clinic-exterior': 'Front entrance of the clinic',
  reception: 'Reception desk and waiting area',
  'treatment-room-physio': 'Physiotherapy treatment room with a treatment table',
  'treatment-room-dental': 'Dental surgery with the chair set up',
  'consulting-room-psychology': 'Quiet consulting room with two chairs',
  'vet-exterior': 'Small clinic building with a blue front door',
  'vet-reception': 'Reception desk with lockers behind it',
  'consult-room': 'Consulting room with an exam table',
  'prep-and-theatre': 'Theatre with the operating table and surgical light',
};

export interface SlotPhoto {
  slot: string;
  alt: string;
}

export function slotPhoto(slot: string | undefined): SlotPhoto | undefined {
  const alt = slot ? photoAlt[slot] : undefined;
  return slot && alt ? { slot, alt } : undefined;
}

export function rolePhoto(contentDir: string, role: PhotoRole): SlotPhoto | undefined {
  return slotPhoto(photoRoles[contentDir]?.[role]);
}
