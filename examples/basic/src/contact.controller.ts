import { Body, Controller, Post } from '@nestjs/common';
import { TurnstileCaptcha, TurnstileResult } from 'nest-cloudflare-turnstile';
import type { TurnstileVerifyResponse } from 'nest-cloudflare-turnstile';

@Controller('contact')
export class ContactController {
  @Post()
  @TurnstileCaptcha()
  send(
    @Body() body: { message?: string },
    @TurnstileResult() result: TurnstileVerifyResponse,
  ) {
    return { message: body.message, solvedOn: result.hostname };
  }
}
