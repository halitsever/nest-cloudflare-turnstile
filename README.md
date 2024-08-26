<p align="center" class="logo-section">
<img src="https://i.ibb.co/HT1M4Kb/image.png" height="80" width="80"/>
</br>
<img src="https://halitsever-api.vercel.app/api/repo-title?title=Cloudflare%20Turnstile%20NestJS">

<p align="center">
🔥 Cloudflare Turnstile integration for Nest JS<br>
<br/>
<br/>
<img src="https://img.shields.io/github/sponsors/halitsever"/>
</p>
<p align="center">
<a align="center" href="https://halitsever.github.io/nest-cloudflare-turnstile">Documentation</a>
  </p>
</p>

<p align="center">
<img src="https://halitsever-api.vercel.app/api/details"/>
</p>

- 🧑‍💻 [**TODO**](#) - update docs

<p align="center" >
<img src="https://halitsever-api.vercel.app/api/installation"/>
</p>

Installation:

```bash
npm install nest-cloudflare-turnstile --save
```

add module to imports array:

```javascript

  imports: [TurnstileModule.forRoot({
    secretKey: '1x0000000000000000000000000000000AA',
    tokenResponse: (req) => req.body.turnstileToken // or you can use req.headers.turnstileToken
  })],

```

use `TurnstileGuard` guard on controller:

```javascript

  @Post()
  @UseGuards(TurnstileGuard)
  getHello(): string {
    return this.appService.getHello();
  }
```

And thats it! For more information, please check the <a href="https://halitsever.github.io/nest-cloudflare-turnstile">docs</a>

<p align="center" href="https://github.com/halitsever/repo_name/issues">
<img src="https://halitsever-api.vercel.app/api/issue"/>
</p>

<p align="center">
<img src="https://halitsever-api.vercel.app/api/sponsor"/>
</p>

<p align="center">
<img src="https://halitsever-api.vercel.app/api/license"/>
</p>

<p align="center">
  MIT LICENSE | <a href="https://halit.org">Halit Sever</a>
</p>
