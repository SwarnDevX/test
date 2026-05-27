import { nodeRegistry } from "@flowforge/nodes-sdk";

nodeRegistry.register({
  type: "trigger.chat-message",
  category: "TRIGGER",
  label: "Chat Message",
  description: "Triggered when a chat message is received from a deployed chatbot",
  icon: "MessageSquare",
  color: "oklch(70% 0.15 300)",
  inputs: [],
  outputs: [
    { name: "message", label: "Message", type: "STRING" },
    { name: "sessionId", label: "Session ID", type: "STRING" },
    { name: "history", label: "History", type: "JSON" },
    { name: "metadata", label: "Metadata", type: "JSON" },
  ],
  parameters: [],
  executor: async (ctx) => {
    const trigger = ctx.inputs.trigger as {
      message?: string;
      sessionId?: string;
      history?: unknown[];
      metadata?: Record<string, unknown>;
    } | undefined;

    return {
      message: trigger?.message ?? "",
      sessionId: trigger?.sessionId ?? "",
      history: trigger?.history ?? [],
      metadata: trigger?.metadata ?? {},
    };
  },
});
