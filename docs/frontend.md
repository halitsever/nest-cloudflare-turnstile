# Frontend frameworks

In a plain HTML form, the widget hands the token to the guard for you, as [Get started](./get-started#send-the-token-from-the-browser) shows. With a frontend framework, read the token from its Turnstile component and send it in the `cf-turnstile-response` header, which the guard reads by default.

Cloudflare accepts each token once. Reset the widget after a request, so the next request gets a fresh token.

## React

[@marsidev/react-turnstile](https://github.com/marsidev/react-turnstile) gives you the token through a ref:

```tsx
import { Turnstile } from '@marsidev/react-turnstile';
import type { TurnstileInstance } from '@marsidev/react-turnstile';
import { useRef, type FormEvent } from 'react';

export function LoginForm() {
  const turnstile = useRef<TurnstileInstance | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await fetch('/auth/login', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'cf-turnstile-response': turnstile.current?.getResponse() ?? '',
      },
      body: JSON.stringify({ email: form.get('email') }),
    });
    turnstile.current?.reset();
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" />
      <Turnstile ref={turnstile} siteKey="YOUR_SITE_KEY" />
      <button type="submit">Log in</button>
    </form>
  );
}
```

## Next.js

The React component runs only in the browser, so the file with the form starts with `'use client'`. If the form posts to a Server Action that calls your Nest API, the widget's hidden field arrives in the form data. Pass it on in the header:

```ts
'use server';

export async function logIn(form: FormData) {
  await fetch(`${process.env.API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'cf-turnstile-response': String(form.get('cf-turnstile-response') ?? ''),
    },
    body: JSON.stringify({ email: form.get('email') }),
  });
}
```

The API then sees the Next.js server as the client. If you use [`remoteIp`](./turnstile-options#remoteip), forward the visitor's address in a header of your own and read it there.

## Vue

[vue-turnstile](https://github.com/ruigomeseu/vue-turnstile) binds the token with `v-model`:

```vue
<script setup lang="ts">
import { ref } from 'vue';
import VueTurnstile from 'vue-turnstile';

const email = ref('');
const token = ref('');

async function logIn() {
  await fetch('/auth/login', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'cf-turnstile-response': token.value,
    },
    body: JSON.stringify({ email: email.value }),
  });
}
</script>

<template>
  <form @submit.prevent="logIn">
    <input v-model="email" type="email" />
    <VueTurnstile site-key="YOUR_SITE_KEY" v-model="token" />
    <button type="submit">Log in</button>
  </form>
</template>
```

To reset the widget, call the component's `reset()` method through a template ref.

## Angular

[ngx-turnstile](https://github.com/verto-health/ngx-turnstile) emits the token from its `resolved` output:

```ts
import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { NgxTurnstileComponent } from 'ngx-turnstile';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [NgxTurnstileComponent],
  template: `
    <input #email type="email" />
    <ngx-turnstile
      siteKey="YOUR_SITE_KEY"
      (resolved)="token = $event"
    ></ngx-turnstile>
    <button [disabled]="!token" (click)="logIn(email.value)">Log in</button>
  `,
})
export class LoginComponent {
  private readonly http = inject(HttpClient);
  token: string | null = null;

  logIn(email: string) {
    this.http
      .post(
        '/auth/login',
        { email },
        { headers: { 'cf-turnstile-response': this.token ?? '' } },
      )
      .subscribe();
  }
}
```

The component resets itself when its token expires and then emits `null`.
