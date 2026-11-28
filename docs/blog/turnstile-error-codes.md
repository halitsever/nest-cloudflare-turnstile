---
title: 'Cloudflare Turnstile Error 600010 and Other Error Codes'
titleTemplate: false
description: 'What Cloudflare Turnstile error 600010 means, the other client-side codes such as 110200 and 300 errors, siteverify error codes and the fixes Cloudflare lists.'
headline: 'Turnstile error codes, from 600010 to timeout-or-duplicate'
date: '2026-11-28'
keyword: 'cloudflare turnstile error 600010'
faq:
  [
    {
      'q': 'What does Cloudflare Turnstile error 600010 mean?',
      'a': 'It is in the 600 family, which Cloudflare documents as a generic challenge failure caused by signals that look like bot behaviour. The remaining digits are internal. The visitor can retry after checking browser, extensions and VPN.',
    },
    {
      'q': 'Why does Turnstile fail in my Electron app or WebView?',
      'a': "Cloudflare's WebView guide lists the requirements: JavaScript and DOM storage on, cookies handled, access to challenges.cloudflare.com, about:blank and about:srcdoc, and a User Agent that stays the same.",
    },
    {
      'q': 'How do I fix Turnstile error 110200?',
      'a': "The page's domain is not allowed for the site key. Add the hostname under Hostname Management in the Cloudflare dashboard, or use a test key for local development.",
    },
  ]
---

# Turnstile error codes, from 600010 to timeout-or-duplicate

<p class="post-meta">By <a href="https://halit.org">Halit Sever</a> · <time datetime="2026-11-28">28 November 2026</time></p>

<p class="lead">Turnstile reports problems in two places. The widget in the browser raises numeric codes such as 600010 through its error callback. The siteverify API on your server answers with named codes such as invalid-input-response. They mean different things and have different fixes.</p>

## What 600010 means

Cloudflare documents client-side errors as families. A code that starts with 600 belongs to the `600*` family, which its [error code reference](https://developers.cloudflare.com/turnstile/troubleshooting/client-side-errors/error-codes/) describes as a "generic challenge failure": the challenge saw signals it reads as bot behaviour. Cloudflare says the digits after the family prefix "are for internal use", so 600010 has no public meaning beyond that. The same goes for the `300*` family. Both are marked as retryable. Cloudflare's always-fail test site key, `2x00000000000000000000AB`, also reports 600010 to the error callback, which you can see on the [live demo](/demo/).

People often search for 600010 together with Electron, which embeds its own Chromium. Cloudflare does not document Electron, but its [mobile WebView guide](https://developers.cloudflare.com/turnstile/get-started/mobile-implementation/) lists what an embedded browser needs: JavaScript and DOM storage enabled, cookies and local storage handled, access to `challenges.cloudflare.com`, `about:blank` and `about:srcdoc` allowed, and a User Agent that does not change during the session. It warns that "Changing the User Agent during a session causes Turnstile challenges to fail."

### Fixes for visitors

Cloudflare's list for challenge failures and loops ([challenge solve issues](https://developers.cloudflare.com/cloudflare-challenges/troubleshooting/challenge-solve-issues/)):

1. Use a supported, up-to-date browser. Turnstile supports all major browsers except Internet Explorer.
2. Turn off extensions such as ad blockers and reload.
3. Make sure JavaScript is on.
4. Try a private window, another browser or another device.
5. Turn off a VPN or proxy, or switch networks.

If it still fails, Cloudflare asks for the error code and Ray ID, a HAR file and a console log.

### Fixes for site owners

- Do not proxy or cache `api.js`. Cloudflare says this "will cause Turnstile to fail when future updates are released".
- With a Content Security Policy, allow `https://challenges.cloudflare.com` in both `script-src` and `frame-src` ([CSP reference](https://developers.cloudflare.com/turnstile/reference/content-security-policy/)).
- In an embedded browser, check the WebView requirements above.

## The other client-side codes

| Code               | Meaning                                                          | Retry |
| ------------------ | ---------------------------------------------------------------- | ----- |
| `110100`, `400020` | Invalid site key                                                 | No    |
| `110110`           | Site key not found                                               | No    |
| `110200`           | Domain not authorized: add it under Hostname Management          | No    |
| `110600`           | Challenge timed out, often a wrong visitor clock                 | Yes   |
| `110620`           | Interaction timed out: reset the widget with `turnstile.reset()` | Yes   |
| `200100`           | Visitor clock is wrong, or something cached the challenge        | No    |
| `200500`           | The iframe did not load: is `challenges.cloudflare.com` blocked? | Yes   |
| `300*`, `600*`     | Generic challenge failure                                        | Yes   |
| `400021`           | Site key region does not match the script's domain               | No    |
| `400070`           | Site key disabled                                                | No    |

A `401` response on a Private Access Token request is expected when the device does not support those tokens, and can be ignored if the widget still returns a token.

When an ad blocker, a DNS filter or a Content Security Policy blocks `challenges.cloudflare.com`, the error depends on what fails: see [please unblock challenges.cloudflare.com](/blog/unblock-challenges-cloudflare-com) for a test with each case.

Codes that start with 110 or 400 are your setup, not the visitor. `110200` is the common one during development: production site keys do not allow `localhost` unless you add it. Cloudflare's [test keys](/blog/turnstile-test-keys) work on any domain, including `localhost`.

## "Cloudflare Turnstile loop"

A loop, where the challenge keeps coming back without being solved, is how the widget behaves when Cloudflare detects strong bot signals. The visitor-side fixes above apply. Setting `retry` to `never` on the widget stops automatic retries, so your page can show its own message from the error callback instead ([widget options](/blog/turnstile-widget-options)).

## Server-side codes from siteverify

These come back in `error-codes` when your server verifies a token:

| Code                     | Meaning                                           |
| ------------------------ | ------------------------------------------------- |
| `missing-input-secret`   | No secret key sent                                |
| `invalid-input-secret`   | Secret key invalid or expired                     |
| `missing-input-response` | No token sent                                     |
| `invalid-input-response` | Token invalid, malformed or expired               |
| `bad-request`            | The request was malformed                         |
| `timeout-or-duplicate`   | Token older than 300 seconds, or already verified |
| `internal-error`         | Error inside Cloudflare                           |

nest-cloudflare-turnstile sorts them: visitor problems become a 400, and secret, request and Cloudflare problems become a 500 that reaches your `onError` hook, with the secret key kept out of the message. It also adds `hostname-mismatch`, `action-mismatch` and `validate-result-failed` for its own checks. The [error handling page](/error-handling) lists every response and shows how to replace them with your own exceptions.

## FAQ

### What does Cloudflare Turnstile error 600010 mean?

It is in the 600 family, which Cloudflare documents as a generic challenge failure caused by signals that look like bot behaviour. The remaining digits are internal. The visitor can retry after checking browser, extensions and VPN.

### Why does Turnstile fail in my Electron app or WebView?

Cloudflare's WebView guide lists the requirements: JavaScript and DOM storage on, cookies handled, access to challenges.cloudflare.com, about:blank and about:srcdoc, and a User Agent that stays the same.

### How do I fix Turnstile error 110200?

The page's domain is not allowed for the site key. Add the hostname under Hostname Management in the Cloudflare dashboard, or use a test key for local development.

## Related posts

- [How Cloudflare Turnstile tells people from bots](/blog/what-is-cloudflare-turnstile)
- [Setting up the Turnstile widget in the page](/blog/turnstile-widget-options)
- [A Turnstile tutorial with Cloudflare's test keys](/blog/turnstile-test-keys)
- [All posts](/blog/)
