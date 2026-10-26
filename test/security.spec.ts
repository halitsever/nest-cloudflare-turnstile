import {
  Controller,
  INestApplication,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { TurnstileCaptcha } from '../src/main';
import { createApp } from './helpers/app';
import {
  siteverifyReplies,
  siteverifyRequests,
  verified,
} from './helpers/siteverify';

@Controller('login')
@TurnstileCaptcha()
class LoginController {
  @Post()
  @TurnstileCaptcha({ action: 'login' })
  login() {
    return { ok: true };
  }
}

@Controller('signup')
@TurnstileCaptcha({ action: 'signup' })
class SignupController {
  @Post()
  create() {
    return { ok: true };
  }
}

/** Reports the reason and error codes in the response body. */
const exceptionFactory = (
  reason: string,
  { errorCodes }: { errorCodes: string[] },
) => new UnauthorizedException({ reason, errorCodes });

describe('security checks', () => {
  let app: INestApplication | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  it('accepts a token issued for an expected hostname', async () => {
    siteverifyReplies({ body: verified });
    app = await createApp('express', {
      expectedHostname: ['shop.example', 'example.com'],
    });

    const res = await request(app.getHttpServer())
      .post('/protected')
      .send({ token: 'token-from-widget' });

    expect(res.status).toBe(201);
  });

  it('rejects a token issued for another hostname', async () => {
    siteverifyReplies({ body: verified });
    app = await createApp('express', {
      expectedHostname: 'shop.example',
      exceptionFactory,
    });

    const res = await request(app.getHttpServer())
      .post('/protected')
      .send({ token: 'token-from-widget' });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      reason: 'invalid',
      errorCodes: ['hostname-mismatch'],
    });
  });

  it('rejects a token whose action differs from expectedAction', async () => {
    siteverifyReplies({ body: verified });
    app = await createApp('express', {
      expectedAction: 'signup',
      exceptionFactory,
    });

    const res = await request(app.getHttpServer())
      .post('/protected')
      .send({ token: 'token-from-widget' });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      reason: 'invalid',
      errorCodes: ['action-mismatch'],
    });
  });

  it('lets a route action override expectedAction', async () => {
    siteverifyReplies({ body: verified });
    app = await createApp('express', { expectedAction: 'signup' }, [
      LoginController,
    ]);

    const res = await request(app.getHttpServer())
      .post('/login')
      .send({ token: 'token-from-widget' });

    expect(res.status).toBe(201);
  });

  it("applies the controller's action to routes without their own", async () => {
    siteverifyReplies({ body: verified });
    app = await createApp('express', { exceptionFactory }, [SignupController]);

    const res = await request(app.getHttpServer())
      .post('/signup')
      .send({ token: 'token-from-widget' });

    expect(res.status).toBe(401);
    expect(res.body.errorCodes).toEqual(['action-mismatch']);
  });

  it("accepts a token whose action matches the controller's", async () => {
    siteverifyReplies({ body: { ...verified, action: 'signup' } });
    app = await createApp('express', {}, [SignupController]);

    const res = await request(app.getHttpServer())
      .post('/signup')
      .send({ token: 'token-from-widget' });

    expect(res.status).toBe(201);
  });

  it('checks the token once when both the controller and the route are decorated', async () => {
    siteverifyReplies({ body: verified });
    app = await createApp('express', {}, [LoginController]);

    await request(app.getHttpServer())
      .post('/login')
      .send({ token: 'token-from-widget' });

    expect(siteverifyRequests).toHaveLength(1);
  });

  it('skips hostname and action checks for results from test keys', async () => {
    siteverifyReplies({
      body: {
        success: true,
        challenge_ts: '2026-10-26T13:00:16.723Z',
        hostname: 'example.com',
        'error-codes': [],
        metadata: { result_with_testing_key: true },
      },
    });
    app = await createApp('express', {
      expectedHostname: 'shop.example',
      expectedAction: 'login',
    });

    const res = await request(app.getHttpServer())
      .post('/protected')
      .send({ token: 'XXXX.DUMMY.TOKEN.XXXX' });

    expect(res.status).toBe(201);
  });

  it('rejects a token longer than 2048 characters without calling Cloudflare', async () => {
    app = await createApp('express', { exceptionFactory });

    const res = await request(app.getHttpServer())
      .post('/protected')
      .send({ token: 'a'.repeat(2049) });

    expect(res.status).toBe(401);
    expect(res.body.reason).toBe('invalid');
    expect(siteverifyRequests).toHaveLength(0);
  });

  it('rejects a token that is not a string without calling Cloudflare', async () => {
    app = await createApp('express', { exceptionFactory });

    const res = await request(app.getHttpServer())
      .post('/protected')
      .send({ token: ['one', 'two'] });

    expect(res.status).toBe(401);
    expect(res.body.reason).toBe('invalid');
    expect(siteverifyRequests).toHaveLength(0);
  });
});
