# Testing

## Turn the guard off

In unit and end-to-end tests that are not about the captcha, let every request through with `skipIf`:

```ts
TurnstileModule.forRoot({
  secretKey: process.env.TURNSTILE_SECRET_KEY,
  skipIf: process.env.NODE_ENV === 'test',
});
```

With `skipIf: true` the module also starts without a secret key, so test environments do not need one.

## Stub the service

To test how your app handles a passed or a rejected token, replace `TurnstileService` with `createTurnstileServiceStub`. It answers every token without a network call, the same way Cloudflare's test keys do:

```ts
import { Test } from '@nestjs/testing';
import {
  createTurnstileServiceStub,
  TurnstileService,
} from 'nest-cloudflare-turnstile';
import { AppModule } from '../src/app.module';

const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
  .overrideProvider(TurnstileService)
  .useValue(createTurnstileServiceStub('fail'))
  .compile();
```

| Verdict            | Answer                                                                                |
| ------------------ | ------------------------------------------------------------------------------------- |
| `'pass'` (default) | Accepts every token. The hostname and action checks are skipped, as with test keys.   |
| `'fail'`           | Rejects the token with `invalid-input-response`                                       |
| `'spent'`          | Rejects the token with `timeout-or-duplicate`                                         |
| an object          | Returns that verdict as is, for example to test `action`, `cdata` or `validateResult` |

The rest of the module stays real, so `exceptionFactory`, `validateResult` and `@TurnstileResult()` behave as they do in production. The stub replaces the service that checks the secret key at start-up, so the test module starts without one.

## Cloudflare test keys

Cloudflare publishes keys that skip the real challenge. Pair a test site key in the browser with a test secret key on the server:

| Site key                   | Widget behavior                 |
| -------------------------- | ------------------------------- |
| `1x00000000000000000000AA` | Always passes, visible          |
| `2x00000000000000000000AB` | Always fails, visible           |
| `1x00000000000000000000BB` | Always passes, invisible        |
| `2x00000000000000000000BB` | Always fails, invisible         |
| `3x00000000000000000000FF` | Forces an interactive challenge |

| Secret key                            | Siteverify answer                            |
| ------------------------------------- | -------------------------------------------- |
| `1x0000000000000000000000000000000AA` | Always passes                                |
| `2x0000000000000000000000000000000AA` | Always fails (`invalid-input-response`)      |
| `3x0000000000000000000000000000000AA` | Token already spent (`timeout-or-duplicate`) |

Test site keys produce the dummy token `XXXX.DUMMY.TOKEN.XXXX`, which only test secret keys accept. That makes them handy for checking your error handling without mocks:

```ts
TurnstileModule.forRoot({
  secretKey: '2x0000000000000000000000000000000AA',
});
// Any request with a token now gets the "invalid" response.
```

Test results report `example.com` as the hostname and carry no action, so the guard skips the `expectedHostname` and `expectedAction` checks for them.

::: danger Never ship a test secret key
With `1x0000000000000000000000000000000AA`, every request that carries a token passes. The module logs a warning when a test secret key runs with `NODE_ENV=production`.
:::

Source: [Cloudflare's testing docs](https://developers.cloudflare.com/turnstile/troubleshooting/testing/).
