import { afterAll, afterEach, beforeAll } from 'vitest';
import { server, siteverifyRequests } from './helpers/siteverify';

// Local requests from supertest must pass through; siteverify always has a handler.
beforeAll(() => server.listen({ onUnhandledFrame: 'bypass' }));

afterEach(() => {
  server.resetHandlers();
  siteverifyRequests.length = 0;
});

afterAll(() => server.close());
