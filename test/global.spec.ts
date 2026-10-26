import { Controller, INestApplication, Post } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import {
  SkipTurnstile,
  TurnstileCaptcha,
  TurnstileGuard,
  TurnstileModule,
} from '../src/main';
import { createApp, SECRET } from './helpers/app';
import {
  siteverifyReplies,
  siteverifyRequests,
  verified,
} from './helpers/siteverify';

@Controller('forms')
class FormsController {
  @Post('contact')
  contact() {
    return { ok: true };
  }

  @Post('login')
  @TurnstileCaptcha()
  login() {
    return { ok: true };
  }

  @Post('signup')
  @TurnstileCaptcha({ action: 'signup' })
  signup() {
    return { ok: true };
  }

  @Post('ping')
  @SkipTurnstile()
  ping() {
    return { ok: true };
  }
}

@Controller('health')
@SkipTurnstile()
class HealthController {
  @Post()
  check() {
    return { ok: true };
  }

  @Post('report')
  @TurnstileCaptcha()
  report() {
    return { ok: true };
  }
}

@Controller('account')
@TurnstileCaptcha()
class AccountController {
  @Post('logout')
  @SkipTurnstile()
  logout() {
    return { ok: true };
  }
}

/** Every route sits behind the guard, as with `APP_GUARD` in an app module. */
async function createGuardedApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [
      TurnstileModule.forRoot({
        secretKey: SECRET,
        tokenResponse: (req) => req.body?.token,
      }),
    ],
    controllers: [FormsController, HealthController],
    providers: [{ provide: APP_GUARD, useClass: TurnstileGuard }],
  }).compile();
  const app = moduleRef.createNestApplication({ logger: false });
  await app.init();
  return app;
}

describe('SkipTurnstile', () => {
  let app: INestApplication | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  it('lets the global guard protect routes without a decorator', async () => {
    app = await createGuardedApp();

    const res = await request(app.getHttpServer()).post('/forms/contact');

    expect(res.status).toBe(400);
  });

  it('lets a marked route through without calling Cloudflare', async () => {
    siteverifyReplies({ body: verified });
    app = await createGuardedApp();

    const res = await request(app.getHttpServer()).post('/forms/ping');

    expect(res.status).toBe(201);
    expect(siteverifyRequests).toHaveLength(0);
  });

  it('lets every route of a marked controller through', async () => {
    app = await createGuardedApp();

    const res = await request(app.getHttpServer()).post('/health');

    expect(res.status).toBe(201);
  });

  it('still guards a route that asks for Turnstile inside a marked controller', async () => {
    app = await createGuardedApp();

    const res = await request(app.getHttpServer()).post('/health/report');

    expect(res.status).toBe(400);
  });

  it('checks the token once when the route also carries the decorator', async () => {
    siteverifyReplies({ body: verified });
    app = await createGuardedApp();

    const res = await request(app.getHttpServer())
      .post('/forms/login')
      .send({ token: 'token-from-widget' });

    expect(res.status).toBe(201);
    expect(siteverifyRequests).toHaveLength(1);
  });

  it("applies the route's options when the global guard checks the token", async () => {
    siteverifyReplies({ body: verified });
    app = await createGuardedApp();

    const res = await request(app.getHttpServer())
      .post('/forms/signup')
      .send({ token: 'token-from-widget' });

    expect(res.status).toBe(400);
  });

  it('exempts a route from the guard of its controller', async () => {
    app = await createApp('express', {}, [AccountController]);

    const res = await request(app.getHttpServer()).post('/account/logout');

    expect(res.status).toBe(201);
  });
});
