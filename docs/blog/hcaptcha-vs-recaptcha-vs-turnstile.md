---
title: 'hCaptcha vs reCAPTCHA vs Cloudflare Turnstile'
titleTemplate: false
description: 'hCaptcha vs reCAPTCHA vs Cloudflare Turnstile: how each widget works, token lifetime, siteverify requests, free tiers and what changes on your server.'
headline: 'hCaptcha, reCAPTCHA and Turnstile compared'
date: '2026-11-28'
keyword: 'hcaptcha vs recaptcha'
faq:
  [
    {
      'q': 'Is hCaptcha better than reCAPTCHA?',
      'a': 'It depends on what you need. hCaptcha is API-compatible with reCAPTCHA v2 and easy to swap in, while reCAPTCHA v3 gives a score without any challenge. Compare the free plans and the challenge your visitors would see.',
    },
    {
      'q': 'Does Cloudflare Turnstile return a score like reCAPTCHA v3?',
      'a': "No. Turnstile's siteverify answer says whether the token is valid, with the hostname, action and cdata. There is no score to compare against a threshold.",
    },
    {
      'q': 'Can I verify hCaptcha or reCAPTCHA tokens with nest-cloudflare-turnstile?',
      'a': "No. The guard only talks to Cloudflare's siteverify endpoint, so it verifies Turnstile tokens.",
    },
  ]
---

# hCaptcha, reCAPTCHA and Turnstile compared

<p class="post-meta">By <a href="https://halit.org">Halit Sever</a> · <time datetime="2026-11-28">28 November 2026</time></p>

<p class="lead">All three follow the same pattern: a widget in the browser produces a token, and your server sends that token with a secret key to the vendor's siteverify endpoint. The differences are in how the visitor is challenged, how long a token lives, what the answer contains and what the free plan covers.</p>

## The short version

|                      | Google reCAPTCHA                                              | hCaptcha                                                      | Cloudflare Turnstile                                                           |
| -------------------- | ------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Widget types         | v2 checkbox, v2 invisible, v3 score                           | Checkbox by default; passive modes on Enterprise              | Managed, non-interactive, invisible                                            |
| What the server gets | `success`; v3 adds a `score` from 0.0 to 1.0                  | `success`; a risk score on Enterprise                         | `success`, plus `action` and `cdata` you set on the widget                     |
| Token lifetime       | Two minutes, verified once                                    | Verified once, 120 seconds by default                         | 300 seconds, verified once                                                     |
| Siteverify request   | `POST https://www.google.com/recaptcha/api/siteverify`        | `POST https://api.hcaptcha.com/siteverify`, form-encoded only | `POST https://challenges.cloudflare.com/turnstile/v0/siteverify`, form or JSON |
| Browser field        | `g-recaptcha-response`                                        | `h-captcha-response`                                          | `cf-turnstile-response`                                                        |
| Free plan            | Essentials: up to 10,000 assessments a month per organization | Free plan with a classic challenge most visitors see          | Up to 20 widgets, no cap on challenges                                         |

The figures come from each vendor's documentation and pricing page as of November 2026: [reCAPTCHA v3](https://developers.google.com/recaptcha/docs/v3), [reCAPTCHA verify](https://developers.google.com/recaptcha/docs/verify), [reCAPTCHA tiers](https://docs.cloud.google.com/recaptcha/docs/compare-tiers), [hCaptcha docs](https://docs.hcaptcha.com/), [hCaptcha Pro](https://www.hcaptcha.com/pro), [Turnstile server-side validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/) and [Turnstile plans](https://developers.cloudflare.com/turnstile/plans/). Prices and limits change, so check those pages before you choose.

## How each one challenges a visitor

**reCAPTCHA** comes in two families. Version 2 is the "I'm not a robot" checkbox, or an invisible badge that only prompts the most suspicious traffic. Version 3 never shows a challenge: it returns a score, where 1.0 is very likely a person and 0.0 very likely a bot, and Google suggests 0.5 as a starting threshold. Your server decides what to do with the score.

**hCaptcha** is API-compatible with reCAPTCHA, which is its main selling point for a switch. By default its script installs a `window.grecaptcha` hook (`recaptchacompat`, on by default), so existing reCAPTCHA v2 code often needs only new keys and a new script URL. On the free plan most visitors see a challenge; the Pro plan's "99.9% Passive" mode and the Enterprise "No-CAPTCHA" modes cut that down.

**Turnstile** does not show image puzzles. Cloudflare runs small JavaScript challenges in the background (proof-of-work, proof-of-space, browser API probing) and adapts the difficulty per visitor. In Managed mode a checkbox appears only when the risk is higher; non-interactive widgets never ask for a click; invisible widgets are hidden entirely. It works on any site, whether or not its traffic goes through Cloudflare.

## What your server does with the token

The server side is nearly the same for all three: post the token and the secret, then read `success`. The details differ:

- **Answer format.** reCAPTCHA v3 gives a score you must compare against a threshold. Turnstile and hCaptcha (outside Enterprise) give a plain yes or no, so there is no threshold to tune.
- **Request body.** hCaptcha's siteverify expects a URL-encoded form and says not to send JSON. Turnstile accepts form data or JSON. reCAPTCHA documents a POST with form parameters.
- **Labels you can check.** Turnstile returns the `action` and `cdata` set on the widget, and the `hostname` where it was solved. reCAPTCHA returns `hostname`, and v3 also returns `action`.
- **Retries.** Turnstile accepts an `idempotency_key`, so a retried request after a network error is treated as the same check instead of a reused token.

In nest-cloudflare-turnstile those checks live in one guard. It posts JSON to siteverify, compares `hostname` with `expectedHostname` and `action` with the route's action, and retries once with the same idempotency key when the call fails on the network or Cloudflare reports `internal-error`. The [options reference](/turnstile-options) lists each setting.

## Privacy and accessibility

Cloudflare states that Turnstile "does not access, store, or transmit user communications, form entries, or other page inputs", and that the widget meets WCAG 2.2 AA. hCaptcha and Google publish their own privacy terms; read them against your own legal requirements rather than a comparison table, because the obligations depend on where your visitors are.

## Which one fits a NestJS app

- If you already run reCAPTCHA v3 and rely on the score in business rules, moving means dropping the score. Turnstile has none.
- If you want a drop-in swap of reCAPTCHA v2 widgets, both hCaptcha and Turnstile have compatibility modes. Turnstile's (`?compat=recaptcha`) works up to reCAPTCHA v2.
- If you want no visible puzzle on the free plan, Turnstile is the one of the three that offers it.

For a Turnstile backend in NestJS, the [get started guide](/get-started) takes about four steps, and the [migration guide](/from-google-recaptcha) maps every `@nestlab/google-recaptcha` option to its Turnstile name.

## FAQ

### Is hCaptcha better than reCAPTCHA?

It depends on what you need. hCaptcha is API-compatible with reCAPTCHA v2 and easy to swap in, while reCAPTCHA v3 gives a score without any challenge. Compare the free plans and the challenge your visitors would see.

### Does Cloudflare Turnstile return a score like reCAPTCHA v3?

No. Turnstile's siteverify answer says whether the token is valid, with the hostname, action and cdata. There is no score to compare against a threshold.

### Can I verify hCaptcha or reCAPTCHA tokens with nest-cloudflare-turnstile?

No. The guard only talks to Cloudflare's siteverify endpoint, so it verifies Turnstile tokens.

## Related posts

- [reCAPTCHA alternatives worth a look](/blog/recaptcha-alternatives)
- [How Cloudflare Turnstile tells people from bots](/blog/what-is-cloudflare-turnstile)
- [Turnstile or reCAPTCHA: what differs for your app](/blog/cloudflare-turnstile-vs-recaptcha)
- [All posts](/blog/)
