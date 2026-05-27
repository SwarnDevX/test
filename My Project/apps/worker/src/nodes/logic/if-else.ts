import { nodeRegistry } from "@flowforge/nodes-sdk";

nodeRegistry.register({
  type: "logic.ifElse",
  category: "LOGIC",
  label: "If / Else",
  description: "Branch execution based on a condition",
  icon: "GitBranch",
  color: "oklch(80% 0.18 85)",
  inputs: [{ name: "input", label: "Input", type: "ANY" }],
  outputs: [
    { name: "true", label: "True", type: "ANY" },
    { name: "false", label: "False", type: "ANY" },
  ],
  parameters: [
    { name: "condition", label: "Condition (JS expression)", type: "string", default: "input.value > 0" },
  ],
  executor: async (ctx) => {
    const condition = String(ctx.params.condition ?? "false");
    const resolvedCondition = ctx.resolveExpression(condition);

    const fn = new Function("inputs", "env", `"use strict"; try { return !!(${resolvedCondition}); } catch { return false; }`);
    const result = fn(ctx.inputs, ctx.env) as boolean;

    return {
      __branch: result ? "true" : "false",
      result,
      ...ctx.inputs,
    };
  },
});
