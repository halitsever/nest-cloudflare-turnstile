import { Controller, INestApplication, Post } from '@nestjs/common';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import {
  TurnstileCaptcha,
  TurnstileResult,
  type TurnstileVerifyResponse,
} from '../src/main';
import { createApp } from './helpers/app';
import {
  siteverifyReplies,
  siteverifyRequests,
  verified,
} from './helpers/siteverify';

@Controller('result')
class ResultController {
  @Post()
  @TurnstileCaptcha()
  handle(@TurnstileResult() result: TurnstileVerifyResponse) {
    return { hostname: result.hostname, action: result.action };
  }
}

describe('guard options', () => {
  let app: INestApplication | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  it('reads the cf-turnstile-response body field when tokenResponse is not set', async () => {
    siteverifyReplies({ body: verified });
    app = await createApp('express', { tokenResponse: undefined });

    const res = await request(app.getHttpServer())
      .post('/protected')
      .send({ 'cf-turnstile-response': 'token-from-form' });

    expect(res.status).toBe(201);
    expect(siteverifyRequests[0].response).toBe('token-from-form');
  });

  it('falls back to the cf-turnstile-response header', async () => {
    siteverifyReplies({ body: verified });
    app = await createApp('express', { tokenResponse: undefined });

    const res = await request(app.getHttpServer())
      .post('/protected')
      .set('cf-turnstile-response', 'token-from-header')
      .send({});

    expect(res.status).toBe(201);
    expect(siteverifyRequests[0].response).toBe('token-from-header');
  });

  it('passes the execution context to tokenResponse', async () => {
    siteverifyReplies({ body: verified });
    app = await createApp('express', {
      tokenResponse: (_req, context) => context.getClass().name,
    });

    await request(app.getHttpServer()).post('/protected').send({});

    expect(siteverifyRequests[0].response).toBe('ProtectedController');
  });

  it('lets a request through when the skipIf function returns true', async () => {
    app = await createApp('express', { skipIf: () => true });

    const res = await request(app.getHttpServer()).post('/protected').send({});

    expect(res.status).toBe(201);
    expect(siteverifyRequests).toHaveLength(0);
  });

  it('validates when an async skipIf function resolves to false', async () => {
    app = await createApp('express', { skipIf: async () => false });

    const res = await request(app.getHttpServer()).post('/protected').send({});

    expect(res.status).toBe(400);
  });

  it('decides per request from the context given to skipIf', async () => {
    app = await createApp('express', {
      skipIf: (context) =>
        context.switchToHttp().getRequest().headers['x-internal'] === 'yes',
    });

    const internal = await request(app.getHttpServer())
      .post('/protected')
      .set('x-internal', 'yes')
      .send({});
    const external = await request(app.getHttpServer())
      .post('/protected')
      .send({});

    expect([internal.status, external.status]).toEqual([201, 400]);
  });

  it('sends the visitor IP chosen by remoteIp', async () => {
    siteverifyReplies({ body: verified });
    app = await createApp('express', {
      remoteIp: (req) => req.headers['x-real-ip'],
    });

    await request(app.getHttpServer())
      .post('/protected')
      .set('x-real-ip', '203.0.113.7')
      .send({ token: 'token-from-widget' });

    expect(siteverifyRequests[0].remoteip).toBe('203.0.113.7');
  });

  it('hands the verification result to the handler', async () => {
    siteverifyReplies({ body: verified });
    app = await createApp('express', {}, [ResultController]);

    const res = await request(app.getHttpServer())
      .post('/result')
      .send({ token: 'token-from-widget' });

    expect(res.body).toEqual({ hostname: 'example.com', action: 'login' });
  });
});
