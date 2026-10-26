import {
  Controller,
  INestApplication,
  Post,
  Type,
  UnauthorizedException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import {
  createTurnstileServiceStub,
  TurnstileCaptcha,
  TurnstileModule,
  TurnstileResult,
  TurnstileService,
  type TurnstileStubVerdict,
  type TurnstileVerifyResponse,
} from '../src/main';
import { ProtectedController } from './helpers/app';
import { siteverifyRequests } from './helpers/siteverify';

@Controller('result')
class ResultController {
  @Post()
  @TurnstileCaptcha()
  handle(@TurnstileResult() result: TurnstileVerifyResponse) {
    return result;
  }
}

/** An app as a user would test it: real module and guard, stubbed service. */
async function appWithStub(
  verdict: TurnstileStubVerdict,
  controllers: Type[] = [ProtectedController],
): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [
      TurnstileModule.forRoot({
        secretKey: '',
        tokenResponse: (req) => req.body?.token,
        expectedHostname: 'shop.example',
        exceptionFactory: (reason, { errorCodes }) =>
          new UnauthorizedException({ reason, errorCodes }),
      }),
    ],
    controllers,
  })
    .overrideProvider(TurnstileService)
    .useValue(createTurnstileServiceStub(verdict))
    .compile();
  const app = moduleRef.createNestApplication({ logger: false });
  await app.init();
  return app;
}

describe('createTurnstileServiceStub', () => {
  let app: INestApplication | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  it("lets requests through on 'pass' without calling Cloudflare", async () => {
    app = await appWithStub('pass');

    const res = await request(app.getHttpServer())
      .post('/protected')
      .send({ token: 'any-token' });

    expect(res.status).toBe(201);
    expect(siteverifyRequests).toHaveLength(0);
  });

  it("rejects tokens on 'fail' like Cloudflare's failing test key", async () => {
    app = await appWithStub('fail');

    const res = await request(app.getHttpServer())
      .post('/protected')
      .send({ token: 'any-token' });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      reason: 'invalid',
      errorCodes: ['invalid-input-response'],
    });
  });

  it("reports a spent token on 'spent'", async () => {
    app = await appWithStub('spent');

    const res = await request(app.getHttpServer())
      .post('/protected')
      .send({ token: 'any-token' });

    expect(res.body.errorCodes).toEqual(['timeout-or-duplicate']);
  });

  it('hands a custom verdict to the handler', async () => {
    const verdict = {
      success: true,
      'error-codes': [],
      hostname: 'shop.example',
      action: 'checkout',
      cdata: 'order-42',
    };
    app = await appWithStub(verdict, [ResultController]);

    const res = await request(app.getHttpServer())
      .post('/result')
      .send({ token: 'any-token' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(verdict);
  });
});
