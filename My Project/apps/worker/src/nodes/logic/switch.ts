import { nodeRegistry } from "@flowforge/nodes-sdk";

nodeRegistry.register({
  type: "logic.switch",
  category: "LOGIC",
  label: "Switch",
  description: "Multi-way branch based on a value",
  icon: "GitBranch",
  color: "oklch(80% 0.18 85)",
  inputs: [{ name: "input", label: "Input", type: "ANY" }],
  outputs: [
    { name: "output", label: "Output", type: "ANY" },
    { name: "default", label: "Default", type: "ANY" },
  ],
  parameters: [
    { name: "expression", label: "Expression", type: "string", default: "{{input.status}}" },
    { name: "cases", label: "Cases (JSON)", type: "string", default: '{"success":"true","failed":"false"}' },
  ],
  executor: async (ctx) => {
    const expression = String(ctx.resolveExpression(String(ctx.params.expression ?? "")));
    const casesStr = String(ctx.params.cases ?? "{}");
    let cases: Record<string, string> = {};
    try { cases = JSON.parse(casesStr) as Record<string, string>; } catch { /* empty */ }

    const matched = cases[expression];
    return {
      __branch: matched ?? "default",
      value: expression,
      ...ctx.inputs,
    };
  },
});
