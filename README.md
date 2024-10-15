<p align="center" class="logo-section">
<img src="https://i.ibb.co/HT1M4Kb/image.png" height="80" width="80"/>
</br>
<img src="https://halitsever-api.vercel.app/api/repo-title?title=Cloudflare%20Turnstile%20NestJS">

<p align="center">
☁️ Cloudflare Turnstile integration for NestJS<br>
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

- 🧩 [**Simple and easy**](#) - This library provides just one guard to protect your endpoints with Cloudflare Turnstile Captcha!

<p align="center" >
<img src="https://halitsever-api.vercel.app/api/installation"/>
</p>

Installation:

```bash
npm install nest-cloudflare-turnstile --save
```

add module to imports array with forRoot method:

```javascript

  imports: [TurnstileModule.forRoot({
    secretKey: '1x0000000000000000000000000000000AA',
    tokenResponse: (req) => req.body.turnstileToken // or you can use req.headers.turnstileToken
  })],

```

or with forRootAsync method:

```javascript
 imports: [
    TurnstileModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secretKey = config.get<string>(
          'CLOUDFLARE_TURNSTILE_PRIVATE_KEY',
        );
        if (!secretKey) {
          throw new Error('Missing Cloudflare Turnstile secret');
        }

        return {
          secretKey,
          tokenResponse: (req) => req.body.turnstileToken,
        };
      },
    }),
  ]
```

use `TurnstileCaptcha` decorator on controller:

```javascript

  import { TurnstileCaptcha } from 'nest-cloudflare-turnstile'

  @Post()
  @TurnstileCaptcha()
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
