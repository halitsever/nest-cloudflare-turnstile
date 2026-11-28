---
title: 'Cloudflare Turnstile Pricing: Free Plan vs Enterprise'
titleTemplate: false
description: 'Cloudflare Turnstile pricing: the free plan has no cap on challenges, 20 widgets and 10 hostnames per widget. What Enterprise adds and which limits matter.'
headline: 'How much Cloudflare Turnstile costs, and what Enterprise adds'
date: '2026-11-28'
keyword: 'cloudflare turnstile pricing'
faq:
  [
    {
      'q': 'Is Cloudflare Turnstile free?',
      'a': "Yes. The free plan includes every widget type and unlimited challenges and siteverify requests, with up to 20 widgets per account and 10 hostnames per widget. Enterprise pricing is through Cloudflare's sales team.",
    },
    {
      'q': 'Do I need a paid Cloudflare plan or Cloudflare DNS to use Turnstile?',
      'a': 'No. Cloudflare says Turnstile can be used independently of its other services, so a site whose DNS and hosting are elsewhere can embed the widget on the free plan.',
    },
    {
      'q': 'What does Turnstile Enterprise add?',
      'a': 'Unlimited widgets, up to 200 hostnames per widget, widgets that accept any hostname, 30 days of analytics instead of 7, Ephemeral IDs and the option to remove Cloudflare branding.',
    },
  ]
---

# How much Cloudflare Turnstile costs, and what Enterprise adds

<p class="post-meta">By <a href="https://halit.org">Halit Sever</a> · <time datetime="2026-11-28">28 November 2026</time></p>

<p class="lead">Turnstile has two plans: Free and Enterprise. Free has no price and no cap on challenges; Enterprise has no public price and is sold through Cloudflare's sales team. For most sites the question is not cost but whether one of the free plan's limits gets in the way.</p>

## The two plans side by side

From Cloudflare's [Turnstile plans page](https://developers.cloudflare.com/turnstile/plans/), as published on 28 November 2026:

|                                                    | Free                 | Enterprise           |
| -------------------------------------------------- | -------------------- | -------------------- |
| Price                                              | Free                 | Contact sales        |
| Widgets                                            | Up to 20 per account | Unlimited            |
| Widget types (managed, non-interactive, invisible) | All                  | All                  |
| Challenges and verification requests               | Unlimited            | Unlimited            |
| Hostnames                                          | 10 per widget        | Up to 200 per widget |
| Widget for any hostname (none preconfigured)       | No                   | Yes                  |
| Analytics lookback                                 | 7 days               | 30 days              |
| Pre-clearance                                      | Yes                  | Yes                  |
| Ephemeral IDs                                      | No                   | Yes                  |
| Remove Cloudflare branding                         | No                   | Yes                  |
| WCAG 2.2 AAA                                       | Yes                  | Yes                  |
| Community support                                  | Yes                  | Yes                  |

Cloudflare adds that widgets and settings carry over on an upgrade, that customers with Enterprise Bot Management and Enterprise Turnstile can have the 20-widget limit raised, and that Turnstile can be used without any other Cloudflare service.

## What "free" covers in practice

- **No per-request fee.** Every page load, every widget render and every siteverify call from your server is included. That differs from reCAPTCHA, whose free Essentials tier counts assessments ([Turnstile vs reCAPTCHA](/blog/cloudflare-turnstile-vs-recaptcha) has the numbers).
- **No Cloudflare account plan needed.** You need a Cloudflare account to create a widget, but your domain does not have to use Cloudflare DNS or its CDN.
- **Production use.** Cloudflare lists "most production applications" among the free plan's fits, next to personal sites and testing.

## The free limits that bite

**10 hostnames per widget.** A widget only works on the hostnames you list. An app with many customer subdomains or a SaaS with custom domains runs into this first, and "any hostname" widgets are Enterprise only. You can split hostnames across widgets, up to 20 widgets.

**20 widgets per account.** One widget per form type is usually enough, since one widget can serve many pages. Use the `action` value to tell forms apart in analytics and on the server instead of creating a widget per page. This site's guard checks the action per route with `@TurnstileCaptcha({ action: 'login' })` ([per-route actions](/advanced#per-route-actions)).

**7 days of analytics.** Export or note what you need if you compare weeks.

**No Ephemeral IDs.** On Enterprise, siteverify can return a short-lived device ID that stays the same when an attacker changes IP addresses, useful for rate limits. The guard exposes it as `result.metadata.ephemeral_id` when present ([Ephemeral IDs](/advanced#ephemeral-ids)). On the free plan, rate-limit by IP address or account instead.

## Costs that are not Turnstile's

- **Your server's siteverify calls.** One HTTPS request per protected form submission. With nest-cloudflare-turnstile that call happens in a guard before your handler runs; the module itself is MIT licensed and free.
- **Testing.** Cloudflare's test site keys and secrets always pass or always fail and cost nothing, which keeps CI away from real widgets ([test keys](/blog/turnstile-test-keys)).
- **Bot Management.** Cloudflare's other bot products are priced separately. [Bot Fight Mode](/blog/cloudflare-bot-fight-mode) is free, Super Bot Fight Mode comes with Pro and higher plans, and Bot Management is an Enterprise add-on. None of them is required for Turnstile.

## When Enterprise is worth asking about

From the table, the cases are specific: more than 20 widgets or 10 hostnames per widget, a multi-tenant app on customers' own domains, a need for device-level signals (Ephemeral IDs), white-label widgets, or longer analytics. If none of these apply, the free plan is the whole product.

## FAQ

### Is Cloudflare Turnstile free?

Yes. The free plan includes every widget type and unlimited challenges and siteverify requests, with up to 20 widgets per account and 10 hostnames per widget. Enterprise pricing is through Cloudflare's sales team.

### Do I need a paid Cloudflare plan or Cloudflare DNS to use Turnstile?

No. Cloudflare says Turnstile can be used independently of its other services, so a site whose DNS and hosting are elsewhere can embed the widget on the free plan.

### What does Turnstile Enterprise add?

Unlimited widgets, up to 200 hostnames per widget, widgets that accept any hostname, 30 days of analytics instead of 7, Ephemeral IDs and the option to remove Cloudflare branding.

## Related posts

- [How Cloudflare Turnstile tells people from bots](/blog/what-is-cloudflare-turnstile)
- [Turnstile or reCAPTCHA: what differs for your app](/blog/cloudflare-turnstile-vs-recaptcha)
- [Bot Fight Mode, Super Bot Fight Mode and Turnstile compared](/blog/cloudflare-bot-fight-mode)
- [All posts](/blog/)
