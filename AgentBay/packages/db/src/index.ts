// @agentbay/db — public API

// DB client
export { getDb, closeDb } from './client.js';
export type { Db } from './client.js';

// All schema tables, enums, relations, and inferred types
export * from './schema/index.js';
