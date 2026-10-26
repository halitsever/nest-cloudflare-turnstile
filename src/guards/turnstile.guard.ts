import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MAX_TOKEN_LENGTH, TOKEN_FIELD } from '../constants/cloudflare';
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
  TurnstileWidgetOptions,
} from '../interfaces/turnstile';
import { TurnstileService } from '../services/turnstile.service';
import { getRequest } from '../utils/request';
import { findWidget } from '../utils/widgets';

// Nest shares one context among a call's guards, so a guarded controller and route verify once,
// while every GraphQL field resolution gets its own context and needs its own token.
const verifiedCalls = new WeakSet<ExecutionContext>();

@Injectable()
export class TurnstileGuard implements CanActivate {
  constructor(
    private readonly turnstileService: TurnstileService,
    @Inject(TURNSTILE_OPTIONS)
    private readonly options: ITurnstileOptions,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (await this.shouldSkip(context)) return true;

    if (verifiedCalls.has(context)) return true;

    const widgetName = this.routeOption(context, 'widget');
    const widget = findWidget(this.options, widgetName);
    const request = getRequest(context);
    const readToken =
      widget?.tokenResponse ?? this.options.tokenResponse ?? readDefaultToken;
    const token = readToken(request, context);
    if (!token) throw this.reject('missing', []);
    if (typeof token !== 'string' || token.length > MAX_TOKEN_LENGTH) {
      throw this.reject('invalid', []);
    }

    const result = await this.turnstileService.validateToken(token, {
      remoteIp: this.options.remoteIp?.(request),
      widget: widgetName,
    });
    if (!result.success) {
      const codes = result['error-codes'] ?? [];
      const reason = codes.includes('missing-input-response')
        ? 'missing'
        : 'invalid';
      throw this.reject(reason, codes);
    }

    const mismatch = this.findMismatch(result, context, widget);
    if (mismatch) throw this.reject('invalid', [mismatch]);

    const { validateResult } = this.options;
    if (validateResult && !(await validateResult(result, request, context))) {
      throw this.reject('invalid', ['validate-result-failed']);
    }

    verifiedCalls.add(context);
    if (request) request[TURNSTILE_RESULT] = result;
    return true;
  }

  private async shouldSkip(context: ExecutionContext): Promise<boolean> {
    const { skipIf } = this.options;
    return typeof skipIf === 'function'
      ? await skipIf(context)
      : skipIf === true;
  }

  private findMismatch(
    result: TurnstileVerifyResponse,
    context: ExecutionContext,
    widget: TurnstileWidgetOptions | undefined,
  ): string | undefined {
    // Test keys never report the real hostname or action.
    if (result.metadata?.result_with_testing_key) return undefined;
    const hostname = widget?.expectedHostname ?? this.options.expectedHostname;
    if (!matches(hostname, result.hostname)) return 'hostname-mismatch';
    const action =
      this.routeOption(context, 'action') ??
      widget?.expectedAction ??
      this.options.expectedAction;
    if (!matches(action, result.action)) return 'action-mismatch';
    return undefined;
  }

  /** A route's own setting wins over its controller's. */
  private routeOption<K extends keyof TurnstileCaptchaOptions>(
    context: ExecutionContext,
    key: K,
  ): TurnstileCaptchaOptions[K] | undefined {
    return [context.getHandler(), context.getClass()]
      .map(
        (target) =>
          this.reflector.get<TurnstileCaptchaOptions | undefined>(
            TURNSTILE_ROUTE_OPTIONS,
            target,
          )?.[key],
      )
      .find((value) => value !== undefined);
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

function readDefaultToken(req: any): unknown {
  return req?.body?.[TOKEN_FIELD] ?? req?.headers?.[TOKEN_FIELD];
}

function matches(
  expected: string | string[] | undefined,
  actual: string | undefined,
): boolean {
  if (expected === undefined) return true;
  const allowed = Array.isArray(expected) ? expected : [expected];
  return actual !== undefined && allowed.includes(actual);
}
