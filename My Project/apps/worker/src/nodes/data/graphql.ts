import { nodeRegistry } from "@flowforge/nodes-sdk";

nodeRegistry.register({
  type: "data.graphql",
  category: "DATA",
  label: "GraphQL",
  description: "Execute a GraphQL query or mutation",
  icon: "Braces",
  color: "oklch(70% 0.15 200)",
  inputs: [{ name: "input", label: "Input", type: "ANY" }],
  outputs: [
    { name: "data", label: "Data", type: "JSON" },
    { name: "errors", label: "Errors", type: "JSON" },
  ],
  parameters: [
    { name: "endpoint", label: "Endpoint URL", type: "string", default: "https://api.example.com/graphql" },
    { name: "query", label: "Query", type: "string", default: "query { viewer { login } }" },
    { name: "variables", label: "Variables (JSON)", type: "string", default: "{}" },
    { name: "headers", label: "Headers (JSON)", type: "string", default: "{}" },
    { name: "credentialId", label: "Credential ID", type: "string", default: "" },
  ],
  executor: async (ctx) => {
    const endpoint = String(ctx.resolveExpression(String(ctx.params.endpoint ?? "")));
    const query = String(ctx.resolveExpression(String(ctx.params.query ?? "")));
    const variablesStr = String(ctx.resolveExpression(String(ctx.params.variables ?? "{}")));
    let variables: Record<string, unknown> = {};
    try { variables = JSON.parse(variablesStr) as Record<string, unknown>; } catch { /* empty */ }

    let headers: Record<string, string> = { "Content-Type": "application/json" };
    try {
      const raw = String(ctx.resolveExpression(String(ctx.params.headers ?? "{}")));
      headers = { ...headers, ...JSON.parse(raw) as Record<string, string> };
    } catch { /* keep defaults */ }

    if (ctx.params.credentialId) {
      const cred = await ctx.getCredential(String(ctx.params.credentialId));
      headers["Authorization"] = `Bearer ${cred.apiKey ?? cred.token ?? ""}`;
    }

    const res = await fetch(String(endpoint), {
      method: "POST",
      headers,
      body: JSON.stringify({ query, variables }),
      signal: ctx.signal,
    });

    if (!res.ok) {
      throw new Error(`GraphQL HTTP error: ${res.status} ${res.statusText}`);
    }

    const json = await res.json() as { data?: unknown; errors?: unknown[] };

    if (json.errors?.length) {
      ctx.logger.warn(`GraphQL returned ${json.errors.length} error(s)`);
    }

    return { data: json.data, errors: json.errors ?? [] };
  },
});
