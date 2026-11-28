---
title: 'Why Your Captcha Should Be Verified on the Server'
titleTemplate: false
description: 'Why a captcha widget alone protects nothing, what a server-side check must verify, and how a NestJS guard verifies Turnstile tokens on every request.'
headline: 'Captcha checks belong on the server'
date: '2026-11-28'
keyword: 'nestjs captcha'
faq:
  [
    {
      'q': 'Is a captcha secure without server-side verification?',
      'a': "No. Cloudflare's docs say the client-side widget alone does not protect your forms and that tokens can be forged. Only the siteverify call with your secret key proves a token is real.",
    },
    {
      'q': 'How do I add a captcha to a NestJS API?',
      'a': 'Install nest-cloudflare-turnstile, register TurnstileModule.forRoot with your Turnstile secret key and put @TurnstileCaptcha() on the routes to protect.',
    },
    {
      'q': 'Should I cache a successful captcha result?',
      'a': 'No. A Turnstile token can be verified once and expires after 300 seconds. Verify each protected request with its own token.',
    },
  ]
---

# Captcha checks belong on the server

<p class="post-meta">By <a href="https://halit.org">Halit Sever</a> · <time datetime="2026-11-28">28 November 2026</time></p>

<p class="lead">A captcha widget in the browser only produces a token. Anyone can send your API a request with a made-up token, or with no widget at all. The protection comes from the server asking the provider whether the token is genuine, on every request that matters.</p>

## The widget is not the check

Cloudflare's validation docs put it in a heading: "Mandatory server-side validation". They go on: "The client-side widget alone does not protect your forms", and "Tokens can be forged" ([server-side validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)). The same holds for reCAPTCHA and hCaptcha. A bot does not run your page; it posts to your endpoint. If the backend only checks that `cf-turnstile-response` is present, any string passes.

The secret key is what makes the check trustworthy. It lives on the server and goes only to the provider's siteverify endpoint. Put it in front-end code and an attacker can verify tokens of their own or skip the check altogether.

## What a server-side check must verify

1. **The token exists and looks sane.** Reject a missing token before calling anyone. Turnstile tokens are at most 2,048 characters, so longer input is not a token.
2. **The provider accepts it.** Post token and secret to siteverify and require `success: true`.
3. **It was solved on your site.** Compare `hostname` with your domains, so a token solved on another site using the same widget is refused.
4. **It was solved for this form.** Compare `action` with what the route expects, so a token from a newsletter widget cannot unlock the login.
5. **It is fresh and unused.** Turnstile tokens are valid for 300 seconds and can be redeemed once; siteverify answers `timeout-or-duplicate` otherwise. Do not cache a "passed" result and reuse it.
6. **Failures are told apart.** A bad token is the visitor's problem (400). A wrong secret or an unreachable provider is yours (500), and should alert you rather than silently block everyone.

## How nest-cloudflare-turnstile does it

The module puts those six steps in a NestJS guard, so they run before the route handler and the handler never sees an unverified request:

```ts
@Controller('auth')
export class AuthController {
  @Post('login')
  @TurnstileCaptcha({ action: 'login' })
  login() {
    // Cloudflare accepted the token, for this hostname and this action.
  }
}
```

From the guard's source:

- It reads the token from the `cf-turnstile-response` body field, then the header, and rejects it without a network call when it is missing, not a string or longer than 2,048 characters.
- It calls siteverify on every request, with a five-second timeout by default. Nothing is cached between requests.
- On a network error, an HTTP 5xx or `internal-error`, it tries once more with the same `idempotency_key`, so Cloudflare treats the retry as the same check and not as a reused token.
- After a pass it checks `expectedHostname` and the route's `action`, then your own [`validateResult`](/turnstile-options#validateresult), which can bind the token's `cdata` to a session.
- Token problems answer 400. Secret, request and provider problems answer 500 and go to `onError`, and the error never contains the secret key ([error handling](/error-handling)).
- With [`verifySecretOnStartup`](/turnstile-options#verifysecretonstartup), the app checks the secret with Cloudflare at boot, so a wrong key fails the deploy instead of the first visitor.

Guards also cover GraphQL resolvers and WebSocket gateways, and `APP_GUARD` can protect every route with `@SkipTurnstile()` for the exceptions ([advanced usage](/advanced)).

## A note on order

In NestJS, guards run before interceptors and pipes. That is what you want for a captcha: an invalid request is refused before body validation or business logic runs. It also means a multipart body parsed by `FileInterceptor` is still empty when the guard looks, so file uploads should send the token in the `cf-turnstile-response` header ([get started](/get-started#send-the-token-from-the-browser)).

## Try it

The [Turnstile demo](/demo/) shows the browser half with Cloudflare's test keys and the guard code that would verify the token. For the full picture of the token flow, read [how Cloudflare Turnstile works](/blog/what-is-cloudflare-turnstile).

## FAQ

### Is a captcha secure without server-side verification?

No. Cloudflare's docs say the client-side widget alone does not protect your forms and that tokens can be forged. Only the siteverify call with your secret key proves a token is real.

### How do I add a captcha to a NestJS API?

Install nest-cloudflare-turnstile, register TurnstileModule.forRoot with your Turnstile secret key and put @TurnstileCaptcha() on the routes to protect.

### Should I cache a successful captcha result?

No. A Turnstile token can be verified once and expires after 300 seconds. Verify each protected request with its own token.

## Related posts

- [reCAPTCHA alternatives worth a look](/blog/recaptcha-alternatives)
- [How Cloudflare Turnstile tells people from bots](/blog/what-is-cloudflare-turnstile)
- [A Turnstile tutorial with Cloudflare's test keys](/blog/turnstile-test-keys)
- [All posts](/blog/)
