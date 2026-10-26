import {
  Type,
  DynamicModule,
  ForwardReference,
  InjectionToken,
  OptionalFactoryDependency,
} from '@nestjs/common';
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

export interface IAsyncTurnstileOptions {
  imports?: Array<
    Type<any> | DynamicModule | Promise<DynamicModule> | ForwardReference
  >;
  inject?: Array<InjectionToken | OptionalFactoryDependency>;
  useFactory: (
    ...args: any[]
  ) => ITurnstileOptions | Promise<ITurnstileOptions>;
}

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
