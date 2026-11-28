---
title: 'Turnstile Widget Options: Size, Theme and Appearance'
titleTemplate: false
description: 'Every Cloudflare Turnstile widget option: size, theme, appearance, execution, language, retry, action and cdata, with data attributes and render() names.'
headline: 'Setting up the Turnstile widget in the page'
date: '2026-11-28'
keyword: 'cloudflare turnstile widget'
faq:
  [
    {
      'q': 'Can I change the colours of the Turnstile widget?',
      'a': 'No. data-theme offers auto, light and dark, and data-size changes the dimensions. There is no option for custom colours.',
    },
    {
      'q': 'How do I make the Turnstile widget full width?',
      'a': 'Set data-size to flexible. The widget then takes 100% of its container, with a minimum width of 300px.',
    },
    {
      'q': 'How do I hide the Turnstile widget unless it is needed?',
      'a': 'Use a Managed widget with data-appearance set to interaction-only. It stays hidden unless the visitor has to interact.',
    },
  ]
---

# Setting up the Turnstile widget in the page

<p class="post-meta">By <a href="https://halit.org">Halit Sever</a> · <time datetime="2026-11-28">28 November 2026</time></p>

<p class="lead">The Turnstile widget is configured in the page, either with data attributes on its container or with parameters to turnstile.render(). This post lists them as Cloudflare documents them in November 2026. Options for the server, such as the expected hostname, live on this site's options page instead.</p>

## Two ways to render

Implicit rendering scans the page for elements with the `cf-turnstile` class when the script loads:

```html
<script
  src="https://challenges.cloudflare.com/turnstile/v0/api.js"
  async
  defer
></script>

<div
  class="cf-turnstile"
  data-sitekey="YOUR_SITE_KEY"
  data-theme="light"
  data-size="flexible"
></div>
```

Explicit rendering waits for your code, which suits single-page apps. Load the script with `?render=explicit` and call `turnstile.render()`:

```js
const widgetId = turnstile.render('#captcha', {
  sitekey: 'YOUR_SITE_KEY',
  theme: 'dark',
  callback: (token) => console.log('token ready'),
});
```

The returned ID goes to `turnstile.reset()`, `turnstile.getResponse()`, `turnstile.isExpired()` and `turnstile.remove()` ([client-side rendering](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/)).

## Size

| `data-size`        | Width                                 | Height |
| ------------------ | ------------------------------------- | ------ |
| `normal` (default) | 300px                                 | 65px   |
| `flexible`         | 100% of the container, at least 300px | 65px   |
| `compact`          | 150px                                 | 140px  |

Size only applies to Managed and non-interactive widgets; invisible ones have none. On a phone layout, `flexible` fills the form width.

## Theme

`data-theme` takes `auto` (the default, which follows the visitor's light or dark preference), `light` or `dark`. There is no option for custom colours: Cloudflare's widget keeps its own look.

## Appearance and execution

These two decide when the widget shows up and when it runs:

| Option            | Values             | Effect                                        |
| ----------------- | ------------------ | --------------------------------------------- |
| `data-appearance` | `always` (default) | Visible as soon as it renders                 |
|                   | `execute`          | Visible once the challenge starts             |
|                   | `interaction-only` | Visible only if the visitor has to interact   |
| `data-execution`  | `render` (default) | The challenge runs when the widget renders    |
|                   | `execute`          | The challenge waits for `turnstile.execute()` |

`interaction-only` with a Managed widget gives you a form that usually shows nothing. `execute` lets you start the challenge on submit, so the token is fresh when the request leaves.

## Language

`data-language` is `auto` by default and also takes ISO 639-1 codes such as `es` or language-country codes such as `en-US`. Unsupported languages fall back to English.

## Retries and expiry

| Option                 | Values                              | Effect                                                   |
| ---------------------- | ----------------------------------- | -------------------------------------------------------- |
| `data-retry`           | `auto` (default), `never`           | Whether a failed challenge is retried                    |
| `data-retry-interval`  | milliseconds, default 8000          | Gap between retries                                      |
| `data-refresh-expired` | `auto` (default), `manual`, `never` | What happens when the token expires                      |
| `data-refresh-timeout` | `auto` (default), `manual`, `never` | What happens after an interactive timeout (Managed mode) |

Tokens expire after 300 seconds. If a form can stay open longer, keep `refresh-expired` on `auto`, or call `turnstile.reset()` yourself when `expired-callback` fires.

## Labels for the server

- `data-action`: up to 32 letters, digits, `_` and `-`. Cloudflare returns it from siteverify, so the server can tell a login token from a signup token.
- `data-cdata`: up to 255 of the same characters, also returned, for example a session ID.

In nest-cloudflare-turnstile, `@TurnstileCaptcha({ action: 'login' })` rejects tokens whose action differs, and [`validateResult`](/turnstile-options#validateresult) can compare `cdata` with the session ([per-route actions](/advanced#per-route-actions)).

## Form field and callbacks

- `data-response-field` (default `true`) adds a hidden input with the token; `data-response-field-name` renames it from `cf-turnstile-response`. If you rename it, point the guard's [`tokenResponse`](/get-started#send-the-token-from-the-browser) at the new name.
- Callbacks: `callback` (token ready), `error-callback`, `expired-callback`, `timeout-callback`, `before-interactive-callback`, `after-interactive-callback` and `unsupported-callback`. The [error codes post](/blog/turnstile-error-codes) explains what the error callback receives.
- `data-tabindex` sets the iframe's tab order, `data-feedback-enabled` lets Cloudflare ask for feedback when the widget fails.

The full table is in Cloudflare's [widget configurations](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/widget-configurations/) page. To see the size, theme and callbacks in action without an account, open the [live demo](/demo/).

## FAQ

### Can I change the colours of the Turnstile widget?

No. data-theme offers auto, light and dark, and data-size changes the dimensions. There is no option for custom colours.

### How do I make the Turnstile widget full width?

Set data-size to flexible. The widget then takes 100% of its container, with a minimum width of 300px.

### How do I hide the Turnstile widget unless it is needed?

Use a Managed widget with data-appearance set to interaction-only. It stays hidden unless the visitor has to interact.

## Related posts

- [How Cloudflare Turnstile tells people from bots](/blog/what-is-cloudflare-turnstile)
- [Turnstile error codes, from 600010 to timeout-or-duplicate](/blog/turnstile-error-codes)
- [A Turnstile tutorial with Cloudflare's test keys](/blog/turnstile-test-keys)
- [All posts](/blog/)
