export const SITEVERIFY_URL =
  'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/** Name of the hidden input the widget adds to forms. */
export const TOKEN_FIELD = 'cf-turnstile-response';

/** Cloudflare caps tokens at this length, so longer ones are rejected without a round trip. */
export const MAX_TOKEN_LENGTH = 2048;

/** Issued by Cloudflare's test site keys. Real secret keys reject it as a bad token, not as a bad secret. */
export const DUMMY_TOKEN = 'XXXX.DUMMY.TOKEN.XXXX';

/** Dummy secrets from Cloudflare's testing docs. */
export const TEST_SECRET_KEYS = [
  '1x0000000000000000000000000000000AA',
  '2x0000000000000000000000000000000AA',
  '3x0000000000000000000000000000000AA',
];
