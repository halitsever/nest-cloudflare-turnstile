import { Module } from '@nestjs/common';
import { TurnstileModule } from 'nest-cloudflare-turnstile';
import { ContactController } from './contact.controller';

/** Cloudflare's test secret that accepts every token. */
const ALWAYS_PASSES = '1x0000000000000000000000000000000AA';

@Module({
  imports: [
    TurnstileModule.forRoot({
      secretKey: process.env.TURNSTILE_SECRET_KEY ?? ALWAYS_PASSES,
    }),
  ],
  controllers: [ContactController],
})
export class AppModule {}
