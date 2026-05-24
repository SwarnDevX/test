import Redis from "ioredis";
import { config } from "../config/index.js";
import { getEmbedding } from "./llm.js";

// In-memory vector store (production: use Pinecone/Chroma/Weaviate)
interface VectorEntry {
  id: string;
  embedding: number[];
  document: string;
  metadata: Record<string, string>;
  collection: string;
}

const vectorStore: VectorEntry[] = [];
let redis: Redis | null = null;

export async function initEmbeddingStore(): Promise<void> {
  try {
    redis = new Redis(config.redisUrl);
    redis.on("error", () => { redis = null; });
    console.log("✅ Redis connected for caching");
  } catch {
    console.warn("⚠️ Redis unavailable, using memory only");
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

export async function indexDocument(
  collection: string,
  id: string,
  document: string,
  metadata: Record<string, string> = {}
): Promise<void> {
  const embedding = await getEmbedding(document);
  // Remove existing if same id
  const existingIdx = vectorStore.findIndex((v) => v.id === id && v.collection === collection);
  if (existingIdx >= 0) vectorStore.splice(existingIdx, 1);
  vectorStore.push({ id, embedding, document, metadata, collection });

  // Cache in Redis
  if (redis) {
    await redis.set(`vec:${collection}:${id}`, JSON.stringify({ document, metadata }), "EX", 86400);
  }
}

export async function searchDocuments(
  collection: string,
  query: string,
  nResults = 5
): Promise<Array<{ id: string; document: string; metadata: Record<string, string>; score: number }>> {
  const queryEmb = await getEmbedding(query);
  const candidates = vectorStore.filter((v) => v.collection === collection);

  const scored = candidates.map((v) => ({
    id: v.id,
    document: v.document,
    metadata: v.metadata,
    score: cosineSimilarity(queryEmb, v.embedding),
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, nResults);
}

// Hybrid search: combines keyword + semantic
export async function hybridSearch(
  collection: string,
  query: string,
  nResults = 5
): Promise<Array<{ id: string; document: string; metadata: Record<string, string>; score: number }>> {
  const semanticResults = await searchDocuments(collection, query, nResults * 2);
  const queryWords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);

  // Boost score for keyword matches
  const boosted = semanticResults.map((r) => {
    const text = r.document.toLowerCase();
    let keywordBoost = 0;
    for (const word of queryWords) {
      if (text.includes(word)) keywordBoost += 0.05;
    }
    return { ...r, score: r.score + Math.min(keywordBoost, 0.2) };
  });

  boosted.sort((a, b) => b.score - a.score);
  return boosted.slice(0, nResults);
}

