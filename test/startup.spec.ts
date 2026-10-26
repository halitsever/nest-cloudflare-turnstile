import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ITurnstileOptions, TurnstileModule } from '../src/main';
import {
  internalError,
  rejected,
  siteverifyReplies,
  siteverifyRequests,
  wrongSecret,
} from './helpers/siteverify';

function compile(options: Partial<ITurnstileOptions>): Promise<TestingModule> {
  return Test.createTestingModule({
    imports: [
      TurnstileModule.forRoot({
        secretKey: 'test-secret-key',
        tokenResponse: (req) => req.body?.token,
        ...options,
      }),
    ],
  }).compile();
}

describe('module startup', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('refuses to start without a secret key', async () => {
    const moduleRef = await compile({ secretKey: '' });

    await expect(moduleRef.init()).rejects.toThrow(/secretKey/);
  });

  it('refuses to start when the secret comes from an unset variable', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        TurnstileModule.forRoot({
          secretKey: process.env.TURNSTILE_SECRET_KEY_THAT_IS_NOT_SET,
        }),
      ],
    }).compile();

    await expect(moduleRef.init()).rejects.toThrow(/secretKey/);
  });

  it('starts without a secret key when validation is skipped', async () => {
    const moduleRef = await compile({ secretKey: '', skipIf: true });

    await expect(moduleRef.init()).resolves.toBeDefined();
  });

  it('warns when a test secret key runs in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const warn = vi
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => {});
    const moduleRef = await compile({
      secretKey: '1x0000000000000000000000000000000AA',
    });

    await moduleRef.init();

    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/test secret key/));
  });

  it('stays quiet about test secret keys outside production', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const warn = vi
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => {});
    const moduleRef = await compile({
      secretKey: '1x0000000000000000000000000000000AA',
    });

    await moduleRef.init();

    expect(warn).not.toHaveBeenCalled();
  });
});

describe('verifySecretOnStartup', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('refuses to start when Cloudflare refuses the secret key', async () => {
    siteverifyReplies({ status: 400, body: wrongSecret });
    const moduleRef = await compile({ verifySecretOnStartup: true });

    await expect(moduleRef.init()).rejects.toThrow(/invalid-input-secret/);
  });

  it('starts when Cloudflare only rejects the dummy token', async () => {
    siteverifyReplies({ body: rejected });
    const moduleRef = await compile({ verifySecretOnStartup: true });

    await expect(moduleRef.init()).resolves.toBeDefined();
    expect(siteverifyRequests[0].secret).toBe('test-secret-key');
  });

  it('checks the secret key of every widget', async () => {
    const moduleRef = await compile({
      verifySecretOnStartup: true,
      widgets: { newsletter: { secretKey: 'newsletter-secret' } },
      fetch: async (_url, init) =>
        JSON.parse(String(init?.body)).secret === 'newsletter-secret'
          ? Response.json(wrongSecret, { status: 400 })
          : Response.json(rejected),
    });

    await expect(moduleRef.init()).rejects.toThrow(/widget "newsletter"/);
  });

  it('keeps the startup check out of onVerify and onError', async () => {
    siteverifyReplies({ status: 400, body: wrongSecret });
    const onVerify = vi.fn();
    const onError = vi.fn();
    const moduleRef = await compile({
      verifySecretOnStartup: true,
      onVerify,
      onError,
    });

    await moduleRef.init().catch(() => undefined);

    expect(onVerify).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });

  it('only warns when Cloudflare cannot be reached', async () => {
    siteverifyReplies('network-error');
    const warn = vi
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => {});
    const moduleRef = await compile({ verifySecretOnStartup: true });

    await expect(moduleRef.init()).resolves.toBeDefined();
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/secretKey/));
  });

  it('only warns when Cloudflare reports an internal error', async () => {
    siteverifyReplies({ body: internalError });
    const warn = vi
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => {});
    const moduleRef = await compile({ verifySecretOnStartup: true });

    await expect(moduleRef.init()).resolves.toBeDefined();
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/internal-error/));
  });

  it('leaves Cloudflare alone when validation is skipped', async () => {
    siteverifyReplies({ body: rejected });
    const moduleRef = await compile({
      verifySecretOnStartup: true,
      skipIf: true,
    });

    await moduleRef.init();

    expect(siteverifyRequests).toHaveLength(0);
  });

  it('does not call Cloudflare at startup unless asked to', async () => {
    siteverifyReplies({ body: rejected });
    const moduleRef = await compile({});

    await moduleRef.init();

    expect(siteverifyRequests).toHaveLength(0);
  });
});
