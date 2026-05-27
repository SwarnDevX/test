import { nodeRegistry } from "@flowforge/nodes-sdk";

const DISCORD_API = "https://discord.com/api/v10";

nodeRegistry.register({
  type: "integration.discord.sendMessage",
  category: "INTEGRATION",
  label: "Discord: Send Message",
  description: "Send a message to a Discord channel",
  icon: "MessageSquare",
  color: "oklch(65% 0.18 300)",
  inputs: [{ name: "input", label: "Input", type: "ANY" }],
  outputs: [{ name: "message", label: "Message", type: "JSON" }],
  parameters: [
    { name: "credentialId", label: "Discord Bot credential", type: "string", default: "" },
    { name: "channelId", label: "Channel ID", type: "string", default: "" },
    { name: "content", label: "Content (expression)", type: "string", default: "{{input.text}}" },
    { name: "username", label: "Bot username override", type: "string", default: "" },
    { name: "embeds", label: "Embeds (JSON array)", type: "string", default: "[]" },
  ],
  executor: async (ctx) => {
    const cred = await ctx.getCredential(String(ctx.params.credentialId));
    const token = cred.botToken ?? cred.token ?? cred.apiKey ?? "";
    const channelId = ctx.resolveExpression(String(ctx.params.channelId ?? ""));
    const content = ctx.resolveExpression(String(ctx.params.content ?? ""));

    const body: Record<string, unknown> = { content };
    try {
      const embeds = JSON.parse(String(ctx.params.embeds ?? "[]")) as unknown[];
      if (embeds.length > 0) body.embeds = embeds;
    } catch { /* empty */ }

    const res = await fetch(`${DISCORD_API}/channels/${channelId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bot ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctx.signal,
    });

    if (!res.ok) throw new Error(`Discord API ${res.status}: ${await res.text()}`);
    const message = await res.json();
    return { message, id: (message as { id: string }).id };
  },
});
