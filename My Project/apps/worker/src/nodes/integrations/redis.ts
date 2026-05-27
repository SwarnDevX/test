import { nodeRegistry } from "@flowforge/nodes-sdk";

nodeRegistry.register({
  type: "integration.redis.get",
  category: "INTEGRATION",
  label: "Redis: Get",
  description: "Get a value from Redis by key",
  icon: "Database",
  color: "oklch(65% 0.18 300)",
  inputs: [{ name: "input", label: "Input", type: "ANY" }],
  outputs: [{ name: "value", label: "Value", type: "ANY" }, { name: "exists", label: "Exists", type: "BOOLEAN" }],
  parameters: [
    { name: "credentialId", label: "Redis credential", type: "string", default: "" },
    { name: "key", label: "Key (expression)", type: "string", default: "{{input.key}}" },
    { name: "parseJson", label: "Parse JSON value", type: "boolean", default: true },
  ],
  executor: async (ctx) => {
    const { redis: workerRedis } = await import("../../redis.js");
    const key = String(ctx.resolveExpression(String(ctx.params.key ?? "")));
    const raw = await workerRedis.get(key);
    const exists = raw !== null;
    let value: unknown = raw;
    if (exists && ctx.params.parseJson) {
      try { value = JSON.parse(raw!); } catch { /* keep string */ }
    }
    return { value, exists };
  },
});

nodeRegistry.register({
  type: "integration.redis.set",
  category: "INTEGRATION",
  label: "Redis: Set",
  description: "Set a key-value pair in Redis",
  icon: "Database",
  color: "oklch(65% 0.18 300)",
  inputs: [{ name: "input", label: "Input", type: "ANY" }],
  outputs: [{ name: "result", label: "Result", type: "STRING" }],
  parameters: [
    { name: "credentialId", label: "Redis credential (leave blank to use default)", type: "string", default: "" },
    { name: "key", label: "Key (expression)", type: "string", default: "{{input.key}}" },
    { name: "value", label: "Value (expression)", type: "string", default: "{{input.value}}" },
    { name: "ttlSeconds", label: "TTL (seconds, 0 = no expiry)", type: "number", default: 0 },
  ],
  executor: async (ctx) => {
    const { redis: workerRedis } = await import("../../redis.js");
    const key = String(ctx.resolveExpression(String(ctx.params.key ?? "")));
    const valueExpr = ctx.resolveExpression(String(ctx.params.value ?? ""));
    const value = typeof valueExpr === "object" ? JSON.stringify(valueExpr) : String(valueExpr);
    const ttl = Number(ctx.params.ttlSeconds ?? 0);

    let result: string | null;
    if (ttl > 0) {
      result = await workerRedis.setex(key, ttl, value);
    } else {
      result = await workerRedis.set(key, value);
    }
    return { result: result ?? "OK", key };
  },
});
