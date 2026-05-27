import { nodeRegistry } from "@flowforge/nodes-sdk";

nodeRegistry.register({
  type: "ai.structuredOutput",
  category: "AI",
  label: "Structured Output",
  description: "Extract structured JSON from text using an LLM",
  icon: "Cpu",
  color: "oklch(65% 0.18 240)",
  inputs: [
    { name: "text", label: "Input Text", type: "STRING" },
  ],
  outputs: [
    { name: "data", label: "Extracted Data", type: "JSON" },
    { name: "raw", label: "Raw JSON String", type: "STRING" },
  ],
  parameters: [
    { name: "model", label: "Model", type: "string", default: "gpt-4o-mini" },
    { name: "schema", label: "JSON Schema", type: "string", default: '{"name":"string","email":"string"}' },
    { name: "instructions", label: "Extraction instructions", type: "string", default: "Extract the requested fields from the text." },
    { name: "credentialId", label: "Credential ID", type: "string", default: "" },
  ],
  executor: async (ctx) => {
    const text = String(ctx.inputs.text ?? ctx.inputs.input ?? "");
    const model = String(ctx.params.model ?? "gpt-4o-mini");
    const schemaStr = String(ctx.params.schema ?? "{}");
    const instructions = String(ctx.params.instructions ?? "Extract the requested fields from the text.");

    let apiKey: string;
    if (ctx.params.credentialId) {
      const cred = await ctx.getCredential(String(ctx.params.credentialId));
      apiKey = cred.apiKey ?? "";
    } else {
      apiKey = ctx.env["OPENAI_API_KEY"] ?? "";
    }

    if (!apiKey) throw new Error("No API key");

    const systemPrompt = `${instructions}

Return ONLY valid JSON matching this schema: ${schemaStr}
Do not include markdown code blocks or any other text.`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text },
        ],
      }),
      signal: ctx.signal,
    });

    if (!res.ok) throw new Error(`API error: ${res.status}`);

    const json = await res.json() as { choices: Array<{ message: { content: string } }>; usage: { total_tokens: number } };
    const raw = json.choices[0]?.message.content ?? "{}";

    let data: unknown;
    try { data = JSON.parse(raw); } catch { data = { raw }; }

    return {
      data,
      raw,
      __tokens: json.usage.total_tokens,
      __model: model,
    };
  },
});
