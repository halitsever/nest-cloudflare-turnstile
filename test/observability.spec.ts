import { Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ITurnstileOptions,
  TurnstileModule,
  TurnstileService,
} from '../src/main';
import { createApp, SECRET } from './helpers/app';
import {
  rejected,
  siteverifyReplies,
  verified,
  wrongSecret,
} from './helpers/siteverify';

async function createService(
  options: Partial<ITurnstileOptions> = {},
): Promise<TurnstileService> {
  const moduleRef = await Test.createTestingModule({
    imports: [TurnstileModule.forRoot({ secretKey: SECRET, ...options })],
  }).compile();
  return moduleRef.get(TurnstileService);
}

describe('onVerify', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reports an accepted token', async () => {
    siteverifyReplies({ body: verified });
    const onVerify = vi.fn();
    const service = await createService({ onVerify });

    await service.validateToken('token-from-widget');

    expect(onVerify).toHaveBeenCalledExactlyOnceWith({
      outcome: 'success',
      result: verified,
      attempts: 1,
      durationMs: expect.any(Number),
    });
  });

  it('reports a token Cloudflare rejected', async () => {
    siteverifyReplies({ body: rejected });
    const onVerify = vi.fn();
    const service = await createService({ onVerify });

    await service.validateToken('expired-token');

    expect(onVerify.mock.calls[0][0]).toMatchObject({
      outcome: 'rejected',
      result: rejected,
      attempts: 1,
    });
  });

  it('reports a failed check with the error onError gets', async () => {
    siteverifyReplies('network-error');
    const onError = vi.fn();
    const onVerify = vi.fn();
    const service = await createService({ onError, onVerify });

    await service.validateToken('token-from-widget').catch(() => undefined);

    const [event] = onVerify.mock.calls[0];
    expect(event).toMatchObject({ outcome: 'failed', attempts: 2 });
    expect(event.result).toBeUndefined();
    expect(event.error).toBe(onError.mock.calls[0][0]);
  });

  it("reports Cloudflare's answer when it refuses the secret key", async () => {
    siteverifyReplies({ status: 400, body: wrongSecret });
    const onVerify = vi.fn();
    const service = await createService({ onError: () => {}, onVerify });

    await service.validateToken('token-from-widget').catch(() => undefined);

    expect(onVerify.mock.calls[0][0]).toMatchObject({
      outcome: 'failed',
      result: wrongSecret,
      error: expect.objectContaining({
        errorCodes: ['invalid-input-secret'],
      }),
      attempts: 1,
    });
  });

  it('counts the retry in attempts', async () => {
    siteverifyReplies('network-error', { body: verified });
    const onVerify = vi.fn();
    const service = await createService({ onVerify });

    await service.validateToken('token-from-widget');

    expect(onVerify.mock.calls[0][0]).toMatchObject({
      outcome: 'success',
      attempts: 2,
    });
  });

  it('measures how long siteverify took', async () => {
    siteverifyReplies({ body: verified, delayMs: 50 });
    const onVerify = vi.fn();
    const service = await createService({ onVerify });

    await service.validateToken('token-from-widget');

    expect(onVerify.mock.calls[0][0].durationMs).toBeGreaterThanOrEqual(40);
  });

  it('names the widget that checked the token', async () => {
    siteverifyReplies({ body: verified });
    const onVerify = vi.fn();
    const service = await createService({
      onVerify,
      widgets: { newsletter: { secretKey: 'newsletter-secret' } },
    });

    await service.validateToken('token-from-widget', { widget: 'newsletter' });

    expect(onVerify.mock.calls[0][0].widget).toBe('newsletter');
  });

  it("reports Cloudflare's verdict even when the guard rejects the token afterwards", async () => {
    siteverifyReplies({ body: verified });
    const onVerify = vi.fn();
    const app = await createApp('express', {
      expectedHostname: 'shop.example',
      onVerify,
    });

    const res = await request(app.getHttpServer())
      .post('/protected')
      .send({ token: 'token-from-widget' });
    await app.close();

    expect(res.status).toBe(400);
    expect(onVerify.mock.calls[0][0].outcome).toBe('success');
  });

  it('keeps the check working when onVerify throws', async () => {
    siteverifyReplies({ body: verified });
    const logError = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => {});
    const service = await createService({
      onVerify: () => {
        throw new Error('metrics are down');
      },
    });

    await expect(service.validateToken('token-from-widget')).resolves.toEqual(
      verified,
    );
    expect(logError).toHaveBeenCalledWith(
      expect.stringContaining('metrics are down'),
    );
  });

  it('logs an async onVerify that rejects instead of leaving it unhandled', async () => {
    siteverifyReplies({ body: verified });
    const logError = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => {});
    const service = await createService({
      onVerify: async () => {
        throw new Error('metrics are down');
      },
    });

    await service.validateToken('token-from-widget');
    await new Promise((resolve) => setImmediate(resolve));

    expect(logError).toHaveBeenCalledWith(
      expect.stringContaining('metrics are down'),
    );
  });
});

describe('debug', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logs each check at debug level', async () => {
    siteverifyReplies({ body: rejected });
    const logDebug = vi
      .spyOn(Logger.prototype, 'debug')
      .mockImplementation(() => {});
    const service = await createService({ debug: true });

    await service.validateToken('expired-token');

    expect(logDebug).toHaveBeenCalledExactlyOnceWith(
      expect.stringMatching(/rejected.*invalid-input-response.*1 attempt/),
    );
  });

  it('keeps the token, the secret key and cdata out of the log', async () => {
    siteverifyReplies({ body: verified });
    const logDebug = vi
      .spyOn(Logger.prototype, 'debug')
      .mockImplementation(() => {});
    const service = await createService({ debug: true });

    await service.validateToken('token-from-widget');

    const logged = logDebug.mock.calls.flat().join('\n');
    expect(logged).toContain('success');
    expect(logged).not.toContain(SECRET);
    expect(logged).not.toContain('token-from-widget');
    expect(logged).not.toContain(verified.cdata);
  });

  it('stays silent when debug is off', async () => {
    siteverifyReplies({ body: verified });
    const logDebug = vi
      .spyOn(Logger.prototype, 'debug')
      .mockImplementation(() => {});
    const service = await createService();

    await service.validateToken('token-from-widget');

    expect(logDebug).not.toHaveBeenCalled();
  });
});
