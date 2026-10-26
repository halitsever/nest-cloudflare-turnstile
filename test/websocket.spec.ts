import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { Test } from '@nestjs/testing';
import { WsException } from '@nestjs/websockets';
import { inspect } from 'node:util';
import { describe, expect, it } from 'vitest';
import {
  ITurnstileOptions,
  TurnstileCaptcha,
  TurnstileGuard,
  TurnstileModule,
  TurnstileResult,
} from '../src/main';
import { SECRET } from './helpers/app';
import {
  rejected,
  siteverifyReplies,
  siteverifyRequests,
  verified,
} from './helpers/siteverify';

class Gateway {
  @TurnstileCaptcha()
  login() {
    return true;
  }
}

const socket = { id: 'socket-1', handshake: { address: '203.0.113.7' } };

/** Builds the context Nest hands to guards for one message: (client, data, pattern). */
function wsContext(data: unknown): ExecutionContextHost {
  const host = new ExecutionContextHost(
    [socket, data, 'login'],
    Gateway,
    Gateway.prototype.login,
  );
  host.setType('ws');
  return host;
}

async function createGuard(
  options: Partial<ITurnstileOptions> = {},
): Promise<TurnstileGuard> {
  const moduleRef = await Test.createTestingModule({
    imports: [TurnstileModule.forRoot({ secretKey: SECRET, ...options })],
  }).compile();
  return moduleRef.get(TurnstileGuard);
}

/** Pulls the factory Nest runs for a custom parameter decorator. */
function paramFactory(decorator: () => ParameterDecorator) {
  class Target {
    handle() {}
  }
  decorator()(Target.prototype, 'handle', 0);
  const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, Target, 'handle');
  return Object.values<{ factory: (data: unknown, ctx: unknown) => unknown }>(
    args,
  )[0].factory;
}

describe('WebSocket gateways', () => {
  it('reads the token from the cf-turnstile-response field of the message', async () => {
    siteverifyReplies({ body: verified });
    const guard = await createGuard();

    await expect(
      guard.canActivate(
        wsContext({ 'cf-turnstile-response': 'token-from-widget' }),
      ),
    ).resolves.toBe(true);
    expect(siteverifyRequests[0].response).toBe('token-from-widget');
  });

  it('rejects a message without a token with a WsException', async () => {
    const guard = await createGuard();

    const error = await guard
      .canActivate(wsContext({ email: 'visitor@example.com' }))
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(WsException);
    expect((error as WsException).getError()).toBe(
      'Missing turnstile verification code.',
    );
  });

  it('rejects a token Cloudflare rejected with a WsException', async () => {
    siteverifyReplies({ body: rejected });
    const guard = await createGuard();

    const error = await guard
      .canActivate(wsContext({ 'cf-turnstile-response': 'expired-token' }))
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(WsException);
    expect((error as WsException).getError()).toBe(
      'Invalid turnstile verification code.',
    );
  });

  it('tells exceptionFactory which transport the call came on', async () => {
    const guard = await createGuard({
      exceptionFactory: (reason, _details, context) =>
        new WsException(`${reason} on ${context.getType()}`),
    });

    const error = await guard
      .canActivate(wsContext({}))
      .catch((caught: unknown) => caught);

    expect((error as WsException).getError()).toBe('missing on ws');
  });

  it('hands the socket to the options that read the request', async () => {
    siteverifyReplies({ body: verified });
    const guard = await createGuard({
      remoteIp: (client) => client.handshake.address,
    });

    await guard.canActivate(
      wsContext({ 'cf-turnstile-response': 'token-from-widget' }),
    );

    expect(siteverifyRequests[0].remoteip).toBe('203.0.113.7');
  });

  it('hands the result of the message to TurnstileResult', async () => {
    siteverifyReplies({ body: verified });
    const guard = await createGuard();
    const context = wsContext({ 'cf-turnstile-response': 'token-from-widget' });

    await guard.canActivate(context);

    expect(paramFactory(TurnstileResult)(undefined, context)).toEqual(verified);
  });

  it('keeps one message from seeing the result of another on the same socket', async () => {
    siteverifyReplies({ body: verified });
    const guard = await createGuard();
    await guard.canActivate(
      wsContext({ 'cf-turnstile-response': 'token-from-widget' }),
    );

    const unguarded = wsContext({ text: 'hello' });

    expect(paramFactory(TurnstileResult)(undefined, unguarded)).toBeUndefined();
  });

  it('keeps the result out of logs and copies of the message', async () => {
    siteverifyReplies({ body: verified });
    const guard = await createGuard();
    const data = { 'cf-turnstile-response': 'token-from-widget' };

    await guard.canActivate(wsContext(data));

    expect(inspect(data)).not.toContain(verified.cdata);
    expect(Object.getOwnPropertySymbols({ ...data })).toEqual([]);
  });

  it('accepts messages whose data is not an object', async () => {
    siteverifyReplies({ body: verified });
    const guard = await createGuard({
      tokenResponse: () => 'token-from-widget',
    });

    await expect(guard.canActivate(wsContext('plain text'))).resolves.toBe(
      true,
    );
  });
});
