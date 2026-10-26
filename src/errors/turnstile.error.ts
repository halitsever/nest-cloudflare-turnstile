/** Passed to `onError` when siteverify gives no usable verdict. Never carries the secret key. */
export class TurnstileError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'TurnstileError';
  }
}
