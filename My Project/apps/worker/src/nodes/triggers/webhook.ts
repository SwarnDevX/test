import { nodeRegistry } from "@flowforge/nodes-sdk";

nodeRegistry.register({
  type: "trigger.webhook",
  category: "TRIGGER",
  label: "Webhook",
  description: "Triggered by an incoming HTTP webhook request",
  icon: "Webhook",
  color: "oklch(65% 0.18 240)",
  inputs: [],
  outputs: [
    { name: "body", label: "Body", type: "JSON" },
    { name: "headers", label: "Headers", type: "JSON" },
    { name: "query", label: "Query", type: "JSON" },
    { name: "method", label: "Method", type: "STRING" },
  ],
  parameters: [
    { name: "path", label: "Path", type: "string", default: "/webhook" },
    { name: "method", label: "HTTP Method", type: "select", options: ["POST", "GET", "PUT", "PATCH"], default: "POST" },
  ],
  executor: async (ctx) => {
    const trigger = ctx.inputs.trigger as { body?: unknown; headers?: unknown; query?: unknown; method?: string } | undefined;
    return {
      body: trigger?.body ?? {},
      headers: trigger?.headers ?? {},
      query: trigger?.query ?? {},
      method: trigger?.method ?? "POST",
    };
  },
});
