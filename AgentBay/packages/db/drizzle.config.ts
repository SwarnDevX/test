import { defineConfig } from 'drizzle-kit';

// Drizzle Kit reads DATABASE_URL at migration-generation time.
// Set it in your shell or .env before running `pnpm migrate:generate`.
const databaseUrl = process.env['DATABASE_URL'];
if (!databaseUrl) {
  throw new Error('DATABASE_URL env var is required for drizzle-kit');
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema/index.ts',
  out: './migrations',
  dbCredentials: {
    url: databaseUrl,
  },
  verbose: true,
  strict: true,
});
