/** Checks shared by the CJS and ESM consumer apps; a mismatch sets a failing exit code. */
const PASSING_SECRET = '1x0000000000000000000000000000000AA';
const FAILING_SECRET = '2x0000000000000000000000000000000AA';
const DUMMY_TOKEN = 'XXXX.DUMMY.TOKEN.XXXX';

export async function runProbes(label, nest, turnstile) {
  const { Controller, Module, Post } = nest.common;
  const { NestFactory } = nest.core;
  const { TurnstileCaptcha, TurnstileModule } = turnstile;

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
    const status = await statusFor(secretKey, body);
    const ok = status === expected;
    if (!ok) process.exitCode = 1;
    console.log(
      `${ok ? 'ok  ' : 'FAIL'} [${label}] ${name}: got ${status}, expected ${expected}`,
    );
  }
}
