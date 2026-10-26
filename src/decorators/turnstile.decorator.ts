import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { TURNSTILE_ROUTE_OPTIONS } from '../constants/tokens';
import { TurnstileGuard } from '../guards/turnstile.guard';
import type { TurnstileCaptchaOptions } from '../interfaces/turnstile';

export function TurnstileCaptcha(
  options: TurnstileCaptchaOptions = {},
): MethodDecorator & ClassDecorator {
  return applyDecorators(
    SetMetadata(TURNSTILE_ROUTE_OPTIONS, options),
    UseGuards(TurnstileGuard),
  );
}
