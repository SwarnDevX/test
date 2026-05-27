import { nodeRegistry } from "@flowforge/nodes-sdk";

nodeRegistry.register({
  type: "ai.documentLoader",
  category: "AI",
  label: "Document Loader",
  description: "Load text content from a URL, file path, or raw text",
  icon: "FileText",
  color: "oklch(65% 0.18 240)",
  inputs: [{ name: "input", label: "Input", type: "ANY" }],
  outputs: [
    { name: "text", label: "Text Content", type: "STRING" },
    { name: "metadata", label: "Metadata", type: "JSON" },
    { name: "wordCount", label: "Word Count", type: "NUMBER" },
  ],
  parameters: [
    { name: "source", label: "Source type", type: "select", options: ["url", "text", "expression"], default: "url" },
    { name: "url", label: "URL", type: "string", default: "" },
    { name: "text", label: "Text (for 'text' source)", type: "string", default: "" },
    { name: "expression", label: "Expression (for 'expression' source)", type: "string", default: "{{input.content}}" },
  ],
  executor: async (ctx) => {
    const source = String(ctx.params.source ?? "url");
    let text = "";
    let metadata: Record<string, unknown> = {};

    switch (source) {
      case "url": {
        const url = String(ctx.resolveExpression(String(ctx.params.url ?? "")));
        if (!url) throw new Error("URL is required");
        const res = await fetch(url, {
          headers: { "User-Agent": "FlowForge/1.0 document-loader" },
          signal: ctx.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status} loading URL`);
        const html = await res.text();
        text = stripHtml(html);
        metadata = { url, contentType: res.headers.get("content-type") ?? "" };
        break;
      }
      case "text": {
        text = String(ctx.resolveExpression(String(ctx.params.text ?? "")));
        break;
      }
      case "expression": {
        const expr = String(ctx.params.expression ?? "{{input.content}}");
        text = String(ctx.resolveExpression(expr));
        break;
      }
    }

    return {
      text,
      metadata,
      wordCount: text.split(/\s+/).filter(Boolean).length,
      charCount: text.length,
    };
  },
});

function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}
