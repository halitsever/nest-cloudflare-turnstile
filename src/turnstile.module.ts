import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { TurnstileService } from './services/turnstile.service';
import { HttpModule } from '@nestjs/axios';
import {
  IAsyncTurnstileOptions,
  ITurnstileOptions,
} from './interfaces/turnstile';
import { TurnstileGuard } from './guards/turnstile.guard';

const TurnstileServiceOptionsToken = 'TurnstileServiceOptions';

const providers: Provider[] = [TurnstileGuard, TurnstileService];

@Global()
@Module({})
export class TurnstileModule {
  public static forRoot(options: ITurnstileOptions): DynamicModule {
    const TurnstileModuleOptionsProvider: Provider = {
      provide: TurnstileServiceOptionsToken,
      useValue: options,
    };

    return {
      module: TurnstileModule,
      imports: [HttpModule],
      providers: [...providers, TurnstileModuleOptionsProvider],
      exports: [...providers, TurnstileModuleOptionsProvider],
    };
  }

  public static forRootAsync({
    imports,
    inject,
    useFactory,
  }: IAsyncTurnstileOptions): DynamicModule {
    const TurnstileModuleOptionsProvider: Provider = {
      provide: TurnstileServiceOptionsToken,
      inject: inject || [],
      useFactory: useFactory,
    };

    return {
      module: TurnstileModule,
      imports: [...(imports || []), HttpModule],
      providers: [...providers, TurnstileModuleOptionsProvider],
      exports: [...providers, TurnstileModuleOptionsProvider],
    };
  }
}
