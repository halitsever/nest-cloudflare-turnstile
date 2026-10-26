import {
  Controller,
  INestApplication,
  Logger,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ITurnstileOptions,
  TurnstileCaptcha,
  TurnstileModule,
  TurnstileService,
} from '../src/main';
import { createApp, SECRET } from './helpers/app';
import {
  siteverifyReplies,
  siteverifyRequests,
  verified,
} from './helpers/siteverify';

@Controller('forms')
class FormsController {
  @Post('login')
  @TurnstileCaptcha()
  login() {
    return { ok: true };
  }

  @Post('newsletter')
  @TurnstileCaptcha({ widget: 'newsletter' })
  newsletter() {
    return { ok: true };
  }

  @Post('promo')
  @TurnstileCaptcha({ widget: 'newsletter', action: 'login' })
  promo() {
    return { ok: true };
  }

  @Post('partner')
  @TurnstileCaptcha({ widget: 'partner' })
  partner() {
    return { ok: true };
  }

  @Post('unknown')
  @TurnstileCaptcha({ widget: 'nope' })
  unknown() {
    return { ok: true };
  }
}

@Controller('subscribe')
@TurnstileCaptcha({ widget: 'newsletter' })
class SubscribeController {
  @Post()
  create() {
    return { ok: true };
  }
}

const widgetOptions: Partial<ITurnstileOptions> = {
  widgets: {
    newsletter: { secretKey: 'newsletter-secret', expectedAction: 'subscribe' },
    partner: {
      secretKey: 'partner-secret',
      expectedHostname: 'partner.example',
      tokenResponse: (req) => req.headers['x-partner-token'],
    },
  },
  exceptionFactory: (reason, { errorCodes }) =>
    new UnauthorizedException({ reason, errorCodes }),
};

describe('widgets', () => {
  let app: INestApplication | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  async function post(path: string, token = 'token-from-widget') {
    app ??= await createApp('express', widgetOptions, [
      FormsController,
      SubscribeController,
    ]);
    return request(app.getHttpServer()).post(path).send({ token });
  }

  it('sends the module secret for routes that name no widget', async () => {
    siteverifyReplies({ body: verified });

    await post('/forms/login');

    expect(siteverifyRequests[0].secret).toBe(SECRET);
  });

  it("sends the widget's secret for a route that names it", async () => {
    siteverifyReplies({ body: { ...verified, action: 'subscribe' } });

    const res = await post('/forms/newsletter');

    expect(res.status).toBe(201);
    expect(siteverifyRequests[0].secret).toBe('newsletter-secret');
  });

  it('uses the widget named on the controller', async () => {
    siteverifyReplies({ body: { ...verified, action: 'subscribe' } });

    await post('/subscribe');

    expect(siteverifyRequests[0].secret).toBe('newsletter-secret');
  });

  it("checks tokens against the widget's action", async () => {
    siteverifyReplies({ body: verified });

    const res = await post('/forms/newsletter');

    expect(res.status).toBe(401);
    expect(res.body.errorCodes).toEqual(['action-mismatch']);
  });

  it("lets the route's action win over the widget's", async () => {
    siteverifyReplies({ body: verified });

    const res = await post('/forms/promo');

    expect(res.status).toBe(201);
  });

  it("reads the token the way the widget's tokenResponse says", async () => {
    siteverifyReplies({ body: { ...verified, hostname: 'partner.example' } });
    app = await createApp('express', widgetOptions, [FormsController]);

    await request(app.getHttpServer())
      .post('/forms/partner')
      .set('x-partner-token', 'token-from-header')
      .send({ token: 'token-from-body' });

    expect(siteverifyRequests[0].response).toBe('token-from-header');
  });

  it("checks tokens against the widget's hostname", async () => {
    siteverifyReplies({ body: verified });
    app = await createApp('express', widgetOptions, [FormsController]);

    const res = await request(app.getHttpServer())
      .post('/forms/partner')
      .set('x-partner-token', 'token-from-header');

    expect(res.body.errorCodes).toEqual(['hostname-mismatch']);
  });

  it('answers 500 without calling Cloudflare for an unknown widget', async () => {
    siteverifyReplies({ body: verified });

    const res = await post('/forms/unknown');

    expect(res.status).toBe(500);
    expect(siteverifyRequests).toHaveLength(0);
  });

  it("uses a widget's secret for manual checks", async () => {
    siteverifyReplies({ body: verified });
    const moduleRef = await Test.createTestingModule({
      imports: [
        TurnstileModule.forRoot({ secretKey: SECRET, ...widgetOptions }),
      ],
    }).compile();

    await moduleRef
      .get(TurnstileService)
      .validateToken('token-from-widget', { widget: 'newsletter' });

    expect(siteverifyRequests[0].secret).toBe('newsletter-secret');
  });

  it('refuses to start when a widget has no secret key', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        TurnstileModule.forRoot({
          secretKey: SECRET,
          widgets: { newsletter: { secretKey: '' } },
        }),
      ],
    }).compile();

    await expect(moduleRef.init()).rejects.toThrow(/widget "newsletter"/);
  });

  it('warns about a test secret on a widget in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const warn = vi
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => {});
    const moduleRef = await Test.createTestingModule({
      imports: [
        TurnstileModule.forRoot({
          secretKey: SECRET,
          widgets: {
            newsletter: { secretKey: '1x0000000000000000000000000000000AA' },
          },
        }),
      ],
    }).compile();

    await moduleRef.init();

    expect(warn).toHaveBeenCalledWith(
      expect.stringMatching(/test secret key.*widget "newsletter"/),
    );
  });
});
