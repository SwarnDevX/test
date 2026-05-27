import { nodeRegistry } from "@flowforge/nodes-sdk";

nodeRegistry.register({
  type: "code.template",
  category: "CODE",
  label: "Template",
  description: "Render a Handlebars/mustache-style template",
  icon: "FileType",
  color: "oklch(65% 0.15 180)",
  inputs: [{ name: "input", label: "Input data", type: "ANY" }],
  outputs: [{ name: "output", label: "Rendered Output", type: "STRING" }],
  parameters: [
    {
      name: "template",
      label: "Template",
      type: "string",
      default: "Hello {{name}}, your result is: {{result}}",
    },
    {
      name: "outputFormat",
      label: "Output format",
      type: "select",
      options: ["text", "html", "markdown", "json"],
      default: "text",
    },
  ],
  executor: async (ctx) => {
    const template = String(ctx.params.template ?? "");
    const data = flattenData(ctx.inputs);

    // Simple mustache-style rendering: {{key}} and {{key.nested}}
    const rendered = template.replace(/\{\{([^}]+)\}\}/g, (_, path: string) => {
      const parts = path.trim().split(".");
      let val: unknown = data;
      for (const part of parts) {
        val = (val as Record<string, unknown>)?.[part];
      }
      if (val === undefined || val === null) return "";
      if (typeof val === "object") return JSON.stringify(val);
      return String(val);
    });

    return { output: rendered, format: ctx.params.outputFormat ?? "text" };
  },
});

function flattenData(inputs: Record<string, unknown>): Record<string, unknown> {
  const flat: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(inputs)) {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      Object.assign(flat, v);
    }
    flat[k] = v;
  }
  return flat;
}
