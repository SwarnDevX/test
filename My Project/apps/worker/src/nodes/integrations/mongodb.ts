import { nodeRegistry } from "@flowforge/nodes-sdk";

nodeRegistry.register({
  type: "integration.mongodb.find",
  category: "INTEGRATION",
  label: "MongoDB: Find",
  description: "Find documents in a MongoDB collection",
  icon: "Database",
  color: "oklch(65% 0.18 300)",
  inputs: [{ name: "input", label: "Input", type: "ANY" }],
  outputs: [{ name: "documents", label: "Documents", type: "JSON" }, { name: "count", label: "Count", type: "NUMBER" }],
  parameters: [
    { name: "credentialId", label: "MongoDB credential", type: "string", default: "" },
    { name: "database", label: "Database", type: "string", default: "" },
    { name: "collection", label: "Collection", type: "string", default: "" },
    { name: "filter", label: "Filter (JSON)", type: "string", default: "{}" },
    { name: "limit", label: "Limit", type: "number", default: 20 },
    { name: "sort", label: "Sort (JSON)", type: "string", default: "{}" },
  ],
  executor: async (ctx) => {
    const cred = await ctx.getCredential(String(ctx.params.credentialId));
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore — mongodb is an optional runtime dependency
    const { MongoClient } = await import("mongodb") as typeof import("mongodb");

    const client = new MongoClient(cred.connectionString ?? cred.url ?? "");
    await client.connect();

    try {
      const db = client.db(String(ctx.params.database ?? ""));
      const col = db.collection(String(ctx.params.collection ?? ""));

      let filter: Record<string, unknown> = {};
      try { filter = JSON.parse(String(ctx.resolveExpression(String(ctx.params.filter ?? "{}")))) as Record<string, unknown>; } catch { /* empty */ }

      let sort: Record<string, unknown> = {};
      try { sort = JSON.parse(String(ctx.params.sort ?? "{}")) as Record<string, unknown>; } catch { /* empty */ }

      const limit = Number(ctx.params.limit ?? 20);
      const cursor = col.find(filter).sort(sort).limit(limit);
      const documents = await cursor.toArray();
      return { documents, count: documents.length };
    } finally {
      await client.close();
    }
  },
});

nodeRegistry.register({
  type: "integration.mongodb.insertOne",
  category: "INTEGRATION",
  label: "MongoDB: Insert One",
  description: "Insert a document into a MongoDB collection",
  icon: "Database",
  color: "oklch(65% 0.18 300)",
  inputs: [{ name: "input", label: "Input", type: "ANY" }],
  outputs: [{ name: "result", label: "Result", type: "JSON" }],
  parameters: [
    { name: "credentialId", label: "MongoDB credential", type: "string", default: "" },
    { name: "database", label: "Database", type: "string", default: "" },
    { name: "collection", label: "Collection", type: "string", default: "" },
    { name: "document", label: "Document (JSON expression)", type: "string", default: "{{input}}" },
  ],
  executor: async (ctx) => {
    const cred = await ctx.getCredential(String(ctx.params.credentialId));
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore — mongodb is an optional runtime dependency
    const { MongoClient } = await import("mongodb") as typeof import("mongodb");
    const client = new MongoClient(cred.connectionString ?? cred.url ?? "");
    await client.connect();

    try {
      const db = client.db(String(ctx.params.database ?? ""));
      const col = db.collection(String(ctx.params.collection ?? ""));

      let document: Record<string, unknown> = {};
      try { document = JSON.parse(String(ctx.resolveExpression(String(ctx.params.document ?? "{}")))) as Record<string, unknown>; } catch { /* empty */ }

      const result = await col.insertOne(document);
      return { result, insertedId: result.insertedId.toString() };
    } finally {
      await client.close();
    }
  },
});
