// @agentbay/shared — public API

// Errors
export {
  BaseError,
  ValidationError,
  AuthError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  PaymentError,
  RateLimitError,
  AgentExecutionError,
  OnchainError,
  InternalError,
  isBaseError,
  toBaseError,
} from './errors.js';

// Utils
export { generateId, isValidId } from './utils/ulid.js';
export { hashPii, hashString } from './utils/hash.js';

// Schemas
export {
  addressSchema,
  idSchema,
  paginationSchema,
  paginatedResponse,
  successResponse,
  errorResponse,
  bytes32Schema,
  supportedChainIdSchema,
} from './schemas/common.js';

export type { PaginationInput } from './schemas/common.js';

// Job types (BullMQ queue definitions shared between API and worker)
export {
  QUEUE_NAMES,
  TaskExecuteJobSchema,
  TaskSettleJobSchema,
  WebhookProcessJobSchema,
  DlqJobSchema,
} from './jobTypes.js';

export type {
  QueueName,
  TaskExecuteJob,
  TaskSettleJob,
  WebhookProcessJob,
  DlqJob,
} from './jobTypes.js';
