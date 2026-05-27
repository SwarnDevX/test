// Error hierarchy for AgentBay. Every thrown error in the system must be one of these.
// Errors carry a stable `code` string (used in API responses) and HTTP status.
// Only catch-and-rethrow at system boundaries; never swallow.

export abstract class BaseError extends Error {
  abstract readonly code: string;
  abstract readonly httpStatus: number;

  constructor(
    message: string,
    public readonly context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = this.constructor.name;
    // Maintains proper stack trace in V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      ...(this.context != null ? { context: this.context } : {}),
    };
  }
}

export class ValidationError extends BaseError {
  readonly code = 'VALIDATION_ERROR';
  readonly httpStatus = 400;
}

export class AuthError extends BaseError {
  readonly code = 'AUTH_ERROR';
  readonly httpStatus = 401;
}

export class ForbiddenError extends BaseError {
  readonly code = 'FORBIDDEN';
  readonly httpStatus = 403;
}

export class NotFoundError extends BaseError {
  readonly code = 'NOT_FOUND';
  readonly httpStatus = 404;
}

export class ConflictError extends BaseError {
  readonly code = 'CONFLICT';
  readonly httpStatus = 409;
}

export class PaymentError extends BaseError {
  readonly code = 'PAYMENT_ERROR';
  readonly httpStatus = 402;
}

export class RateLimitError extends BaseError {
  readonly code = 'RATE_LIMIT_EXCEEDED';
  readonly httpStatus = 429;

  constructor(
    message = 'Too many requests',
    public readonly retryAfterMs?: number,
    context?: Record<string, unknown>,
  ) {
    super(message, context);
  }
}

export class AgentExecutionError extends BaseError {
  readonly code = 'AGENT_EXECUTION_ERROR';
  readonly httpStatus = 500;
}

export class OnchainError extends BaseError {
  readonly code = 'ONCHAIN_ERROR';
  readonly httpStatus = 502;
}

export class InternalError extends BaseError {
  readonly code = 'INTERNAL_ERROR';
  readonly httpStatus = 500;
}

export function isBaseError(err: unknown): err is BaseError {
  return err instanceof BaseError;
}

export function toBaseError(err: unknown): BaseError {
  if (isBaseError(err)) return err;
  if (err instanceof Error) return new InternalError(err.message);
  return new InternalError('An unexpected error occurred');
}
