# Upgrading from 0.0.x to 1.0

Most apps upgrade by bumping the version. The module, the decorator and their options keep their names. Read the list below if you handle errors, run without a secret in some environments, or still use Node.js 18.

## Requirements

- Node.js 20 or later.
- NestJS 10, 11 or 12. `@nestjs/common`, `@nestjs/core` and `reflect-metadata` are now peer dependencies, so the package uses your app's copies instead of installing its own. This fixes the 500 responses that NestJS 10 and 12 apps got instead of 400s, which came from a second copy of NestJS inside the package.
- axios, `@nestjs/axios` and rxjs are no longer installed. The package calls Cloudflare with the `fetch` built into Node.js.
- Behind an outbound proxy, check your setup before upgrading. axios read `HTTP_PROXY` and `HTTPS_PROXY` on its own, but Node.js `fetch` ignores them unless you opt in, and every guarded route would answer 500. See [Outbound proxies](./advanced#outbound-proxies).

## Behavior changes

- The app refuses to start without a `secretKey`, unless `skipIf` is `true`. Before, every request failed at runtime instead.
- `onError` receives a `TurnstileError` instead of an `AxiosError`. It carries `errorCodes` and a `cause`, and never the secret key, which the `AxiosError` exposed in `config.data`.
- Cloudflare's `internal-error` now gets one retry and then a 500. Before, it could reach visitors as a 400 invalid-token response. Wrong or missing secrets still answer 500.
- siteverify calls time out after 5 seconds and are retried once. Set `timeout` to change the limit.
- Tokens that are not strings or are longer than 2048 characters are rejected without a call to Cloudflare.
- `exceptionFactory` gets a second argument, `{ errorCodes }`. Factories that take only the reason keep working.
- `tokenResponse` is optional. Without it, the guard reads the `cf-turnstile-response` body field or header. Its second argument is now the `ExecutionContext`.

## New features

- [`expectedHostname` and `expectedAction`](./turnstile-options#expectedhostname), plus per-route actions with `@TurnstileCaptcha({ action })`
- `@TurnstileCaptcha()` on controller classes
- [`@TurnstileResult()`](./advanced#read-the-verification-result) to read the verification result
- `TurnstileService` exported from the package root
- `remoteIp`, as a module option and as an argument to `validateToken`
- `skipIf` as a function
- `useClass`, `useExisting` and `isGlobal` for module setup
- GraphQL resolvers on Apollo and Mercurius

## A note on header examples

Older versions of the README read the token with `req.headers.turnstileToken`. Node.js lowercases header names, so that value was always `undefined`. Use `req.headers['turnstiletoken']`, or drop `tokenResponse` and send the `cf-turnstile-response` header.
