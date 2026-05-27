import { nodeRegistry } from "@flowforge/nodes-sdk";

const SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets";

async function sheetsFetch(path: string, token: string, method = "GET", body?: unknown, signal?: AbortSignal) {
  const res = await fetch(`${SHEETS_API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });
  if (!res.ok) throw new Error(`Google Sheets API ${res.status}: ${await res.text()}`);
  return res.json();
}

nodeRegistry.register({
  type: "integration.googleSheets.appendRow",
  category: "INTEGRATION",
  label: "Google Sheets: Append Row",
  description: "Append a row to a Google Sheets spreadsheet",
  icon: "Table",
  color: "oklch(65% 0.18 300)",
  inputs: [{ name: "input", label: "Input", type: "ANY" }],
  outputs: [{ name: "result", label: "Result", type: "JSON" }],
  parameters: [
    { name: "credentialId", label: "Google credential (OAuth2)", type: "string", default: "" },
    { name: "spreadsheetId", label: "Spreadsheet ID", type: "string", default: "" },
    { name: "range", label: "Range (e.g. Sheet1!A:Z)", type: "string", default: "Sheet1" },
    { name: "values", label: "Values (JSON array of arrays)", type: "string", default: "[[\"{{input.col1}}\",\"{{input.col2}}\"]]" },
  ],
  executor: async (ctx) => {
    const cred = await ctx.getCredential(String(ctx.params.credentialId));
    const token = cred.accessToken ?? cred.token ?? cred.apiKey ?? "";
    const spreadsheetId = String(ctx.params.spreadsheetId ?? "");
    const range = String(ctx.params.range ?? "Sheet1");

    let values: unknown[][] = [[]];
    try {
      values = JSON.parse(String(ctx.resolveExpression(String(ctx.params.values ?? "[[]]")))) as unknown[][];
    } catch { /* empty */ }

    const result = await sheetsFetch(
      `/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      token,
      "POST",
      { values },
      ctx.signal,
    );

    return { result, spreadsheetId, range };
  },
});

nodeRegistry.register({
  type: "integration.googleSheets.getValues",
  category: "INTEGRATION",
  label: "Google Sheets: Get Values",
  description: "Read values from a Google Sheets range",
  icon: "Table",
  color: "oklch(65% 0.18 300)",
  inputs: [{ name: "input", label: "Input", type: "ANY" }],
  outputs: [{ name: "rows", label: "Rows", type: "JSON" }, { name: "count", label: "Row count", type: "NUMBER" }],
  parameters: [
    { name: "credentialId", label: "Google credential", type: "string", default: "" },
    { name: "spreadsheetId", label: "Spreadsheet ID", type: "string", default: "" },
    { name: "range", label: "Range", type: "string", default: "Sheet1" },
  ],
  executor: async (ctx) => {
    const cred = await ctx.getCredential(String(ctx.params.credentialId));
    const token = cred.accessToken ?? cred.token ?? cred.apiKey ?? "";
    const spreadsheetId = String(ctx.params.spreadsheetId ?? "");
    const range = String(ctx.params.range ?? "Sheet1");

    const result = await sheetsFetch(`/${spreadsheetId}/values/${encodeURIComponent(range)}`, token, "GET", undefined, ctx.signal) as { values?: unknown[][] };
    const rows = result.values ?? [];
    return { rows, count: rows.length };
  },
});
