import { nodeRegistry } from "@flowforge/nodes-sdk";

const AT_API = "https://api.airtable.com/v0";

async function atFetch(path: string, token: string, method = "GET", body?: unknown, signal?: AbortSignal) {
  const res = await fetch(`${AT_API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });
  if (!res.ok) throw new Error(`Airtable API ${res.status}: ${await res.text()}`);
  return res.json();
}

nodeRegistry.register({
  type: "integration.airtable.createRecord",
  category: "INTEGRATION",
  label: "Airtable: Create Record",
  description: "Create a new record in an Airtable table",
  icon: "Table",
  color: "oklch(65% 0.18 300)",
  inputs: [{ name: "input", label: "Input", type: "ANY" }],
  outputs: [{ name: "record", label: "Record", type: "JSON" }],
  parameters: [
    { name: "credentialId", label: "Airtable credential", type: "string", default: "" },
    { name: "baseId", label: "Base ID", type: "string", default: "" },
    { name: "tableId", label: "Table ID or name", type: "string", default: "" },
    { name: "fields", label: "Fields (JSON expression)", type: "string", default: "{{input}}" },
  ],
  executor: async (ctx) => {
    const cred = await ctx.getCredential(String(ctx.params.credentialId));
    const token = cred.apiKey ?? cred.token ?? "";
    const baseId = String(ctx.params.baseId ?? "");
    const tableId = String(ctx.params.tableId ?? "");

    let fields: Record<string, unknown> = {};
    try {
      const raw = ctx.resolveExpression(String(ctx.params.fields ?? "{}"));
      fields = typeof raw === "string" ? JSON.parse(raw) as Record<string, unknown> : raw as Record<string, unknown>;
    } catch { /* empty */ }

    const record = await atFetch(`/${baseId}/${tableId}`, token, "POST", { fields }, ctx.signal);
    return { record, id: (record as { id: string }).id };
  },
});

nodeRegistry.register({
  type: "integration.airtable.listRecords",
  category: "INTEGRATION",
  label: "Airtable: List Records",
  description: "List records from an Airtable table",
  icon: "Table",
  color: "oklch(65% 0.18 300)",
  inputs: [{ name: "input", label: "Input", type: "ANY" }],
  outputs: [{ name: "records", label: "Records", type: "JSON" }],
  parameters: [
    { name: "credentialId", label: "Airtable credential", type: "string", default: "" },
    { name: "baseId", label: "Base ID", type: "string", default: "" },
    { name: "tableId", label: "Table ID or name", type: "string", default: "" },
    { name: "filterFormula", label: "Filter formula", type: "string", default: "" },
    { name: "maxRecords", label: "Max records", type: "number", default: 100 },
  ],
  executor: async (ctx) => {
    const cred = await ctx.getCredential(String(ctx.params.credentialId));
    const token = cred.apiKey ?? cred.token ?? "";
    const baseId = String(ctx.params.baseId ?? "");
    const tableId = String(ctx.params.tableId ?? "");
    const maxRecords = Number(ctx.params.maxRecords ?? 100);
    const filterFormula = String(ctx.params.filterFormula ?? "").trim();

    const params = new URLSearchParams({ maxRecords: String(maxRecords) });
    if (filterFormula) params.set("filterByFormula", filterFormula);

    const result = await atFetch(`/${baseId}/${tableId}?${params}`, token, "GET", undefined, ctx.signal) as { records: unknown[] };
    return { records: result.records, count: result.records.length };
  },
});
