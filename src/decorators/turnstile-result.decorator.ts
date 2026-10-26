import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TURNSTILE_RESULT } from '../constants/tokens';

/** Injects the siteverify result for the request that passed the guard. */
export const TurnstileResult = createParamDecorator(
  (_data: unknown, context: ExecutionContext) =>
    context.switchToHttp().getRequest()[TURNSTILE_RESULT],
);
