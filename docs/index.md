---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: Cloudflare Turnstile for NestJS
  tagline: A guard that checks Cloudflare Turnstile tokens before your handlers run.
  image:
    src: https://i.ibb.co/HT1M4Kb/image.png
    alt: Cloud logo
  actions:
    - theme: brand
      text: Get started
      link: /get-started
    - theme: alt
      text: GitHub
      link: https://github.com/halitsever/nest-cloudflare-turnstile

features:
  - title: One decorator
    details: Put @TurnstileCaptcha() on a route or a controller. Requests without a valid token stop at the guard.
  - title: NestJS 10, 11 and 12
    details: Uses the Nest packages your app already has and adds no runtime dependencies of its own.
  - title: Express, Fastify and GraphQL
    details: The same guard protects REST routes on either HTTP adapter and GraphQL resolvers on Apollo or Mercurius.
  - title: The checks Cloudflare recommends
    details: Verifies the hostname and action, retries a failed call once with an idempotency key, and keeps the secret key out of errors.
---
