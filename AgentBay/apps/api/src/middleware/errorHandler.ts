import type { Context } from 'hono';
import { isBaseError, toBaseError, InternalError } from '@agentbay/shared';
import { errorResponse } from '@agentbay/shared';
import { logger } from './logger.js';

// Global Hono error handler. Registered via `app.onError()`.
// Converts all thrown errors — BaseError subclasses or unknown — into the
// standard `{ ok: false, error: { code, message, requestId } }` shape.
export function onError(err: Error, c: Context): Response {
  const requestId = (c.get('requestId') as string | undefined) ?? 'unknown';
  const base = isBaseError(err) ? err : toBaseError(err);

  // Log at warn for client errors, error for server errors
  const level = base.httpStatus >= 500 ? 'error' : 'warn';
  logger[level]({
    requestId,
    code: base.code,
    message: base.message,
    httpStatus: base.httpStatus,
    ...(base.httpStatus >= 500 ? { stack: base.stack } : {}),
  });

  return c.json(
    errorResponse({ code: base.code, message: base.message, requestId }),
    base.httpStatus as Parameters<typeof c.json>[1],
  );
}

// 404 handler — registered via `app.notFound()`
export function onNotFound(c: Context): Response {
  const requestId = (c.get('requestId') as string | undefined) ?? 'unknown';
  const err = new (class extends InternalError {
    override readonly code = 'NOT_FOUND';
    override readonly httpStatus = 404;
  })(`Route not found: ${c.req.method} ${c.req.path}`);

  return c.json(
    errorResponse({ code: err.code, message: err.message, requestId }),
    404,
  );
}
