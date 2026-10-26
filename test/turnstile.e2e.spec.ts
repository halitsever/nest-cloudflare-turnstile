import {
  Controller,
  INestApplication,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TurnstileCaptcha } from '../src/main';
import { Adapter, createApp, SECRET } from './helpers/app';
import {
  rejected,
  siteverifyReplies,
  siteverifyRequests,
  verified,
} from './helpers/siteverify';

@Controller('class-guarded')
@TurnstileCaptcha()
class ClassGuardedController {
  @Post('first')
  first() {
    return { route: 'first' };
  }

  @Post('second')
  second() {
    return { route: 'second' };
  }
}

describe.each<Adapter>(['express', 'fastify'])(
  'guarded route on %s',
  (adapter) => {
    let app: INestApplication;

    afterEach(async () => {
      await app?.close();
    });

    it('lets a request with a verified token reach the handler', async () => {
      siteverifyReplies({ body: verified });
      app = await createApp(adapter);

      const res = await request(app.getHttpServer())
        .post('/protected')
        .send({ token: 'token-from-widget' });

      expect(res.status).toBe(201);
      expect(res.body).toEqual({ ok: true });
    });

    it('sends the secret key and the token to siteverify', async () => {
      siteverifyReplies({ body: verified });
      app = await createApp(adapter);

      await request(app.getHttpServer())
        .post('/protected')
        .send({ token: 'token-from-widget' });

      expect(siteverifyRequests).toHaveLength(1);
      expect(siteverifyRequests[0]).toMatchObject({
        secret: SECRET,
        response: 'token-from-widget',
      });
    });

    it('answers 400 without calling Cloudflare when the token is missing', async () => {
      app = await createApp(adapter);

      const res = await request(app.getHttpServer())
        .post('/protected')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Missing turnstile verification code.');
      expect(siteverifyRequests).toHaveLength(0);
    });

    it('answers 400 when Cloudflare rejects the token', async () => {
      siteverifyReplies({ body: rejected });
      app = await createApp(adapter);

      const res = await request(app.getHttpServer())
        .post('/protected')
        .send({ token: 'expired-token' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid turnstile verification code.');
    });

    it('throws the exceptionFactory result for a missing token', async () => {
      app = await createApp(adapter, {
        exceptionFactory: (reason) =>
          new UnauthorizedException(`token ${reason}`),
      });

      const res = await request(app.getHttpServer())
        .post('/protected')
        .send({});

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('token missing');
    });

    it('throws the exceptionFactory result for a rejected token', async () => {
      siteverifyReplies({ body: rejected });
      app = await createApp(adapter, {
        exceptionFactory: (reason) =>
          new UnauthorizedException(`token ${reason}`),
      });

      const res = await request(app.getHttpServer())
        .post('/protected')
        .send({ token: 'expired-token' });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('token invalid');
    });

    it('lets every request through without calling Cloudflare when skipIf is true', async () => {
      app = await createApp(adapter, { skipIf: true });

      const res = await request(app.getHttpServer())
        .post('/protected')
        .send({});

      expect(res.status).toBe(201);
      expect(siteverifyRequests).toHaveLength(0);
    });

    it('guards every route of a controller decorated at class level', async () => {
      app = await createApp(adapter, {}, [ClassGuardedController]);

      const first = await request(app.getHttpServer())
        .post('/class-guarded/first')
        .send({});
      const second = await request(app.getHttpServer())
        .post('/class-guarded/second')
        .send({});

      expect([first.status, second.status]).toEqual([400, 400]);
    });

    it('answers 500 and calls onError when Cloudflare is unreachable', async () => {
      siteverifyReplies('network-error');
      const onError = vi.fn();
      app = await createApp(adapter, { onError });

      const res = await request(app.getHttpServer())
        .post('/protected')
        .send({ token: 'token-from-widget' });

      expect(res.status).toBe(500);
      expect(onError).toHaveBeenCalled();
    });
  },
);
