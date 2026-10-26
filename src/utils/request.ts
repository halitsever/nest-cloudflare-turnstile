import type { ExecutionContext } from '@nestjs/common';

/** The HTTP request behind a REST route or a GraphQL resolver, or the socket behind a WebSocket message. */
export function getRequest(context: ExecutionContext): any {
  const type = context.getType<string>();
  if (type === 'graphql') {
    const graphqlContext = context.getArgByIndex(2);
    // Apollo exposes the request as `req`; Mercurius only through `reply.request`.
    return graphqlContext?.req ?? graphqlContext?.reply?.request;
  }
  if (type === 'ws') return context.switchToWs().getClient();
  return context.switchToHttp().getRequest();
}

/** Where the result waits for `@TurnstileResult()`: the message on WebSockets, since a socket carries many. */
export function getResultHolder(context: ExecutionContext): any {
  return context.getType() === 'ws'
    ? context.switchToWs().getData()
    : getRequest(context);
}
