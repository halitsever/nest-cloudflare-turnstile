import {
  ExecutionContext,
  CanActivate,
  Injectable,
  Inject,
  BadRequestException,
} from '@nestjs/common';
import { TurnstileService } from '../services/turnstile.service';
import { ITurnstileOptions } from '../interfaces/turnstile';
import { Messages } from '../constants/messages';

@Injectable()
export class TurnstileGuard implements CanActivate {
  constructor(
    private readonly turnstileService: TurnstileService,
    @Inject('TurnstileServiceOptions')
    private readonly options: ITurnstileOptions,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    /**
     * Skip Cloudflare Turnstile validation if `skipIf` is true.
     * Useful for local development or testing environments where Turnstile is not needed.
     */
    const skipValidation = this.options?.skipIf === true;
    if (skipValidation) return true;

    const request = context.switchToHttp().getRequest();
    const responseToken = this.options.tokenResponse(request);
    if (!responseToken) throw new BadRequestException(Messages.MISSING);
    const { success } =
      await this.turnstileService.validateToken(responseToken);
    if (!success) throw new BadRequestException(Messages.INVALID);
    return success;
  }
}
