import {
  ConfigurableModuleBuilder,
  type ConfigurableModuleCls,
} from '@nestjs/common';
import { TURNSTILE_OPTIONS } from './constants/tokens';
import type { ITurnstileOptions } from './interfaces/turnstile';

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
  .setExtras({ isGlobal: true }, (definition, extras) => ({
    ...definition,
    global: extras.isGlobal,
  }))
  .build().ConfigurableModuleClass;
