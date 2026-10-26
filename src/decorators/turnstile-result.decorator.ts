import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TURNSTILE_RESULT } from '../constants/tokens';
import { getResultHolder } from '../utils/request';

/** Injects the siteverify result for the request that passed the guard. */
export const TurnstileResult = createParamDecorator(
  (_data: unknown, context: ExecutionContext) =>
    getResultHolder(context)?.[TURNSTILE_RESULT],
);
