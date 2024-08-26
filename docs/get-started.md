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
