import { createHash } from 'node:crypto';

// Hash PII (emails, IPs) before logging so they never appear in plain text in log sinks.
export function hashPii(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 16);
}

// Stable deterministic hash for any string value (non-cryptographic use: cache keys, etc.)
export function hashString(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}
