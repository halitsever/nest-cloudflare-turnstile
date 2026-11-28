---
title: 'Turnstile and Captcha Guides for NestJS Developers'
titleTemplate: false
description: 'Guides to Cloudflare Turnstile and captcha providers: how tokens are verified, error codes, widget options, test keys and how Turnstile compares to reCAPTCHA.'
---

# Captcha and Turnstile guides

<p class="lead">Notes on bot protection for web forms and APIs, written from Cloudflare's, Google's and hCaptcha's own documentation and from the source of nest-cloudflare-turnstile, the NestJS guard this site documents.</p>

## [hCaptcha, reCAPTCHA and Turnstile compared](/blog/hcaptcha-vs-recaptcha-vs-turnstile)

hCaptcha vs reCAPTCHA vs Cloudflare Turnstile: how each widget works, token lifetime, siteverify requests, free tiers and what changes on your server.

## [reCAPTCHA alternatives worth a look](/blog/recaptcha-alternatives)

reCAPTCHA alternatives compared: Cloudflare Turnstile, hCaptcha, ALTCHA and Friendly Captcha, how each one verifies visitors, and their free plans.

## [How Cloudflare Turnstile tells people from bots](/blog/what-is-cloudflare-turnstile)

What Cloudflare Turnstile is, how its widget turns a background challenge into a token, and how your server verifies that token with the siteverify API.

## [Turnstile error codes, from 600010 to timeout-or-duplicate](/blog/turnstile-error-codes)

What Cloudflare Turnstile error 600010 means, the other client-side codes such as 110200 and 300 errors, siteverify error codes and the fixes Cloudflare lists.

## [Turnstile or reCAPTCHA: what differs for your app](/blog/cloudflare-turnstile-vs-recaptcha)

Cloudflare Turnstile vs Google reCAPTCHA: challenges, scores, token lifetime, free tiers and what the switch changes in your backend code and your tests.

## [Setting up the Turnstile widget in the page](/blog/turnstile-widget-options)

Every Cloudflare Turnstile widget option: size, theme, appearance, execution, language, retry, action and cdata, with data attributes and render() names.

## [A Turnstile tutorial with Cloudflare's test keys](/blog/turnstile-test-keys)

Use Cloudflare Turnstile test keys to build and test a form locally: site keys that pass, fail or force a challenge, test secrets and the NestJS test stub.

## [Captcha checks belong on the server](/blog/verify-captcha-server-side)

Why a captcha widget alone protects nothing, what a server-side check must verify, and how a NestJS guard verifies Turnstile tokens on every request.
