import { nodeRegistry } from "@flowforge/nodes-sdk";

nodeRegistry.register({
  type: "logic.setVariable",
  category: "LOGIC",
  label: "Set Variable",
  description: "Set a named variable that can be referenced downstream",
  icon: "Variable",
  color: "oklch(80% 0.18 85)",
  inputs: [{ name: "input", label: "Input", type: "ANY" }],
  outputs: [{ name: "output", label: "Output", type: "ANY" }],
  parameters: [
    { name: "variableName", label: "Variable name", type: "string", default: "myVariable" },
    { name: "value", label: "Value (expression)", type: "string", default: "{{input.result}}" },
  ],
  executor: async (ctx) => {
    const name = String(ctx.params.variableName ?? "variable");
    const valueExpr = String(ctx.params.value ?? "");
    const resolved = ctx.resolveExpression(valueExpr);

    return {
      [name]: resolved,
      variableName: name,
      variableValue: resolved,
    };
  },
});
