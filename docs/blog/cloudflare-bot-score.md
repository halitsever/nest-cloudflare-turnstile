---
title: 'Cloudflare Bot Score: What 1 to 99 Means'
titleTemplate: false
description: "How Cloudflare Bot Management scores each request from 1 (bot) to 99 (human), the score groups, the engines behind it, a WAF rule using it and Turnstile's role."
headline: 'How Cloudflare scores requests from bot to human'
date: '2026-11-28'
keyword: 'cloudflare bot score'
faq:
  [
    {
      'q': 'What is a good Cloudflare bot score?',
      'a': 'Higher means more likely human. Cloudflare groups 30 to 99 as likely human, 2 to 29 as likely automated and 1 as automated. Bot Management notes that scores below 30 are commonly associated with bot traffic.',
    },
    {
      'q': 'Can I see bot scores on the free plan?',
      'a': 'No. Granular scores are only available to Enterprise customers with Bot Management. Pro and higher plans see traffic in score groups under Security, Bots. The free plan has Bot Fight Mode, which acts on its own without exposing a score.',
    },
    {
      'q': 'What does a bot score of 0 mean?',
      'a': 'Not computed. Bot Management did not evaluate the request, for example because another feature such as a Redirect Rule handled it first. It does not mean the request is human or safe.',
    },
  ]
---

# How Cloudflare scores requests from bot to human

<p class="post-meta">By <a href="https://halit.org">Halit Sever</a> · <time datetime="2026-11-28">28 November 2026</time></p>

<p class="lead">Cloudflare Bot Management gives every request a number from 1 to 99: 1 means Cloudflare is quite sure a bot sent it, 99 that a person did. The score does nothing by itself; site owners write rules that act on it. Here is how the score is made, how to use it, and how it differs from the yes-or-no answer a Turnstile check gives.</p>

## The scale and the groups

From Cloudflare's [bot score docs](https://developers.cloudflare.com/bots/concepts/bot-score/):

| Group            | Score                                                 |
| ---------------- | ----------------------------------------------------- |
| Not computed     | 0                                                     |
| Automated        | 1                                                     |
| Likely automated | 2 to 29                                               |
| Likely human     | 30 to 99                                              |
| Verified bot     | Known good automation, such as search engine crawlers |

The [Bot Management page](https://developers.cloudflare.com/bots/get-started/bot-management/) adds that scores below 30 are commonly associated with bot traffic. A score of 0 only means the request was not scored, for instance because a Redirect Rule answered it before Bot Management ran.

## Who can see it

- **Enterprise with the Bot Management add-on:** the exact score on every request, in WAF custom rules as `cf.bot_management.score`, in Workers, in Bot Analytics and in logs.
- **Pro and higher:** traffic split into the groups above under **Security**, **Bots**, without per-request scores.
- **Free:** [Bot Fight Mode](/blog/cloudflare-bot-fight-mode), which uses the same detection technology but acts on its own.

## How the score is made

Cloudflare lists several detection engines for Enterprise Bot Management:

- **Heuristics** match every request against a database of known malicious fingerprints and give high-confidence detections a 1. A missing or empty `User-Agent` header gets a 1 straight away, which Cloudflare notes as a common false positive behind corporate proxies that strip the header.
- **Machine learning** ("Adaptive Intelligence") produces most scores from 2 to 99, trained on request features such as headers, session characteristics and browser signals from across Cloudflare's network. It retrains often, so Cloudflare asks you to review score-based rules from time to time.
- **JavaScript detections** catch headless browsers and other automation tools with a small injected script.
- **Anomaly detection** compares traffic with a baseline for your site. Cloudflare is deprecating it and no longer onboards new customers.

The [`__cf_bm` cookie](/blog/cf-bm-cookie) ties a visitor's requests together, so the score reflects a session's pattern rather than one request in isolation.

## Acting on the score

Bot Management does not block or challenge anything until you write a rule. Cloudflare's "Definite Bots" template is:

```txt
(cf.bot_management.score eq 1 and not cf.bot_management.verified_bot and not cf.bot_management.static_resource)
```

A typical next step is a Managed Challenge for low scores on the paths that matter, for example `http.request.uri.path eq "/login" and cf.bot_management.score lt 30`, and nothing on a public blog. Cloudflare's docs use exactly that contrast. What the visitor sees then is a [challenge page](/blog/verifying-you-are-human).

## Bot score vs a Turnstile result

|                        | Bot score                                | Turnstile                                                           |
| ---------------------- | ---------------------------------------- | ------------------------------------------------------------------- |
| Output                 | A number from 1 to 99 per request        | A token your server checks: `success` true or false                 |
| Where it applies       | Every request through Cloudflare's proxy | The forms or calls that carry a token                               |
| Plan                   | Enterprise add-on                        | Free plan available ([pricing](/blog/cloudflare-turnstile-pricing)) |
| Needs Cloudflare proxy | Yes                                      | No                                                                  |
| Decision               | Your WAF rule at the edge                | Your backend, after siteverify                                      |

reCAPTCHA v3 gives a score too, from 0.0 to 1.0, which some apps branch on. Turnstile does not; if you migrate from reCAPTCHA and used several score ranges, [Turnstile vs reCAPTCHA](/blog/cloudflare-turnstile-vs-recaptcha) covers what to use instead. On Enterprise, Turnstile's siteverify answer can include an Ephemeral ID for rate limits, and this site's guard exposes it as `result.metadata.ephemeral_id` ([advanced usage](/advanced#ephemeral-ids)).

## When your own traffic scores low

- **Monitoring and API clients** send no browser signals. Exempt them with a WAF Skip rule before your bot rules, or check `cf.bot_management.verified_bot` for known services.
- **Corporate proxies** that strip `User-Agent` score 1. Cloudflare suggests `cf.bot_management.corporate_proxy` or an IP allowlist.

## FAQ

### What is a good Cloudflare bot score?

Higher means more likely human. Cloudflare groups 30 to 99 as likely human, 2 to 29 as likely automated and 1 as automated. Bot Management notes that scores below 30 are commonly associated with bot traffic.

### Can I see bot scores on the free plan?

No. Granular scores are only available to Enterprise customers with Bot Management. Pro and higher plans see traffic in score groups under Security, Bots. The free plan has Bot Fight Mode, which acts on its own without exposing a score.

### What does a bot score of 0 mean?

Not computed. Bot Management did not evaluate the request, for example because another feature such as a Redirect Rule handled it first. It does not mean the request is human or safe.

## Related posts

- [Bot Fight Mode, Super Bot Fight Mode and Turnstile compared](/blog/cloudflare-bot-fight-mode)
- [The \_\_cf_bm cookie: what Cloudflare stores and for how long](/blog/cf-bm-cookie)
- [What happens while Cloudflare is verifying you are human](/blog/verifying-you-are-human)
- [All posts](/blog/)
