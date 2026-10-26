import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

export const SITEVERIFY_URL =
  'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/** Production-shaped success, as documented by Cloudflare. */
export const verified = {
  success: true,
  challenge_ts: '2026-10-26T13:00:16.723Z',
  hostname: 'example.com',
  'error-codes': [],
  action: 'login',
  cdata: 'sessionid-123456789',
};

/** Captured from siteverify with the always-fails test secret. */
export const rejected = {
  success: false,
  'error-codes': ['invalid-input-response'],
  messages: [],
};

/** Captured from siteverify with a wrong secret; Cloudflare answers HTTP 400. */
export const wrongSecret = {
  success: false,
  'error-codes': ['invalid-input-secret'],
  messages: [],
};

export type SiteverifyReply =
  { body: Record<string, unknown>; status?: number } | 'network-error';

/** Every body that reached siteverify during the current test. */
export const siteverifyRequests: Array<Record<string, string>> = [];

export const server = setupServer(
  http.post(SITEVERIFY_URL, () => {
    throw new Error('siteverify was called but this test set no reply');
  }),
);

/** Answers siteverify calls with the replies in order; the last one repeats. */
export function siteverifyReplies(...replies: SiteverifyReply[]): void {
  let call = 0;
  server.use(
    http.post(SITEVERIFY_URL, async ({ request }) => {
      siteverifyRequests.push(await readBody(request));
      const reply = replies[Math.min(call++, replies.length - 1)];
      if (reply === 'network-error') return HttpResponse.error();
      return HttpResponse.json(reply.body, { status: reply.status ?? 200 });
    }),
  );
}

async function readBody(request: Request): Promise<Record<string, string>> {
  const type = request.headers.get('content-type') ?? '';
  if (type.includes('application/x-www-form-urlencoded')) {
    return Object.fromEntries(new URLSearchParams(await request.text()));
  }
  return (await request.json()) as Record<string, string>;
}
