import { ExecutionContext, CanActivate, Injectable, Inject, InternalServerErrorException } from "@nestjs/common";
import { TurnstileService } from "../services/turnstile.service";
import { ITurnstileOptions } from "../interfaces/turnstile";
import { Messages } from "../constants/messages";

@Injectable()
export class TurnstileGuard implements CanActivate {
    constructor(private readonly turnstileService: TurnstileService,
        @Inject('TurnstileServiceOptions') private readonly options: ITurnstileOptions
    ) {

    }
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const responseToken = this.options.tokenResponse(request);
        if (!responseToken) throw new InternalServerErrorException(Messages.FAIL);
        const { success } = await this.turnstileService.validateToken(responseToken);
        if (!success) throw new InternalServerErrorException(Messages.FAIL)
        else return success;
    }
}

