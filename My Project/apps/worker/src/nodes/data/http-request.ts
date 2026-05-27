import { nodeRegistry } from "@flowforge/nodes-sdk";

nodeRegistry.register({
  type: "data.httpRequest",
  category: "DATA",
  label: "HTTP Request",
  description: "Make an HTTP request to any REST API",
  icon: "Globe",
  color: "oklch(70% 0.15 200)",
  inputs: [{ name: "input", label: "Input", type: "ANY" }],
  outputs: [
    { name: "data", label: "Response Data", type: "JSON" },
    { name: "status", label: "Status Code", type: "NUMBER" },
    { name: "headers", label: "Response Headers", type: "JSON" },
  ],
  parameters: [
    { name: "url", label: "URL", type: "string", default: "https://api.example.com/endpoint" },
    { name: "method", label: "Method", type: "select", options: ["GET", "POST", "PUT", "PATCH", "DELETE"], default: "GET" },
    { name: "headers", label: "Headers (JSON)", type: "string", default: '{"Content-Type":"application/json"}' },
    { name: "body", label: "Body (JSON/expression)", type: "string", default: "" },
    { name: "timeout", label: "Timeout (ms)", type: "number", default: 30000 },
    { name: "authType", label: "Auth", type: "select", options: ["none", "bearer", "basic", "credential"], default: "none" },
    { name: "credentialId", label: "Credential ID", type: "string", default: "" },
  ],
  executor: async (ctx) => {
    const url = String(ctx.resolveExpression(String(ctx.params.url ?? "")));
    const method = String(ctx.params.method ?? "GET");
    const timeout = Number(ctx.params.timeout ?? 30_000);

    let headers: Record<string, string> = { "Content-Type": "application/json" };
    try {
      const raw = String(ctx.resolveExpression(String(ctx.params.headers ?? "{}")));
      headers = { ...headers, ...JSON.parse(raw) as Record<string, string> };
    } catch { /* keep defaults */ }

    // Auth
    const authType = String(ctx.params.authType ?? "none");
    if (authType === "bearer" && ctx.params.credentialId) {
      const cred = await ctx.getCredential(String(ctx.params.credentialId));
      headers["Authorization"] = `Bearer ${cred.apiKey ?? cred.token ?? ""}`;
    } else if (authType === "basic" && ctx.params.credentialId) {
      const cred = await ctx.getCredential(String(ctx.params.credentialId));
      const encoded = btoa(`${cred.username ?? ""}:${cred.password ?? ""}`);
      headers["Authorization"] = `Basic ${encoded}`;
    }

    let body: BodyInit | undefined;
    const bodyParam = String(ctx.params.body ?? "").trim();
    if (bodyParam && method !== "GET") {
      const resolved = String(ctx.resolveExpression(bodyParam));
      try {
        body = JSON.stringify(JSON.parse(resolved));
      } catch {
        body = resolved;
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    ctx.signal.addEventListener("abort", () => controller.abort());

    try {
      const res = await fetch(url, { method, headers, body, signal: controller.signal });
      clearTimeout(timeoutId);

      const responseHeaders = Object.fromEntries(res.headers.entries());
      const contentType = res.headers.get("content-type") ?? "";

      let data: unknown;
      if (contentType.includes("application/json")) {
        data = await res.json();
      } else {
        data = await res.text();
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}: ${JSON.stringify(data)}`);
      }

      return { data, status: res.status, headers: responseHeaders, ok: true };
    } finally {
      clearTimeout(timeoutId);
    }
  },
});
