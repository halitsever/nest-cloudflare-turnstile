---
title: Cloudflare Turnstile Demo with Test Keys
titleTemplate: false
description: 'A live Cloudflare Turnstile demo with test site keys that pass, fail or force a challenge, the token it returns and the NestJS guard code that verifies it.'
aside: false
faq:
  - q: Does this demo send my data to a server?
    a: No. The page only loads the Turnstile widget from Cloudflare with a public test site key and shows the token in the page. Nothing is posted to a backend.
  - q: Why is the token always the same?
    a: Cloudflare's test site keys always produce the dummy token XXXX.DUMMY.TOKEN.XXXX. Only test secret keys accept it, and production secret keys reject it.
  - q: Can I verify a Turnstile token in the browser?
    a: No. Verification needs your secret key, which must stay on the server. The browser only receives a token that your backend checks with Cloudflare's siteverify API.
---

# Try the Turnstile widget, then see the NestJS guard

This page runs the real Cloudflare Turnstile widget with Cloudflare's public test site keys. Pick a key, watch the widget, and see the token your form would send. Below it is the NestJS code that verifies that token on the server, which is the half of Turnstile a browser demo cannot do.

<TurnstileDemo />

The test keys work on any domain and never challenge a real visitor: `1x00000000000000000000AA` always passes, `2x00000000000000000000AB` always fails and `3x00000000000000000000FF` always asks for a click. The widget here uses `retry: 'never'` so a failure shows once instead of repeating, and `action: 'login'`. Cloudflare's [testing docs](https://developers.cloudflare.com/turnstile/troubleshooting/testing/) list every test key.

## What happens after the token

The widget proves nothing on its own. Cloudflare's docs say "The client-side widget alone does not protect your forms": a bot can post any string as a token. Your server has to send the token, with its secret key, to Cloudflare's siteverify API and act on the answer. That needs the secret key, so it cannot happen on this page.

1. The browser sends the form, with the token in the hidden `cf-turnstile-response` field, or in a header of the same name.
2. The guard reads the token and refuses the request with 400 if it is missing or longer than 2,048 characters.
3. It posts the token and the secret key to `https://challenges.cloudflare.com/turnstile/v0/siteverify`.
4. If Cloudflare accepts it, the guard checks the hostname and the action, then runs your handler.

## The server code for this demo

Register the module with the test secret that matches the test site keys:

```ts
import { Module } from '@nestjs/common';
import { TurnstileModule } from 'nest-cloudflare-turnstile';

@Module({
  imports: [
    TurnstileModule.forRoot({
      // Test secret: always passes. Use your real secret in production.
      secretKey: '1x0000000000000000000000000000000AA',
    }),
  ],
})
export class AppModule {}
```

Guard the route the form posts to. The `action` matches the widget's `action: 'login'`:

```ts
import { Controller, Post } from '@nestjs/common';
import { TurnstileCaptcha } from 'nest-cloudflare-turnstile';

@Controller('auth')
export class AuthController {
  @Post('login')
  @TurnstileCaptcha({ action: 'login' })
  login() {
    return { ok: true };
  }
}
```

The widget on a plain HTML form needs no extra code. Inside a `<form>`, Turnstile adds the hidden field and the guard reads it:

```html
<script
  src="https://challenges.cloudflare.com/turnstile/v0/api.js"
  async
  defer
></script>

<form action="/auth/login" method="POST">
  <div
    class="cf-turnstile"
    data-sitekey="1x00000000000000000000AA"
    data-action="login"
  ></div>
  <button type="submit">Log in</button>
</form>
```

## What each key does on the server

| Site key in the browser    | Secret on the server                  | Response                                                      |
| -------------------------- | ------------------------------------- | ------------------------------------------------------------- |
| `1x00000000000000000000AA` | `1x0000000000000000000000000000000AA` | The handler runs                                              |
| `2x00000000000000000000AB` | any                                   | 400 `Missing turnstile verification code.`, no token was made |
| `3x00000000000000000000FF` | `1x0000000000000000000000000000000AA` | The handler runs once the visitor clicked                     |
| `1x00000000000000000000AA` | `2x0000000000000000000000000000000AA` | 400 `Invalid turnstile verification code.`                    |
| `1x00000000000000000000AA` | `3x0000000000000000000000000000000AA` | 400, with `timeout-or-duplicate` in the error codes           |

Results from test keys report `example.com` as the hostname and carry no action, so the guard skips the `expectedHostname` and action checks for them. Test those with your real keys.

## Next steps

- [Get started](/get-started): install the package and protect your first route.
- [Testing](/testing): test keys, `skipIf` and the service stub for unit tests.
- [Error handling](/error-handling): every response and how to replace it.
- [Testing Cloudflare Turnstile with test keys](/blog/turnstile-test-keys): a longer tutorial with the same keys.
- [Turnstile widget options](/blog/turnstile-widget-options): size, theme, appearance and callbacks.

## FAQ

### Does this demo send my data to a server?

No. The page only loads the Turnstile widget from Cloudflare with a public test site key and shows the token in the page. Nothing is posted to a backend.

### Why is the token always the same?

Cloudflare's test site keys always produce the dummy token `XXXX.DUMMY.TOKEN.XXXX`. Only test secret keys accept it, and production secret keys reject it.

### Can I verify a Turnstile token in the browser?

No. Verification needs your secret key, which must stay on the server. The browser only receives a token that your backend checks with Cloudflare's siteverify API.
