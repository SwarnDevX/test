import { nodeRegistry } from "@flowforge/nodes-sdk";

nodeRegistry.register({
  type: "logic.math",
  category: "LOGIC",
  label: "Math",
  description: "Perform mathematical operations",
  icon: "Hash",
  color: "oklch(80% 0.18 85)",
  inputs: [{ name: "input", label: "Input", type: "NUMBER" }],
  outputs: [{ name: "result", label: "Result", type: "NUMBER" }],
  parameters: [
    { name: "operation", label: "Operation", type: "select", options: ["add", "subtract", "multiply", "divide", "modulo", "power", "abs", "ceil", "floor", "round", "sqrt"], default: "add" },
    { name: "operand", label: "Operand", type: "number", default: 0 },
    { name: "expression", label: "Custom expression (overrides above)", type: "string", default: "" },
  ],
  executor: async (ctx) => {
    const expr = String(ctx.params.expression ?? "").trim();
    if (expr) {
      const resolved = ctx.resolveExpression(expr);
      const fn = new Function("inputs", "Math", `"use strict"; return (${resolved});`);
      const result = fn(ctx.inputs, Math) as number;
      return { result };
    }

    const input = Number((ctx.inputs.input as number | undefined) ?? (ctx.inputs.value as number | undefined) ?? 0);
    const operand = Number(ctx.params.operand ?? 0);
    const op = String(ctx.params.operation ?? "add");

    const ops: Record<string, number> = {
      add: input + operand,
      subtract: input - operand,
      multiply: input * operand,
      divide: operand !== 0 ? input / operand : NaN,
      modulo: input % operand,
      power: Math.pow(input, operand),
      abs: Math.abs(input),
      ceil: Math.ceil(input),
      floor: Math.floor(input),
      round: Math.round(input),
      sqrt: Math.sqrt(input),
    };

    return { result: ops[op] ?? 0, input, operand, operation: op };
  },
});
