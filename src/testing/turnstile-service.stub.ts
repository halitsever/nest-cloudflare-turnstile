import type { TurnstileVerifyResponse } from '../interfaces/turnstile';
import type { TurnstileService } from '../services/turnstile.service';

/** A named answer from Cloudflare's test keys, or a full verdict of your own. */
export type TurnstileStubVerdict =
  'pass' | 'fail' | 'spent' | TurnstileVerifyResponse;

// Shapes captured from siteverify with the 1x, 2x and 3x test secrets.
const VERDICTS = {
  pass: (): TurnstileVerifyResponse => ({
    success: true,
    challenge_ts: new Date().toISOString(),
    hostname: 'example.com',
    'error-codes': [],
    metadata: { result_with_testing_key: true },
  }),
  fail: (): TurnstileVerifyResponse => ({
    success: false,
    'error-codes': ['invalid-input-response'],
    messages: [],
    metadata: { result_with_testing_key: true },
  }),
  spent: (): TurnstileVerifyResponse => ({
    success: false,
    'error-codes': ['timeout-or-duplicate'],
    messages: [],
    metadata: { result_with_testing_key: true },
  }),
};

/**
 * Stands in for TurnstileService in your tests, without network calls:
 * `overrideProvider(TurnstileService).useValue(createTurnstileServiceStub('fail'))`.
 */
export function createTurnstileServiceStub(
  verdict: TurnstileStubVerdict = 'pass',
): TurnstileService {
  const answer = () =>
    typeof verdict === 'string'
      ? VERDICTS[verdict]()
      : structuredClone(verdict);
  return {
    validateToken: async () => answer(),
  } as unknown as TurnstileService;
}
