import { nodeRegistry } from "@flowforge/nodes-sdk";

nodeRegistry.register({
  type: "integration.mysql.query",
  category: "INTEGRATION",
  label: "MySQL: Query",
  description: "Execute a SQL query on a MySQL database",
  icon: "Database",
  color: "oklch(65% 0.18 300)",
  inputs: [{ name: "input", label: "Input", type: "ANY" }],
  outputs: [
    { name: "rows", label: "Rows", type: "JSON" },
    { name: "rowCount", label: "Row count", type: "NUMBER" },
  ],
  parameters: [
    { name: "credentialId", label: "MySQL credential", type: "string", default: "" },
    { name: "query", label: "SQL Query (with ? placeholders)", type: "string", default: "SELECT * FROM users WHERE id = ?" },
    { name: "parameters", label: "Parameters (JSON array)", type: "string", default: "[]" },
  ],
  executor: async (ctx) => {
    ctx.logger.warn("MySQL node requires 'mysql2' package to be installed in worker dependencies.");
    const cred = await ctx.getCredential(String(ctx.params.credentialId));
    const query = String(ctx.resolveExpression(String(ctx.params.query ?? "SELECT 1")));
    let parameters: unknown[] = [];
    try { parameters = JSON.parse(String(ctx.resolveExpression(String(ctx.params.parameters ?? "[]")))) as unknown[]; } catch { /* empty */ }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore — mysql2 is an optional runtime dependency
    const mysql2 = await import("mysql2/promise") as typeof import("mysql2/promise");
    const conn = await mysql2.createConnection(cred.connectionString ?? cred.url ?? "");
    try {
      const [rows] = await conn.execute(query, parameters);
      return { rows: Array.isArray(rows) ? rows : [rows], rowCount: Array.isArray(rows) ? rows.length : 1 };
    } finally {
      await conn.end();
    }
  },
});
