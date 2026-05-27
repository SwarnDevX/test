import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index.js';

// Connection pool shared across the process.
// Never call this in a serverless context — use a single connection per invocation instead.
let _client: ReturnType<typeof drizzle<typeof schema>> | null = null;
let _pool: postgres.Sql | null = null;

export function getDb(databaseUrl?: string): ReturnType<typeof drizzle<typeof schema>> {
  if (_client != null) return _client;

  const url = databaseUrl ?? process.env['DATABASE_URL'];
  if (!url) throw new Error('DATABASE_URL is required');

  _pool = postgres(url, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: true, // prepared statements for hot paths
  });

  _client = drizzle(_pool, { schema });
  return _client;
}

export async function closeDb(): Promise<void> {
  if (_pool != null) {
    await _pool.end();
    _pool = null;
    _client = null;
  }
}

export type Db = ReturnType<typeof getDb>;
