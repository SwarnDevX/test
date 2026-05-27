import { nodeRegistry } from "@flowforge/nodes-sdk";

nodeRegistry.register({
  type: "trigger.manual",
  category: "TRIGGER",
  label: "Manual Trigger",
  description: "Manually trigger the workflow from the editor or API",
  icon: "Zap",
  color: "oklch(72% 0.17 145)",
  inputs: [],
  outputs: [{ name: "output", label: "Output", type: "ANY" }],
  parameters: [],
  executor: async (ctx) => {
    const trigger = ctx.inputs["trigger"];
    return {
      triggeredAt: new Date().toISOString(),
      triggeredBy: "manual",
      ...(trigger && typeof trigger === "object" ? trigger as Record<string, unknown> : {}),
    };
  },
});
