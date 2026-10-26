# Options

`forRoot` takes these options. `forRootAsync` takes the same object from its factory.

| Option             | Type                                                  | Default                                |
| ------------------ | ----------------------------------------------------- | -------------------------------------- |
| `secretKey`        | `string`                                              | required                               |
| `tokenResponse`    | `(req, context) => unknown`                           | `cf-turnstile-response` body or header |
| `remoteIp`         | `(req) => string \| undefined`                        | not sent                               |
| `expectedHostname` | `string \| string[]`                                  | any hostname                           |
| `expectedAction`   | `string \| string[]`                                  | any action                             |
| `timeout`          | `number`                                              | `5000`                                 |
| `skipIf`           | `boolean \| (context) => boolean \| Promise<boolean>` | `false`                                |
| `exceptionFactory` | `(reason, details) => Error`                          | `BadRequestException`                  |
| `onError`          | `(error: TurnstileError) => void`                     | none                                   |
| `isGlobal`         | `boolean`                                             | `true`                                 |

## secretKey

The secret key of your widget, from the Cloudflare dashboard. Keep it on the server. The module refuses to start without one unless `skipIf` is `true`, and it logs a warning when one of [Cloudflare's test keys](./testing#cloudflare-test-keys) runs with `NODE_ENV=production`.

## tokenResponse

Reads the token from the request. The second argument is Nest's `ExecutionContext`. When you leave it out, the guard reads the `cf-turnstile-response` body field that the widget adds to forms, then a header with the same name.

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

## timeout

How long to wait for each siteverify call, in milliseconds. When a call times out, fails on the network, gets an HTTP 5xx answer or comes back with `internal-error`, the guard tries once more with the same idempotency key. If the second attempt also fails, the request gets a 500 and `onError` is called.

## skipIf

Lets requests through without a check. Pass a boolean for a fixed setting, or a function that decides per request:

```ts
TurnstileModule.forRoot({
  secretKey: process.env.TURNSTILE_SECRET_KEY,
  skipIf: process.env.NODE_ENV === 'test',
});

// or, per request
TurnstileModule.forRoot({
  secretKey: process.env.TURNSTILE_SECRET_KEY,
  skipIf: (context) =>
    context.switchToHttp().getRequest().headers['x-internal-job'] === 'yes',
});
```

## exceptionFactory

Builds the exception the guard throws for a missing or rejected token. See [Error handling](./error-handling#custom-exceptions).

## onError

Called with a `TurnstileError` when siteverify cannot be reached or refuses the request itself, for example because of a wrong secret key. The error never contains the secret. See [Error handling](./error-handling#setup-and-network-errors).

## isGlobal

The module is global by default. Pass `isGlobal: false` to make it visible only to the modules that import it.
