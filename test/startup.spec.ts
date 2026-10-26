import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ITurnstileOptions, TurnstileModule } from '../src/main';

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
