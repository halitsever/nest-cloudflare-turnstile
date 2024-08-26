import { DynamicModule, Module } from '@nestjs/common';
import { TurnstileService } from './services/turnstile.service';
import { HttpModule } from '@nestjs/axios';
import { ITurnstileOptions } from './interfaces/turnstile'
import { TurnstileGuard } from './guards/turnstile.guard'

@Module({
})
export class TurnstileModule {
  static forRoot(options: ITurnstileOptions): DynamicModule {

    const TurnstileModuleOptionsProvider =
    {
      provide: 'TurnstileServiceOptions',
      useValue: options
    };

    return {
      providers: [TurnstileModuleOptionsProvider, TurnstileService, TurnstileGuard],
      module: TurnstileModule,
      imports: [HttpModule],
      exports: [TurnstileModuleOptionsProvider, TurnstileService, TurnstileGuard]
    }
  }



}
