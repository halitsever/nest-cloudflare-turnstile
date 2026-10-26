import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MAX_TOKEN_LENGTH } from '../constants/cloudflare';
import { Messages } from '../constants/messages';
import {
  TURNSTILE_OPTIONS,
  TURNSTILE_RESULT,
  TURNSTILE_ROUTE_OPTIONS,
} from '../constants/tokens';
import type {
  ITurnstileOptions,
  TurnstileCaptchaOptions,
  TurnstileFailureReason,
  TurnstileVerifyResponse,
} from '../interfaces/turnstile';
import { TurnstileService } from '../services/turnstile.service';

@Injectable()
export class TurnstileGuard implements CanActivate {
  constructor(
    private readonly turnstileService: TurnstileService,
    @Inject(TURNSTILE_OPTIONS)
    private readonly options: ITurnstileOptions,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.options.skipIf === true) return true;

    const request = context.switchToHttp().getRequest();
    // A controller and its route can both carry the guard, but a token can only be verified once.
    if (request[TURNSTILE_RESULT]) return true;

    const token: unknown = this.options.tokenResponse(request);
    if (!token) throw this.reject('missing', []);
    if (typeof token !== 'string' || token.length > MAX_TOKEN_LENGTH) {
      throw this.reject('invalid', []);
    }

    const result = await this.turnstileService.validateToken(token);
    if (!result.success) throw this.reject('invalid', result['error-codes']);

    const mismatch = this.findMismatch(result, context);
    if (mismatch) throw this.reject('invalid', [mismatch]);

    request[TURNSTILE_RESULT] = result;
    return true;
  }

  private findMismatch(
    result: TurnstileVerifyResponse,
    context: ExecutionContext,
  ): string | undefined {
    // Test keys never report the real hostname or action.
    if (result.metadata?.result_with_testing_key) return undefined;
    if (!matches(this.options.expectedHostname, result.hostname)) {
      return 'hostname-mismatch';
    }
    const action = this.routeAction(context) ?? this.options.expectedAction;
    if (!matches(action, result.action)) return 'action-mismatch';
    return undefined;
  }

  /** The route's own action wins over its controller's. */
  private routeAction(
    context: ExecutionContext,
  ): string | string[] | undefined {
    return [context.getHandler(), context.getClass()]
      .map(
        (target) =>
          this.reflector.get<TurnstileCaptchaOptions | undefined>(
            TURNSTILE_ROUTE_OPTIONS,
            target,
          )?.action,
      )
      .find((action) => action !== undefined);
  }

  private reject(reason: TurnstileFailureReason, errorCodes: string[]): Error {
    if (this.options.exceptionFactory) {
      return this.options.exceptionFactory(reason, { errorCodes });
    }
    return new BadRequestException(
      reason === 'missing' ? Messages.MISSING : Messages.INVALID,
    );
  }
}

function matches(
  expected: string | string[] | undefined,
  actual: string | undefined,
): boolean {
  if (expected === undefined) return true;
  const allowed = Array.isArray(expected) ? expected : [expected];
  return actual !== undefined && allowed.includes(actual);
}
