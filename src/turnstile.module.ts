import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { TurnstileService } from './services/turnstile.service';
import {
  IAsyncTurnstileOptions,
  ITurnstileOptions,
} from './interfaces/turnstile';
import { TurnstileGuard } from './guards/turnstile.guard';
import { TURNSTILE_OPTIONS } from './constants/tokens';

const providers: Provider[] = [TurnstileGuard, TurnstileService];

@Global()
@Module({})
export class TurnstileModule {
  public static forRoot(options: ITurnstileOptions): DynamicModule {
    const TurnstileModuleOptionsProvider: Provider = {
      provide: TURNSTILE_OPTIONS,
      useValue: options,
    };

    return {
      module: TurnstileModule,
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
      provide: TURNSTILE_OPTIONS,
      inject: inject || [],
      useFactory: useFactory,
    };

    return {
      module: TurnstileModule,
      imports: imports || [],
      providers: [...providers, TurnstileModuleOptionsProvider],
      exports: [...providers, TurnstileModuleOptionsProvider],
    };
  }
}
