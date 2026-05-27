import { nodeRegistry } from "@flowforge/nodes-sdk";

const SLACK_API = "https://slack.com/api";

nodeRegistry.register({
  type: "integration.slack.sendMessage",
  category: "INTEGRATION",
  label: "Slack: Send Message",
  description: "Send a message to a Slack channel",
  icon: "MessageSquare",
  color: "oklch(65% 0.18 300)",
  inputs: [{ name: "input", label: "Input", type: "ANY" }],
  outputs: [{ name: "result", label: "Result", type: "JSON" }],
  parameters: [
    { name: "credentialId", label: "Slack credential", type: "string", default: "" },
    { name: "channel", label: "Channel (e.g. #general)", type: "string", default: "#general" },
    { name: "message", label: "Message (expression)", type: "string", default: "{{input.text}}" },
    { name: "username", label: "Bot username (optional)", type: "string", default: "" },
    { name: "iconEmoji", label: "Icon emoji", type: "string", default: ":robot_face:" },
  ],
  executor: async (ctx) => {
    const cred = await ctx.getCredential(String(ctx.params.credentialId));
    const token = cred.botToken ?? cred.apiKey ?? "";
    if (!token) throw new Error("Slack bot token is required");

    const channel = ctx.resolveExpression(String(ctx.params.channel ?? "#general"));
    const text = ctx.resolveExpression(String(ctx.params.message ?? ""));

    const body: Record<string, unknown> = { channel, text };
    if (ctx.params.username) body.username = String(ctx.params.username);
    if (ctx.params.iconEmoji) body.icon_emoji = String(ctx.params.iconEmoji);

    const res = await fetch(`${SLACK_API}/chat.postMessage`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctx.signal,
    });

    const json = await res.json() as { ok: boolean; ts?: string; error?: string };
    if (!json.ok) throw new Error(`Slack API error: ${json.error}`);

    return { result: json, messageTs: json.ts, channel };
  },
});

nodeRegistry.register({
  type: "integration.slack.getChannelHistory",
  category: "INTEGRATION",
  label: "Slack: Get Channel History",
  description: "Get recent messages from a Slack channel",
  icon: "MessageSquare",
  color: "oklch(65% 0.18 300)",
  inputs: [{ name: "input", label: "Input", type: "ANY" }],
  outputs: [{ name: "messages", label: "Messages", type: "JSON" }],
  parameters: [
    { name: "credentialId", label: "Slack credential", type: "string", default: "" },
    { name: "channel", label: "Channel ID", type: "string", default: "" },
    { name: "limit", label: "Limit", type: "number", default: 10 },
  ],
  executor: async (ctx) => {
    const cred = await ctx.getCredential(String(ctx.params.credentialId));
    const token = cred.botToken ?? cred.apiKey ?? "";
    const channel = ctx.resolveExpression(String(ctx.params.channel ?? ""));
    const limit = Number(ctx.params.limit ?? 10);

    const res = await fetch(`${SLACK_API}/conversations.history?channel=${channel}&limit=${limit}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: ctx.signal,
    });

    const json = await res.json() as { ok: boolean; messages?: unknown[]; error?: string };
    if (!json.ok) throw new Error(`Slack API error: ${json.error}`);

    return { messages: json.messages ?? [], count: json.messages?.length ?? 0 };
  },
});
