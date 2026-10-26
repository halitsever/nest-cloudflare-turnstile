import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import { TurnstileModule, TurnstileService } from '../../src/main';

const DUMMY_TOKEN = 'XXXX.DUMMY.TOKEN.XXXX';

async function serviceWith(secretKey: string): Promise<TurnstileService> {
  const moduleRef = await Test.createTestingModule({
    imports: [
      TurnstileModule.forRoot({
        secretKey,
        tokenResponse: (req) => req.body?.token,
      }),
    ],
  }).compile();
  return moduleRef.get(TurnstileService);
}

describe('siteverify with Cloudflare test secrets', () => {
  it('accepts the dummy token with the always-passes secret', async () => {
    const service = await serviceWith('1x0000000000000000000000000000000AA');

    await expect(service.validateToken(DUMMY_TOKEN)).resolves.toMatchObject({
      success: true,
      hostname: 'example.com',
    });
  });

  it('rejects the dummy token with the always-fails secret', async () => {
    const service = await serviceWith('2x0000000000000000000000000000000AA');

    await expect(service.validateToken(DUMMY_TOKEN)).resolves.toMatchObject({
      success: false,
      'error-codes': ['invalid-input-response'],
    });
  });

  it('reports a spent token with the token-spent secret', async () => {
    const service = await serviceWith('3x0000000000000000000000000000000AA');

    await expect(service.validateToken(DUMMY_TOKEN)).resolves.toMatchObject({
      success: false,
      'error-codes': ['timeout-or-duplicate'],
    });
  });
});

describe('verifySecretOnStartup with Cloudflare', () => {
  async function start(secretKey: string) {
    const moduleRef = await Test.createTestingModule({
      imports: [
        TurnstileModule.forRoot({ secretKey, verifySecretOnStartup: true }),
      ],
    }).compile();
    return moduleRef.init();
  }

  it('starts with a secret that rejects the dummy token', async () => {
    await expect(
      start('2x0000000000000000000000000000000AA'),
    ).resolves.toBeDefined();
  });

  it('refuses to start with a made-up secret', async () => {
    await expect(
      start('0x4AAAAAAAmadeUpSecretForTesting00000'),
    ).rejects.toThrow(/invalid-input-secret/);
  });
});
