import { BadRequestException } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import {
  TurnstileCaptcha,
  TurnstileGuard,
  TurnstileModule,
  TurnstileResult,
} from '../src/main';
import { SECRET } from './helpers/app';
import {
  siteverifyReplies,
  siteverifyRequests,
  verified,
} from './helpers/siteverify';

class Resolver {
  verify() {
    return true;
  }

  @TurnstileCaptcha({ action: 'newsletter' })
  subscribe() {
    return true;
  }

  @TurnstileCaptcha({ action: 'login' })
  login() {
    return true;
  }
}

/** Builds the context Nest hands to guards for one resolver call: (root, args, context, info). */
function graphqlContext(
  contextValue: object,
  handler: () => unknown = Resolver.prototype.verify,
): ExecutionContextHost {
  const host = new ExecutionContextHost(
    [undefined, {}, contextValue, {}],
    Resolver,
    handler,
  );
  host.setType('graphql');
  return host;
}

function headersRequest(token?: string) {
  return {
    body: { query: '{ verify }' },
    headers: token ? { 'cf-turnstile-response': token } : {},
  };
}

async function createGuard(): Promise<TurnstileGuard> {
  const moduleRef = await Test.createTestingModule({
    imports: [TurnstileModule.forRoot({ secretKey: SECRET })],
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

describe('GraphQL resolvers', () => {
  it('reads the token from the request Apollo puts on the context', async () => {
    siteverifyReplies({ body: verified });
    const guard = await createGuard();

    const allowed = await guard.canActivate(
      graphqlContext({ req: headersRequest('token-from-header') }),
    );

    expect(allowed).toBe(true);
    expect(siteverifyRequests[0].response).toBe('token-from-header');
  });

  it('reads the token from the request Mercurius keeps on the reply', async () => {
    siteverifyReplies({ body: verified });
    const guard = await createGuard();

    const allowed = await guard.canActivate(
      graphqlContext({
        reply: { request: headersRequest('token-from-header') },
      }),
    );

    expect(allowed).toBe(true);
  });

  it('rejects a resolver call without a token', async () => {
    const guard = await createGuard();

    await expect(
      guard.canActivate(graphqlContext({ req: headersRequest() })),
    ).rejects.toThrow(BadRequestException);
  });

  it('needs a fresh token for every guarded field in one operation', async () => {
    siteverifyReplies(
      { body: verified },
      {
        body: {
          success: false,
          'error-codes': ['timeout-or-duplicate'],
          messages: [],
        },
      },
    );
    const guard = await createGuard();
    const req = headersRequest('token-from-header');

    await guard.canActivate(graphqlContext({ req }));
    await expect(guard.canActivate(graphqlContext({ req }))).rejects.toThrow(
      BadRequestException,
    );
    expect(siteverifyRequests).toHaveLength(2);
  });

  it('checks the action of a field even after another field passed', async () => {
    siteverifyReplies({ body: { ...verified, action: 'newsletter' } });
    const guard = await createGuard();
    const req = headersRequest('token-from-header');

    await guard.canActivate(
      graphqlContext({ req }, Resolver.prototype.subscribe),
    );
    await expect(
      guard.canActivate(graphqlContext({ req }, Resolver.prototype.login)),
    ).rejects.toThrow(BadRequestException);
  });

  it('hands the verification result to TurnstileResult', async () => {
    siteverifyReplies({ body: verified });
    const guard = await createGuard();
    const context = graphqlContext({
      req: headersRequest('token-from-header'),
    });

    await guard.canActivate(context);

    expect(paramFactory(TurnstileResult)(undefined, context)).toEqual(verified);
  });
});
