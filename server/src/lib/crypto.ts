import { randomBytes, randomInt, createHash } from 'node:crypto';

// Unambiguous uppercase alphanumeric charset (no 0/O or 1/I) for human
// readable order references like BNG-7K9F3Q (BanaGifts).
const REFERENCE_CHARSET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const REFERENCE_LENGTH = 6;
const REFERENCE_PREFIX = 'BNG-';

export function generateOrderReference(): string {
  let suffix = '';
  for (let i = 0; i < REFERENCE_LENGTH; i += 1) {
    suffix += REFERENCE_CHARSET[randomInt(0, REFERENCE_CHARSET.length)];
  }
  return `${REFERENCE_PREFIX}${suffix}`;
}

/** Plaintext tracking token — returned to the client exactly once. */
export function generateTrackingToken(): string {
  return randomBytes(32).toString('hex');
}

/** One-way hash of the tracking token — the only form persisted in the DB. */
export function hashTrackingToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
