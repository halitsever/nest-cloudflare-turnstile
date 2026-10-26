import {
  ConfigurableModuleBuilder,
  type ConfigurableModuleCls,
} from '@nestjs/common';
import { TURNSTILE_OPTIONS } from './constants/tokens';
import { TurnstileGuard } from './guards/turnstile.guard';
import type { ITurnstileOptions } from './interfaces/turnstile';
import { TurnstileService } from './services/turnstile.service';

// Annotated so declaration files import Nest types by name instead of through resolution-mode import types.
export const ConfigurableModuleClass: ConfigurableModuleCls<
  ITurnstileOptions,
  'forRoot',
  'createTurnstileOptions',
  { isGlobal: boolean }
> = new ConfigurableModuleBuilder<ITurnstileOptions>({
  optionsInjectionToken: TURNSTILE_OPTIONS,
})
  .setClassMethodName('forRoot')
  .setFactoryMethodName('createTurnstileOptions')
  // Global unless told otherwise, so feature modules can use the guard without importing it.
  // Providers live here rather than in @Module so a bare `imports: [TurnstileModule]` stays harmless.
  .setExtras({ isGlobal: true }, (definition, extras) => ({
    ...definition,
    global: extras.isGlobal,
    providers: [
      ...(definition.providers ?? []),
      TurnstileService,
      TurnstileGuard,
    ],
    exports: [
      ...(definition.exports ?? []),
      TurnstileService,
      TurnstileGuard,
      TURNSTILE_OPTIONS,
    ],
  }))
  .build().ConfigurableModuleClass;
