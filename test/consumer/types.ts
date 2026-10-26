// Compiled inside the consumer app against the packed declarations, with the TypeScript of each Nest era.
import 'reflect-metadata';
import {
  Controller,
  Injectable,
  Module,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ITurnstileOptions,
  TURNSTILE_OPTIONS,
  TurnstileCaptcha,
  TurnstileError,
  TurnstileModule,
  TurnstileOptionsFactory,
  TurnstileResult,
  TurnstileService,
  type TurnstileVerifyResponse,
} from 'nest-cloudflare-turnstile';

@Injectable()
class TurnstileConfig implements TurnstileOptionsFactory {
  createTurnstileOptions(): ITurnstileOptions {
    return { secretKey: 'secret', expectedHostname: 'example.com' };
  }
}

@Controller()
@TurnstileCaptcha()
export class GuardedController {
  constructor(private readonly turnstile: TurnstileService) {}

  @Post('login')
  @TurnstileCaptcha({ action: 'login' })
  login(@TurnstileResult() result: TurnstileVerifyResponse): string {
    return result.hostname ?? '';
  }

  @Post('manual')
  manual(): Promise<TurnstileVerifyResponse> {
    return this.turnstile.validateToken('token', { remoteIp: '203.0.113.7' });
  }
}

@Module({
  imports: [
    TurnstileModule.forRoot({
      secretKey: 'secret',
      tokenResponse: (req, context) =>
        context.getType() === 'http' ? req.body.token : undefined,
      remoteIp: (req) => req.ip,
      expectedAction: ['login', 'signup'],
      timeout: 3000,
      isGlobal: false,
      skipIf: async (context) => context.getType() === 'rpc',
      exceptionFactory: (reason, { errorCodes }) =>
        new UnauthorizedException({ reason, errorCodes }),
      onError: (error: TurnstileError) => console.error(error.errorCodes),
    }),
  ],
})
export class SyncModule {}

@Module({
  imports: [TurnstileModule.forRootAsync({ useClass: TurnstileConfig })],
})
export class AsyncModule {}

export const optionsToken: string = TURNSTILE_OPTIONS;
