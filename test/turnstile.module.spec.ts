import {
  DynamicModule,
  Injectable,
  INestApplication,
  Module,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import {
  ITurnstileOptions,
  TURNSTILE_OPTIONS,
  TurnstileModule,
  TurnstileOptionsFactory,
  TurnstileService,
} from '../src/main';
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

@Injectable()
class TurnstileConfig implements TurnstileOptionsFactory {
  createTurnstileOptions(): ITurnstileOptions {
    return {
      secretKey: 'secret-from-class',
      tokenResponse: (req) => req.body?.token,
    };
  }
}

@Module({ providers: [TurnstileConfig], exports: [TurnstileConfig] })
class TurnstileConfigModule {}

/** Compiles the given module setup and returns the secret it sends to siteverify. */
async function secretSentBy(turnstile: DynamicModule): Promise<string> {
  siteverifyReplies({ body: verified });
  const moduleRef = await Test.createTestingModule({
    imports: [turnstile],
  }).compile();
  await moduleRef.get(TurnstileService).validateToken('token-from-widget');
  return siteverifyRequests[0].secret;
}

describe('TurnstileModule', () => {
  let app: INestApplication | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  it('verifies tokens with the secret given to forRoot', async () => {
    const secret = await secretSentBy(
      TurnstileModule.forRoot({
        secretKey: 'secret-from-forRoot',
        tokenResponse: (req) => req.body?.token,
      }),
    );

    expect(secret).toBe('secret-from-forRoot');
  });

  it('verifies tokens with the secret built by an async factory', async () => {
    const secret = await secretSentBy(
      TurnstileModule.forRootAsync({
        imports: [SecretStoreModule],
        inject: [SecretStore],
        useFactory: async (store: SecretStore) => ({
          secretKey: store.read(),
          tokenResponse: (req) => req.body?.token,
        }),
      }),
    );

    expect(secret).toBe('secret-from-store');
  });

  it('verifies tokens with options from a useClass factory', async () => {
    const secret = await secretSentBy(
      TurnstileModule.forRootAsync({ useClass: TurnstileConfig }),
    );

    expect(secret).toBe('secret-from-class');
  });

  it('verifies tokens with options from an existing provider', async () => {
    const secret = await secretSentBy(
      TurnstileModule.forRootAsync({
        imports: [TurnstileConfigModule],
        useExisting: TurnstileConfig,
      }),
    );

    expect(secret).toBe('secret-from-class');
  });

  it('provides its options under TURNSTILE_OPTIONS', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        TurnstileModule.forRoot({
          secretKey: 'secret-from-forRoot',
          tokenResponse: (req) => req.body?.token,
        }),
      ],
    }).compile();

    expect(moduleRef.get(TURNSTILE_OPTIONS)).toMatchObject({
      secretKey: 'secret-from-forRoot',
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

  it('stays out of other modules when isGlobal is false', async () => {
    @Module({ controllers: [ProtectedController] })
    class FeatureModule {}

    const compiling = Test.createTestingModule({
      imports: [
        TurnstileModule.forRoot({
          secretKey: 'secret-from-forRoot',
          tokenResponse: (req) => req.body?.token,
          isGlobal: false,
        }),
        FeatureModule,
      ],
    }).compile();

    await expect(compiling).rejects.toThrow(/TurnstileService/);
  });
});
