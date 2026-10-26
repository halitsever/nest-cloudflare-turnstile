# Changelog

## v1.1.0

[compare changes](https://github.com/halitsever/nest-cloudflare-turnstile/compare/v1.0.0...v1.1.0)

New options for checks of your own and for tests, plus a fix for 5xx answers from siteverify. Nothing in 1.0 changes.

### 🚀 Enhancements

- Add a fetch option and release the body of 5xx answers ([9994d96](https://github.com/halitsever/nest-cloudflare-turnstile/commit/9994d96))
- Add validateResult for checks of your own ([7649fa2](https://github.com/halitsever/nest-cloudflare-turnstile/commit/7649fa2))
- Add a TurnstileService stub for your own tests ([461a4d1](https://github.com/halitsever/nest-cloudflare-turnstile/commit/461a4d1))

### 📖 Documentation

- Bring back the README images ([a3be503](https://github.com/halitsever/nest-cloudflare-turnstile/commit/a3be503))

### ✅ Tests

- Type-check the 1.1 options in consumer apps ([350b514](https://github.com/halitsever/nest-cloudflare-turnstile/commit/350b514))

### 🤖 CI

- Rehearse the npm publish from a manual run ([bd97eac](https://github.com/halitsever/nest-cloudflare-turnstile/commit/bd97eac))
- Keep Dependabot off majors the toolchain cannot take ([df56b82](https://github.com/halitsever/nest-cloudflare-turnstile/commit/df56b82))

### ❤️ Contributors

- Halit Sever ([@halitsever](https://github.com/halitsever))

## v1.0.0

[compare changes](https://github.com/halitsever/nest-cloudflare-turnstile/compare/v0.0.17...v1.0.0)

NestJS 10, 11 and 12 support, no runtime dependencies, and new options for hostname and action checks, GraphQL and error handling. Read the [upgrade guide](https://halitsever.github.io/nest-cloudflare-turnstile/migration) before you update.

### ⚠️ Breaking changes

- `@nestjs/common`, `@nestjs/core` and `reflect-metadata` are peer dependencies now, and Node.js 20 or later is required. Apps on NestJS 10 and 12 no longer get a second copy of NestJS that turned 400 responses into 500s.
- The app refuses to start without a `secretKey`, unless `skipIf` is `true`.
- `onError` receives a `TurnstileError` instead of an `AxiosError`, and the error no longer contains the secret key.
- Cloudflare's `internal-error` is retried once and then answers 500 instead of 400.
- siteverify calls time out after 5 seconds.
- Tokens that are not strings or are longer than 2048 characters are rejected without a call to Cloudflare.
- Calls to Cloudflare use the `fetch` built into Node.js, which ignores `HTTP_PROXY` and `HTTPS_PROXY` unless you opt in. See [Outbound proxies](https://halitsever.github.io/nest-cloudflare-turnstile/advanced#outbound-proxies).

### 🚀 Enhancements

- ⚠️  Call siteverify with native fetch and a timeout ([1aac4f6](https://github.com/halitsever/nest-cloudflare-turnstile/commit/1aac4f6))
- Export TurnstileService and allow class-level TurnstileCaptcha ([461bfb7](https://github.com/halitsever/nest-cloudflare-turnstile/commit/461bfb7))
- Configure the module with useClass, useExisting and isGlobal ([54ea351](https://github.com/halitsever/nest-cloudflare-turnstile/commit/54ea351))
- Check token hostname and action, with per-route actions ([9443d8b](https://github.com/halitsever/nest-cloudflare-turnstile/commit/9443d8b))
- ⚠️  Fail fast without a secret key and flag test keys in production ([36bc1d1](https://github.com/halitsever/nest-cloudflare-turnstile/commit/36bc1d1))
- ⚠️  Retry siteverify once and treat setup errors as 500 ([53fbe35](https://github.com/halitsever/nest-cloudflare-turnstile/commit/53fbe35))
- Add TurnstileResult, remoteIp, skipIf functions and a default token field ([371fa3e](https://github.com/halitsever/nest-cloudflare-turnstile/commit/371fa3e))
- Guard GraphQL resolvers on Apollo and Mercurius ([5b4df9e](https://github.com/halitsever/nest-cloudflare-turnstile/commit/5b4df9e))

### 🩹 Fixes

- Verify every guarded GraphQL field with its own token ([7d8344f](https://github.com/halitsever/nest-cloudflare-turnstile/commit/7d8344f))
- Keep a bare TurnstileModule import harmless ([f458402](https://github.com/halitsever/nest-cloudflare-turnstile/commit/f458402))
- Type secretKey as string | undefined so env examples compile ([cfb9bdf](https://github.com/halitsever/nest-cloudflare-turnstile/commit/cfb9bdf))
- Log setup errors without onError and contain a failing onError ([67c3a2a](https://github.com/halitsever/nest-cloudflare-turnstile/commit/67c3a2a))

### 📖 Documentation

- Rewrite the README for 1.0 ([4b75b89](https://github.com/halitsever/nest-cloudflare-turnstile/commit/4b75b89))
- Add options, error handling, testing, advanced and upgrade guides ([36e6f05](https://github.com/halitsever/nest-cloudflare-turnstile/commit/36e6f05))
- Add contributing and security guides ([b4a3366](https://github.com/halitsever/nest-cloudflare-turnstile/commit/b4a3366))
- Cover outbound proxies, safe skipIf rules and multipart uploads ([2af5c44](https://github.com/halitsever/nest-cloudflare-turnstile/commit/2af5c44))
- Spell out the release steps ([20d350d](https://github.com/halitsever/nest-cloudflare-turnstile/commit/20d350d))

### 📦 Build

- Compile with TypeScript 6 in strict mode ([fa12595](https://github.com/halitsever/nest-cloudflare-turnstile/commit/fa12595))
- Lint with ESLint flat config and check formatting ([22ed7c6](https://github.com/halitsever/nest-cloudflare-turnstile/commit/22ed7c6))
- ⚠️  Move Nest to peer dependencies for Nest 10, 11 and 12 ([5b1496a](https://github.com/halitsever/nest-cloudflare-turnstile/commit/5b1496a))

### 🏡 Chore

- Remove unused dev dependencies ([e05fbf1](https://github.com/halitsever/nest-cloudflare-turnstile/commit/e05fbf1))
- Add issue forms, a PR template and funding info ([d7a3c37](https://github.com/halitsever/nest-cloudflare-turnstile/commit/d7a3c37))

### ✅ Tests

- Cover the guard, service and module with Vitest ([40a2724](https://github.com/halitsever/nest-cloudflare-turnstile/commit/40a2724))
- Type-check the packed declarations in consumer apps ([eb05873](https://github.com/halitsever/nest-cloudflare-turnstile/commit/eb05873))
- Cover the whole public API in the consumer type check ([eae2b11](https://github.com/halitsever/nest-cloudflare-turnstile/commit/eae2b11))
- Cover classic form posts on Express and Fastify ([b94310b](https://github.com/halitsever/nest-cloudflare-turnstile/commit/b94310b))
- Cover actions set on the controller ([493caa0](https://github.com/halitsever/nest-cloudflare-turnstile/commit/493caa0))

### 🎨 Styles

- Describe the options token without history ([7c556e7](https://github.com/halitsever/nest-cloudflare-turnstile/commit/7c556e7))

### 🤖 CI

- Run lint, tests and consumer checks on every PR ([629e921](https://github.com/halitsever/nest-cloudflare-turnstile/commit/629e921))
- Publish to npm with trusted publishing ([52bbcf7](https://github.com/halitsever/nest-cloudflare-turnstile/commit/52bbcf7))
- Refresh the docs deploy and add Dependabot ([7ea354e](https://github.com/halitsever/nest-cloudflare-turnstile/commit/7ea354e))
- Build before linting the package ([eef5f13](https://github.com/halitsever/nest-cloudflare-turnstile/commit/eef5f13))
- Refuse to publish a tag that does not match package.json ([eb64e7f](https://github.com/halitsever/nest-cloudflare-turnstile/commit/eb64e7f))

### ❤️ Contributors

- Halit Sever ([@halitsever](https://github.com/halitsever))

## v0.0.17

[compare changes](https://github.com/halitsever/nest-cloudflare-turnstile/compare/v0.0.15...v0.0.17)

v0.0.16 was tagged but not published to npm. Its changes shipped in v0.0.17.

### 🚀 Enhancements

- Add `exceptionFactory` to customize the exception for a missing or invalid token ([#17](https://github.com/halitsever/nest-cloudflare-turnstile/pull/17))

### 📖 Documentation

- Document `skipIf` and `exceptionFactory` ([#18](https://github.com/halitsever/nest-cloudflare-turnstile/pull/18))

### 📦 Build

- Bump axios from 1.9.0 to 1.12.2 ([#16](https://github.com/halitsever/nest-cloudflare-turnstile/pull/16))

### ❤️ Contributors

- Halit Sever ([@halitsever](https://github.com/halitsever))

## v0.0.15

[compare changes](https://github.com/halitsever/nest-cloudflare-turnstile/compare/v0.0.12...v0.0.15)

### 🚀 Enhancements

- **turnstile.guard:** Add skipIf option #2 ([#2](https://github.com/halitsever/nest-cloudflare-turnstile/issues/2))

### 🏡 Chore

- Bump nestjs to 11.1.1 #14 ([#14](https://github.com/halitsever/nest-cloudflare-turnstile/issues/14))

### ❤️ Contributors

- Halit Sever ([@halitsever](https://github.com/halitsever))

## v0.0.12

[compare changes](https://github.com/halitsever/nest-cloudflare-turnstile/compare/v0.0.11...v0.0.12)

### 🏡 Chore

- **release:** V0.0.11 ([ca36750](https://github.com/halitsever/nest-cloudflare-turnstile/commit/ca36750))

### 🤖 CI

- Add --bump arg to release script ([599a48d](https://github.com/halitsever/nest-cloudflare-turnstile/commit/599a48d))

### ❤️ Contributors

- Halit Sever ([@halitsever](http://github.com/halitsever))

## v0.0.11

[compare changes](https://github.com/halitsever/nest-cloudflare-turnstile/compare/v0.0.11...v0.0.11)

### 🤖 CI

- Add --bump arg to release script ([599a48d](https://github.com/halitsever/nest-cloudflare-turnstile/commit/599a48d))

### ❤️ Contributors

- Halit Sever ([@halitsever](http://github.com/halitsever))

## v0.0.10

[compare changes](https://github.com/halitsever/nest-cloudflare-turnstile/compare/0.0.9...v0.0.10)

### 🤖 CI

- Bump version to 0.0.9 ([9cd9d93](https://github.com/halitsever/nest-cloudflare-turnstile/commit/9cd9d93))

### ❤️ Contributors

- Halit Sever ([@halitsever](http://github.com/halitsever))
