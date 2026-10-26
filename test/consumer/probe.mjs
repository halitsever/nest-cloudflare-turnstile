import { io } from 'socket.io-client';

/** Checks shared by the CJS and ESM consumer apps; a mismatch sets a failing exit code. */
const PASSING_SECRET = '1x0000000000000000000000000000000AA';
const FAILING_SECRET = '2x0000000000000000000000000000000AA';
const DUMMY_TOKEN = 'XXXX.DUMMY.TOKEN.XXXX';

export async function runProbes(label, nest, turnstile) {
  const { Controller, Module, Post } = nest.common;
  const { NestFactory } = nest.core;
  const { SubscribeMessage, WebSocketGateway } = nest.websockets;
  const { TurnstileCaptcha, TurnstileModule, TurnstileResult } = turnstile;

  // Decorators are applied by hand so the probe runs as plain JavaScript.
  function buildModule(secretKey) {
    class AppController {
      verify() {
        return { ok: true };
      }
    }
    const descriptor = Object.getOwnPropertyDescriptor(
      AppController.prototype,
      'verify',
    );
    TurnstileCaptcha()(AppController.prototype, 'verify', descriptor);
    Post('verify')(AppController.prototype, 'verify', descriptor);
    Controller()(AppController);

    class AppModule {}
    Module({
      imports: [
        TurnstileModule.forRoot({
          secretKey,
          tokenResponse: (req) => req.body?.token,
        }),
      ],
      controllers: [AppController],
    })(AppModule);
    return AppModule;
  }

  async function statusFor(secretKey, body) {
    const app = await NestFactory.create(buildModule(secretKey), {
      logger: false,
    });
    await app.listen(0, '127.0.0.1');
    try {
      const res = await fetch(`${await app.getUrl()}/verify`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      return res.status;
    } finally {
      await app.close();
    }
  }

  function buildGatewayModule(secretKey) {
    class AppGateway {
      verify(result) {
        return { hostname: result?.hostname };
      }
    }
    const descriptor = Object.getOwnPropertyDescriptor(
      AppGateway.prototype,
      'verify',
    );
    TurnstileCaptcha()(AppGateway.prototype, 'verify', descriptor);
    SubscribeMessage('verify')(AppGateway.prototype, 'verify', descriptor);
    TurnstileResult()(AppGateway.prototype, 'verify', 0);
    WebSocketGateway()(AppGateway);

    class GatewayModule {}
    Module({
      imports: [TurnstileModule.forRoot({ secretKey })],
      providers: [AppGateway],
    })(GatewayModule);
    return GatewayModule;
  }

  /** The hostname the gateway acknowledged, or the message of the exception Nest emitted. */
  async function socketReplyFor(secretKey, data) {
    const app = await NestFactory.create(buildGatewayModule(secretKey), {
      logger: false,
    });
    await app.listen(0, '127.0.0.1');
    const socket = io(await app.getUrl(), { transports: ['websocket'] });
    try {
      const reply = await new Promise((resolve, reject) => {
        const timer = setTimeout(
          () => reject(new Error('the gateway did not answer')),
          10_000,
        );
        const settle = (payload) => {
          clearTimeout(timer);
          resolve(payload);
        };
        socket.on('exception', settle);
        socket.emit('verify', data, settle);
      });
      return reply.message ?? reply.hostname;
    } finally {
      socket.close();
      await app.close();
    }
  }

  const cases = [
    ['missing token', PASSING_SECRET, {}, 400],
    [
      'dummy token, passing secret',
      PASSING_SECRET,
      { token: DUMMY_TOKEN },
      201,
    ],
    [
      'dummy token, failing secret',
      FAILING_SECRET,
      { token: DUMMY_TOKEN },
      400,
    ],
  ];
  for (const [name, secretKey, body, expected] of cases) {
    report(name, await statusFor(secretKey, body), expected);
  }

  const socketCases = [
    [
      'socket, missing token',
      PASSING_SECRET,
      {},
      'Missing turnstile verification code.',
    ],
    [
      'socket, dummy token, passing secret',
      PASSING_SECRET,
      { 'cf-turnstile-response': DUMMY_TOKEN },
      'example.com',
    ],
    [
      'socket, dummy token, failing secret',
      FAILING_SECRET,
      { 'cf-turnstile-response': DUMMY_TOKEN },
      'Invalid turnstile verification code.',
    ],
  ];
  for (const [name, secretKey, data, expected] of socketCases) {
    report(name, await socketReplyFor(secretKey, data), expected);
  }

  function report(name, got, expected) {
    const ok = got === expected;
    if (!ok) process.exitCode = 1;
    console.log(
      `${ok ? 'ok  ' : 'FAIL'} [${label}] ${name}: got ${got}, expected ${expected}`,
    );
  }
}
