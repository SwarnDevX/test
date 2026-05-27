import { nodeRegistry } from "@flowforge/nodes-sdk";

nodeRegistry.register({
  type: "integration.linear.createIssue",
  category: "INTEGRATION",
  label: "Linear: Create Issue",
  description: "Create a Linear issue",
  icon: "Layers",
  color: "oklch(65% 0.18 300)",
  inputs: [{ name: "input", label: "Input", type: "ANY" }],
  outputs: [{ name: "issue", label: "Issue", type: "JSON" }],
  parameters: [
    { name: "credentialId", label: "Linear credential", type: "string", default: "" },
    { name: "teamId", label: "Team ID", type: "string", default: "" },
    { name: "title", label: "Title (expression)", type: "string", default: "{{input.title}}" },
    { name: "description", label: "Description", type: "string", default: "{{input.description}}" },
    { name: "priority", label: "Priority (0-4)", type: "number", default: 0 },
    { name: "labelIds", label: "Label IDs (JSON array)", type: "string", default: "[]" },
  ],
  executor: async (ctx) => {
    const cred = await ctx.getCredential(String(ctx.params.credentialId));
    const token = cred.apiKey ?? cred.token ?? "";

    const query = `
      mutation CreateIssue($teamId: String!, $title: String!, $description: String, $priority: Int, $labelIds: [String!]) {
        issueCreate(input: { teamId: $teamId, title: $title, description: $description, priority: $priority, labelIds: $labelIds }) {
          issue { id title url identifier }
        }
      }
    `;

    let labelIds: string[] = [];
    try { labelIds = JSON.parse(String(ctx.params.labelIds ?? "[]")) as string[]; } catch { /* empty */ }

    const res = await fetch("https://api.linear.app/graphql", {
      method: "POST",
      headers: { Authorization: token, "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        variables: {
          teamId: String(ctx.params.teamId ?? ""),
          title: ctx.resolveExpression(String(ctx.params.title ?? "")),
          description: ctx.resolveExpression(String(ctx.params.description ?? "")),
          priority: Number(ctx.params.priority ?? 0),
          labelIds,
        },
      }),
      signal: ctx.signal,
    });

    if (!res.ok) throw new Error(`Linear API ${res.status}: ${await res.text()}`);
    const json = await res.json() as { data: { issueCreate: { issue: { id: string; title: string; url: string; identifier: string } } } };
    const issue = json.data.issueCreate.issue;
    return { issue, url: issue.url, identifier: issue.identifier };
  },
});
