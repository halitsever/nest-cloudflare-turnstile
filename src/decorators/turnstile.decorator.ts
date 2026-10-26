import { applyDecorators, UseGuards } from '@nestjs/common';
import { TurnstileGuard } from '../guards/turnstile.guard';

export function TurnstileCaptcha(): MethodDecorator & ClassDecorator {
  return applyDecorators(UseGuards(TurnstileGuard));
}
