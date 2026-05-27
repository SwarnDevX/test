import { nodeRegistry } from "@flowforge/nodes-sdk";

nodeRegistry.register({
  type: "integration.salesforce.createRecord",
  category: "INTEGRATION",
  label: "Salesforce: Create Record",
  description: "Create a Salesforce record (Lead, Contact, Opportunity, etc.)",
  icon: "Cloud",
  color: "oklch(65% 0.18 300)",
  inputs: [{ name: "input", label: "Input", type: "ANY" }],
  outputs: [{ name: "record", label: "Record", type: "JSON" }],
  parameters: [
    { name: "credentialId", label: "Salesforce credential (OAuth2)", type: "string", default: "" },
    { name: "instanceUrl", label: "Instance URL", type: "string", default: "https://your-instance.salesforce.com" },
    { name: "objectType", label: "Object Type", type: "string", default: "Lead" },
    { name: "fields", label: "Fields (JSON)", type: "string", default: "{}" },
  ],
  executor: async (ctx) => {
    const cred = await ctx.getCredential(String(ctx.params.credentialId));
    const token = cred.accessToken ?? cred.token ?? "";
    const instanceUrl = String(ctx.params.instanceUrl ?? "").replace(/\/$/, "");
    const objectType = String(ctx.params.objectType ?? "Lead");

    let fields: Record<string, unknown> = {};
    try { fields = JSON.parse(String(ctx.resolveExpression(String(ctx.params.fields ?? "{}")))) as Record<string, unknown>; } catch { /* empty */ }

    const res = await fetch(`${instanceUrl}/services/data/v58.0/sobjects/${objectType}/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(fields),
      signal: ctx.signal,
    });

    if (!res.ok) throw new Error(`Salesforce API ${res.status}: ${await res.text()}`);
    const record = await res.json();
    return { record, id: (record as { id: string }).id };
  },
});
