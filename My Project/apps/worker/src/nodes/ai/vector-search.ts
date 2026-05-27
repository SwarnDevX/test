import { nodeRegistry } from "@flowforge/nodes-sdk";
import { prisma } from "@flowforge/db";

nodeRegistry.register({
  type: "ai.vectorSearch",
  category: "AI",
  label: "Vector Search",
  description: "Semantic search over a knowledge base using pgvector",
  icon: "Search",
  color: "oklch(65% 0.18 240)",
  inputs: [{ name: "query", label: "Query Text", type: "STRING" }],
  outputs: [
    { name: "results", label: "Results", type: "JSON" },
    { name: "context", label: "Concatenated Context", type: "STRING" },
  ],
  parameters: [
    { name: "knowledgeBaseId", label: "Knowledge Base ID", type: "string", default: "" },
    { name: "topK", label: "Top K results", type: "number", default: 5 },
    { name: "similarityThreshold", label: "Min similarity (0-1)", type: "number", default: 0.7 },
    { name: "embeddingModel", label: "Embedding model", type: "string", default: "text-embedding-3-small" },
    { name: "credentialId", label: "Credential ID", type: "string", default: "" },
  ],
  executor: async (ctx) => {
    const query = String(ctx.inputs.query ?? ctx.inputs.input ?? "");
    const knowledgeBaseId = String(ctx.params.knowledgeBaseId ?? "");
    const topK = Number(ctx.params.topK ?? 5);
    const threshold = Number(ctx.params.similarityThreshold ?? 0.7);
    const model = String(ctx.params.embeddingModel ?? "text-embedding-3-small");

    if (!knowledgeBaseId) throw new Error("knowledgeBaseId is required");

    // Get embedding for query
    let apiKey: string;
    if (ctx.params.credentialId) {
      const cred = await ctx.getCredential(String(ctx.params.credentialId));
      apiKey = cred.apiKey ?? "";
    } else {
      apiKey = ctx.env["OPENAI_API_KEY"] ?? "";
    }

    if (!apiKey) throw new Error("No API key for embeddings");

    const embRes = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, input: query }),
      signal: ctx.signal,
    });

    if (!embRes.ok) throw new Error(`Embedding API error: ${embRes.status}`);
    const embJson = await embRes.json() as { data: Array<{ embedding: number[] }> };
    const queryEmbedding = embJson.data[0]?.embedding ?? [];
    const embeddingStr = `[${queryEmbedding.join(",")}]`;

    // Vector similarity search
    const results = await prisma.$queryRaw<Array<{ id: string; content: string; chunk_index: number; similarity: number }>>`
      SELECT c.id, c.content, c.chunk_index,
             1 - (c.embedding <=> ${embeddingStr}::vector) AS similarity
      FROM chunks c
      INNER JOIN documents d ON d.id = c.document_id
      WHERE d.knowledge_base_id = ${knowledgeBaseId}
        AND 1 - (c.embedding <=> ${embeddingStr}::vector) > ${threshold}
      ORDER BY c.embedding <=> ${embeddingStr}::vector
      LIMIT ${topK}
    `;

    const context = results.map((r) => r.content).join("\n\n---\n\n");

    return {
      results,
      context,
      count: results.length,
      query,
    };
  },
});
