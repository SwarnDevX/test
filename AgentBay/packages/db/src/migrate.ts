// Run pending Drizzle migrations against the target database.
// Called by: `pnpm --filter @agentbay/db migrate`
// Or directly in CI: `node dist/migrate.js`
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const databaseUrl = process.env['DATABASE_URL'];
if (!databaseUrl) {
  process.stderr.write('DATABASE_URL env var is required\n');
  process.exit(1);
}

// Use a single connection for migrations (not a pool)
const sql = postgres(databaseUrl, { max: 1 });
const db = drizzle(sql);

process.stdout.write('Running migrations...\n');

await migrate(db, {
  migrationsFolder: join(__dirname, '..', 'migrations'),
});

process.stdout.write('Migrations complete.\n');
await sql.end();
