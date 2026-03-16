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

## skipIf

Use `skipIf` to bypass Turnstile validation conditionally. This is useful in local development or testing environments where you don't want to validate real tokens.

```javascript
imports: [TurnstileModule.forRoot({
  secretKey: '1x0000000000000000000000000000000AA',
  tokenResponse: (req) => req.body.turnstileToken,
  skipIf: process.env.NODE_ENV === 'development',
})],
```

When `skipIf` is `true`, the guard will allow all requests through without contacting Cloudflare.

## exceptionFactory

Use `exceptionFactory` to customize the exception thrown when validation fails. The factory receives a `reason` argument — either `'missing'` (no token provided) or `'invalid'` (token failed verification).

```javascript
import { UnauthorizedException } from '@nestjs/common';

imports: [TurnstileModule.forRoot({
  secretKey: '1x0000000000000000000000000000000AA',
  tokenResponse: (req) => req.body.turnstileToken,
  exceptionFactory: (reason) => {
    if (reason === 'missing') {
      return new UnauthorizedException('Turnstile token is required.');
    }
    return new UnauthorizedException('Turnstile token is invalid.');
  },
})],
```

Without `exceptionFactory`, the guard throws a `BadRequestException` by default.
