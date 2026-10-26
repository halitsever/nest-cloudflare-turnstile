# Basic example

A NestJS app with one form behind the Turnstile guard. It uses Cloudflare's test keys, so it runs without a Cloudflare account.

[Open it in StackBlitz](https://stackblitz.com/github/halitsever/nest-cloudflare-turnstile/tree/main/examples/basic)

## Run it locally

```bash
npm install
npm start
```

Open http://localhost:3000 and send the form. The guard checks the token with Cloudflare before the handler runs, and the handler answers with the message and the hostname from the verification result.

## See a rejected token

`2x0000000000000000000000000000000AA` is Cloudflare's test secret that rejects every token:

```bash
TURNSTILE_SECRET_KEY=2x0000000000000000000000000000000AA npm start
```

The form now gets a 400 response. To try your own widget, put its site key in `public/index.html` and start the app with its secret key in `TURNSTILE_SECRET_KEY`.
