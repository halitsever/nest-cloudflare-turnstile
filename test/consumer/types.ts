// Compiled inside the consumer app against the packed declarations, with the TypeScript of each Nest era.
import 'reflect-metadata';
import { Controller, Injectable, Module, Post } from '@nestjs/common';
import {
  ITurnstileOptions,
  TURNSTILE_OPTIONS,
  TurnstileCaptcha,
  TurnstileError,
  TurnstileModule,
  TurnstileOptionsFactory,
  TurnstileService,
  TurnstileVerifyResponse,
} from 'nest-cloudflare-turnstile';

@Injectable()
class TurnstileConfig implements TurnstileOptionsFactory {
  createTurnstileOptions(): ITurnstileOptions {
    return { secretKey: 'secret', tokenResponse: (req) => req.body.token };
  }
}

@Controller()
@TurnstileCaptcha()
export class GuardedController {
  constructor(private readonly turnstile: TurnstileService) {}

  @Post()
  @TurnstileCaptcha()
  check(): Promise<TurnstileVerifyResponse> {
    return this.turnstile.validateToken('token');
  }
}

@Module({
  imports: [
    TurnstileModule.forRoot({
      secretKey: 'secret',
      tokenResponse: (req) => req.body.token,
      isGlobal: false,
      onError: (error: TurnstileError) => console.error(error.message),
    }),
  ],
})
export class SyncModule {}

@Module({
  imports: [TurnstileModule.forRootAsync({ useClass: TurnstileConfig })],
})
export class AsyncModule {}

export const optionsToken: string = TURNSTILE_OPTIONS;
