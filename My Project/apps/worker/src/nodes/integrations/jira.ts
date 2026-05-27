import { nodeRegistry } from "@flowforge/nodes-sdk";

nodeRegistry.register({
  type: "integration.jira.createIssue",
  category: "INTEGRATION",
  label: "Jira: Create Issue",
  description: "Create a Jira issue",
  icon: "SquareKanban",
  color: "oklch(65% 0.18 300)",
  inputs: [{ name: "input", label: "Input", type: "ANY" }],
  outputs: [{ name: "issue", label: "Issue", type: "JSON" }],
  parameters: [
    { name: "credentialId", label: "Jira credential", type: "string", default: "" },
    { name: "domain", label: "Jira domain (e.g. mycompany.atlassian.net)", type: "string", default: "" },
    { name: "projectKey", label: "Project key", type: "string", default: "" },
    { name: "issueType", label: "Issue type", type: "string", default: "Task" },
    { name: "summary", label: "Summary (expression)", type: "string", default: "{{input.title}}" },
    { name: "description", label: "Description", type: "string", default: "{{input.body}}" },
    { name: "priority", label: "Priority", type: "select", options: ["Highest", "High", "Medium", "Low", "Lowest"], default: "Medium" },
  ],
  executor: async (ctx) => {
    const cred = await ctx.getCredential(String(ctx.params.credentialId));
    const token = cred.apiToken ?? cred.apiKey ?? "";
    const email = cred.email ?? "";
    const domain = String(ctx.params.domain ?? "").replace(/\/$/, "");
    const projectKey = String(ctx.params.projectKey ?? "");

    const auth = btoa(`${email}:${token}`);
    const body = {
      fields: {
        project: { key: projectKey },
        summary: ctx.resolveExpression(String(ctx.params.summary ?? "")),
        description: {
          type: "doc",
          version: 1,
          content: [{
            type: "paragraph",
            content: [{ type: "text", text: ctx.resolveExpression(String(ctx.params.description ?? "")) }],
          }],
        },
        issuetype: { name: String(ctx.params.issueType ?? "Task") },
        priority: { name: String(ctx.params.priority ?? "Medium") },
      },
    };

    const res = await fetch(`https://${domain}/rest/api/3/issue`, {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctx.signal,
    });

    if (!res.ok) throw new Error(`Jira API ${res.status}: ${await res.text()}`);
    const issue = await res.json();
    return { issue, key: (issue as { key: string }).key, url: `https://${domain}/browse/${(issue as { key: string }).key}` };
  },
});
