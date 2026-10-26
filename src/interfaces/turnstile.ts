import type { ConfigurableModuleAsyncOptions } from '@nestjs/common';
import type { TurnstileError } from '../errors/turnstile.error';

export type TurnstileFailureReason = 'missing' | 'invalid';

export interface TurnstileFailureDetails {
  /** Codes from Cloudflare, or `hostname-mismatch` and `action-mismatch` from the guard. */
  errorCodes: string[];
}

export interface ITurnstileOptions {
  secretKey: string;
  tokenResponse: (req: any) => string;
  onError?: (error: TurnstileError) => void;
  skipIf?: boolean;
  exceptionFactory?: (
    reason: TurnstileFailureReason,
    details: TurnstileFailureDetails,
  ) => Error;
  /** Milliseconds to wait for siteverify. Defaults to 5000. */
  timeout?: number;
  /** Hostnames a token may be issued for. */
  expectedHostname?: string | string[];
  /** Widget actions a token may carry. `@TurnstileCaptcha({ action })` takes precedence. */
  expectedAction?: string | string[];
}

export interface TurnstileCaptchaOptions {
  /** Widget actions this route or controller accepts. */
  action?: string | string[];
}

/** Implemented by classes passed to `forRootAsync` as `useClass` or `useExisting`. */
export interface TurnstileOptionsFactory {
  createTurnstileOptions(): ITurnstileOptions | Promise<ITurnstileOptions>;
}

export type IAsyncTurnstileOptions = ConfigurableModuleAsyncOptions<
  ITurnstileOptions,
  'createTurnstileOptions'
> & { isGlobal?: boolean };

/** Body of a siteverify answer. */
export interface TurnstileVerifyResponse {
  success: boolean;
  'error-codes': string[];
  challenge_ts?: string;
  hostname?: string;
  action?: string;
  cdata?: string;
  messages?: string[];
  metadata?: { ephemeral_id?: string; result_with_testing_key?: boolean };
}
