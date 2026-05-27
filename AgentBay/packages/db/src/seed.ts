// Seed the database with minimal test data for local development.
// Run: pnpm --filter @agentbay/db seed
// WARNING: Do not run in production — seed data uses fixed well-known wallet addresses.
import { getDb, closeDb } from './client.js';
import { users, agents } from './schema/index.js';

const db = getDb();

process.stdout.write('Seeding database...\n');

// Seed users
const [alice] = await db
  .insert(users)
  .values({
    walletAddress: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266', // Anvil account #0
    displayName: 'Alice (Dev)',
    isAdmin: true,
  })
  .onConflictDoNothing()
  .returning();

const [bob] = await db
  .insert(users)
  .values({
    walletAddress: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8', // Anvil account #1
    displayName: 'Bob (Agent Owner)',
  })
  .onConflictDoNothing()
  .returning();

if (alice != null) {
  process.stdout.write(`Created user: ${alice.id} (Alice)\n`);
}

if (bob != null) {
  // Seed a demo agent owned by Bob
  const [researchAgent] = await db
    .insert(agents)
    .values({
      ownerId: bob.id,
      name: 'Researcher v1',
      description: 'Searches the web and synthesises long-form research reports.',
      capabilities: ['research', 'summarize', 'web_search'],
    })
    .onConflictDoNothing()
    .returning();

  if (researchAgent != null) {
    process.stdout.write(`Created agent: ${researchAgent.id} (Researcher v1)\n`);
  }

  process.stdout.write(`Created user: ${bob.id} (Bob)\n`);
}

process.stdout.write('Seed complete.\n');
await closeDb();
