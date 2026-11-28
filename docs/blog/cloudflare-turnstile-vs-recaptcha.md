---
title: 'Cloudflare Turnstile vs reCAPTCHA'
titleTemplate: false
description: 'Cloudflare Turnstile vs Google reCAPTCHA: challenges, scores, token lifetime, free tiers and what the switch changes in your backend code and your tests.'
headline: 'Turnstile or reCAPTCHA: what differs for your app'
date: '2026-11-28'
keyword: 'cloudflare turnstile vs recaptcha'
faq:
  [
    {
      'q': 'Is Cloudflare Turnstile better than reCAPTCHA?',
      'a': 'Turnstile has no image puzzles on its free plan and no cap on challenges. reCAPTCHA v3 gives a score that some apps rely on. If you need the score, Turnstile is not a direct replacement.',
    },
    {
      'q': 'Can Turnstile replace reCAPTCHA v3?',
      'a': 'Only if you treat the v3 score as a single pass or fail threshold. Turnstile returns valid or invalid, with no score.',
    },
    {
      'q': 'Do I need to change my backend when switching to Turnstile?',
      'a': 'Yes: the siteverify URL, the token field name and the result fields change. With NestJS, the migration guide maps each @nestlab/google-recaptcha option.',
    },
  ]
---

# Turnstile or reCAPTCHA: what differs for your app

<p class="post-meta">By <a href="https://halit.org">Halit Sever</a> · <time datetime="2026-11-28">28 November 2026</time></p>

<p class="lead">Turnstile and reCAPTCHA solve the same problem with the same token-and-siteverify design. The differences that matter in practice are the score, the free tier and a handful of fields on the server. This post compares them; the step-by-step move of a NestJS app is on the migration page.</p>

## Side by side

|                      | reCAPTCHA                                                     | Cloudflare Turnstile                                                                 |
| -------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Visitor experience   | v2: checkbox, sometimes image challenges. v3: nothing visible | Background challenge; a checkbox only when Managed mode needs one                    |
| Result               | v3 returns a score from 0.0 to 1.0                            | Valid or not; no score                                                               |
| Token lifetime       | Two minutes, verified once                                    | 300 seconds, verified once                                                           |
| Siteverify           | `https://www.google.com/recaptcha/api/siteverify`             | `https://challenges.cloudflare.com/turnstile/v0/siteverify`, POST only, form or JSON |
| Fields you can check | `hostname`; v3 adds `action` and `score`                      | `hostname`, `action`, `cdata`                                                        |
| Free tier            | Essentials: up to 10,000 assessments a month per organization | Up to 20 widgets, no cap on challenges                                               |
| Test keys            | Published by Google                                           | Five site keys and three secret keys                                                 |

Turnstile's free plan limits are broken down in [Turnstile pricing](/blog/cloudflare-turnstile-pricing).

Sources, as of November 2026: [reCAPTCHA v3](https://developers.google.com/recaptcha/docs/v3), [reCAPTCHA verify](https://developers.google.com/recaptcha/docs/verify), [reCAPTCHA tiers](https://docs.cloud.google.com/recaptcha/docs/compare-tiers), [Turnstile validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/), [Turnstile plans](https://developers.cloudflare.com/turnstile/plans/).

## The score is the real difference

reCAPTCHA v3 does not decide for you. It returns a number, and Google suggests 0.5 as a default threshold. Apps often build rules around it: a low score asks for a second factor, a very low one blocks. Turnstile has no equivalent. Cloudflare either accepts the token or does not, and the decision of how hard to challenge happens inside the widget.

So the switch is easy for apps that use reCAPTCHA v2 or treat the v3 score as pass or fail at one threshold. Apps that branch on several score ranges need a different signal for the grey zone, such as rate limits. Turnstile's Enterprise plan adds an [Ephemeral ID](/advanced#ephemeral-ids), a short-lived device ID that suits rate limits.

## Front-end differences

- Field name: `g-recaptcha-response` becomes `cf-turnstile-response`.
- Script: Turnstile loads from `challenges.cloudflare.com`. Cloudflare asks you not to proxy or cache it.
- Compatibility: `api.js?compat=recaptcha` registers Turnstile as `grecaptcha` for code written against reCAPTCHA v2. Cloudflare says migration "is currently compatible up to reCAPTCHA v2" ([migration docs](https://developers.cloudflare.com/turnstile/migration/recaptcha/)).
- Labels: reCAPTCHA v3 actions allow letters, digits, slashes and underscores. Turnstile's `data-action` allows up to 32 letters, digits, `_` and `-`, so an action with a slash must be renamed.

## Back-end differences

- Turnstile's siteverify accepts only POST, while reCAPTCHA's also takes GET with query parameters.
- Turnstile accepts an `idempotency_key`, so a retry after a network error is not mistaken for a reused token.
- Turnstile returns `cdata`, a value up to 255 characters you set on the widget, which you can use to bind a token to a session.

## In a NestJS app

With `@nestlab/google-recaptcha` and nest-cloudflare-turnstile the shape stays the same: a module with `forRoot`, a guard decorator, a result decorator. `score` has no counterpart, and the action list moves to `expectedAction`. The [migration guide](/from-google-recaptcha) has the full mapping of options, decorators and error codes, so it is not repeated here.

Tests change too. Turnstile's test keys skip the real challenge, and the module ships `createTurnstileServiceStub` for unit tests. See [testing with test keys](/blog/turnstile-test-keys) or try the keys on the [live demo](/demo/).

## FAQ

### Is Cloudflare Turnstile better than reCAPTCHA?

Turnstile has no image puzzles on its free plan and no cap on challenges. reCAPTCHA v3 gives a score that some apps rely on. If you need the score, Turnstile is not a direct replacement.

### Can Turnstile replace reCAPTCHA v3?

Only if you treat the v3 score as a single pass or fail threshold. Turnstile returns valid or invalid, with no score.

### Do I need to change my backend when switching to Turnstile?

Yes: the siteverify URL, the token field name and the result fields change. With NestJS, the migration guide maps each @nestlab/google-recaptcha option.

## Related posts

- [hCaptcha, reCAPTCHA and Turnstile compared](/blog/hcaptcha-vs-recaptcha-vs-turnstile)
- [reCAPTCHA alternatives worth a look](/blog/recaptcha-alternatives)
- [Captcha checks belong on the server](/blog/verify-captcha-server-side)
- [All posts](/blog/)
