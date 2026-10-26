/** Injection token for the module options. Apps may inject them by this string, so it must not change. */
export const TURNSTILE_OPTIONS = 'TurnstileServiceOptions';

export const TURNSTILE_ROUTE_OPTIONS =
  'nest-cloudflare-turnstile:route-options';

/** Request property that holds the verification result once the guard passes. */
export const TURNSTILE_RESULT = Symbol.for('nest-cloudflare-turnstile:result');
