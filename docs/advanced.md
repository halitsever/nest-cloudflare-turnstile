# Advanced usage

## Per-route actions

Give each widget an action with `data-action`, then tell each route which action it accepts:

```html
<div
  class="cf-turnstile"
  data-sitekey="YOUR_SITE_KEY"
  data-action="login"
></div>
```

```ts
@Controller('auth')
@TurnstileCaptcha({ action: ['login', 'signup'] })
export class AuthController {
  @Post('login')
  @TurnstileCaptcha({ action: 'login' })
  login() {}

  @Post('signup')
  signup() {}
}
```

The route's action wins over the controller's, and the controller's wins over the module's `expectedAction`. When both the controller and the route carry the decorator, the token is still checked once per call.

## Read the verification result

`@TurnstileResult()` injects what Cloudflare returned for the request, including `hostname`, `action`, `cdata` and `challenge_ts`:

```ts
import { Controller, Post } from '@nestjs/common';
import { TurnstileCaptcha, TurnstileResult } from 'nest-cloudflare-turnstile';
import type { TurnstileVerifyResponse } from 'nest-cloudflare-turnstile';

@Controller('orders')
export class OrdersController {
  @Post()
  @TurnstileCaptcha()
  create(@TurnstileResult() result: TurnstileVerifyResponse) {
    // result.cdata holds the data-cdata value set on the widget
  }
}
```

Import `TurnstileVerifyResponse` with `import type`. With `isolatedModules` and `emitDecoratorMetadata` both on, TypeScript requires that for interfaces used in decorated parameters.

It is `undefined` when `skipIf` let the request through.

## Verify a token yourself

`TurnstileService` is available for code outside the guard, such as WebSocket gateways or queue workers:

```ts
import { Injectable } from '@nestjs/common';
import { TurnstileService } from 'nest-cloudflare-turnstile';

@Injectable()
export class SignupService {
  constructor(private readonly turnstile: TurnstileService) {}

  async signUp(token: string, ip: string) {
    const result = await this.turnstile.validateToken(token, { remoteIp: ip });
    if (!result.success) {
      // result['error-codes'] says why
    }
  }
}
```

`validateToken` resolves with Cloudflare's answer, including rejections. It throws an `InternalServerErrorException` and calls `onError` for the setup and network errors listed in [Error handling](./error-handling#setup-and-network-errors). It does not check hostname or action; compare `result.hostname` and `result.action` yourself if you need to.

## GraphQL

The guard works on resolvers with Apollo and Mercurius. GraphQL requests carry a query in the body, so send the token in the `cf-turnstile-response` header:

```ts
@Resolver()
export class AuthResolver {
  @Mutation(() => Boolean)
  @TurnstileCaptcha({ action: 'login' })
  login(@Args('email') email: string) {
    return true;
  }
}
```

`tokenResponse` receives the HTTP request as its first argument, and the `ExecutionContext` as its second if you need the GraphQL arguments.

The guard finds the request through the GraphQL context: `req` on Apollo, `reply` on Mercurius. Both drivers put them there by default. If you pass your own `context` factory, keep those fields, or every call is treated as missing a token.

Every guarded field checks its own token, and Cloudflare accepts a token only once. An operation can therefore resolve one guarded field per token. A second guarded field in the same operation, including an alias of the first such as `{ a: login b: login }`, is rejected, so one solved challenge cannot cover a batch of login attempts.

## Fastify

Nothing changes. The guard reads `req.body` and `req.headers` from the Fastify request, and classic form posts work because Nest registers a form body parser.

## Outbound proxies

The module calls Cloudflare with the `fetch` built into Node.js, which ignores `HTTP_PROXY`, `HTTPS_PROXY` and `NO_PROXY` by default. On Node.js 22.21, 24 or later, start the app with `NODE_USE_ENV_PROXY=1` (or the `--use-env-proxy` flag) to route the calls through your proxy. Older versions need a global dispatcher from the `undici` package, such as `EnvHttpProxyAgent` set with `setGlobalDispatcher`.

## Module setup options

`forRootAsync` also accepts a class that builds the options, or an existing provider:

```ts
import { Injectable } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  ITurnstileOptions,
  TurnstileModule,
  TurnstileOptionsFactory,
} from 'nest-cloudflare-turnstile';

@Injectable()
export class TurnstileConfig implements TurnstileOptionsFactory {
  constructor(private readonly config: ConfigService) {}

  createTurnstileOptions(): ITurnstileOptions {
    return {
      secretKey: this.config.getOrThrow('TURNSTILE_SECRET_KEY'),
      expectedHostname: this.config.get('APP_HOSTNAME'),
    };
  }
}

TurnstileModule.forRootAsync({
  imports: [ConfigModule],
  useClass: TurnstileConfig,
});
```

The options are also available for injection under the `TURNSTILE_OPTIONS` token.
