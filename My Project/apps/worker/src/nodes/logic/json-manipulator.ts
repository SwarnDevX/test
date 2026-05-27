import { nodeRegistry } from "@flowforge/nodes-sdk";

nodeRegistry.register({
  type: "logic.jsonManipulator",
  category: "LOGIC",
  label: "JSON",
  description: "Extract, transform, or reshape JSON data",
  icon: "Code",
  color: "oklch(80% 0.18 85)",
  inputs: [{ name: "input", label: "Input", type: "JSON" }],
  outputs: [{ name: "output", label: "Output", type: "JSON" }],
  parameters: [
    {
      name: "operation",
      label: "Operation",
      type: "select",
      options: ["extract", "merge", "pick", "omit", "set", "delete", "map", "expression"],
      default: "extract",
    },
    { name: "path", label: "JSON Path / Key", type: "string", default: "data.result" },
    { name: "expression", label: "JS Expression (for 'expression' mode)", type: "string", default: "input" },
    { name: "value", label: "Value (for 'set' mode)", type: "string", default: "" },
    { name: "keys", label: "Keys (comma-sep, for pick/omit)", type: "string", default: "id,name" },
  ],
  executor: async (ctx) => {
    const input = (ctx.inputs.input ?? ctx.inputs) as Record<string, unknown>;
    const operation = String(ctx.params.operation ?? "extract");
    const path = String(ctx.params.path ?? "");
    const keys = String(ctx.params.keys ?? "").split(",").map((k) => k.trim()).filter(Boolean);

    switch (operation) {
      case "extract": {
        const parts = path.split(".");
        let val: unknown = input;
        for (const part of parts) {
          val = (val as Record<string, unknown>)?.[part];
        }
        return { output: val, path };
      }
      case "merge": {
        const extra = ctx.params.value ? JSON.parse(String(ctx.params.value)) as Record<string, unknown> : {};
        return { output: { ...input, ...extra } };
      }
      case "pick": {
        const picked = Object.fromEntries(keys.map((k) => [k, input[k]]));
        return { output: picked };
      }
      case "omit": {
        const omitted = Object.fromEntries(Object.entries(input).filter(([k]) => !keys.includes(k)));
        return { output: omitted };
      }
      case "set": {
        const parts = path.split(".");
        const key = parts[parts.length - 1] ?? path;
        return { output: { ...input, [key]: ctx.resolveExpression(String(ctx.params.value ?? "")) } };
      }
      case "delete": {
        const without = { ...input };
        delete without[path];
        return { output: without };
      }
      case "expression": {
        const expr = String(ctx.params.expression ?? "input");
        const fn = new Function("input", "inputs", `"use strict"; return (${ctx.resolveExpression(expr)});`);
        return { output: fn(input, ctx.inputs) };
      }
      default:
        return { output: input };
    }
  },
});
