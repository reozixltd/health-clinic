/** Photo slot names per content folder. Names only: drop <slot>.jpg into src/assets/images/. */
export const photoSlots: Record<string, string[]> = {
  fernway: [
    'clinic-exterior',
    'reception',
    'treatment-room-physio',
    'treatment-room-dental',
    'consulting-room-psychology',
    'hero-consult',
    'service-physiotherapy',
    'service-sports-physio',
    'service-dental-check-up',
    'service-dental-hygiene',
    'service-psychology',
    'waiting-area',
    'rehab-gym',
    'clinic-detail',
    'founder-priya',
    'blog-back-care',
    'blog-return-to-running',
    'blog-dental-check-up',
    'blog-dental-clean',
    'blog-first-psychology-session',
    'blog-sleep-and-pain',
    'provider-priya-nair',
    'provider-tom-hargreave',
    'provider-elena-marsh',
    'provider-sam-whitlock',
    'provider-hannah-reyes',
    'provider-lucas-brandt',
    ...Array.from({ length: 9 }, (_, i) => `avatar-${i + 1}`),
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
  fernway: { hero: 'hero-consult', exterior: 'clinic-exterior', firstVisit: 'treatment-room-physio' },
  hollybank: { hero: 'vet-reception', exterior: 'vet-exterior', firstVisit: 'consult-room' },
};

/**
 * Alt text for every slot that is not a person's portrait. Provider photos take their alt from the
 * clinician's name and role, and review avatars from the reviewer's name.
 */
export const photoAlt: Record<string, string> = {
  'clinic-exterior': 'Clinic entrance with glass doors and a timber deck',
  reception: 'Bright waiting area with a reception counter and blue chairs',
  'treatment-room-physio': 'Treatment room with a treatment table',
  'treatment-room-dental': 'Dental surgery with the chair set up',
  'consulting-room-psychology': 'Consulting room with two rose armchairs by the window',
  'hero-consult': 'A clinician with a clipboard listening to a patient across a table in a bright room',
  'service-physiotherapy': 'A physiotherapist assessing a woman with back pain beside a sunlit window',
  'service-sports-physio': 'A physiotherapist guiding a patient through a stretch on the treatment couch',
  'service-dental-check-up': 'A smiling patient sitting in the dental chair',
  'service-dental-hygiene': 'A clinician showing a patient how to brush on a model of teeth',
  'service-psychology': 'A psychologist talking with a client in armchairs',
  'waiting-area': 'Waiting lounge with timber tables, plants and tall windows',
  'rehab-gym': 'Rehab studio with timber reformer beds and a large plant',
  'clinic-detail': 'A rolled towel, a candle and dried flowers set out on a treatment couch',
  'founder-priya': 'Priya Nair, founder of the clinic, at her desk',
  'blog-back-care': 'A woman stretching in her office chair by a window',
  'blog-return-to-running': 'A runner on a grass path in low evening sun',
  'blog-dental-check-up': 'A patient smiling as she sits up in the dental chair',
  'blog-dental-clean': 'A hygienist holding a model of teeth beside a patient',
  'blog-first-psychology-session': 'Two people talking across a quiet room',
  'blog-sleep-and-pain': 'A woman asleep in white bedding',
  'vet-exterior': 'Small white single-storey building with a blue door',
  'vet-reception': 'Reception desk with lockers behind it',
  'consult-room': 'Consulting room with an exam table',
  'prep-and-theatre': 'Theatre with the operating table and surgical light',
};

/** Where the subject sits in a photo that gets cropped hard, as a CSS object-position. Centre when unset. */
export const photoFocus: Record<string, string> = {
  'hero-consult': '80% 40%',
};

export interface SlotPhoto {
  slot: string;
  alt: string;
  focus?: string;
}

export function slotPhoto(slot: string | undefined): SlotPhoto | undefined {
  const alt = slot ? photoAlt[slot] : undefined;
  return slot && alt ? { slot, alt, focus: photoFocus[slot] } : undefined;
}

export function rolePhoto(contentDir: string, role: PhotoRole): SlotPhoto | undefined {
  return slotPhoto(photoRoles[contentDir]?.[role]);
}
