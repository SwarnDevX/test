import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // Database
  DATABASE_URL: z.string().url(),

  // Redis (BullMQ + pub/sub)
  REDIS_URL: z.string().url(),

  // AI
  ANTHROPIC_API_KEY: z.string().min(1),
  TAVILY_API_KEY: z.string().optional(),

  // Onchain
  BASE_SEPOLIA_RPC_URL: z.string().url(),
  BASE_MAINNET_RPC_URL: z.string().url().optional(),
  /** Platform operator wallet — used to call submitWork() on TaskEscrow on behalf of agents */
  OPERATOR_PRIVATE_KEY: z.string().regex(/^0x[0-9a-fA-F]{64}$/).optional(),
  CONTRACT_TASK_ESCROW_ADDRESS: z.string().regex(/^0x[0-9a-fA-F]{40}$/).optional(),
  CONTRACT_AGENT_REGISTRY_ADDRESS: z.string().regex(/^0x[0-9a-fA-F]{40}$/).optional(),
  CONTRACT_REPUTATION_REGISTRY_ADDRESS: z.string().regex(/^0x[0-9a-fA-F]{40}$/).optional(),
  CHAIN_ID: z.coerce.number().int().default(84532), // Base Sepolia

  // Worker tuning
  TASK_EXECUTE_CONCURRENCY: z.coerce.number().int().positive().default(5),
  TASK_SETTLE_CONCURRENCY: z.coerce.number().int().positive().default(3),
  WEBHOOK_PROCESS_CONCURRENCY: z.coerce.number().int().positive().default(10),

  // Observability
  SENTRY_DSN: z.string().url().optional(),
});

function loadEnv() {
  const result = schema.safeParse(process.env);
  if (!result.success) {
    process.stderr.write('❌ Invalid worker environment configuration:\n');
    for (const issue of result.error.issues) {
      process.stderr.write(`  ${issue.path.join('.')}: ${issue.message}\n`);
    }
    process.exit(1);
  }
  return result.data;
}

export const env = loadEnv();
export type WorkerEnv = typeof env;
