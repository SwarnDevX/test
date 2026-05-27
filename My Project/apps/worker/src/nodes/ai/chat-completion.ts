import { nodeRegistry } from "@flowforge/nodes-sdk";

const PROVIDER_ENDPOINTS: Record<string, string> = {
  "gpt-4o": "https://api.openai.com/v1/chat/completions",
  "gpt-4o-mini": "https://api.openai.com/v1/chat/completions",
  "gpt-4-turbo": "https://api.openai.com/v1/chat/completions",
  "gpt-3.5-turbo": "https://api.openai.com/v1/chat/completions",
  "claude-opus-4-7": "https://api.anthropic.com/v1/messages",
  "claude-sonnet-4-6": "https://api.anthropic.com/v1/messages",
  "claude-haiku-4-5-20251001": "https://api.anthropic.com/v1/messages",
  "mistral-large-latest": "https://api.mistral.ai/v1/chat/completions",
  "mistral-small-latest": "https://api.mistral.ai/v1/chat/completions",
};

function isAnthropicModel(model: string) {
  return model.startsWith("claude-");
}

nodeRegistry.register({
  type: "ai.chatCompletion",
  category: "AI",
  label: "Chat Completion",
  description: "Generate text with LLMs (OpenAI, Anthropic, Mistral, etc.)",
  icon: "Brain",
  color: "oklch(65% 0.18 240)",
  inputs: [
    { name: "input", label: "Input", type: "ANY" },
    { name: "prompt", label: "User Prompt (overrides config)", type: "STRING" },
  ],
  outputs: [
    { name: "text", label: "Response Text", type: "STRING" },
    { name: "message", label: "Full Message", type: "JSON" },
  ],
  parameters: [
    { name: "model", label: "Model", type: "string", default: "gpt-4o" },
    { name: "temperature", label: "Temperature", type: "number", default: 0.7 },
    { name: "maxTokens", label: "Max Tokens", type: "number", default: 2048 },
    { name: "systemPrompt", label: "System Prompt", type: "string", default: "You are a helpful assistant." },
    { name: "userPrompt", label: "User Prompt", type: "string", default: "{{trigger.message}}" },
    { name: "credentialId", label: "Credential ID", type: "string", default: "" },
    { name: "stream", label: "Stream", type: "boolean", default: false },
  ],
  executor: async (ctx) => {
    const model = String(ctx.params.model ?? "gpt-4o");
    const temperature = Number(ctx.params.temperature ?? 0.7);
    const maxTokens = Number(ctx.params.maxTokens ?? 2048);
    const systemPrompt = ctx.resolveExpression(String(ctx.params.systemPrompt ?? "You are a helpful assistant."));
    const rawUserPrompt = (ctx.inputs.prompt as string | undefined) ?? ctx.resolveExpression(String(ctx.params.userPrompt ?? "{{trigger.message}}"));
    const userPrompt = String(rawUserPrompt);
    const stream = Boolean(ctx.params.stream ?? false);

    // Get API key
    let apiKey: string;
    if (ctx.params.credentialId) {
      const cred = await ctx.getCredential(String(ctx.params.credentialId));
      apiKey = cred.apiKey ?? "";
    } else {
      apiKey = isAnthropicModel(model)
        ? (ctx.env["ANTHROPIC_API_KEY"] ?? "")
        : (ctx.env["OPENAI_API_KEY"] ?? "");
    }

    if (!apiKey) throw new Error(`No API key for model ${model}`);

    const endpoint = PROVIDER_ENDPOINTS[model] ?? "https://api.openai.com/v1/chat/completions";

    let text = "";
    let inputTokens = 0;
    let outputTokens = 0;

    if (isAnthropicModel(model)) {
      const body = {
        model,
        max_tokens: maxTokens,
        temperature,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
        stream,
      };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify(body),
        signal: ctx.signal,
      });

      if (!res.ok) throw new Error(`Anthropic API error: ${res.status} ${await res.text()}`);

      if (stream && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const lines = decoder.decode(value).split("\n").filter((l) => l.startsWith("data: "));
          for (const line of lines) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const ev = JSON.parse(data) as { type: string; delta?: { text?: string }; usage?: { input_tokens: number; output_tokens: number } };
              if (ev.type === "content_block_delta" && ev.delta?.text) {
                text += ev.delta.text;
                ctx.emit("stream:chunk", ev.delta.text);
              }
              if (ev.usage) {
                inputTokens = ev.usage.input_tokens;
                outputTokens = ev.usage.output_tokens;
              }
            } catch { /* skip malformed */ }
          }
        }
      } else {
        const json = await res.json() as { content: Array<{ type: string; text: string }>; usage: { input_tokens: number; output_tokens: number } };
        text = json.content[0]?.text ?? "";
        inputTokens = json.usage.input_tokens;
        outputTokens = json.usage.output_tokens;
      }
    } else {
      // OpenAI-compatible
      const body = {
        model,
        temperature,
        max_tokens: maxTokens,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream,
      };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: ctx.signal,
      });

      if (!res.ok) throw new Error(`LLM API error: ${res.status} ${await res.text()}`);

      if (stream && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const lines = decoder.decode(value).split("\n").filter((l) => l.startsWith("data: "));
          for (const line of lines) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const ev = JSON.parse(data) as { choices: Array<{ delta: { content?: string } }>; usage?: { prompt_tokens: number; completion_tokens: number } };
              const chunk = ev.choices[0]?.delta.content ?? "";
              if (chunk) { text += chunk; ctx.emit("stream:chunk", chunk); }
              if (ev.usage) { inputTokens = ev.usage.prompt_tokens; outputTokens = ev.usage.completion_tokens; }
            } catch { /* skip */ }
          }
        }
      } else {
        const json = await res.json() as { choices: Array<{ message: { content: string } }>; usage: { prompt_tokens: number; completion_tokens: number } };
        text = json.choices[0]?.message.content ?? "";
        inputTokens = json.usage.prompt_tokens;
        outputTokens = json.usage.completion_tokens;
      }
    }

    const totalTokens = inputTokens + outputTokens;

    return {
      text,
      message: { role: "assistant", content: text },
      __tokens: totalTokens,
      __model: model,
      __inputTokens: inputTokens,
      __outputTokens: outputTokens,
    };
  },
});
