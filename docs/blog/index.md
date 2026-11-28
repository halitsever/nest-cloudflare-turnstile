---
title: 'Turnstile and Captcha Guides for NestJS Developers'
titleTemplate: false
description: 'Guides to Cloudflare Turnstile and its bot checks: token verification, error codes, challenge pages, bot scores, pricing and how it compares to reCAPTCHA.'
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

## [Why a site asks you to unblock challenges.cloudflare.com, and how to fix it](/blog/unblock-challenges-cloudflare-com)

Why a site says please unblock challenges.cloudflare.com to proceed: what the domain does, what blocks it, how to check it, and the fix for site owners.

## [What happens while Cloudflare is verifying you are human](/blog/verifying-you-are-human)

What Cloudflare does while a page says verifying you are human, why it may think you are a bot, what causes a verification loop and what site owners can change.

## [The \_\_cf_bm cookie: what Cloudflare stores and for how long](/blog/cf-bm-cookie)

The __cf_bm cookie comes from Cloudflare Bot Management and Bot Fight Mode: what it holds, why it expires after 30 minutes, and whether it tracks you.

## [How much Cloudflare Turnstile costs, and what Enterprise adds](/blog/cloudflare-turnstile-pricing)

Cloudflare Turnstile pricing: the free plan has no cap on challenges, 20 widgets and 10 hostnames per widget. What Enterprise adds and which limits matter.

## [Bot Fight Mode, Super Bot Fight Mode and Turnstile compared](/blog/cloudflare-bot-fight-mode)

What Cloudflare Bot Fight Mode does, why it can block your own API and webhooks, how Super Bot Fight Mode differs, and when Turnstile on a form fits better.

## [How Cloudflare scores requests from bot to human](/blog/cloudflare-bot-score)

How Cloudflare Bot Management scores each request from 1 (bot) to 99 (human), the score groups, the engines behind it, a WAF rule using it and Turnstile's role.
