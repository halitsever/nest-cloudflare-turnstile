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

use `TurnstileGuard` guard on controller:

```javascript
  import { TurnstileCaptcha } from 'nest-cloudflare-turnstile'

  @Post()
  @TurnstileCaptcha()
  getHello(): string {
    return this.appService.getHello();
  }
```
