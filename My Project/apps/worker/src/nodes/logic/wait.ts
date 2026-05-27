import { nodeRegistry } from "@flowforge/nodes-sdk";

nodeRegistry.register({
  type: "logic.wait",
  category: "LOGIC",
  label: "Wait",
  description: "Pause execution for a given duration",
  icon: "Timer",
  color: "oklch(80% 0.18 85)",
  inputs: [{ name: "input", label: "Input", type: "ANY" }],
  outputs: [{ name: "output", label: "Output", type: "ANY" }],
  parameters: [
    { name: "durationMs", label: "Duration (ms)", type: "number", default: 1000 },
  ],
  executor: async (ctx) => {
    const ms = Math.min(Number(ctx.params.durationMs ?? 1000), 300_000); // max 5min
    await new Promise((resolve, reject) => {
      const id = setTimeout(resolve, ms);
      ctx.signal.addEventListener("abort", () => { clearTimeout(id); reject(new Error("Aborted")); });
    });
    return { waited: ms, ...toPassthrough(ctx.inputs.input) };
  },
});

function toPassthrough(v: unknown): Record<string, unknown> {
  if (v && typeof v === "object" && !Array.isArray(v)) return v as Record<string, unknown>;
  return { value: v };
}
