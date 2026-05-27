import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  PORT: z.coerce.number().int().min(1).max(65535).default(3002),

  REDIS_URL: z.string().url(),

  // Shared secret between the API (signs) and this service (verifies)
  REALTIME_JWT_SECRET: z.string().min(32),

  // Observability
  SENTRY_DSN: z.string().url().optional(),
});

function loadEnv() {
  const result = schema.safeParse(process.env);
  if (!result.success) {
    process.stderr.write('❌ Invalid realtime environment configuration:\n');
    for (const issue of result.error.issues) {
      process.stderr.write(`  ${issue.path.join('.')}: ${issue.message}\n`);
    }
    process.exit(1);
  }
  return result.data;
}

export const env = loadEnv();
export type RealtimeEnv = typeof env;
