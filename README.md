<p align="center">
  <img src="https://i.ibb.co/HT1M4Kb/image.png" height="80" width="80" alt="Cloud logo" />
  <br />
  <img src="https://halitsever-api.vercel.app/api/repo-title?title=Cloudflare%20Turnstile%20NestJS" alt="Cloudflare Turnstile NestJS" />
</p>

<p align="center">
  ☁️ A guard that checks <a href="https://developers.cloudflare.com/turnstile/">Cloudflare Turnstile</a> tokens before your NestJS handlers run.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/nest-cloudflare-turnstile"><img src="https://img.shields.io/npm/v/nest-cloudflare-turnstile" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/nest-cloudflare-turnstile"><img src="https://img.shields.io/npm/dm/nest-cloudflare-turnstile" alt="npm downloads" /></a>
  <a href="https://github.com/halitsever/nest-cloudflare-turnstile/actions/workflows/ci.yml"><img src="https://github.com/halitsever/nest-cloudflare-turnstile/actions/workflows/ci.yml/badge.svg" alt="CI status" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/npm/l/nest-cloudflare-turnstile" alt="MIT license" /></a>
  <a href="https://github.com/sponsors/halitsever"><img src="https://img.shields.io/github/sponsors/halitsever" alt="GitHub sponsors" /></a>
</p>

<p align="center">
  <a href="https://halitsever.github.io/nest-cloudflare-turnstile">Documentation</a>
</p>

<p align="center">
  <img src="https://halitsever-api.vercel.app/api/details" alt="Details" />
</p>

- One decorator for a route or a whole controller, or a global guard with `@SkipTurnstile()` for the exceptions
- NestJS 10, 11 and 12, on Express or Fastify, including GraphQL resolvers and WebSocket gateways
- No runtime dependencies besides Nest itself
- Hostname and action checks, as Cloudflare recommends
- Several widgets in one app, each with its own secret key
- An `onVerify` hook for metrics, and debug logs without tokens or secrets
- An optional startup check that Cloudflare accepts your secret key
- One safe retry when siteverify fails, and errors that never contain your secret key

<p align="center">
  <img src="https://halitsever-api.vercel.app/api/installation" alt="Installation" />
</p>

```bash
npm install nest-cloudflare-turnstile
```

The package needs Node.js 20 or later.

## Quick start

Register the module with the secret key of your widget:

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

Then protect a route:

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

The guard reads the token from the `cf-turnstile-response` field that the widget adds to forms, or from a header with the same name. A request without a token gets a 400, and so does a request whose token Cloudflare rejects.

## Common options

```ts
import { UnauthorizedException } from '@nestjs/common';

TurnstileModule.forRoot({
  secretKey: process.env.TURNSTILE_SECRET_KEY,
  // Read the token from somewhere else.
  tokenResponse: (req) => req.body?.captcha,
  // Reject tokens solved on other sites.
  expectedHostname: 'example.com',
  // Let requests through in tests.
  skipIf: process.env.NODE_ENV === 'test',
  // Throw your own exception for missing or rejected tokens.
  exceptionFactory: (reason, { errorCodes }) =>
    new UnauthorizedException({ reason, errorCodes }),
});
```

> [!WARNING]
> `1x0000000000000000000000000000000AA` is Cloudflare's always-passes test secret. In production it lets every request with a token through, so the module logs a warning when it runs with `NODE_ENV=production`.

## Documentation

- [Get started](https://halitsever.github.io/nest-cloudflare-turnstile/get-started): module setup and sending the token from the browser
- [Frontend frameworks](https://halitsever.github.io/nest-cloudflare-turnstile/frontend): sending the token from React, Next.js, Vue and Angular
- [Options](https://halitsever.github.io/nest-cloudflare-turnstile/turnstile-options): every option with its default
- [Error handling](https://halitsever.github.io/nest-cloudflare-turnstile/error-handling): responses, custom exceptions and `onError`
- [Testing](https://halitsever.github.io/nest-cloudflare-turnstile/testing): `skipIf` and Cloudflare's test keys
- [Advanced usage](https://halitsever.github.io/nest-cloudflare-turnstile/advanced): per-route actions, a global guard, several widgets, the verification result, GraphQL, WebSockets and manual checks
- [Upgrading from 0.0.x](https://halitsever.github.io/nest-cloudflare-turnstile/migration)
- [Migrating from @nestlab/google-recaptcha](https://halitsever.github.io/nest-cloudflare-turnstile/from-google-recaptcha)

<p align="center">
  <a href="https://github.com/halitsever/nest-cloudflare-turnstile/issues"><img src="https://halitsever-api.vercel.app/api/issue" alt="Issues" /></a>
</p>

Issues and pull requests are welcome. [CONTRIBUTING.md](./CONTRIBUTING.md) explains the setup, and [SECURITY.md](./SECURITY.md) explains how to report a vulnerability privately.

<p align="center">
  <img src="https://halitsever-api.vercel.app/api/sponsor" alt="Sponsor" />
</p>

<p align="center">
  <img src="https://halitsever-api.vercel.app/api/license" alt="License" />
</p>

<p align="center">
  MIT LICENSE | <a href="https://halit.org">Halit Sever</a>
</p>
