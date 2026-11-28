---
title: 'reCAPTCHA Alternatives in 2026'
titleTemplate: false
description: 'reCAPTCHA alternatives compared: Cloudflare Turnstile, hCaptcha, ALTCHA and Friendly Captcha, how each one verifies visitors, and their free plans.'
headline: 'reCAPTCHA alternatives worth a look'
date: '2026-11-28'
keyword: 'recaptcha alternatives'
faq:
  [
    {
      'q': 'What is the best free alternative to reCAPTCHA?',
      'a': "Cloudflare Turnstile has a free plan with no cap on challenges and no image puzzles. ALTCHA's open-source widget is free and self-hosted. Which is best depends on hosting and privacy needs.",
    },
    {
      'q': 'Is there a reCAPTCHA alternative without cookies?',
      'a': "ALTCHA and Friendly Captcha both state that they set no cookies. Check each vendor's privacy terms for the details that matter to you.",
    },
    {
      'q': 'Do reCAPTCHA alternatives still need server-side verification?',
      'a': 'Yes. Every one of them hands the browser a token or solution that your server must check before it trusts the request.',
    },
  ]
---

# reCAPTCHA alternatives worth a look

<p class="post-meta">By <a href="https://halit.org">Halit Sever</a> · <time datetime="2026-11-28">28 November 2026</time></p>

<p class="lead">People look for a reCAPTCHA alternative for three reasons: image puzzles that annoy visitors, the monthly limit on Google's free tier, and privacy reviews. Four services come up most often. Each is described here from its own website and docs as of November 2026.</p>

## The four options at a glance

| Service              | How it checks the visitor                                      | Hosting                        | Free option                                     |
| -------------------- | -------------------------------------------------------------- | ------------------------------ | ----------------------------------------------- |
| Cloudflare Turnstile | Background JavaScript challenges; a checkbox only when needed  | Cloudflare                     | Up to 20 widgets, no cap on challenges          |
| hCaptcha             | Visual challenge on the free plan; passive modes on paid plans | hCaptcha                       | Free plan                                       |
| ALTCHA               | Proof-of-work in the browser                                   | Self-hosted, or ALTCHA's cloud | Open-source widget, MIT licensed                |
| Friendly Captcha     | Proof-of-work puzzle solved in the background                  | Friendly Captcha               | Free plan for non-commercial, low-traffic sites |

For reference, Google's own free tier is reCAPTCHA Essentials, with up to 10,000 assessments a month per organization ([tier comparison](https://docs.cloud.google.com/recaptcha/docs/compare-tiers)).

## Cloudflare Turnstile

Turnstile is Cloudflare's "smart CAPTCHA alternative". It collects signals with small non-interactive JavaScript challenges and avoids showing a puzzle. Widgets come in Managed, non-interactive and invisible modes, and any site can embed one without moving its DNS or traffic to Cloudflare. The free plan allows up to 20 widgets with 10 hostnames each and has no cap on challenges ([plans](https://developers.cloudflare.com/turnstile/plans/)).

Migration is short: a compatibility script, `api.js?compat=recaptcha`, registers Turnstile as `grecaptcha` and fills the `g-recaptcha-response` field, for code written against reCAPTCHA v2 ([migration docs](https://developers.cloudflare.com/turnstile/migration/recaptcha/)). On the server you change the siteverify URL. Turnstile has no score, so code that reads reCAPTCHA v3 scores needs a rethink.

## hCaptcha

hCaptcha says its methods are API-compatible with reCAPTCHA, and its script installs a `grecaptcha` hook by default. The free plan gives "a classic CAPTCHA experience in which most users will generally see a challenge". The Pro plan adds a passive mode in which fewer than 0.1% of legitimate users see one, and Enterprise adds a risk score ([hCaptcha Pro](https://www.hcaptcha.com/pro)). Its siteverify endpoint takes a URL-encoded form POST, not JSON ([docs](https://docs.hcaptcha.com/)).

## ALTCHA

ALTCHA replaces the visual challenge with a silent proof-of-work: the browser spends a little CPU time solving a puzzle that is cheap for one visitor and costly for a bot sending thousands of requests. The open-source widget is MIT licensed and free, and you verify solutions on your own server with one of its libraries (JavaScript, Python, Go, Java, PHP and more). ALTCHA also sells a hosted cloud service and a self-hosted platform called Sentinel ([altcha.org](https://altcha.org/)). The site says ALTCHA sets no cookies and does no fingerprinting.

## Friendly Captcha

Friendly Captcha is a German company. It generates a unique crypto puzzle for each device, which is solved in the background, usually within a few seconds. It states it does not track users and sets no cookies. A free plan covers one domain and up to 1,000 requests a month for non-commercial, low-traffic sites; paid plans raise the limits ([friendlycaptcha.com](https://friendlycaptcha.com/)).

## How to choose

- **No puzzles, no bill, a large site:** Turnstile's free plan has no challenge cap.
- **Smallest code change from reCAPTCHA v2:** hCaptcha or Turnstile in compatibility mode.
- **Nothing leaves your own servers:** ALTCHA's self-hosted widget and server library.
- **EU-based vendor:** Friendly Captcha, or ALTCHA's EU-hosted cloud.

Proof-of-work services and Turnstile all still need a server-side check. A widget in the browser proves nothing until your backend has verified its token or solution, as the post on [server-side verification](/blog/verify-captcha-server-side) explains.

## Using Turnstile from NestJS

If you pick Turnstile and your API is NestJS, nest-cloudflare-turnstile verifies the token in a guard: `@TurnstileCaptcha()` on a route, the secret key in `TurnstileModule.forRoot()`. Start with the [get started guide](/get-started), try the widget on the [live demo](/demo/), or move an existing reCAPTCHA setup with the [migration guide](/from-google-recaptcha).

## FAQ

### What is the best free alternative to reCAPTCHA?

Cloudflare Turnstile has a free plan with no cap on challenges and no image puzzles. ALTCHA's open-source widget is free and self-hosted. Which is best depends on hosting and privacy needs.

### Is there a reCAPTCHA alternative without cookies?

ALTCHA and Friendly Captcha both state that they set no cookies. Check each vendor's privacy terms for the details that matter to you.

### Do reCAPTCHA alternatives still need server-side verification?

Yes. Every one of them hands the browser a token or solution that your server must check before it trusts the request.

## Related posts

- [hCaptcha, reCAPTCHA and Turnstile compared](/blog/hcaptcha-vs-recaptcha-vs-turnstile)
- [Turnstile or reCAPTCHA: what differs for your app](/blog/cloudflare-turnstile-vs-recaptcha)
- [Captcha checks belong on the server](/blog/verify-captcha-server-side)
- [All posts](/blog/)
