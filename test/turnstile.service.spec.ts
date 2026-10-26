import { InternalServerErrorException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { inspect } from 'node:util';
import { describe, expect, it, vi } from 'vitest';
import {
  ITurnstileOptions,
  TurnstileError,
  TurnstileModule,
  TurnstileService,
} from '../src/main';
import { SECRET } from './helpers/app';
import {
  internalError,
  rejected,
  siteverifyReplies,
  siteverifyRequests,
  verified,
  wrongSecret,
} from './helpers/siteverify';

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

async function createService(
  options: Partial<ITurnstileOptions> = {},
): Promise<TurnstileService> {
  const moduleRef = await Test.createTestingModule({
    imports: [
      TurnstileModule.forRoot({
        secretKey: SECRET,
        tokenResponse: (req) => req.body?.token,
        ...options,
      }),
    ],
  }).compile();
  return moduleRef.get(TurnstileService);
}

describe('TurnstileService.validateToken', () => {
  it("returns Cloudflare's verdict for an accepted token", async () => {
    siteverifyReplies({ body: verified });
    const service = await createService();

    await expect(service.validateToken('token-from-widget')).resolves.toEqual(
      verified,
    );
  });

  it("returns Cloudflare's verdict for a rejected token", async () => {
    siteverifyReplies({ body: rejected });
    const service = await createService();

    await expect(service.validateToken('expired-token')).resolves.toEqual(
      rejected,
    );
  });

  it('posts the secret key, the token and an idempotency key', async () => {
    siteverifyReplies({ body: verified });
    const service = await createService();

    await service.validateToken('token-from-widget');

    expect(siteverifyRequests).toEqual([
      {
        secret: SECRET,
        response: 'token-from-widget',
        idempotency_key: expect.stringMatching(UUID),
      },
    ]);
  });

  it('uses a new idempotency key for every token', async () => {
    siteverifyReplies({ body: verified });
    const service = await createService();

    await service.validateToken('first-token');
    await service.validateToken('second-token');

    const [first, second] = siteverifyRequests;
    expect(first.idempotency_key).not.toBe(second.idempotency_key);
  });

  it('retries once with the same idempotency key after a network error', async () => {
    siteverifyReplies('network-error', { body: verified });
    const service = await createService();

    await expect(service.validateToken('token-from-widget')).resolves.toEqual(
      verified,
    );
    const [first, second] = siteverifyRequests;
    expect(siteverifyRequests).toHaveLength(2);
    expect(second.idempotency_key).toBe(first.idempotency_key);
  });

  it('retries once when Cloudflare reports an internal error', async () => {
    siteverifyReplies({ body: internalError }, { body: verified });
    const service = await createService();

    await expect(service.validateToken('token-from-widget')).resolves.toEqual(
      verified,
    );
    expect(siteverifyRequests).toHaveLength(2);
  });

  it('retries once after an HTTP 5xx answer', async () => {
    siteverifyReplies({ status: 502, body: {} }, { body: verified });
    const service = await createService();

    await expect(service.validateToken('token-from-widget')).resolves.toEqual(
      verified,
    );
    expect(siteverifyRequests).toHaveLength(2);
  });

  it('gives up after one retry and reports the cause to onError', async () => {
    siteverifyReplies('network-error');
    const onError = vi.fn();
    const service = await createService({ onError });

    await expect(service.validateToken('token-from-widget')).rejects.toThrow(
      InternalServerErrorException,
    );
    expect(siteverifyRequests).toHaveLength(2);
    expect(onError).toHaveBeenCalledOnce();
    expect(onError.mock.calls[0][0]).toBeInstanceOf(TurnstileError);
    expect(onError.mock.calls[0][0].cause).toBeDefined();
  });

  it('fails with a 500 when Cloudflare keeps reporting internal errors', async () => {
    siteverifyReplies({ body: internalError });
    const onError = vi.fn();
    const service = await createService({ onError });

    await expect(service.validateToken('token-from-widget')).rejects.toThrow(
      InternalServerErrorException,
    );
    expect(onError.mock.calls[0][0].errorCodes).toEqual(['internal-error']);
  });

  it('reports the error codes when Cloudflare refuses the secret key', async () => {
    siteverifyReplies({ status: 400, body: wrongSecret });
    const onError = vi.fn();
    const service = await createService({ onError });

    await expect(service.validateToken('token-from-widget')).rejects.toThrow(
      InternalServerErrorException,
    );
    expect(siteverifyRequests).toHaveLength(1);
    expect(onError.mock.calls[0][0].errorCodes).toEqual([
      'invalid-input-secret',
    ]);
  });

  it('does not retry a token Cloudflare rejected', async () => {
    siteverifyReplies({ body: rejected });
    const service = await createService();

    await service.validateToken('expired-token');

    expect(siteverifyRequests).toHaveLength(1);
  });

  it('fails with a 500 and calls onError when siteverify has a server error', async () => {
    siteverifyReplies({ status: 503, body: {} });
    const onError = vi.fn();
    const service = await createService({ onError });

    await expect(service.validateToken('token-from-widget')).rejects.toThrow(
      InternalServerErrorException,
    );
    expect(onError).toHaveBeenCalledOnce();
  });

  it('fails with a 500 and calls onError when siteverify refuses the secret key', async () => {
    siteverifyReplies({ status: 400, body: wrongSecret });
    const onError = vi.fn();
    const service = await createService({ onError });

    await expect(service.validateToken('token-from-widget')).rejects.toThrow(
      InternalServerErrorException,
    );
    expect(onError).toHaveBeenCalledOnce();
  });

  it('gives up on siteverify after the configured timeout', async () => {
    siteverifyReplies({ body: verified, delayMs: 500 });
    const service = await createService({ timeout: 50 });

    await expect(service.validateToken('token-from-widget')).rejects.toThrow(
      InternalServerErrorException,
    );
  });

  it('keeps the secret key out of the error passed to onError', async () => {
    siteverifyReplies({ status: 400, body: wrongSecret });
    const onError = vi.fn();
    const service = await createService({ onError });

    await service.validateToken('token-from-widget').catch(() => undefined);

    expect(inspect(onError.mock.calls[0][0], { depth: null })).not.toContain(
      SECRET,
    );
  });
});
