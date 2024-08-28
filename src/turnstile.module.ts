import { DynamicModule, Global, Module } from '@nestjs/common';
import { TurnstileService } from './services/turnstile.service';
import { HttpModule } from '@nestjs/axios';
import { ITurnstileOptions } from './interfaces/turnstile';
import { TurnstileGuard } from './guards/turnstile.guard';

@Global()
@Module({})
export class TurnstileModule {
  public static forRoot(options: ITurnstileOptions): DynamicModule {
    const TurnstileModuleOptionsProvider = {
      provide: 'TurnstileServiceOptions',
      useValue: options,
    };

    return {
      module: TurnstileModule,
      imports: [HttpModule],
      providers: [
        TurnstileGuard,
        TurnstileModuleOptionsProvider,
        TurnstileService,
      ],
      exports: [
        TurnstileGuard,
        TurnstileModuleOptionsProvider,
        TurnstileService,
      ],
    };
  }
}
