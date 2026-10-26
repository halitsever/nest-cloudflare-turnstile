import { SetMetadata } from '@nestjs/common';
import { TURNSTILE_SKIP } from '../constants/tokens';

/** Exempts a route or controller from the guard, such as a health check under a global `APP_GUARD`. */
export function SkipTurnstile(): MethodDecorator & ClassDecorator {
  return SetMetadata(TURNSTILE_SKIP, true);
}
