import { HttpService } from '@nestjs/axios';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { firstValueFrom, catchError } from 'rxjs';
import { ITurnstileOptions } from '../interfaces/turnstile';

@Injectable()
export class TurnstileService {
  private readonly BASE_URL = 'https://challenges.cloudflare.com';

  constructor(
    private readonly httpService: HttpService,
    @Inject('TurnstileServiceOptions')
    private readonly options: ITurnstileOptions,
  ) {}

  async validateToken(token: string) {
    const { data } = await firstValueFrom(
      this.httpService
        .post(`${this.BASE_URL}/turnstile/v0/siteverify`, {
          response: token,
          secret: this.options.secretKey,
          headers: {
            'content-type': 'application/x-www-form-urlencoded',
          },
        })
        .pipe(
          catchError((error) => {
            if (this.options.onError) this.options.onError(error);

            throw new InternalServerErrorException(
              'Failed turnstile verification.',
            );
          }),
        ),
    );

    return data;
  }
}
