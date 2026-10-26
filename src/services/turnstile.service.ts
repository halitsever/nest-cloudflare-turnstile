import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  DUMMY_TOKEN,
  SITEVERIFY_URL,
  TEST_SECRET_KEYS,
} from '../constants/cloudflare';
import { Messages } from '../constants/messages';
import { TURNSTILE_OPTIONS } from '../constants/tokens';
import { TurnstileError } from '../errors/turnstile.error';
import { findWidget } from '../utils/widgets';
import type {
  ITurnstileOptions,
  TurnstileVerifyEvent,
  TurnstileVerifyResponse,
  ValidateTokenOptions,
} from '../interfaces/turnstile';

const DEFAULT_TIMEOUT_MS = 5_000;
const MAX_ATTEMPTS = 2;

/** Codes that blame the secret, the request or Cloudflare rather than the visitor. */
const SERVER_ERROR_CODES = [
  'missing-input-secret',
  'invalid-input-secret',
  'bad-request',
  'internal-error',
];

const SECRET_ERROR_CODES = ['missing-input-secret', 'invalid-input-secret'];

/** A failed exchange keeps Cloudflare's answer, if any, next to the error. */
type Exchange =
  | {
      outcome: 'success' | 'rejected';
      result: TurnstileVerifyResponse;
      error?: undefined;
      attempts: number;
    }
  | {
      outcome: 'failed';
      result?: TurnstileVerifyResponse;
      error: TurnstileError;
      attempts: number;
    };

@Injectable()
export class TurnstileService implements OnModuleInit {
  private readonly logger = new Logger('TurnstileModule');

  constructor(
    @Inject(TURNSTILE_OPTIONS)
    private readonly options: ITurnstileOptions,
  ) {}

  /** Setup mistakes throw right away. A promise comes back only while the secrets are checked with Cloudflare. */
  onModuleInit(): void | Promise<void> {
    const {
      secretKey,
      skipIf,
      verifySecretOnStartup,
      widgets = {},
    } = this.options;
    const secrets: Array<[label: string, secret: string | undefined]> = [
      ['', secretKey],
      ...Object.entries(widgets).map(
        ([name, widget]): [string, string | undefined] => [
          ` for widget "${name}"`,
          widget.secretKey,
        ],
      ),
    ];
    for (const [label, secret] of secrets) {
      if (!secret && skipIf !== true) {
        throw new Error(
          `TurnstileModule needs a secretKey${label}. Set one, or set skipIf: true to turn validation off.`,
        );
      }
      if (
        process.env.NODE_ENV === 'production' &&
        TEST_SECRET_KEYS.includes(secret ?? '')
      ) {
        this.logger.warn(
          `TurnstileModule is using a Cloudflare test secret key in production${label}, so it cannot tell real visitors from bots.`,
        );
      }
    }
    if (verifySecretOnStartup && skipIf !== true) {
      return Promise.all(
        secrets.map(([label, secret]) => this.verifySecret(label, secret)),
      ).then(() => undefined);
    }
  }

  /** A Cloudflare outage only warns, because it must not keep the app from starting. */
  private async verifySecret(
    label: string,
    secret: string | undefined,
  ): Promise<void> {
    const exchange = await this.post(secret, DUMMY_TOKEN);
    if (exchange.outcome !== 'failed') return;
    const { errorCodes } = exchange.error;
    if (errorCodes.some((code) => SECRET_ERROR_CODES.includes(code))) {
      throw new Error(
        `Cloudflare refused the TurnstileModule secretKey${label} [${errorCodes.join(', ')}]. Check the key in the Cloudflare dashboard.`,
      );
    }
    this.logger.warn(
      `TurnstileModule could not check the secretKey${label} with Cloudflare at startup: ${describe(exchange.error)}`,
    );
  }

  /**
   * Asks siteverify about a token. Resolves with the verdict, including rejections;
   * throws a 500 when the request itself fails or Cloudflare blames the setup.
   */
  async validateToken(
    token: string,
    { remoteIp, widget }: ValidateTokenOptions = {},
  ): Promise<TurnstileVerifyResponse> {
    const { secretKey } = findWidget(this.options, widget) ?? this.options;
    const started = performance.now();
    const exchange = await this.post(secretKey, token, remoteIp);
    this.notify({
      ...exchange,
      widget,
      durationMs: Math.round(performance.now() - started),
    });
    if (exchange.outcome === 'failed') throw this.fail(exchange.error);
    return exchange.result;
  }

  /** Tries twice; the shared idempotency key lets Cloudflare treat the retry as the same check. */
  private async post(
    secret: string | undefined,
    token: string,
    remoteIp?: string,
  ): Promise<Exchange> {
    const body = JSON.stringify({
      secret,
      response: token,
      remoteip: remoteIp,
      idempotency_key: randomUUID(),
    });
    let cause: unknown;
    for (let attempts = 1; attempts <= MAX_ATTEMPTS; attempts++) {
      try {
        const result = await this.request(body);
        const retryable = result['error-codes']?.includes('internal-error');
        if (!retryable || attempts === MAX_ATTEMPTS) {
          return classify(result, attempts);
        }
      } catch (error) {
        cause = error;
      }
    }
    const error = new TurnstileError('Turnstile siteverify request failed', {
      cause,
    });
    return { outcome: 'failed', error, attempts: MAX_ATTEMPTS };
  }

  private async request(body: string): Promise<TurnstileVerifyResponse> {
    const send = this.options.fetch ?? fetch;
    const response = await send(SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
      signal: AbortSignal.timeout(this.options.timeout ?? DEFAULT_TIMEOUT_MS),
    });
    // Bad secrets and malformed requests come back as 4xx with a JSON verdict.
    if (response.status >= 500) {
      // An unread body holds its connection until garbage collection; waiting on the cancel could hang.
      response.body?.cancel().catch(() => undefined);
      throw new Error(`siteverify answered HTTP ${response.status}`);
    }
    return (await response.json()) as TurnstileVerifyResponse;
  }

  private fail(error: TurnstileError): InternalServerErrorException {
    this.report(error);
    return new InternalServerErrorException(Messages.FAIL);
  }

  /** Nest does not log HttpExceptions, so without onError a broken setup would fail silently. */
  private report(error: TurnstileError): void {
    const { onError } = this.options;
    if (onError) this.runHook('onError', () => onError(error));
    else this.logger.error(describe(error));
  }

  private notify(event: TurnstileVerifyEvent): void {
    const { onVerify, debug } = this.options;
    if (debug) this.logger.debug(summarize(event));
    if (onVerify) {
      // A copy, so a hook that redacts the result cannot change what the guard checks next.
      const copy = { ...event, result: structuredClone(event.result) };
      this.runHook('onVerify', () => onVerify(copy));
    }
  }

  /** A hook that throws or rejects is logged, so it can neither break the check nor leave an unhandled rejection. */
  private runHook(name: string, hook: () => unknown): void {
    const logFailure = (cause: unknown) =>
      this.logger.error(`${name} failed: ${describe(cause)}`);
    try {
      Promise.resolve(hook()).catch(logFailure);
    } catch (cause) {
      logFailure(cause);
    }
  }
}

function classify(result: TurnstileVerifyResponse, attempts: number): Exchange {
  if (result.success) return { outcome: 'success', result, attempts };
  const errorCodes = (result['error-codes'] ?? []).filter((code) =>
    SERVER_ERROR_CODES.includes(code),
  );
  if (errorCodes.length === 0) return { outcome: 'rejected', result, attempts };
  const error = new TurnstileError('Turnstile siteverify refused the request', {
    errorCodes,
  });
  return { outcome: 'failed', result, error, attempts };
}

/** Leaves out the token, the secret key and cdata, which can hold a session ID. */
function summarize(event: TurnstileVerifyEvent): string {
  const errorCodes = event.result?.['error-codes'] ?? [];
  const codes = errorCodes.length > 0 ? ` [${errorCodes.join(', ')}]` : '';
  const widget =
    event.widget === undefined ? '' : ` for widget "${event.widget}"`;
  const attempts =
    event.attempts === 1 ? '1 attempt' : `${event.attempts} attempts`;
  return `siteverify ${event.outcome}${codes}${widget}: ${attempts}, ${event.durationMs} ms`;
}

function describe(error: unknown): string {
  if (!(error instanceof Error)) return String(error);
  const codes =
    error instanceof TurnstileError && error.errorCodes.length > 0
      ? ` [${error.errorCodes.join(', ')}]`
      : '';
  const cause = error.cause instanceof Error ? `: ${error.cause.message}` : '';
  return `${error.message}${codes}${cause}`;
}
