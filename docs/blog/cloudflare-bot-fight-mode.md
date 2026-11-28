---
title: 'Cloudflare Bot Fight Mode: What It Does and Limits'
titleTemplate: false
description: 'What Cloudflare Bot Fight Mode does, why it can block your own API and webhooks, how Super Bot Fight Mode differs, and when Turnstile on a form fits better.'
headline: 'Bot Fight Mode, Super Bot Fight Mode and Turnstile compared'
date: '2026-11-28'
keyword: 'cloudflare bot fight mode'
faq:
  [
    {
      'q': 'What does Cloudflare Bot Fight Mode do?',
      'a': 'It identifies traffic that matches known bot patterns across the whole domain and answers it with computationally expensive challenges. It is free and has a single on and off switch.',
    },
    {
      'q': 'Can I make an exception to Bot Fight Mode?',
      'a': 'No. Cloudflare says Skip, Bypass and Allow rules have no effect on it because it runs outside the Ruleset Engine. An IP Access rule that matches first stops it. For exceptions, use Super Bot Fight Mode, which supports Skip rules.',
    },
    {
      'q': 'Should I use Bot Fight Mode or Turnstile?',
      'a': 'They do different jobs. Bot Fight Mode challenges suspected bots anywhere on a proxied domain. Turnstile checks a person at a specific form and your server verifies the token. A site with an API can use Turnstile on its forms and leave Bot Fight Mode off.',
    },
  ]
---

# Bot Fight Mode, Super Bot Fight Mode and Turnstile compared

<p class="post-meta">By <a href="https://halit.org">Halit Sever</a> · <time datetime="2026-11-28">28 November 2026</time></p>

<p class="lead">Bot Fight Mode is the free switch in Cloudflare's dashboard that challenges bot-like traffic on your whole domain. It is easy to turn on and hard to tune, and it is a common reason why an app's own API clients, webhooks or mobile app start failing after a site moves behind Cloudflare. This post sets out what it does, what its paid sibling adds, and where a Turnstile widget fits instead.</p>

## What Bot Fight Mode does

Cloudflare's [Bot Fight Mode page](https://developers.cloudflare.com/bots/get-started/bot-fight-mode/) describes it as a simple, free product. When on, it:

- identifies traffic matching patterns of known bots,
- issues computationally expensive challenges, so that sending automated requests costs the client CPU time,
- notifies Bandwidth Alliance partners where that applies.

It also turns on JavaScript detections, which cannot be disabled while it runs, which inject a small script into your pages, and it uses the [`__cf_bm` cookie](/blog/cf-bm-cookie) to follow a visitor's requests. Turn it on under **Security**, **Settings**, filtered by **Bot traffic**.

## Its limits

Cloudflare lists them plainly:

- **It protects the entire domain.** There are no per-path settings.
- **It cannot be customized through WAF custom rules.** Skip, Bypass and Allow have no effect, because it runs in a separate pipeline outside the Ruleset Engine. Page Rules cannot skip it either. Only an IP Access rule that matches the request first keeps it from firing.
- **It may challenge API and mobile app traffic.** A JSON client or a webhook sender cannot solve a JavaScript challenge.
- **Content Security Policy.** For JavaScript detections, scripts under `/cdn-cgi/challenge-platform/` must be allowed, and a policy without nonces causes "Refused to execute inline script" errors. Nonces set in a `<meta>` tag are not supported.

Together, the second and third points leave two options when it breaks your own integrations, and Cloudflare's page names both: turn it off, or move to Super Bot Fight Mode, which supports exceptions.

## Super Bot Fight Mode

[Super Bot Fight Mode](https://developers.cloudflare.com/bots/get-started/super-bot-fight-mode/) comes with Pro, Business and Enterprise plans. Compared with Bot Fight Mode it adds:

- a chosen action (allow, challenge or block) per category: definitely automated, likely automated, verified bots,
- protection for static resources and bot analytics,
- **exceptions through WAF custom rules with the Skip action**, which run before it.

Cloudflare warns that sites using Cloudflare Tunnel should keep **Definitely automated** set to **Allow**, or tunnel connections can fail with `websocket: bad handshake`. Turn off Bot Fight Mode before switching to Super Bot Fight Mode.

Above both sits Bot Management, an Enterprise add-on that gives every request a [bot score](/blog/cloudflare-bot-score) from 1 to 99 for your own rules.

## Where Turnstile fits

|                        | Bot Fight Mode       | Super Bot Fight Mode          | Turnstile                               |
| ---------------------- | -------------------- | ----------------------------- | --------------------------------------- |
| Price                  | Free                 | Pro plan and up               | Free plan available                     |
| Scope                  | Whole proxied domain | Whole domain, with Skip rules | The forms or calls you choose           |
| Needs Cloudflare proxy | Yes                  | Yes                           | No                                      |
| Exceptions             | IP Access rules only | WAF Skip rules                | Not needed: only protected routes check |
| Decision made by       | Cloudflare's edge    | Cloudflare's edge             | Your server, from the siteverify answer |
| Effect on API clients  | May challenge them   | May, unless skipped           | None on unprotected routes              |

Turnstile runs on the same challenge platform as Cloudflare's other checks, but you place it: a widget on the login or signup form produces a token, and your backend verifies it ([how Turnstile works](/blog/what-is-cloudflare-turnstile)). Machine clients that call other routes are never challenged. With NestJS, that is one decorator on the route:

```ts
@Post('signup')
@TurnstileCaptcha({ action: 'signup' })
signUp(@Body() body: SignUpDto) {
  return this.users.create(body);
}
```

The guard rejects a missing or invalid token with `400 Bad Request` before the handler runs ([get started](/get-started)).

## Choosing

- A content site with no API, on the free plan: Bot Fight Mode is a reasonable default. Watch Security Events for requests labelled **Bot Fight Mode**.
- A site with an API, webhooks or a mobile app on the free plan: leave Bot Fight Mode off and protect the forms that attract abuse with Turnstile.
- On Pro or higher: Super Bot Fight Mode with Skip rules for your API paths, plus Turnstile on forms where you want proof of a person.

## FAQ

### What does Cloudflare Bot Fight Mode do?

It identifies traffic that matches known bot patterns across the whole domain and answers it with computationally expensive challenges. It is free and has a single on and off switch.

### Can I make an exception to Bot Fight Mode?

No. Cloudflare says Skip, Bypass and Allow rules have no effect on it because it runs outside the Ruleset Engine. An IP Access rule that matches first stops it. For exceptions, use Super Bot Fight Mode, which supports Skip rules.

### Should I use Bot Fight Mode or Turnstile?

They do different jobs. Bot Fight Mode challenges suspected bots anywhere on a proxied domain. Turnstile checks a person at a specific form and your server verifies the token. A site with an API can use Turnstile on its forms and leave Bot Fight Mode off.

## Related posts

- [How Cloudflare scores requests from bot to human](/blog/cloudflare-bot-score)
- [The \_\_cf_bm cookie: what Cloudflare stores and for how long](/blog/cf-bm-cookie)
- [How much Cloudflare Turnstile costs, and what Enterprise adds](/blog/cloudflare-turnstile-pricing)
- [All posts](/blog/)
