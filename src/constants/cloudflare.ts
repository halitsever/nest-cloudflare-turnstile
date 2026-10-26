export const SITEVERIFY_URL =
  'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/** Cloudflare caps tokens at this length, so longer ones are rejected without a round trip. */
export const MAX_TOKEN_LENGTH = 2048;

/** Dummy secrets from Cloudflare's testing docs. */
export const TEST_SECRET_KEYS = [
  '1x0000000000000000000000000000000AA',
  '2x0000000000000000000000000000000AA',
  '3x0000000000000000000000000000000AA',
];
