import { nodeRegistry } from "@flowforge/nodes-sdk";

nodeRegistry.register({
  type: "logic.filter",
  category: "LOGIC",
  label: "Filter",
  description: "Filter array items by a condition",
  icon: "Filter",
  color: "oklch(80% 0.18 85)",
  inputs: [{ name: "items", label: "Items (array)", type: "JSON" }],
  outputs: [
    { name: "matched", label: "Matched", type: "JSON" },
    { name: "unmatched", label: "Unmatched", type: "JSON" },
    { name: "count", label: "Count", type: "NUMBER" },
  ],
  parameters: [
    { name: "condition", label: "Condition (JS: item => bool)", type: "string", default: "item.active === true" },
  ],
  executor: async (ctx) => {
    const rawItems = (ctx.inputs.items ?? ctx.inputs.input ?? []) as unknown[];
    const items = Array.isArray(rawItems) ? rawItems : [rawItems];
    const condition = String(ctx.params.condition ?? "true");

    const fn = new Function("item", "index", `"use strict"; return !!(${condition});`) as (item: unknown, idx: number) => boolean;

    const matched: unknown[] = [];
    const unmatched: unknown[] = [];

    for (let i = 0; i < items.length; i++) {
      try {
        if (fn(items[i], i)) matched.push(items[i]);
        else unmatched.push(items[i]);
      } catch {
        unmatched.push(items[i]);
      }
    }

    return { matched, unmatched, count: matched.length };
  },
});
