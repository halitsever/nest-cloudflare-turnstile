# Get started

## Install

```bash
npm install nest-cloudflare-turnstile
```

The package needs Node.js 20 or later and works with NestJS 10, 11 and 12. It uses the `@nestjs/common` and `@nestjs/core` packages your app already has.

## Register the module

Import `TurnstileModule` once, usually in `AppModule`, with the secret key of your widget from the Cloudflare dashboard:

```ts
import { Module } from '@nestjs/common';
import { TurnstileModule } from 'nest-cloudflare-turnstile';

@Module({
  imports: [
    TurnstileModule.forRoot({
      secretKey: process.env.TURNSTILE_SECRET_KEY,
    }),
  ],
})
export class AppModule {}
```

If the secret comes from `@nestjs/config`, use `forRootAsync`:

```ts
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TurnstileModule } from 'nest-cloudflare-turnstile';

TurnstileModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    secretKey: config.getOrThrow<string>('TURNSTILE_SECRET_KEY'),
  }),
});
```

The module is global, so feature modules can use the guard without importing it again. The app refuses to start when `secretKey` is empty, unless [`skipIf`](./turnstile-options#skipif) is `true`.

## Protect a route

```ts
import { Controller, Post } from '@nestjs/common';
import { TurnstileCaptcha } from 'nest-cloudflare-turnstile';

@Controller('auth')
export class AuthController {
  @Post('login')
  @TurnstileCaptcha()
  login() {
    // Runs only after Cloudflare accepted the token.
  }
}
```

Put the decorator on the controller class to protect every route in it.

## Send the token from the browser

Inside a form, the Turnstile widget adds a hidden `cf-turnstile-response` field. The guard reads that field by default:

```html
<script
  src="https://challenges.cloudflare.com/turnstile/v0/api.js"
  async
  defer
></script>

<form action="/auth/login" method="POST">
  <input name="email" type="email" />
  <div class="cf-turnstile" data-sitekey="YOUR_SITE_KEY"></div>
  <button type="submit">Log in</button>
</form>
```

When the page calls your API with `fetch`, send the token in a header of the same name. The guard checks the header when the body has no token:

```js
const token = turnstile.getResponse(widgetId);

await fetch('/auth/login', {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'cf-turnstile-response': token,
  },
  body: JSON.stringify({ email }),
});
```

To read the token from somewhere else, such as a field the widget renamed with `data-response-field-name`, pass `tokenResponse`:

```ts
TurnstileModule.forRoot({
  secretKey: process.env.TURNSTILE_SECRET_KEY,
  tokenResponse: (req) => req.body?.captcha,
});
```

Node.js lowercases header names, so read `req.headers['x-captcha-token']`, never `req.headers['X-Captcha-Token']`.

Guards run before interceptors, so a multipart body that `FileInterceptor` parses is still empty when the guard looks for the token. For file uploads, send the token in the `cf-turnstile-response` header.

## When a check fails

| Situation                                              | Response                                   |
| ------------------------------------------------------ | ------------------------------------------ |
| No token in the request                                | 400 `Missing turnstile verification code.` |
| Cloudflare rejects the token                           | 400 `Invalid turnstile verification code.` |
| Cloudflare cannot be reached, or it rejects the secret | 500 `Failed turnstile verification.`       |

[Error handling](./error-handling) shows how to change these responses. [Testing](./testing) covers local development and automated tests.
