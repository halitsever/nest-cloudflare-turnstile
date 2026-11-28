---
title: 'Testing Cloudflare Turnstile with Test Keys'
titleTemplate: false
description: 'Use Cloudflare Turnstile test keys to build and test a form locally: site keys that pass, fail or force a challenge, test secrets and the NestJS test stub.'
headline: "A Turnstile tutorial with Cloudflare's test keys"
date: '2026-11-28'
keyword: 'cloudflare turnstile tutorial'
faq:
  [
    {
      'q': 'What are the Cloudflare Turnstile test keys?',
      'a': 'Site keys 1x00000000000000000000AA (passes), 2x00000000000000000000AB (fails) and 3x00000000000000000000FF (forces a challenge), plus invisible variants, and secret keys 1x, 2x and 3x0000000000000000000000000000000AA.',
    },
    {
      'q': 'Do Turnstile test keys work on localhost?',
      'a': 'Yes. Cloudflare says test keys work on any domain, including localhost, 127.0.0.1 and 0.0.0.0.',
    },
    {
      'q': 'Can I use a real secret key with a test site key?',
      'a': 'No. Test site keys produce a dummy token that production secret keys reject.',
    },
  ]
---

# A Turnstile tutorial with Cloudflare's test keys

<p class="post-meta">By <a href="https://halit.org">Halit Sever</a> · <time datetime="2026-11-28">28 November 2026</time></p>

<p class="lead">You can build and test a Turnstile form without creating a widget in the Cloudflare dashboard. Cloudflare publishes test site keys and secret keys that give fixed answers on any domain, localhost included. This tutorial pairs them with a NestJS backend.</p>

## The test keys

Site keys go in the browser:

| Site key                   | Behaviour                                |
| -------------------------- | ---------------------------------------- |
| `1x00000000000000000000AA` | Always passes, visible                   |
| `2x00000000000000000000AB` | Always fails, visible                    |
| `1x00000000000000000000BB` | Always passes, invisible                 |
| `2x00000000000000000000BB` | Always fails, invisible                  |
| `3x00000000000000000000FF` | Forces an interactive challenge, visible |

Secret keys go on the server:

| Secret key                            | Siteverify answer                            |
| ------------------------------------- | -------------------------------------------- |
| `1x0000000000000000000000000000000AA` | Always passes                                |
| `2x0000000000000000000000000000000AA` | Always fails                                 |
| `3x0000000000000000000000000000000AA` | Token already spent (`timeout-or-duplicate`) |

Test site keys produce the dummy token `XXXX.DUMMY.TOKEN.XXXX`. Test secrets accept only that token, and production secrets reject it. A passing test result reports `example.com` as the hostname and has no `action` or `cdata` ([Cloudflare testing docs](https://developers.cloudflare.com/turnstile/troubleshooting/testing/)).

## Step 1: the form

```html
<script
  src="https://challenges.cloudflare.com/turnstile/v0/api.js"
  async
  defer
></script>

<form action="/auth/login" method="POST">
  <input name="email" type="email" />
  <div class="cf-turnstile" data-sitekey="1x00000000000000000000AA"></div>
  <button type="submit">Log in</button>
</form>
```

Open the page on `localhost`. The widget passes at once and adds a hidden `cf-turnstile-response` field holding the dummy token. Production site keys would refuse `localhost` with error 110200 unless you add it to the widget's hostnames.

## Step 2: the NestJS backend

```bash
npm install nest-cloudflare-turnstile
```

```ts
import { Module } from '@nestjs/common';
import { TurnstileModule } from 'nest-cloudflare-turnstile';

@Module({
  imports: [
    TurnstileModule.forRoot({
      // 1x0000000000000000000000000000000AA locally, the real secret in production
      secretKey: process.env.TURNSTILE_SECRET_KEY,
    }),
  ],
})
export class AppModule {}
```

```ts
@Controller('auth')
export class AuthController {
  @Post('login')
  @TurnstileCaptcha()
  login() {
    return { ok: true };
  }
}
```

Start the app with `TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA` and submit the form. The guard sends the dummy token to Cloudflare's real siteverify endpoint, gets a pass, and the handler runs. The guard skips the hostname and action checks for results from test keys, because those never report real values (`metadata.result_with_testing_key` in the answer).

## Step 3: test the failure paths

Change one key at a time:

| Browser key                | Server secret                         | What you get                                                           |
| -------------------------- | ------------------------------------- | ---------------------------------------------------------------------- |
| `2x00000000000000000000AB` | any                                   | The widget fails, no token: 400 `Missing turnstile verification code.` |
| `1x00000000000000000000AA` | `2x0000000000000000000000000000000AA` | 400 `Invalid turnstile verification code.`                             |
| `1x00000000000000000000AA` | `3x0000000000000000000000000000000AA` | 400, with `timeout-or-duplicate` in the error codes                    |
| `3x00000000000000000000FF` | `1x0000000000000000000000000000000AA` | The visitor must click; then the handler runs                          |

This checks the error handling end to end without any mocks. The [error handling page](/error-handling) shows how to replace those 400 responses with your own exceptions.

## Step 4: unit tests without the network

For Jest or Vitest suites, swap the service for the stub the module ships:

```ts
import { Test } from '@nestjs/testing';
import {
  createTurnstileServiceStub,
  TurnstileService,
} from 'nest-cloudflare-turnstile';

const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
  .overrideProvider(TurnstileService)
  .useValue(createTurnstileServiceStub('fail'))
  .compile();
```

`'pass'`, `'fail'` and `'spent'` mirror the three test secrets, and an object lets you return a custom result, for example to test an action or `cdata`. Tests that are not about the captcha can turn the guard off with `skipIf`. Details on the [testing page](/testing).

## Before you ship

- Swap both keys for real ones from the dashboard. The module logs a warning if a test secret runs with `NODE_ENV=production`, because every token would pass.
- Test hostname and action checks with real keys, since test results skip them.
- Turn on [`verifySecretOnStartup`](/turnstile-options#verifysecretonstartup) to catch a wrong secret at boot.

To see the three visible site keys side by side, open the [Turnstile demo](/demo/). A runnable app with test keys is in the repository's [basic example](https://github.com/halitsever/nest-cloudflare-turnstile/tree/main/examples/basic).

## FAQ

### What are the Cloudflare Turnstile test keys?

Site keys 1x00000000000000000000AA (passes), 2x00000000000000000000AB (fails) and 3x00000000000000000000FF (forces a challenge), plus invisible variants, and secret keys 1x, 2x and 3x0000000000000000000000000000000AA.

### Do Turnstile test keys work on localhost?

Yes. Cloudflare says test keys work on any domain, including localhost, 127.0.0.1 and 0.0.0.0.

### Can I use a real secret key with a test site key?

No. Test site keys produce a dummy token that production secret keys reject.

## Related posts

- [Turnstile error codes, from 600010 to timeout-or-duplicate](/blog/turnstile-error-codes)
- [Setting up the Turnstile widget in the page](/blog/turnstile-widget-options)
- [Captcha checks belong on the server](/blog/verify-captcha-server-side)
- [All posts](/blog/)
