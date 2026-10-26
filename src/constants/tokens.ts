/** Injection token for the module options. The value is kept from 0.0.x so lookups by string still resolve. */
export const TURNSTILE_OPTIONS = 'TurnstileServiceOptions';

export const TURNSTILE_ROUTE_OPTIONS =
  'nest-cloudflare-turnstile:route-options';

/** Request property that holds the verification result once the guard passes. */
export const TURNSTILE_RESULT = Symbol.for('nest-cloudflare-turnstile:result');
