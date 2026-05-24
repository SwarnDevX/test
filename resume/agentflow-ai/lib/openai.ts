// lib/openai.ts - Shared OpenAI client

import OpenAI from 'openai';

let _client: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (_client) return _client;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set. Please add it to .env.local');
  }
  _client = new OpenAI({ apiKey });
  return _client;
}

export async function createEmbedding(text: string): Promise<number[]> {
  const client = getOpenAI();
  const response = await client.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.slice(0, 8000), // limit tokens
  });
  return response.data[0].embedding;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-10);
}

// Token cost estimator (GPT-4 Turbo pricing)
export function estimateCost(tokens: number, model = 'gpt-4-turbo'): number {
  const rates: Record<string, number> = {
    'gpt-4-turbo': 0.01 / 1000,
    'gpt-4o': 0.005 / 1000,
    'gpt-3.5-turbo': 0.0005 / 1000,
    'text-embedding-3-small': 0.00002 / 1000,
  };
  return (rates[model] ?? 0.01 / 1000) * tokens;
}

