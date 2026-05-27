// Validate all required environment variables at startup.
// The app refuses to boot if any required var is missing or malformed.
import { z } from 'zod';

const schema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),

  // Database
  DATABASE_URL: z.string().url(),

  // Redis
  REDIS_URL: z.string().url(),

  // Auth
  SESSION_SECRET: z.string().min(32),
  SESSION_TTL_SECONDS: z.coerce.number().int().positive().default(604800), // 7 days
  NONCE_TTL_SECONDS: z.coerce.number().int().positive().default(300),      // 5 min
  COOKIE_DOMAIN: z.string().optional(),

  // Onchain
  BASE_SEPOLIA_RPC_URL: z.string().url(),
  BASE_MAINNET_RPC_URL: z.string().url().optional(),
  CONTRACT_AGENT_REGISTRY_ADDRESS: z.string().regex(/^0x[0-9a-fA-F]{40}$/).optional(),
  CONTRACT_TASK_ESCROW_ADDRESS: z.string().regex(/^0x[0-9a-fA-F]{40}$/).optional(),
  CONTRACT_REPUTATION_REGISTRY_ADDRESS: z.string().regex(/^0x[0-9a-fA-F]{40}$/).optional(),

  // Auth — SIWE
  SIWE_DOMAIN: z.string().min(1).default('localhost'),

  // Realtime service — shared secret for short-lived JWTs
  REALTIME_JWT_SECRET: z.string().min(32).optional(),
  REALTIME_JWT_EXPIRES_IN: z.string().default('60s'),

  // Rate limits
  RATE_LIMIT_ANON_RPM: z.coerce.number().int().positive().default(60),
  RATE_LIMIT_AUTH_RPM: z.coerce.number().int().positive().default(600),

  // Agent runtime
  ANTHROPIC_API_KEY: z.string().min(1),
  TAVILY_API_KEY: z.string().optional(), // enables webSearch tool; agents work without it

  // x402 payments
  X402_RECIPIENT_ADDRESS: z.string().regex(/^0x[0-9a-fA-F]{40}$/).optional(),

  // Observability
  SENTRY_DSN: z.string().url().optional(),
  AXIOM_DATASET: z.string().optional(),
  AXIOM_TOKEN: z.string().optional(),
});

function loadEnv() {
  const result = schema.safeParse(process.env);
  if (!result.success) {
    process.stderr.write('❌ Invalid environment configuration:\n');
    for (const issue of result.error.issues) {
      process.stderr.write(`  ${issue.path.join('.')}: ${issue.message}\n`);
    }
    process.exit(1);
  }
  return result.data;
}

// Singleton — parsed once at module load time
export const env = loadEnv();
export type Env = typeof env;
