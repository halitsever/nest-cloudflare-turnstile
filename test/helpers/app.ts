import { Controller, INestApplication, Post, Type } from '@nestjs/common';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import {
  ITurnstileOptions,
  TurnstileCaptcha,
  TurnstileModule,
} from '../../src/main';

export const SECRET = 'test-secret-key';

export type Adapter = 'express' | 'fastify';

@Controller()
export class ProtectedController {
  @Post('protected')
  @TurnstileCaptcha()
  handle() {
    return { ok: true };
  }
}

/** Boots an app whose /protected route sits behind the guard. */
export async function createApp(
  adapter: Adapter,
  options: Partial<ITurnstileOptions> = {},
  controllers: Type[] = [ProtectedController],
): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [
      TurnstileModule.forRoot({
        secretKey: SECRET,
        tokenResponse: (req) => req.body?.token,
        ...options,
      }),
    ],
    controllers,
  }).compile();

  if (adapter === 'express') {
    const app = moduleRef.createNestApplication({ logger: false });
    await app.init();
    return app;
  }

  const app = moduleRef.createNestApplication<NestFastifyApplication>(
    new FastifyAdapter(),
    { logger: false },
  );
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
  return app;
}
