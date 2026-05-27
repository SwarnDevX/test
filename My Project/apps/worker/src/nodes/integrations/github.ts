import { nodeRegistry } from "@flowforge/nodes-sdk";

const GH_API = "https://api.github.com";

async function ghFetch(path: string, token: string, method = "GET", body?: unknown, signal?: AbortSignal) {
  const res = await fetch(`${GH_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
  return res.json();
}

nodeRegistry.register({
  type: "integration.github.createIssue",
  category: "INTEGRATION",
  label: "GitHub: Create Issue",
  description: "Create a GitHub issue",
  icon: "Github",
  color: "oklch(65% 0.18 300)",
  inputs: [{ name: "input", label: "Input", type: "ANY" }],
  outputs: [{ name: "issue", label: "Issue", type: "JSON" }],
  parameters: [
    { name: "credentialId", label: "GitHub credential", type: "string", default: "" },
    { name: "owner", label: "Owner", type: "string", default: "" },
    { name: "repo", label: "Repository", type: "string", default: "" },
    { name: "title", label: "Title (expression)", type: "string", default: "{{input.title}}" },
    { name: "body", label: "Body (expression)", type: "string", default: "{{input.body}}" },
    { name: "labels", label: "Labels (comma-sep)", type: "string", default: "" },
    { name: "assignees", label: "Assignees (comma-sep)", type: "string", default: "" },
  ],
  executor: async (ctx) => {
    const cred = await ctx.getCredential(String(ctx.params.credentialId));
    const token = cred.token ?? cred.apiKey ?? "";
    const owner = ctx.resolveExpression(String(ctx.params.owner ?? ""));
    const repo = ctx.resolveExpression(String(ctx.params.repo ?? ""));
    const title = ctx.resolveExpression(String(ctx.params.title ?? ""));
    const body = ctx.resolveExpression(String(ctx.params.body ?? ""));
    const labels = String(ctx.params.labels ?? "").split(",").map((l) => l.trim()).filter(Boolean);
    const assignees = String(ctx.params.assignees ?? "").split(",").map((a) => a.trim()).filter(Boolean);

    const issue = await ghFetch(`/repos/${owner}/${repo}/issues`, token, "POST", { title, body, labels, assignees }, ctx.signal);
    return { issue, url: (issue as { html_url: string }).html_url, number: (issue as { number: number }).number };
  },
});

nodeRegistry.register({
  type: "integration.github.listIssues",
  category: "INTEGRATION",
  label: "GitHub: List Issues",
  description: "List issues in a repository",
  icon: "Github",
  color: "oklch(65% 0.18 300)",
  inputs: [{ name: "input", label: "Input", type: "ANY" }],
  outputs: [{ name: "issues", label: "Issues", type: "JSON" }],
  parameters: [
    { name: "credentialId", label: "GitHub credential", type: "string", default: "" },
    { name: "owner", label: "Owner", type: "string", default: "" },
    { name: "repo", label: "Repository", type: "string", default: "" },
    { name: "state", label: "State", type: "select", options: ["open", "closed", "all"], default: "open" },
    { name: "perPage", label: "Per page", type: "number", default: 30 },
  ],
  executor: async (ctx) => {
    const cred = await ctx.getCredential(String(ctx.params.credentialId));
    const token = cred.token ?? cred.apiKey ?? "";
    const owner = String(ctx.params.owner ?? "");
    const repo = String(ctx.params.repo ?? "");
    const state = String(ctx.params.state ?? "open");
    const perPage = Number(ctx.params.perPage ?? 30);

    const issues = await ghFetch(`/repos/${owner}/${repo}/issues?state=${state}&per_page=${perPage}`, token, "GET", undefined, ctx.signal);
    return { issues, count: (issues as unknown[]).length };
  },
});

nodeRegistry.register({
  type: "integration.github.createPullRequest",
  category: "INTEGRATION",
  label: "GitHub: Create Pull Request",
  description: "Create a GitHub pull request",
  icon: "Github",
  color: "oklch(65% 0.18 300)",
  inputs: [{ name: "input", label: "Input", type: "ANY" }],
  outputs: [{ name: "pr", label: "Pull Request", type: "JSON" }],
  parameters: [
    { name: "credentialId", label: "GitHub credential", type: "string", default: "" },
    { name: "owner", label: "Owner", type: "string", default: "" },
    { name: "repo", label: "Repository", type: "string", default: "" },
    { name: "title", label: "Title", type: "string", default: "" },
    { name: "body", label: "Body", type: "string", default: "" },
    { name: "head", label: "Head branch", type: "string", default: "" },
    { name: "base", label: "Base branch", type: "string", default: "main" },
  ],
  executor: async (ctx) => {
    const cred = await ctx.getCredential(String(ctx.params.credentialId));
    const token = cred.token ?? cred.apiKey ?? "";
    const owner = String(ctx.params.owner ?? "");
    const repo = String(ctx.params.repo ?? "");

    const pr = await ghFetch(`/repos/${owner}/${repo}/pulls`, token, "POST", {
      title: ctx.resolveExpression(String(ctx.params.title ?? "")),
      body: ctx.resolveExpression(String(ctx.params.body ?? "")),
      head: String(ctx.params.head ?? ""),
      base: String(ctx.params.base ?? "main"),
    }, ctx.signal);

    return { pr, url: (pr as { html_url: string }).html_url };
  },
});
