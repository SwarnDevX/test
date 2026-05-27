import { nodeRegistry } from "@flowforge/nodes-sdk";

nodeRegistry.register({
  type: "logic.merge",
  category: "LOGIC",
  label: "Merge",
  description: "Merge outputs from multiple parallel branches",
  icon: "Merge",
  color: "oklch(80% 0.18 85)",
  inputs: [
    { name: "a", label: "Input A", type: "ANY" },
    { name: "b", label: "Input B", type: "ANY" },
    { name: "c", label: "Input C (optional)", type: "ANY" },
  ],
  outputs: [{ name: "output", label: "Merged Output", type: "JSON" }],
  parameters: [
    { name: "mode", label: "Merge mode", type: "select", options: ["shallow", "deep", "array"], default: "shallow" },
  ],
  executor: async (ctx) => {
    const { a, b, c } = ctx.inputs as { a?: unknown; b?: unknown; c?: unknown };
    const mode = String(ctx.params.mode ?? "shallow");

    if (mode === "array") {
      return { output: [a, b, c].filter((v) => v !== undefined) };
    }

    const merged = { ...toObject(a), ...toObject(b) };
    if (c !== undefined) Object.assign(merged, toObject(c));
    return merged;
  },
});

function toObject(v: unknown): Record<string, unknown> {
  if (v && typeof v === "object" && !Array.isArray(v)) return v as Record<string, unknown>;
  return {};
}
