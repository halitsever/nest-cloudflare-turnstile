// Compiled inside the consumer app against the packed declarations, with the TypeScript of each Nest era.
import 'reflect-metadata';
import {
  Controller,
  Get,
  Injectable,
  Module,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WsException,
} from '@nestjs/websockets';
import {
  createTurnstileServiceStub,
  ITurnstileOptions,
  SkipTurnstile,
  TURNSTILE_OPTIONS,
  TurnstileCaptcha,
  TurnstileError,
  TurnstileGuard,
  TurnstileModule,
  TurnstileOptionsFactory,
  TurnstileResult,
  TurnstileService,
  type TurnstileStubVerdict,
  type TurnstileVerifyEvent,
  type TurnstileVerifyResponse,
  type TurnstileWidgetOptions,
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

  @Post('subscribe')
  @TurnstileCaptcha({ widget: 'newsletter' })
  subscribe(): Promise<TurnstileVerifyResponse> {
    return this.turnstile.validateToken('token', { widget: 'newsletter' });
  }

  @Get('health')
  @SkipTurnstile()
  health(): string {
    return 'ok';
  }
}

@Controller('status')
@SkipTurnstile()
export class StatusController {}

@WebSocketGateway()
export class ChatGateway {
  @SubscribeMessage('join')
  @TurnstileCaptcha({ action: 'join' })
  join(
    @MessageBody() body: { room: string },
    @TurnstileResult() result: TurnstileVerifyResponse,
  ): string {
    return `${body.room} ${result.hostname ?? ''}`;
  }
}

const newsletter: TurnstileWidgetOptions = {
  secretKey: process.env.TURNSTILE_NEWSLETTER_SECRET_KEY,
  expectedAction: 'subscribe',
  expectedHostname: ['example.com'],
  tokenResponse: (req) => req.headers['x-newsletter-token'],
};

function recordCheck(event: TurnstileVerifyEvent): void {
  const codes = event.result?.['error-codes'] ?? event.error?.errorCodes;
  console.log(
    event.widget,
    event.outcome,
    codes,
    event.durationMs,
    event.attempts,
  );
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
      fetch: (input, init) => fetch(input, init),
      validateResult: async (result, req, context) =>
        context.getType() === 'http' && result.cdata === req.session?.id,
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

// The README example: an environment variable is string | undefined under strict.
@Module({
  imports: [
    TurnstileModule.forRoot({ secretKey: process.env.TURNSTILE_SECRET_KEY }),
  ],
})
export class EnvModule {}

@Module({
  imports: [
    TurnstileModule.forRoot({
      secretKey: 'secret',
      widgets: { newsletter },
      onVerify: recordCheck,
      debug: true,
      verifySecretOnStartup: true,
      exceptionFactory: (reason, { errorCodes }, context) =>
        context.getType() === 'ws'
          ? new WsException({ reason, errorCodes })
          : new UnauthorizedException({ reason, errorCodes }),
    }),
  ],
  controllers: [StatusController],
  providers: [ChatGateway, { provide: APP_GUARD, useClass: TurnstileGuard }],
})
export class GlobalGuardModule {}

export const optionsToken: string = TURNSTILE_OPTIONS;

const spent: TurnstileStubVerdict = 'spent';
export const stubs: TurnstileService[] = [
  createTurnstileServiceStub(),
  createTurnstileServiceStub(spent),
  createTurnstileServiceStub({ success: true, 'error-codes': [] }),
];
