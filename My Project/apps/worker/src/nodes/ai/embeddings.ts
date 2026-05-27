import { nodeRegistry } from "@flowforge/nodes-sdk";

nodeRegistry.register({
  type: "ai.embeddings",
  category: "AI",
  label: "Embeddings",
  description: "Convert text to vector embeddings",
  icon: "Sparkles",
  color: "oklch(65% 0.18 240)",
  inputs: [{ name: "text", label: "Text", type: "STRING" }],
  outputs: [
    { name: "embedding", label: "Embedding Vector", type: "VECTOR" },
    { name: "dimensions", label: "Dimensions", type: "NUMBER" },
  ],
  parameters: [
    { name: "model", label: "Model", type: "string", default: "text-embedding-3-small" },
    { name: "credentialId", label: "Credential ID", type: "string", default: "" },
  ],
  executor: async (ctx) => {
    const text = String(ctx.inputs.text ?? ctx.inputs.input ?? "");
    const model = String(ctx.params.model ?? "text-embedding-3-small");

    let apiKey: string;
    if (ctx.params.credentialId) {
      const cred = await ctx.getCredential(String(ctx.params.credentialId));
      apiKey = cred.apiKey ?? "";
    } else {
      apiKey = ctx.env["OPENAI_API_KEY"] ?? "";
    }

    if (!apiKey) throw new Error("No API key for embeddings");

    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, input: text }),
      signal: ctx.signal,
    });

    if (!res.ok) throw new Error(`Embeddings API error: ${res.status}`);

    const json = await res.json() as { data: Array<{ embedding: number[] }>; usage: { total_tokens: number } };
    const embedding = json.data[0]?.embedding ?? [];

    return {
      embedding,
      dimensions: embedding.length,
      __tokens: json.usage.total_tokens,
      __model: model,
    };
  },
});
