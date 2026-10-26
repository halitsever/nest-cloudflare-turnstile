import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Messages } from '../constants/messages';
import { TURNSTILE_OPTIONS } from '../constants/tokens';
import { TurnstileError } from '../errors/turnstile.error';
import type {
  ITurnstileOptions,
  TurnstileVerifyResponse,
} from '../interfaces/turnstile';

const SITEVERIFY_URL =
  'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const DEFAULT_TIMEOUT_MS = 5_000;

@Injectable()
export class TurnstileService {
  constructor(
    @Inject(TURNSTILE_OPTIONS)
    private readonly options: ITurnstileOptions,
  ) {}

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
