# Error handling

The guard sorts failures into two groups. Problems with the visitor's token become 400 responses by default. Problems with your setup or with Cloudflare become 500 responses and reach `onError`.

## Token problems

| Reason    | When                                                                                                     | Default response                           |
| --------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `missing` | The request has no token                                                                                 | 400 `Missing turnstile verification code.` |
| `invalid` | Cloudflare rejected the token, it was malformed, or its hostname or action did not match what you expect | 400 `Invalid turnstile verification code.` |

### Custom exceptions

Pass `exceptionFactory` to throw something else. It receives the reason and the error codes behind it:

```ts
import { ForbiddenException } from '@nestjs/common';

TurnstileModule.forRoot({
  secretKey: process.env.TURNSTILE_SECRET_KEY,
  exceptionFactory: (reason, { errorCodes }) =>
    new ForbiddenException({
      message:
        reason === 'missing'
          ? 'Please complete the challenge.'
          : 'The challenge expired, please try again.',
      errorCodes,
    }),
});
```

Return an `HttpException` so Nest turns it into the status you chose. Any other error becomes a 500.

### Error codes

`errorCodes` holds Cloudflare's codes, or one of the codes the guard adds itself. It is empty when the token was missing or malformed before any call to Cloudflare.

| Code                     | Meaning                                                                                   |
| ------------------------ | ----------------------------------------------------------------------------------------- |
| `missing-input-response` | Cloudflare received no token (reported as `missing`)                                      |
| `invalid-input-response` | The token is invalid, malformed or expired                                                |
| `timeout-or-duplicate`   | The token was already used or is older than five minutes                                  |
| `hostname-mismatch`      | Added by the guard: the token's hostname is not in `expectedHostname`                     |
| `action-mismatch`        | Added by the guard: the token's action is not the one the route expects                   |
| `validate-result-failed` | Added by the guard: [`validateResult`](./turnstile-options#validateresult) returned false |

## Setup and network errors

The guard answers 500 `Failed turnstile verification.` and calls `onError` with a `TurnstileError` when:

- siteverify cannot be reached, times out or answers with HTTP 5xx twice in a row
- Cloudflare reports `missing-input-secret`, `invalid-input-secret` or `bad-request`, which point at your configuration
- Cloudflare reports `internal-error` on both attempts

```ts
import { Logger } from '@nestjs/common';

const logger = new Logger('Turnstile');

TurnstileModule.forRoot({
  secretKey: process.env.TURNSTILE_SECRET_KEY,
  onError: (error) =>
    logger.error(`${error.message} [${error.errorCodes.join(', ')}]`),
});
```

`error.errorCodes` lists the Cloudflare codes and is empty for network failures, where `error.cause` holds the original error. The error never contains your secret key.

Without `onError`, the module logs these errors with Nest's `Logger` under the `TurnstileModule` context, because Nest does not log 500 responses that come from an `HttpException`. If `onError` throws or returns a rejected promise, the module logs that too and the request still gets the 500.

`exceptionFactory` is not used for these cases, because they are not the visitor's fault. To catch a wrong secret key before the first visitor does, turn on [`verifySecretOnStartup`](./turnstile-options#verifysecretonstartup).

To track every check, including the successful ones, use [`onVerify`](./turnstile-options#onverify).
