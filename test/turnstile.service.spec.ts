import { InternalServerErrorException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { inspect } from 'node:util';
import { describe, expect, it, vi } from 'vitest';
import {
  ITurnstileOptions,
  TurnstileModule,
  TurnstileService,
} from '../src/main';
import { SECRET } from './helpers/app';
import {
  rejected,
  siteverifyReplies,
  siteverifyRequests,
  verified,
  wrongSecret,
} from './helpers/siteverify';

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

  it('posts only the secret key and the token', async () => {
    siteverifyReplies({ body: verified });
    const service = await createService();

    await service.validateToken('token-from-widget');

    expect(siteverifyRequests).toEqual([
      { secret: SECRET, response: 'token-from-widget' },
    ]);
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
