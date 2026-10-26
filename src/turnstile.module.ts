import { Module } from '@nestjs/common';
import { TURNSTILE_OPTIONS } from './constants/tokens';
import { TurnstileGuard } from './guards/turnstile.guard';
import { TurnstileService } from './services/turnstile.service';
import { ConfigurableModuleClass } from './turnstile.module-definition';

@Module({
  providers: [TurnstileService, TurnstileGuard],
  exports: [TurnstileService, TurnstileGuard, TURNSTILE_OPTIONS],
})
export class TurnstileModule extends ConfigurableModuleClass {}
