import { nodeRegistry } from "@flowforge/nodes-sdk";

const HS_API = "https://api.hubapi.com";

async function hsFetch(path: string, token: string, method = "GET", body?: unknown, signal?: AbortSignal) {
  const res = await fetch(`${HS_API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });
  if (!res.ok) throw new Error(`HubSpot API ${res.status}: ${await res.text()}`);
  if (res.status === 204) return {};
  return res.json();
}

nodeRegistry.register({
  type: "integration.hubspot.createContact",
  category: "INTEGRATION",
  label: "HubSpot: Create Contact",
  description: "Create a new HubSpot contact",
  icon: "Users",
  color: "oklch(65% 0.18 300)",
  inputs: [{ name: "input", label: "Input", type: "ANY" }],
  outputs: [{ name: "contact", label: "Contact", type: "JSON" }],
  parameters: [
    { name: "credentialId", label: "HubSpot credential", type: "string", default: "" },
    { name: "email", label: "Email (expression)", type: "string", default: "{{input.email}}" },
    { name: "firstName", label: "First name", type: "string", default: "{{input.firstName}}" },
    { name: "lastName", label: "Last name", type: "string", default: "{{input.lastName}}" },
    { name: "company", label: "Company", type: "string", default: "{{input.company}}" },
    { name: "phone", label: "Phone", type: "string", default: "" },
    { name: "properties", label: "Extra properties (JSON)", type: "string", default: "{}" },
  ],
  executor: async (ctx) => {
    const cred = await ctx.getCredential(String(ctx.params.credentialId));
    const token = cred.token ?? cred.apiKey ?? "";

    const props: Record<string, string> = {
      email: String(ctx.resolveExpression(String(ctx.params.email ?? ""))),
      firstname: String(ctx.resolveExpression(String(ctx.params.firstName ?? ""))),
      lastname: String(ctx.resolveExpression(String(ctx.params.lastName ?? ""))),
      company: String(ctx.resolveExpression(String(ctx.params.company ?? ""))),
    };
    if (ctx.params.phone) props.phone = String(ctx.resolveExpression(String(ctx.params.phone)));

    try {
      const extra = JSON.parse(String(ctx.resolveExpression(String(ctx.params.properties ?? "{}")))) as Record<string, string>;
      Object.assign(props, extra);
    } catch { /* empty */ }

    const contact = await hsFetch("/crm/v3/objects/contacts", token, "POST", { properties: props }, ctx.signal);
    return { contact, id: (contact as { id: string }).id };
  },
});

nodeRegistry.register({
  type: "integration.hubspot.searchContacts",
  category: "INTEGRATION",
  label: "HubSpot: Search Contacts",
  description: "Search HubSpot contacts",
  icon: "Users",
  color: "oklch(65% 0.18 300)",
  inputs: [{ name: "input", label: "Input", type: "ANY" }],
  outputs: [{ name: "contacts", label: "Contacts", type: "JSON" }],
  parameters: [
    { name: "credentialId", label: "HubSpot credential", type: "string", default: "" },
    { name: "query", label: "Search query", type: "string", default: "{{input.email}}" },
    { name: "limit", label: "Limit", type: "number", default: 10 },
  ],
  executor: async (ctx) => {
    const cred = await ctx.getCredential(String(ctx.params.credentialId));
    const token = cred.token ?? cred.apiKey ?? "";
    const query = ctx.resolveExpression(String(ctx.params.query ?? ""));
    const limit = Number(ctx.params.limit ?? 10);

    const result = await hsFetch("/crm/v3/objects/contacts/search", token, "POST", {
      query,
      limit,
      properties: ["email", "firstname", "lastname", "company"],
    }, ctx.signal) as { results: unknown[]; total: number };

    return { contacts: result.results, total: result.total };
  },
});
