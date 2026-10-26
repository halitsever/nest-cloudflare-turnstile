import { Injectable, INestApplication, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { TurnstileModule } from '../src/main';
import { TurnstileService } from '../src/services/turnstile.service';
import { ProtectedController } from './helpers/app';
import {
  siteverifyReplies,
  siteverifyRequests,
  verified,
} from './helpers/siteverify';

@Injectable()
class SecretStore {
  read() {
    return 'secret-from-store';
  }
}

@Module({ providers: [SecretStore], exports: [SecretStore] })
class SecretStoreModule {}

describe('TurnstileModule', () => {
  let app: INestApplication | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  it('verifies tokens with the secret given to forRoot', async () => {
    siteverifyReplies({ body: verified });
    const moduleRef = await Test.createTestingModule({
      imports: [
        TurnstileModule.forRoot({
          secretKey: 'secret-from-forRoot',
          tokenResponse: (req) => req.body?.token,
        }),
      ],
    }).compile();

    await moduleRef.get(TurnstileService).validateToken('token-from-widget');

    expect(siteverifyRequests[0]).toMatchObject({
      secret: 'secret-from-forRoot',
    });
  });

  it('verifies tokens with the secret built by an async factory', async () => {
    siteverifyReplies({ body: verified });
    const moduleRef = await Test.createTestingModule({
      imports: [
        TurnstileModule.forRootAsync({
          imports: [SecretStoreModule],
          inject: [SecretStore],
          useFactory: async (store: SecretStore) => ({
            secretKey: store.read(),
            tokenResponse: (req) => req.body?.token,
          }),
        }),
      ],
    }).compile();

    await moduleRef.get(TurnstileService).validateToken('token-from-widget');

    expect(siteverifyRequests[0]).toMatchObject({
      secret: 'secret-from-store',
    });
  });

  it('guards routes in modules that do not import it', async () => {
    siteverifyReplies({ body: verified });

    @Module({ controllers: [ProtectedController] })
    class FeatureModule {}

    const moduleRef = await Test.createTestingModule({
      imports: [
        TurnstileModule.forRoot({
          secretKey: 'secret-from-forRoot',
          tokenResponse: (req) => req.body?.token,
        }),
        FeatureModule,
      ],
    }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    await app.init();

    const res = await request(app.getHttpServer())
      .post('/protected')
      .send({ token: 'token-from-widget' });

    expect(res.status).toBe(201);
    expect(siteverifyRequests).toHaveLength(1);
  });
});
