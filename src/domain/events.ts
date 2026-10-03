/** Booking state broadcast between the booking steps and the page chrome. */
export const BOOKING_EVENT = 'health:booking';

export function emitBooking<T>(state: T): void {
  document.dispatchEvent(new CustomEvent<T>(BOOKING_EVENT, { detail: state }));
}

export function onBooking<T>(cb: (state: T) => void): () => void {
  const handler = (e: Event) => cb((e as CustomEvent<T>).detail);
  document.addEventListener(BOOKING_EVENT, handler);
  return () => document.removeEventListener(BOOKING_EVENT, handler);
}
