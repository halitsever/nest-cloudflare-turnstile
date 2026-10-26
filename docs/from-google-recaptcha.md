# Migrating from @nestlab/google-recaptcha

[@nestlab/google-recaptcha](https://github.com/chvarkov/google-recaptcha) and this package share their shape: a module with `forRoot` and `forRootAsync`, a decorator that guards routes and one that injects the result. Replace the reCAPTCHA widget in the frontend, then rename things on the server with the tables below.

```ts
// Before
GoogleRecaptchaModule.forRoot({
  secretKey: process.env.GOOGLE_RECAPTCHA_SECRET_KEY,
  response: (req) => req.headers.recaptcha,
  skipIf: process.env.NODE_ENV !== 'production',
  actions: ['SignUp', 'SignIn'],
  score: 0.8,
});

// After
TurnstileModule.forRoot({
  secretKey: process.env.TURNSTILE_SECRET_KEY,
  skipIf: process.env.NODE_ENV !== 'production',
  expectedAction: ['SignUp', 'SignIn'],
});
```

## Module options

| @nestlab/google-recaptcha | nest-cloudflare-turnstile | Notes                                                                                 |
| ------------------------- | ------------------------- | ------------------------------------------------------------------------------------- |
| `secretKey`               | `secretKey`               | The widget's secret key from the Cloudflare dashboard                                 |
| `response`                | `tokenResponse`           | Optional. By default the guard reads the `cf-turnstile-response` body field or header |
| `actions`                 | `expectedAction`          | Also takes a single string                                                            |
| `score`                   | none                      | Turnstile has no score: Cloudflare accepts or rejects the token                       |
| `skipIf`                  | `skipIf`                  | The function gets the `ExecutionContext` instead of the request                       |
| `remoteIp`                | `remoteIp`                |                                                                                       |
| `debug`                   | `debug`                   | Leaves tokens and secret keys out of the log                                          |
| `logger`                  | none                      | Logs go through Nest's `Logger`, so `app.useLogger()` applies                         |
| `network`                 | `fetch`                   | Turnstile has a single siteverify URL                                                 |
| `axiosConfig`             | `timeout`, `fetch`        | No axios. For proxies, see [Outbound proxies](./advanced#outbound-proxies)            |
| `global`                  | `isGlobal`                | Defaults to `true`                                                                    |
| `enterprise`              | none                      | Turnstile has one API for every plan                                                  |

## Decorators and services

| @nestlab/google-recaptcha             | nest-cloudflare-turnstile                                                                        |
| ------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `@Recaptcha()`                        | `@TurnstileCaptcha()`                                                                            |
| `@Recaptcha({ action })`              | `@TurnstileCaptcha({ action })`                                                                  |
| `@Recaptcha({ response })`            | `tokenResponse` on the module or on a [widget](./advanced#several-widgets)                       |
| `@RecaptchaResult()`                  | `@TurnstileResult()`                                                                             |
| `RecaptchaVerificationResult`         | `TurnstileVerifyResponse`                                                                        |
| `GoogleRecaptchaValidator.validate()` | `TurnstileService.validateToken()`                                                               |
| `GoogleRecaptchaException`            | `BadRequestException`, or your own from [`exceptionFactory`](./error-handling#custom-exceptions) |
| `RecaptchaConfigRef`                  | none. Load the options at startup with `forRootAsync`                                            |

`validateToken()` resolves with Cloudflare's answer as it is. Check `result.success` and `result['error-codes']` instead of `result.errors`.

## Error codes

| @nestlab/google-recaptcha                                                | nest-cloudflare-turnstile                                                                |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| `MissingInputResponse`                                                   | reason `missing`                                                                         |
| `InvalidInputResponse`                                                   | `invalid-input-response`                                                                 |
| `TimeoutOrDuplicate`                                                     | `timeout-or-duplicate`                                                                   |
| `ForbiddenAction`                                                        | `action-mismatch`                                                                        |
| `LowScore`                                                               | none                                                                                     |
| `MissingInputSecret`, `InvalidInputSecret`, `BadRequest`, `NetworkError` | a 500, and a `TurnstileError` for [`onError`](./error-handling#setup-and-network-errors) |

`exceptionFactory` gets the codes in `details.errorCodes`.

## Frontend

reCAPTCHA setups often send the token in a `recaptcha` header. Send the Turnstile token in `cf-turnstile-response` and leave `tokenResponse` out, or keep your header and point `tokenResponse` at it. [Frontend frameworks](./frontend) has examples for React, Vue and Angular.
