import { nodeRegistry } from "@flowforge/nodes-sdk";

nodeRegistry.register({
  type: "trigger.schedule",
  category: "TRIGGER",
  label: "Schedule",
  description: "Triggered on a cron schedule",
  icon: "Calendar",
  color: "oklch(80% 0.18 85)",
  inputs: [],
  outputs: [{ name: "output", label: "Output", type: "JSON" }],
  parameters: [
    { name: "cronExpression", label: "Cron Expression", type: "string", default: "0 9 * * 1-5" },
    { name: "timezone", label: "Timezone", type: "string", default: "UTC" },
  ],
  executor: async (ctx) => {
    const trigger = ctx.inputs.trigger as { scheduledJobId?: string; triggeredAt?: string } | undefined;
    return {
      scheduledJobId: trigger?.scheduledJobId,
      triggeredAt: trigger?.triggeredAt ?? new Date().toISOString(),
      cronExpression: ctx.params.cronExpression,
    };
  },
});
