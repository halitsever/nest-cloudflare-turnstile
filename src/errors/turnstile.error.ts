/** Passed to `onError` when siteverify gives no usable verdict. Never carries the secret key. */
export class TurnstileError extends Error {
  /** Error codes from Cloudflare. Empty when siteverify could not be reached. */
  readonly errorCodes: string[];

  constructor(
    message: string,
    options: { cause?: unknown; errorCodes?: string[] } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = 'TurnstileError';
    this.errorCodes = options.errorCodes ?? [];
  }
}
