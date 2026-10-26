import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { SITEVERIFY_URL, TEST_SECRET_KEYS } from '../constants/cloudflare';
import { Messages } from '../constants/messages';
import { TURNSTILE_OPTIONS } from '../constants/tokens';
import { TurnstileError } from '../errors/turnstile.error';
import type {
  ITurnstileOptions,
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

@Injectable()
export class TurnstileService implements OnModuleInit {
  private readonly logger = new Logger('TurnstileModule');

  constructor(
    @Inject(TURNSTILE_OPTIONS)
    private readonly options: ITurnstileOptions,
  ) {}

  onModuleInit(): void {
    const { secretKey, skipIf } = this.options;
    if (!secretKey && skipIf !== true) {
      throw new Error(
        'TurnstileModule needs a secretKey. Set one, or set skipIf: true to turn validation off.',
      );
    }
    if (
      process.env.NODE_ENV === 'production' &&
      TEST_SECRET_KEYS.includes(secretKey ?? '')
    ) {
      this.logger.warn(
        'TurnstileModule is using a Cloudflare test secret key in production, so it cannot tell real visitors from bots.',
      );
    }
  }

  /**
   * Asks siteverify about a token. Resolves with the verdict, including rejections;
   * throws a 500 when the request itself fails or Cloudflare blames the setup.
   */
  async validateToken(
    token: string,
    { remoteIp }: ValidateTokenOptions = {},
  ): Promise<TurnstileVerifyResponse> {
    const body = JSON.stringify({
      secret: this.options.secretKey,
      response: token,
      remoteip: remoteIp,
      idempotency_key: randomUUID(),
    });
    const result = await this.post(body);
    const serverCodes = result.success
      ? []
      : (result['error-codes'] ?? []).filter((code) =>
          SERVER_ERROR_CODES.includes(code),
        );
    if (serverCodes.length > 0) {
      throw this.fail(
        new TurnstileError('Turnstile siteverify refused the request', {
          errorCodes: serverCodes,
        }),
      );
    }
    return result;
  }

  /** Tries twice; the shared idempotency key lets Cloudflare treat the retry as the same check. */
  private async post(body: string): Promise<TurnstileVerifyResponse> {
    let failure: unknown;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const result = await this.request(body);
        const retryable = result['error-codes']?.includes('internal-error');
        if (!retryable || attempt === MAX_ATTEMPTS) return result;
      } catch (error) {
        failure = error;
      }
    }
    throw this.fail(
      new TurnstileError('Turnstile siteverify request failed', {
        cause: failure,
      }),
    );
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
    if (!onError) {
      this.logger.error(describe(error));
      return;
    }
    const logFailure = (cause: unknown) =>
      this.logger.error(`onError failed: ${describe(cause)}`);
    try {
      // An async handler that rejects must not turn into an unhandled rejection.
      Promise.resolve(onError(error)).catch(logFailure);
    } catch (cause) {
      logFailure(cause);
    }
  }
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
