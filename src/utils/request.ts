import type { ExecutionContext } from '@nestjs/common';

/** The HTTP request behind a REST route or a GraphQL resolver. */
export function getRequest(context: ExecutionContext): any {
  if (context.getType<string>() === 'graphql') {
    const graphqlContext = context.getArgByIndex(2);
    // Apollo exposes the request as `req`; Mercurius only through `reply.request`.
    return graphqlContext?.req ?? graphqlContext?.reply?.request;
  }
  return context.switchToHttp().getRequest();
}
