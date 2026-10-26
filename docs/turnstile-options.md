# Options

`forRoot` takes these options. `forRootAsync` takes the same object from its factory.

| Option                  | Type                                                    | Default                                                     |
| ----------------------- | ------------------------------------------------------- | ----------------------------------------------------------- |
| `secretKey`             | `string \| undefined`                                   | required                                                    |
| `tokenResponse`         | `(req, context) => unknown`                             | `cf-turnstile-response` body field, header or message field |
| `remoteIp`              | `(req) => string \| undefined`                          | not sent                                                    |
| `expectedHostname`      | `string \| string[]`                                    | any hostname                                                |
| `expectedAction`        | `string \| string[]`                                    | any action                                                  |
| `validateResult`        | `(result, req, context) => boolean \| Promise<boolean>` | none                                                        |
| `timeout`               | `number`                                                | `5000`                                                      |
| `fetch`                 | `typeof fetch`                                          | the global `fetch`                                          |
| `skipIf`                | `boolean \| (context) => boolean \| Promise<boolean>`   | `false`                                                     |
| `exceptionFactory`      | `(reason, details, context) => Error`                   | `BadRequestException`, or `WsException` in gateways         |
| `onError`               | `(error: TurnstileError) => void`                       | none                                                        |
| `onVerify`              | `(event: TurnstileVerifyEvent) => void`                 | none                                                        |
| `debug`                 | `boolean`                                               | `false`                                                     |
| `widgets`               | `Record<string, TurnstileWidgetOptions>`                | none                                                        |
| `verifySecretOnStartup` | `boolean`                                               | `false`                                                     |
| `isGlobal`              | `boolean`                                               | `true`                                                      |

## secretKey

The secret key of your widget, from the Cloudflare dashboard. Keep it on the server. The module refuses to start without one unless `skipIf` is `true`, and it logs a warning when one of [Cloudflare's test keys](./testing#cloudflare-test-keys) runs with `NODE_ENV=production`. To also catch a wrong key at startup, turn on [`verifySecretOnStartup`](#verifysecretonstartup).

## tokenResponse

Reads the token from the request. The second argument is Nest's `ExecutionContext`. When you leave it out, the guard reads the `cf-turnstile-response` body field that the widget adds to forms, then a header with the same name. In [WebSocket gateways](./advanced#websocket-gateways), it reads that field from the message.

```ts
TurnstileModule.forRoot({
  secretKey: process.env.TURNSTILE_SECRET_KEY,
  tokenResponse: (req) => req.headers['x-turnstile-token'],
});
```

The guard answers 400 when this returns nothing. It also answers 400, without calling Cloudflare, when the value is not a string or is longer than 2048 characters.

## remoteIp

Returns the visitor's IP address, which the guard sends to Cloudflare as `remoteip`. Cloudflare treats it as an extra signal. Behind a proxy, make sure the value is the visitor's address and not the proxy's, for example `req.ip` with Express's `trust proxy` setting.

```ts
TurnstileModule.forRoot({
  secretKey: process.env.TURNSTILE_SECRET_KEY,
  remoteIp: (req) => req.ip,
});
```

## expectedHostname

Cloudflare reports the hostname where the visitor solved the challenge. Set this to reject tokens solved on other sites that use the same widget.

```ts
TurnstileModule.forRoot({
  secretKey: process.env.TURNSTILE_SECRET_KEY,
  expectedHostname: ['example.com', 'www.example.com'],
});
```

## expectedAction

The action is a label you give a widget with `data-action`, such as `login` or `signup`. Set this to reject tokens from widgets meant for other forms. A route can set its own action with [`@TurnstileCaptcha({ action })`](./advanced#per-route-actions), which takes precedence.

The guard skips the hostname and action checks for results from Cloudflare's test keys, because those never report the real values.

## validateResult

Runs after Cloudflare accepted the token and the hostname and action checks passed. Return `false` to reject the token like an invalid one, with the `validate-result-failed` error code, or throw your own exception.

A common use is to bind the token to the visitor's session. Put the session ID in the widget's `data-cdata` attribute, then compare it on the server:

```html
<div
  class="cf-turnstile"
  data-sitekey="YOUR_SITE_KEY"
  data-cdata="SESSION_ID"
></div>
```

```ts
TurnstileModule.forRoot({
  secretKey: process.env.TURNSTILE_SECRET_KEY,
  validateResult: (result, req) => result.cdata === req.session.id,
});
```

A token solved in someone else's session then fails, even though Cloudflare accepted it. `data-cdata` takes up to 255 letters, digits, `_` and `-`, so encode a session ID that has other characters. The function can be async, and its third argument is the `ExecutionContext`.

## timeout

How long to wait for each siteverify call, in milliseconds. When a call times out, fails on the network, gets an HTTP 5xx answer or comes back with `internal-error`, the guard tries once more with the same idempotency key. If the second attempt also fails, the request gets a 500 and `onError` is called.

## fetch

Sends the siteverify requests instead of the `fetch` built into Node.js. Use it to route the calls through your own HTTP client, or to log them:

```ts
TurnstileModule.forRoot({
  secretKey: process.env.TURNSTILE_SECRET_KEY,
  fetch: async (input, init) => {
    const started = Date.now();
    const response = await fetch(input, init);
    console.log(
      `siteverify answered ${response.status} in ${Date.now() - started} ms`,
    );
    return response;
  },
});
```

The timeout and the retry still apply to it. For proxies, see [Outbound proxies](./advanced#outbound-proxies).

## skipIf

Lets requests through without a check. Pass a boolean for a fixed setting, or a function that decides per request:

```ts
TurnstileModule.forRoot({
  secretKey: process.env.TURNSTILE_SECRET_KEY,
  skipIf: process.env.NODE_ENV === 'test',
});

// or, per request: skip for staff that an authentication guard already identified
TurnstileModule.forRoot({
  secretKey: process.env.TURNSTILE_SECRET_KEY,
  skipIf: (context) =>
    context.switchToHttp().getRequest().user?.role === 'staff',
});
```

Base the decision only on data your server set, such as the user an authentication guard attached. Headers, query strings and the body come from the visitor, so a rule built on them lets anyone skip the check. For `req.user` to be there in time, register the authentication guard globally with `APP_GUARD`, because global guards run before the guards of a controller or route.

## exceptionFactory

Builds the exception the guard throws for a missing or rejected token. Its third argument is the `ExecutionContext`, which tells HTTP routes and WebSocket gateways apart. See [Error handling](./error-handling#custom-exceptions).

## onError

Called with a `TurnstileError` when siteverify cannot be reached or refuses the request itself, for example because of a wrong secret key. The error never contains the secret. When you leave it out, the module logs the error instead. See [Error handling](./error-handling#setup-and-network-errors).

## onVerify

Called after every siteverify check, from the guard or from [`validateToken`](./advanced#verify-a-token-yourself), with Cloudflare's answer and how long it took. Use it for metrics, for example with [prom-client](https://github.com/siimon/prom-client):

```ts
import { Counter } from 'prom-client';

const checks = new Counter({
  name: 'turnstile_checks_total',
  help: 'Turnstile siteverify checks by outcome',
  labelNames: ['outcome'],
});

TurnstileModule.forRoot({
  secretKey: process.env.TURNSTILE_SECRET_KEY,
  onVerify: ({ outcome }) => checks.inc({ outcome }),
});
```

| Field        | Value                                                                                                           |
| ------------ | --------------------------------------------------------------------------------------------------------------- |
| `outcome`    | `success` or `rejected` as Cloudflare answered, or `failed` when siteverify gave no answer or blamed your setup |
| `result`     | Cloudflare's answer. Missing when siteverify could not be reached                                               |
| `error`      | For failed checks, the `TurnstileError` that `onError` gets                                                     |
| `widget`     | The name from [`widgets`](#widgets), when the check used one                                                    |
| `durationMs` | Time spent on siteverify, retry included                                                                        |
| `attempts`   | `1`, or `2` when the first request failed and was retried                                                       |

The event describes Cloudflare's answer, not the guard's decision. A token Cloudflare accepted counts as `success` even when the hostname or action check or `validateResult` rejects it afterwards. Requests the guard turns away before calling Cloudflare, such as those without a token, produce no event. If `onVerify` throws or returns a rejected promise, the module logs that and the check goes on.

## debug

Logs one line per siteverify check at Nest's debug level:

```text
DEBUG [TurnstileModule] siteverify rejected [timeout-or-duplicate]: 1 attempt, 84 ms
```

The line has the outcome, Cloudflare's error codes, the widget name if there is one, the attempts and the duration. It never has the token, the secret key or `cdata`. Nest's default logger prints debug messages. If your app sets its own log levels, include `'debug'`.

## widgets

Adds widgets with their own secret keys, for forms that use a different Cloudflare widget than the rest of the app. A route picks one by name with [`@TurnstileCaptcha({ widget })`](./advanced#several-widgets).

```ts
TurnstileModule.forRoot({
  secretKey: process.env.TURNSTILE_SECRET_KEY,
  widgets: {
    newsletter: {
      secretKey: process.env.TURNSTILE_NEWSLETTER_SECRET_KEY,
      expectedAction: 'subscribe',
    },
  },
});
```

A widget can also set its own `expectedHostname`, `expectedAction` and `tokenResponse`. Whatever it leaves out comes from the module. At startup, each widget's secret key gets the same checks as `secretKey`.

## verifySecretOnStartup

Sends Cloudflare's dummy token with each secret key when the app starts. If Cloudflare answers `invalid-input-secret`, the app does not start, so a wrong key fails the deploy instead of every protected request.

```ts
TurnstileModule.forRoot({
  secretKey: process.env.TURNSTILE_SECRET_KEY,
  verifySecretOnStartup: true,
});
```

A working key rejects the dummy token as an invalid token, which counts as a pass. If Cloudflare cannot be reached or reports an internal error, the module logs a warning and starts anyway, which can delay startup by up to twice the [`timeout`](#timeout). The check does not run when `skipIf` is `true`, and it does not call `onVerify` or `onError`.

## isGlobal

The module is global by default, so every module can use the guard and `TurnstileService`. With `isGlobal: false`, they are available only where the configured module is imported. Configure it once in a shared module that re-exports it:

```ts
@Module({
  imports: [
    TurnstileModule.forRoot({
      secretKey: process.env.TURNSTILE_SECRET_KEY,
      isGlobal: false,
    }),
  ],
  exports: [TurnstileModule],
})
export class CaptchaModule {}
```

Then import `CaptchaModule` in each module that uses the guard. Importing the bare `TurnstileModule` class does not bring the configuration along.
