import type {
  ConfigurableModuleAsyncOptions,
  ExecutionContext,
} from '@nestjs/common';
import type { TurnstileError } from '../errors/turnstile.error';

export type TurnstileFailureReason = 'missing' | 'invalid';

export interface TurnstileFailureDetails {
  /** Codes from Cloudflare, or codes the guard adds such as `hostname-mismatch`. */
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
  /** More widgets, each with its own secret key. A route picks one with `@TurnstileCaptcha({ widget })`. */
  widgets?: Record<string, TurnstileWidgetOptions>;
}

/** A widget besides the module's own. Settings left out fall back to the module's. */
export interface TurnstileWidgetOptions {
  /** Secret key of this widget. The module refuses to start when it is empty. */
  secretKey: string | undefined;
  expectedHostname?: string | string[];
  expectedAction?: string | string[];
  tokenResponse?: (req: any, context: ExecutionContext) => unknown;
}

export interface ValidateTokenOptions {
  /** Visitor IP, sent to Cloudflare as `remoteip`. */
  remoteIp?: string;
  /** Name of the widget whose secret key to use instead of the module's. */
  widget?: string;
}

export interface TurnstileCaptchaOptions {
  /** Widget actions this route or controller accepts. */
  action?: string | string[];
  /** Name of the widget, from the module's `widgets`, whose tokens this route accepts. */
  widget?: string;
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
