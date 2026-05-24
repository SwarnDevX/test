import OpenAI from "openai";
import { config } from "../config/index.js";

const openai = new OpenAI({ apiKey: config.openaiKey });

export async function chatCompletion(
  systemPrompt: string,
  userPrompt: string,
  jsonMode = true
): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: jsonMode ? { type: "json_object" } : undefined,
    temperature: 0.2,
    max_tokens: 4096,
  });
  return response.choices[0].message.content || "{}";
}

export async function getEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text.slice(0, 8000),
  });
  return response.data[0].embedding;
}

