---
title: 'Verifying You Are Human: Cloudflare Checks Explained'
titleTemplate: false
description: 'What Cloudflare does while a page says verifying you are human, why it may think you are a bot, what causes a verification loop and what site owners can change.'
headline: 'What happens while Cloudflare is verifying you are human'
date: '2026-11-28'
keyword: 'verifying you are human. this may take a few seconds.'
faq:
  [
    {
      'q': 'Why does Cloudflare keep saying verifying you are human?',
      'a': 'The site has a rule that challenges your request, for example because of your IP address reputation, a high threat score or a bot detection. If the check never finishes, an extension, disabled JavaScript or cookies, or an outdated browser is the usual cause.',
    },
    {
      'q': 'How long does Cloudflare human verification take?',
      'a': 'Cloudflare says a non-interactive challenge typically takes less than five seconds. A managed challenge passes most visitors without a click and only asks for one when signals look automated.',
    },
    {
      'q': 'Why does Cloudflare think I am a bot?',
      'a': "Cloudflare's docs list a high threat score for your IP, poor IP reputation (common on shared VPNs and corporate proxies), bot detection, the site's own firewall rules and the Browser Integrity Check.",
    },
  ]
---

# What happens while Cloudflare is verifying you are human

<p class="post-meta">By <a href="https://halit.org">Halit Sever</a> · <time datetime="2026-11-28">28 November 2026</time></p>

<p class="lead">"Verifying you are human. This may take a few seconds." is the line many people know from Cloudflare's challenge page, the screen that appears before a site loads. It is not the site being slow: Cloudflare has paused your request and is running checks in your browser. Here is what those checks are, why you got one, and what to do when the page never moves on.</p>

## What the page is

Cloudflare calls it an [interstitial Challenge Page](https://developers.cloudflare.com/cloudflare-challenges/challenge-types/challenge-pages/). It holds the request, evaluates the browser for signs of automation and lets the request through only when the challenge passes. The wording has changed over time. A challenge page loaded in headless Chrome on 28 November 2026 read "Performing security verification" and "This website uses a security service to protect against malicious bots", with a Ray ID at the bottom.

You can see the same page without a browser. Fetched with `curl` on that day, one protected login page answered:

```text
HTTP/2 403
content-type: text/html; charset=UTF-8
cf-mitigated: challenge
server: cloudflare
```

with a body titled "Just a moment..." that says "Enable JavaScript and cookies to continue", and scripts from `/cdn-cgi/challenge-platform/` plus frames from `challenges.cloudflare.com`. Cloudflare's [supported browsers page](https://developers.cloudflare.com/cloudflare-challenges/reference/supported-browsers/) says tools such as curl and wget cannot pass, since the checks need JavaScript.

## The three kinds of challenge

A site owner picks the challenge type as the action of a firewall (WAF) rule. Bot Management and rate limiting rules can trigger it too.

| Type                                | What you see                                                                                                                          |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Non-interactive                     | Only the waiting screen while your browser runs Cloudflare's JavaScript. Cloudflare says this typically takes less than five seconds. |
| Managed (recommended by Cloudflare) | Cloudflare picks the check per request. Most visitors pass with no click and see "Successful"; some get a checkbox.                   |
| Interactive                         | Always asks you to interact.                                                                                                          |

Cloudflare's [challenge overview](https://developers.cloudflare.com/cloudflare-challenges/) says none of these use image puzzles or distorted text. Once you pass, a `cf_clearance` cookie records it, and the site does not challenge you again at that level until the clearance expires, after a period the site owner sets ([clearance](https://developers.cloudflare.com/cloudflare-challenges/concepts/clearance/)).

Turnstile, the widget this site's NestJS guard verifies, runs on the same challenge platform but inside a form instead of in front of the whole site; [what is Cloudflare Turnstile](/blog/what-is-cloudflare-turnstile) explains the difference.

## Why Cloudflare thinks you might be a bot

Cloudflare's [troubleshooting page](https://developers.cloudflare.com/cloudflare-challenges/troubleshooting/) lists the usual reasons a real person is challenged:

- **High threat score** for your IP address.
- **IP reputation**: an address with a history of suspicious activity. Cloudflare names shared VPNs and corporate proxies as common cases.
- **Bot detection** on traffic that resembles automation. On sites with Bot Management, every request gets a [bot score](/blog/cloudflare-bot-score).
- **The site's own WAF rules**, which may target regions, user agents or paths.
- **Browser Integrity Check**, which tests that the browser behaves like a standard one.

None of these mean the site has decided you are a bot. They mean it asks for proof before letting the request through.

## When it loops or never finishes

Cloudflare's [challenge solve issues page](https://developers.cloudflare.com/cloudflare-challenges/troubleshooting/challenge-solve-issues/) gives the causes of a loop: an unstable network, browser settings or extensions that block the challenge scripts, an unsupported browser, JavaScript turned off, and strong bot signals. Its steps for visitors:

1. Update the browser. Internet Explorer is not supported, and very old browsers have limited support.
2. Turn off extensions, especially ad, script and fingerprinting blockers, and reload. A private window does this quickly.
3. Make sure JavaScript and cookies are on. The clearance is a cookie, so a browser that drops cookies is challenged again on every page.
4. Try another browser or device.
5. Turn off a VPN or proxy for the test.
6. Run Cloudflare's compatibility check at `https://debug.challenges.cloudflare.com/`.

If none of that works, send the site the Ray ID from the page. Only the site owner can change why the rule fires. If the page says it cannot load the challenge at all, see [please unblock challenges.cloudflare.com](/blog/unblock-challenges-cloudflare-com).

Two things that look like errors are normal, according to the same page: a `401` on a Private Access Token request in developer tools, and failed DNS lookups for subdomains of `challenges.cloudflare.com` during a Turnstile check.

## For site owners

- Prefer **Managed Challenge** over the other types, as Cloudflare recommends.
- Challenge pages break `fetch` and XHR calls, which expect JSON and get an HTML page. Cloudflare suggests Turnstile with pre-clearance for API routes, or a Turnstile widget on the form itself with the token checked on your server. The [get started guide](/get-started) does the latter for NestJS.
- Exempt your own monitors and integrations with a WAF **Skip** rule placed before the challenge rule.
- Combining challenges with other Rules features can cause loops, per Cloudflare's caution on the challenge page docs.

## A fake version to watch for

A real Cloudflare check asks, at most, for a click. Pages that copy this screen and tell you to press Windows+R or paste a command are a malware trick; see [fake captcha scams](https://projects.halit.org/e-captcha-solver/blog/fake-captcha-scam).

## FAQ

### Why does Cloudflare keep saying verifying you are human?

The site has a rule that challenges your request, for example because of your IP address reputation, a high threat score or a bot detection. If the check never finishes, an extension, disabled JavaScript or cookies, or an outdated browser is the usual cause.

### How long does Cloudflare human verification take?

Cloudflare says a non-interactive challenge typically takes less than five seconds. A managed challenge passes most visitors without a click and only asks for one when signals look automated.

### Why does Cloudflare think I am a bot?

Cloudflare's docs list a high threat score for your IP, poor IP reputation (common on shared VPNs and corporate proxies), bot detection, the site's own firewall rules and the Browser Integrity Check.

## Related posts

- [Why a site asks you to unblock challenges.cloudflare.com](/blog/unblock-challenges-cloudflare-com)
- [How Cloudflare scores requests from bot to human](/blog/cloudflare-bot-score)
- [Bot Fight Mode, Super Bot Fight Mode and Turnstile compared](/blog/cloudflare-bot-fight-mode)
- [All posts](/blog/)
