// Sets minimum required env vars so env.ts doesn't exit(1) during tests.
// Tests that need a real DB must have DATABASE_URL set externally (e.g. in .env.test).
process.env['NODE_ENV'] ??= 'test';
process.env['DATABASE_URL'] ??= 'postgresql://postgres:postgres@localhost:5432/agentbay_test';
process.env['REDIS_URL'] ??= 'redis://localhost:6379/1';
process.env['SESSION_SECRET'] ??= 'test-secret-at-least-32-characters-long!!';
process.env['BASE_SEPOLIA_RPC_URL'] ??= 'https://sepolia.base.org';
process.env['ANTHROPIC_API_KEY'] ??= 'sk-ant-test';
process.env['SIWE_DOMAIN'] ??= 'localhost';
