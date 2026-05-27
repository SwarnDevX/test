import { nodeRegistry } from "@flowforge/nodes-sdk";

nodeRegistry.register({
  type: "ai.imageGeneration",
  category: "AI",
  label: "Image Generation",
  description: "Generate images with DALL-E or Stable Diffusion",
  icon: "Image",
  color: "oklch(65% 0.18 240)",
  inputs: [{ name: "prompt", label: "Prompt", type: "STRING" }],
  outputs: [
    { name: "url", label: "Image URL", type: "STRING" },
    { name: "b64", label: "Base64 Data", type: "STRING" },
    { name: "revisedPrompt", label: "Revised Prompt", type: "STRING" },
  ],
  parameters: [
    { name: "model", label: "Model", type: "select", options: ["dall-e-3", "dall-e-2"], default: "dall-e-3" },
    { name: "size", label: "Size", type: "select", options: ["1024x1024", "1792x1024", "1024x1792"], default: "1024x1024" },
    { name: "quality", label: "Quality", type: "select", options: ["standard", "hd"], default: "standard" },
    { name: "style", label: "Style", type: "select", options: ["vivid", "natural"], default: "vivid" },
    { name: "credentialId", label: "Credential ID", type: "string", default: "" },
  ],
  executor: async (ctx) => {
    const prompt = ctx.resolveExpression(String(ctx.inputs.prompt ?? ctx.params.prompt ?? ""));
    const model = String(ctx.params.model ?? "dall-e-3");
    const size = String(ctx.params.size ?? "1024x1024");
    const quality = String(ctx.params.quality ?? "standard");
    const style = String(ctx.params.style ?? "vivid");

    let apiKey: string;
    if (ctx.params.credentialId) {
      const cred = await ctx.getCredential(String(ctx.params.credentialId));
      apiKey = cred.apiKey ?? "";
    } else {
      apiKey = ctx.env["OPENAI_API_KEY"] ?? "";
    }

    if (!apiKey) throw new Error("No OpenAI API key");

    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, prompt, size, quality, style, n: 1, response_format: "url" }),
      signal: ctx.signal,
    });

    if (!res.ok) throw new Error(`DALL-E API error: ${res.status} ${await res.text()}`);

    const json = await res.json() as { data: Array<{ url?: string; b64_json?: string; revised_prompt?: string }> };
    const img = json.data[0];

    return {
      url: img?.url ?? "",
      b64: img?.b64_json ?? "",
      revisedPrompt: img?.revised_prompt ?? prompt,
    };
  },
});
