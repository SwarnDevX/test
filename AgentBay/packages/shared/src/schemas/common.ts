import { z } from 'zod';

// Ethereum address (checksummed or lowercased — validated as hex, not checksummed here)
export const addressSchema = z
  .string()
  .regex(/^0x[0-9a-fA-F]{40}$/, 'Invalid Ethereum address');

// ULID primary key
export const idSchema = z
  .string()
  .regex(/^[0-9A-HJKMNP-TV-Z]{26}$/, 'Invalid ID format');

// Pagination
export const paginationSchema = z.object({
  cursor: idSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

// Standard paginated response wrapper
export function paginatedResponse<T>(
  data: T[],
  limit: number,
): { data: T[]; nextCursor: string | null } {
  const hasMore = data.length > limit;
  const sliced = hasMore ? data.slice(0, limit) : data;
  const lastItem = sliced.at(-1);

  let nextCursor: string | null = null;
  if (hasMore && lastItem != null && typeof lastItem === 'object' && 'id' in lastItem) {
    nextCursor = String((lastItem as { id: unknown }).id);
  }
  return { data: sliced, nextCursor };
}

// Successful API response shape: { ok: true, data }
export function successResponse<T>(data: T): { ok: true; data: T } {
  return { ok: true, data };
}

// Error API response shape: { ok: false, error: { code, message, requestId } }
export function errorResponse(opts: {
  code: string;
  message: string;
  requestId: string;
}): { ok: false; error: { code: string; message: string; requestId: string } } {
  return { ok: false, error: opts };
}

// Bytes32 hex string
export const bytes32Schema = z
  .string()
  .regex(/^0x[0-9a-fA-F]{64}$/, 'Invalid bytes32');

// Chain IDs we support
export const supportedChainIdSchema = z.union([
  z.literal(84532), // Base Sepolia
  z.literal(8453),  // Base Mainnet
]);
