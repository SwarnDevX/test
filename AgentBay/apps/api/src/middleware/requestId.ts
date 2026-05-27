import { createMiddleware } from 'hono/factory';
import { ulid } from 'ulid';

// Generates a ULID request ID, stores it in context variables, and echoes it
// as an X-Request-Id response header. Downstream middleware and handlers read
// it via c.get('requestId').
export const requestIdMiddleware = createMiddleware(async (c, next) => {
  const requestId = ulid();
  c.set('requestId', requestId);
  c.header('X-Request-Id', requestId);
  await next();
});
