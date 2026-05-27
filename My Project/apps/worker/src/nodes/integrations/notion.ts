import { nodeRegistry } from "@flowforge/nodes-sdk";

const NOTION_API = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";

async function notionFetch(path: string, token: string, method = "GET", body?: unknown, signal?: AbortSignal) {
  const res = await fetch(`${NOTION_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });
  if (!res.ok) throw new Error(`Notion API ${res.status}: ${await res.text()}`);
  return res.json();
}

nodeRegistry.register({
  type: "integration.notion.createPage",
  category: "INTEGRATION",
  label: "Notion: Create Page",
  description: "Create a new Notion page in a database",
  icon: "FileText",
  color: "oklch(65% 0.18 300)",
  inputs: [{ name: "input", label: "Input", type: "ANY" }],
  outputs: [{ name: "page", label: "Created Page", type: "JSON" }],
  parameters: [
    { name: "credentialId", label: "Notion credential", type: "string", default: "" },
    { name: "databaseId", label: "Database ID", type: "string", default: "" },
    { name: "title", label: "Title (expression)", type: "string", default: "{{input.title}}" },
    { name: "properties", label: "Properties (JSON)", type: "string", default: "{}" },
    { name: "content", label: "Page content (Markdown)", type: "string", default: "" },
  ],
  executor: async (ctx) => {
    const cred = await ctx.getCredential(String(ctx.params.credentialId));
    const token = cred.token ?? cred.apiKey ?? "";
    const databaseId = String(ctx.params.databaseId ?? "");
    const title = String(ctx.resolveExpression(String(ctx.params.title ?? "")));

    let extraProps: Record<string, unknown> = {};
    try { extraProps = JSON.parse(String(ctx.resolveExpression(String(ctx.params.properties ?? "{}")))) as Record<string, unknown>; } catch { /* empty */ }

    const properties: Record<string, unknown> = {
      title: { title: [{ text: { content: title } }] },
      ...extraProps,
    };

    const body: Record<string, unknown> = {
      parent: { database_id: databaseId },
      properties,
    };

    const contentStr = String(ctx.params.content ?? "").trim();
    if (contentStr) {
      body.children = [{
        object: "block",
        type: "paragraph",
        paragraph: { rich_text: [{ type: "text", text: { content: ctx.resolveExpression(contentStr) } }] },
      }];
    }

    const page = await notionFetch("/pages", token, "POST", body, ctx.signal);
    return { page, url: (page as { url: string }).url, id: (page as { id: string }).id };
  },
});

nodeRegistry.register({
  type: "integration.notion.queryDatabase",
  category: "INTEGRATION",
  label: "Notion: Query Database",
  description: "Query a Notion database with filters",
  icon: "Database",
  color: "oklch(65% 0.18 300)",
  inputs: [{ name: "input", label: "Input", type: "ANY" }],
  outputs: [{ name: "results", label: "Results", type: "JSON" }],
  parameters: [
    { name: "credentialId", label: "Notion credential", type: "string", default: "" },
    { name: "databaseId", label: "Database ID", type: "string", default: "" },
    { name: "filter", label: "Filter (Notion filter JSON)", type: "string", default: "{}" },
    { name: "pageSize", label: "Page size", type: "number", default: 20 },
  ],
  executor: async (ctx) => {
    const cred = await ctx.getCredential(String(ctx.params.credentialId));
    const token = cred.token ?? cred.apiKey ?? "";
    const databaseId = String(ctx.params.databaseId ?? "");
    let filter: Record<string, unknown> | undefined;
    try {
      const parsed = JSON.parse(String(ctx.params.filter ?? "{}")) as Record<string, unknown>;
      if (Object.keys(parsed).length > 0) filter = parsed;
    } catch { /* empty */ }

    const body: Record<string, unknown> = { page_size: Number(ctx.params.pageSize ?? 20) };
    if (filter) body.filter = filter;

    const result = await notionFetch(`/databases/${databaseId}/query`, token, "POST", body, ctx.signal) as { results: unknown[]; has_more: boolean };
    return { results: result.results, count: result.results.length, hasMore: result.has_more };
  },
});
