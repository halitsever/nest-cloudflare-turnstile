import type {
  ConfigurableModuleAsyncOptions,
  ExecutionContext,
} from '@nestjs/common';
import type { TurnstileError } from '../errors/turnstile.error';

export type TurnstileFailureReason = 'missing' | 'invalid';

export interface TurnstileFailureDetails {
  /** Codes from Cloudflare, or `hostname-mismatch` and `action-mismatch` from the guard. */
  errorCodes: string[];
}

export interface ITurnstileOptions {
  /** Secret key of the Turnstile widget, from the Cloudflare dashboard. The module refuses to start when it is empty. */
  secretKey: string | undefined;
  /**
   * Reads the token from the request. Defaults to the `cf-turnstile-response`
   * body field, which the widget adds to forms, then the header of the same name.
   */
  tokenResponse?: (req: any, context: ExecutionContext) => unknown;
  /** Visitor IP, sent to Cloudflare as `remoteip`. Left out when this returns nothing. */
  remoteIp?: (req: any) => string | undefined;
  /** Hostnames a token may be issued for. */
  expectedHostname?: string | string[];
  /** Widget actions a token may carry. `@TurnstileCaptcha({ action })` takes precedence. */
  expectedAction?: string | string[];
  /** Runs after Cloudflare accepted the token. Return false to reject it, for example when `cdata` does not match the session. */
  validateResult?: (
    result: TurnstileVerifyResponse,
    req: any,
    context: ExecutionContext,
  ) => boolean | Promise<boolean>;
  /** Milliseconds to wait for each siteverify attempt. Defaults to 5000. */
  timeout?: number;
  /** Sends the siteverify requests instead of the global `fetch`, for example through a proxy. */
  fetch?: typeof fetch;
  /** Lets requests through without a check, for example in tests. */
  skipIf?:
    boolean | ((context: ExecutionContext) => boolean | Promise<boolean>);
  /** Builds the exception for a missing or rejected token. Defaults to `BadRequestException`. */
  exceptionFactory?: (
    reason: TurnstileFailureReason,
    details: TurnstileFailureDetails,
  ) => Error;
  /** Called when siteverify cannot be reached or refuses the request itself. The guard then answers 500. */
  onError?: (error: TurnstileError) => void;
}

export interface ValidateTokenOptions {
  /** Visitor IP, sent to Cloudflare as `remoteip`. */
  remoteIp?: string;
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
