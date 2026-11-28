---
title: 'What Is Cloudflare Turnstile and How Does It Work?'
titleTemplate: false
description: 'What Cloudflare Turnstile is, how its widget turns a background challenge into a token, and how your server verifies that token with the siteverify API.'
headline: 'How Cloudflare Turnstile tells people from bots'
date: '2026-11-28'
keyword: 'what is cloudflare turnstile'
faq:
  [
    {
      'q': 'Is Cloudflare Turnstile free?',
      'a': 'Yes. The free plan allows up to 20 widgets per account, 10 hostnames per widget and has no cap on challenges. Enterprise adds more widgets and hostnames, longer analytics and Ephemeral IDs.',
    },
    {
      'q': "Do I need to use Cloudflare's CDN to use Turnstile?",
      'a': 'No. Cloudflare says Turnstile can be embedded into any website without sending traffic through Cloudflare.',
    },
    {
      'q': 'How long is a Turnstile token valid?',
      'a': '300 seconds from when it was generated, and it can be verified only once. An expired or reused token comes back with timeout-or-duplicate.',
    },
  ]
---

# How Cloudflare Turnstile tells people from bots

<p class="post-meta">By <a href="https://halit.org">Halit Sever</a> · <time datetime="2026-11-28">28 November 2026</time></p>

<p class="lead">Cloudflare Turnstile is a captcha replacement. Instead of asking visitors to pick traffic lights, it runs small challenges in the browser and hands your page a token. Your server then asks Cloudflare whether that token is real. Both halves are needed.</p>

## What Turnstile is

Cloudflare calls Turnstile its "smart CAPTCHA alternative". The widget runs non-interactive JavaScript challenges that gather signals about the browser and its environment: proof-of-work, proof-of-space, probing of web APIs, and checks for browser quirks and human behaviour. Cloudflare tunes the difficulty per request so that visitors do not get a visual puzzle ([Turnstile overview](https://developers.cloudflare.com/turnstile/)).

Turnstile is separate from Cloudflare's CDN. Any website can embed the widget, whether or not its traffic runs through Cloudflare. The free plan allows up to 20 widgets with no cap on challenges ([plans](https://developers.cloudflare.com/turnstile/plans/)).

## The three widget modes

| Mode                  | What the visitor sees                                            |
| --------------------- | ---------------------------------------------------------------- |
| Managed (recommended) | A widget that shows a checkbox only when the visitor looks risky |
| Non-interactive       | A visible widget that never asks for a click                     |
| Invisible             | Nothing at all                                                   |

You pick the mode when you create the widget in the Cloudflare dashboard. Size, theme and when the widget appears are set in the page, as the post on [widget options](/blog/turnstile-widget-options) shows.

## How a token is made and checked

1. **The page loads the script** from `https://challenges.cloudflare.com/turnstile/v0/api.js` and renders a widget with your public site key.
2. **The widget runs its challenge.** When it passes, it calls your `callback` with a token and, inside a form, puts the token in a hidden `cf-turnstile-response` field.
3. **The browser sends the token** to your server with the form or in a request header.
4. **Your server calls siteverify.** It posts the token and its secret key to `https://challenges.cloudflare.com/turnstile/v0/siteverify`.
5. **Cloudflare answers** with `success`, the `hostname` where the challenge was solved, the `action` and `cdata` you set on the widget, a `challenge_ts` timestamp and `error-codes` when it failed.
6. **Your server acts on the answer**: run the handler, or reject the request.

A token is valid for 300 seconds and can be verified once. Cloudflare caps tokens at 2,048 characters ([server-side validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)).

## Why step 4 is not optional

Cloudflare's own docs say it plainly: "The client-side widget alone does not protect your forms", and "Tokens can be forged". A bot can skip the widget and post whatever it likes in `cf-turnstile-response`. Only the siteverify call, made with the secret key that never leaves your server, tells you whether the token came from a solved challenge. More on this in [why captchas must be verified on the server](/blog/verify-captcha-server-side).

## What the NestJS guard adds

nest-cloudflare-turnstile does steps 4 to 6 inside a NestJS guard. Put `@TurnstileCaptcha()` on a route and the guard:

- reads the token from the `cf-turnstile-response` body field or header,
- rejects a missing token, or one longer than 2,048 characters, without calling Cloudflare,
- posts it to siteverify with a five-second timeout, retrying once with the same idempotency key on a network error or `internal-error`,
- checks `hostname` against `expectedHostname` and `action` against the route's action,
- answers 400 for a bad token and 500 for a broken setup, and never puts the secret key in an error.

A longer walkthrough of wiring this into an app is on halit.org: [Cloudflare Turnstile in NestJS](https://www.halit.org/posts/cloudflare-turnstile-nestjs). On this site, the [get started guide](/get-started) covers install and the first protected route, and the [live demo](/demo/) shows the widget with Cloudflare's test keys.

## FAQ

### Is Cloudflare Turnstile free?

Yes. The free plan allows up to 20 widgets per account, 10 hostnames per widget and has no cap on challenges. Enterprise adds more widgets and hostnames, longer analytics and Ephemeral IDs.

### Do I need to use Cloudflare's CDN to use Turnstile?

No. Cloudflare says Turnstile can be embedded into any website without sending traffic through Cloudflare.

### How long is a Turnstile token valid?

300 seconds from when it was generated, and it can be verified only once. An expired or reused token comes back with timeout-or-duplicate.

## Related posts

- [hCaptcha, reCAPTCHA and Turnstile compared](/blog/hcaptcha-vs-recaptcha-vs-turnstile)
- [Setting up the Turnstile widget in the page](/blog/turnstile-widget-options)
- [Captcha checks belong on the server](/blog/verify-captcha-server-side)
- [All posts](/blog/)
