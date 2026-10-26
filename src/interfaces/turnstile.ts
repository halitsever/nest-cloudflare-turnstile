import type { ConfigurableModuleAsyncOptions } from '@nestjs/common';
import type { TurnstileError } from '../errors/turnstile.error';

export interface ITurnstileOptions {
  secretKey: string;
  tokenResponse: (req: any) => string;
  onError?: (error: TurnstileError) => void;
  skipIf?: boolean;
  exceptionFactory?: (reason: 'missing' | 'invalid') => Error;
  /** Milliseconds to wait for siteverify. Defaults to 5000. */
  timeout?: number;
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
