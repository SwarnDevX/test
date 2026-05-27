import { nodeRegistry } from "@flowforge/nodes-sdk";

nodeRegistry.register({
  type: "integration.openai.runAssistant",
  category: "INTEGRATION",
  label: "OpenAI: Run Assistant",
  description: "Run an OpenAI Assistant and get the response",
  icon: "Bot",
  color: "oklch(65% 0.18 300)",
  inputs: [{ name: "input", label: "Input", type: "ANY" }],
  outputs: [
    { name: "text", label: "Response Text", type: "STRING" },
    { name: "messages", label: "All Messages", type: "JSON" },
    { name: "threadId", label: "Thread ID", type: "STRING" },
  ],
  parameters: [
    { name: "credentialId", label: "OpenAI credential", type: "string", default: "" },
    { name: "assistantId", label: "Assistant ID", type: "string", default: "" },
    { name: "message", label: "User message (expression)", type: "string", default: "{{input.message}}" },
    { name: "threadId", label: "Thread ID (optional, for continuation)", type: "string", default: "" },
    { name: "maxWaitMs", label: "Max wait (ms)", type: "number", default: 60000 },
  ],
  executor: async (ctx) => {
    const cred = await ctx.getCredential(String(ctx.params.credentialId));
    const apiKey = cred.apiKey ?? ctx.env["OPENAI_API_KEY"] ?? "";
    if (!apiKey) throw new Error("OpenAI API key required");

    const assistantId = String(ctx.params.assistantId ?? "");
    const message = ctx.resolveExpression(String(ctx.params.message ?? ""));
    const existingThreadId = String(ctx.params.threadId ?? "").trim();
    const maxWaitMs = Number(ctx.params.maxWaitMs ?? 60_000);

    const headers = { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "OpenAI-Beta": "assistants=v2" };
    const base = "https://api.openai.com/v1";

    // Create or reuse thread
    let threadId = existingThreadId;
    if (!threadId) {
      const threadRes = await fetch(`${base}/threads`, { method: "POST", headers, body: JSON.stringify({}), signal: ctx.signal });
      if (!threadRes.ok) throw new Error(`Thread create failed: ${threadRes.status}`);
      threadId = ((await threadRes.json()) as { id: string }).id;
    }

    // Add user message
    await fetch(`${base}/threads/${threadId}/messages`, {
      method: "POST",
      headers,
      body: JSON.stringify({ role: "user", content: message }),
      signal: ctx.signal,
    });

    // Run
    const runRes = await fetch(`${base}/threads/${threadId}/runs`, {
      method: "POST",
      headers,
      body: JSON.stringify({ assistant_id: assistantId }),
      signal: ctx.signal,
    });
    if (!runRes.ok) throw new Error(`Run create failed: ${runRes.status}`);
    const run = await runRes.json() as { id: string; status: string };

    // Poll until complete
    const deadline = Date.now() + maxWaitMs;
    let runStatus = run.status;
    let runId = run.id;

    while (!["completed", "failed", "cancelled"].includes(runStatus) && Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 1000));
      const pollRes = await fetch(`${base}/threads/${threadId}/runs/${runId}`, { headers, signal: ctx.signal });
      const polled = await pollRes.json() as { status: string };
      runStatus = polled.status;
    }

    if (runStatus !== "completed") throw new Error(`Run ended with status: ${runStatus}`);

    // Get messages
    const msgsRes = await fetch(`${base}/threads/${threadId}/messages?order=desc&limit=10`, { headers, signal: ctx.signal });
    const msgsJson = await msgsRes.json() as { data: Array<{ role: string; content: Array<{ type: string; text?: { value: string } }> }> };
    const assistantMsg = msgsJson.data.find((m) => m.role === "assistant");
    const text = assistantMsg?.content.find((c) => c.type === "text")?.text?.value ?? "";

    return { text, messages: msgsJson.data, threadId };
  },
});
