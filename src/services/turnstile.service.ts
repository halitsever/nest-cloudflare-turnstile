import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { SITEVERIFY_URL, TEST_SECRET_KEYS } from '../constants/cloudflare';
import { Messages } from '../constants/messages';
import { TURNSTILE_OPTIONS } from '../constants/tokens';
import { TurnstileError } from '../errors/turnstile.error';
import type {
  ITurnstileOptions,
  TurnstileVerifyResponse,
} from '../interfaces/turnstile';

const DEFAULT_TIMEOUT_MS = 5_000;

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
      TEST_SECRET_KEYS.includes(secretKey)
    ) {
      this.logger.warn(
        'TurnstileModule is using a Cloudflare test secret key in production, so it cannot tell real visitors from bots.',
      );
    }
  }

  async validateToken(token: string): Promise<TurnstileVerifyResponse> {
    try {
      const response = await fetch(SITEVERIFY_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          secret: this.options.secretKey,
          response: token,
        }),
        signal: AbortSignal.timeout(this.options.timeout ?? DEFAULT_TIMEOUT_MS),
      });
      if (!response.ok) {
        throw new Error(`siteverify answered HTTP ${response.status}`);
      }
      return (await response.json()) as TurnstileVerifyResponse;
    } catch (cause) {
      this.options.onError?.(
        new TurnstileError('Turnstile siteverify request failed', { cause }),
      );
      throw new InternalServerErrorException(Messages.FAIL);
    }
  }
}
