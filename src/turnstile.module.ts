import { Module } from '@nestjs/common';
import { ConfigurableModuleClass } from './turnstile.module-definition';

@Module({})
export class TurnstileModule extends ConfigurableModuleClass {}
