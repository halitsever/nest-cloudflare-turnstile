import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import { TurnstileModule } from '../src/main';
import { TurnstileService } from '../src/services/turnstile.service';
import { SECRET } from './helpers/app';
import { rejected, siteverifyReplies, verified } from './helpers/siteverify';

async function createService(): Promise<TurnstileService> {
  const moduleRef = await Test.createTestingModule({
    imports: [
      TurnstileModule.forRoot({
        secretKey: SECRET,
        tokenResponse: (req) => req.body?.token,
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
});
