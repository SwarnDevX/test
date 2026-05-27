import { nodeRegistry } from "@flowforge/nodes-sdk";

nodeRegistry.register({
  type: "logic.loop",
  category: "LOGIC",
  label: "Loop",
  description: "Iterate over an array, emitting one item at a time",
  icon: "RefreshCcw",
  color: "oklch(80% 0.18 85)",
  inputs: [{ name: "items", label: "Items", type: "JSON" }],
  outputs: [
    { name: "item", label: "Current Item", type: "ANY" },
    { name: "index", label: "Index", type: "NUMBER" },
    { name: "isLast", label: "Is Last", type: "BOOLEAN" },
    { name: "results", label: "All Results", type: "JSON" },
  ],
  parameters: [
    { name: "concurrency", label: "Concurrency", type: "number", default: 1 },
    { name: "maxIterations", label: "Max Iterations", type: "number", default: 100 },
  ],
  executor: async (ctx) => {
    const rawItems = (ctx.inputs.items ?? ctx.inputs.input ?? []) as unknown[];
    const items = Array.isArray(rawItems) ? rawItems : [rawItems];
    const maxIterations = Math.min(Number(ctx.params.maxIterations ?? 100), 1000);
    const slice = items.slice(0, maxIterations);

    // In a real multi-step loop we'd emit sub-executions per item.
    // Here we return all items so downstream nodes receive the full set.
    return {
      item: slice[0],
      index: 0,
      isLast: slice.length <= 1,
      results: slice,
      total: slice.length,
    };
  },
});
