let _openai: import('openai').OpenAI | null = null

function getOpenAI() {
  if (!_openai && process.env.OPENAI_API_KEY) {
    const { default: OpenAI } = require('openai')
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return _openai
}

export async function embedText(text: string): Promise<number[] | null> {
  const client = getOpenAI()
  if (!client) return generateFallbackEmbedding(text)

  try {
    const response = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text.slice(0, 8000),
    })
    return response.data[0].embedding
  } catch {
    return generateFallbackEmbedding(text)
  }
}

export async function embedBatch(texts: string[]): Promise<(number[] | null)[]> {
  const client = getOpenAI()
  if (!client) return texts.map(generateFallbackEmbedding)

  try {
    const response = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: texts.map((t) => t.slice(0, 8000)),
    })
    return response.data.map((d) => d.embedding)
  } catch {
    return texts.map(generateFallbackEmbedding)
  }
}

// Deterministic hash-based pseudo-embedding for demo mode
function generateFallbackEmbedding(text: string): number[] {
  const dim = 384
  const embedding = new Array(dim).fill(0)
  for (let i = 0; i < text.length; i++) {
    const idx = (text.charCodeAt(i) * (i + 1)) % dim
    embedding[idx] += text.charCodeAt(i) / 1000
  }
  const norm = Math.sqrt(embedding.reduce((s, v) => s + v * v, 0)) || 1
  return embedding.map((v) => v / norm)
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0
  let dot = 0, normA = 0, normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) || 1)
}
