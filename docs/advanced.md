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

An action can be up to 32 characters long and may contain letters, digits, `_` and `-`. The route's action wins over the controller's, and the controller's wins over the module's `expectedAction`. When both the controller and the route carry the decorator, the token is still checked once per call.

## Protect every route

Register the guard with `APP_GUARD` to require a token on every route, then exempt the routes that must stay open, such as health checks, with `@SkipTurnstile()`:

```ts
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TurnstileGuard, TurnstileModule } from 'nest-cloudflare-turnstile';

@Module({
  imports: [
    TurnstileModule.forRoot({ secretKey: process.env.TURNSTILE_SECRET_KEY }),
  ],
  providers: [{ provide: APP_GUARD, useClass: TurnstileGuard }],
})
export class AppModule {}
```

```ts
import { Controller, Get } from '@nestjs/common';
import { SkipTurnstile } from 'nest-cloudflare-turnstile';

@Controller('health')
@SkipTurnstile()
export class HealthController {
  @Get()
  check() {
    return { status: 'ok' };
  }
}
```

The closest decorator wins. `@TurnstileCaptcha()` on a route still guards it inside a controller marked with `@SkipTurnstile()`, and `@SkipTurnstile()` on a route exempts it from its controller's `@TurnstileCaptcha()`, with or without the global guard. A controller's own decorator also beats one on its parent class.

The global guard covers GraphQL resolvers too, and on NestJS 12 every WebSocket message as well. Every guarded GraphQL field needs a token of its own, so a query that asks for two fields fails. Mark the resolvers and gateways that should stay open with `@SkipTurnstile()`. In gateways, the options get the socket instead of the request, as [WebSocket gateways](#websocket-gateways) explains.

Routes can keep `@TurnstileCaptcha()` for its options, such as `action` or `widget`. The global guard applies them, and the token is still checked once per call.

## Several widgets

Every Cloudflare widget has its own site key and secret key. When a form uses a different widget than the rest of the app, add it under [`widgets`](./turnstile-options#widgets) and name it on the routes that accept its tokens:

```ts
@Controller('newsletter')
@TurnstileCaptcha({ widget: 'newsletter' })
export class NewsletterController {
  @Post()
  subscribe() {}
}
```

Routes that name no widget keep using the module's `secretKey`. As with actions, the route's `widget` wins over the controller's, and an action set with the decorator wins over the widget's `expectedAction`.

A route that names a widget missing from `widgets` answers 500 without calling Cloudflare. To check a token for a widget yourself, pass its name to `validateToken`:

```ts
const result = await this.turnstile.validateToken(token, {
  widget: 'newsletter',
});
```

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

## Ephemeral IDs

On Enterprise plans, Cloudflare can add an [Ephemeral ID](https://developers.cloudflare.com/turnstile/additional-configuration/ephemeral-id/) to the result: a short-lived device ID that stays the same when an attacker switches IP addresses. It changes within a few days, so use it for rate limits and fraud checks rather than to identify people:

```ts
@Post('signup')
@TurnstileCaptcha({ action: 'signup' })
async signUp(
  @Body() body: SignUpDto,
  @TurnstileResult() result: TurnstileVerifyResponse,
) {
  const deviceId = result.metadata?.ephemeral_id;
  if (deviceId && (await this.signups.countRecent(deviceId)) >= 3) {
    throw new ForbiddenException('Too many sign-ups from this device.');
  }
  return this.signups.create(body);
}
```

To turn such tokens away in the guard, check the ID in [`validateResult`](./turnstile-options#validateresult) instead.

## Verify a token yourself

`TurnstileService` is available for code outside the guard, such as queue workers or a gateway's `handleConnection`:

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

## WebSocket gateways

The guard also protects `@SubscribeMessage()` handlers. Send the token with each message in its `cf-turnstile-response` field:

```ts
import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { TurnstileCaptcha, TurnstileResult } from 'nest-cloudflare-turnstile';
import type { TurnstileVerifyResponse } from 'nest-cloudflare-turnstile';

@WebSocketGateway()
export class ChatGateway {
  @SubscribeMessage('join')
  @TurnstileCaptcha({ action: 'join' })
  join(
    @MessageBody() body: { room: string },
    @TurnstileResult() result: TurnstileVerifyResponse,
  ) {
    return { room: body.room };
  }
}
```

```js
socket.emit('join', { room: 'lobby', 'cf-turnstile-response': token });
```

Cloudflare accepts a token only once, so every guarded message needs a fresh one. A missing or rejected token throws a `WsException`, which Nest's socket.io adapter sends to the client as an `exception` event.

Where the options take the request, a gateway passes the socket instead. On socket.io, `remoteIp: (req) => req.ip ?? req.handshake?.address` covers HTTP routes and gateways alike. `@TurnstileResult()` reads the result from the message, so another message on the same socket never sees it.

## Fastify

Nothing changes. The guard reads `req.body` and `req.headers` from the Fastify request, and classic form posts work because Nest registers a form body parser.

## Outbound proxies

The module calls Cloudflare with the `fetch` built into Node.js, which ignores `HTTP_PROXY`, `HTTPS_PROXY` and `NO_PROXY` by default. On Node.js 22.21, 24 or later, start the app with `NODE_USE_ENV_PROXY=1` (or the `--use-env-proxy` flag) to route the calls through your proxy. On older versions, pass a [`fetch`](./turnstile-options#fetch) that goes through your proxy, or set a global dispatcher from the `undici` package, such as `EnvHttpProxyAgent` with `setGlobalDispatcher`.

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
