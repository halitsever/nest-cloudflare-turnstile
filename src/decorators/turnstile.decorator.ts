import { UseGuards } from '@nestjs/common';
import { TurnstileGuard } from '../guards/turnstile.guard';

export function TurnstileCaptcha(): MethodDecorator {
    return UseGuards(TurnstileGuard);
}