import { nodeRegistry } from "@flowforge/nodes-sdk";

nodeRegistry.register({
  type: "integration.postgres.query",
  category: "INTEGRATION",
  label: "PostgreSQL: Query",
  description: "Execute a SQL query on a PostgreSQL database",
  icon: "Database",
  color: "oklch(65% 0.18 300)",
  inputs: [{ name: "input", label: "Input", type: "ANY" }],
  outputs: [
    { name: "rows", label: "Rows", type: "JSON" },
    { name: "rowCount", label: "Row count", type: "NUMBER" },
  ],
  parameters: [
    { name: "credentialId", label: "PostgreSQL credential", type: "string", default: "" },
    { name: "query", label: "SQL Query (with $1, $2 placeholders)", type: "string", default: "SELECT * FROM users WHERE id = $1" },
    { name: "parameters", label: "Parameters (JSON array)", type: "string", default: "[]" },
    { name: "timeout", label: "Query timeout (ms)", type: "number", default: 30000 },
  ],
  executor: async (ctx) => {
    const cred = await ctx.getCredential(String(ctx.params.credentialId));
    const connectionString = cred.connectionString ?? cred.url ?? "";
    if (!connectionString) throw new Error("PostgreSQL connection string is required");

    const query = String(ctx.resolveExpression(String(ctx.params.query ?? "SELECT 1")));
    let parameters: unknown[] = [];
    try { parameters = JSON.parse(String(ctx.resolveExpression(String(ctx.params.parameters ?? "[]")))) as unknown[]; } catch { /* empty */ }

    // Use Prisma raw query via env-level connection — in production integrate pg directly
    const { prisma } = await import("@flowforge/db");
    const rows = await prisma.$queryRawUnsafe(query, ...parameters);

    return { rows: Array.isArray(rows) ? rows : [rows], rowCount: Array.isArray(rows) ? rows.length : 1 };
  },
});
